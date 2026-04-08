const { z } = require('zod');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { createOtp, verifyOtp } = require('../services/otp.service');
const { sendOtpEmail, sendRegistrationConfirmation } = require('../services/email.service');
const { signToken } = require('../services/jwt.service');
const { logAction } = require('../services/audit.service');

// Validation schemas
const otpRequestSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
});

const otpVerifySchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

const supplierRegisterSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  vendorType: z.enum(['Operator', 'Developer', 'Landlord', 'Broker', 'Advisor', 'Other Intermediary']),
  mandateStatus: z.enum(['Exclusive', 'Non-exclusive', 'Direct', 'Unknown']),
  ndaRequired: z.boolean(),
  ndaSigned: z.boolean(),
  contactEmail: z.string().email().trim().toLowerCase(),
  contactNumber: z.string().optional(),
});

const customerRegisterSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  companyName: z.string().min(1).max(500).trim(),
  companyType: z.string().min(1),
  jurisdiction: z.enum(['UAE', 'KSA', 'Qatar', 'Bahrain', 'Oman', 'Kuwait', 'Other']),
  industrySector: z.string().min(1).trim(),
  taxVatNumber: z.string().min(1).trim(),
  companyAddress: z.string().min(1).trim(),
  website: z.string().url().optional().or(z.literal('')),
  authSignatoryName: z.string().min(1).trim(),
  authSignatoryTitle: z.string().min(1).trim(),
  billingContactName: z.string().min(1).trim(),
  billingContactEmail: z.string().email().trim().toLowerCase(),
  primaryUseCases: z.array(z.string()).min(1),
  locationPreferences: z.array(z.string()).optional(),
  sovereigntyReqs: z.array(z.string()).optional(),
  complianceReqs: z.array(z.string()).optional(),
  budgetRange: z.string().optional(),
  urgency: z.string().optional(),
});

// POST /api/auth/otp/request
const requestOtp = async (req, res, next) => {
  try {
    const { email } = otpRequestSchema.parse(req.body);

    const { plainCode } = await createOtp(email, 'login');
    await sendOtpEmail(email, plainCode);

    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/otp/verify
const verifyOtpHandler = async (req, res, next) => {
  try {
    const { email, code } = otpVerifySchema.parse(req.body);

    const result = await verifyOtp(email, code);
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // New user — return a registration token (not full auth)
      return res.json({
        authenticated: true,
        registered: false,
        email,
        message: 'OTP verified. Please complete registration.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated' });
    }

    // Existing user — issue JWT
    user.lastLoginAt = new Date();
    await user.save();

    const org = user.organizationId
      ? await Organization.findById(user.organizationId)
      : null;

    const token = signToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    await logAction({
      userId: user._id,
      action: 'LOGIN',
      ipAddress: req.ip,
    });

    res.json({
      authenticated: true,
      registered: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organizationStatus: org?.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/register/supplier
const registerSupplier = async (req, res, next) => {
  try {
    const data = supplierRegisterSchema.parse(req.body);

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Determine role: broker types get 'broker' role
    const isBroker = ['Broker', 'Advisor', 'Other Intermediary'].includes(data.vendorType);
    const role = isBroker ? 'broker' : 'supplier';
    const orgType = isBroker ? 'BROKER' : 'SUPPLIER';

    const org = await Organization.create({
      type: orgType,
      status: 'KYC_SUBMITTED',
      vendorType: data.vendorType,
      mandateStatus: data.mandateStatus,
      ndaRequired: data.ndaRequired,
      ndaSigned: data.ndaSigned,
      contactEmail: data.contactEmail,
      contactNumber: data.contactNumber,
    });

    const user = await User.create({
      email: data.email,
      role,
      organizationId: org._id,
    });

    const token = signToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      organizationId: org._id,
    });

    await logAction({
      userId: user._id,
      action: 'REGISTER_SUPPLIER',
      targetModel: 'Organization',
      targetId: org._id,
      ipAddress: req.ip,
    });

    await sendRegistrationConfirmation(data.email, role).catch(console.error);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        organizationId: org._id,
        organizationStatus: org.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/register/customer
const registerCustomer = async (req, res, next) => {
  try {
    const data = customerRegisterSchema.parse(req.body);

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const org = await Organization.create({
      type: 'CUSTOMER',
      status: 'KYC_SUBMITTED',
      companyName: data.companyName,
      companyType: data.companyType,
      jurisdiction: data.jurisdiction,
      industrySector: data.industrySector,
      taxVatNumber: data.taxVatNumber,
      companyAddress: data.companyAddress,
      website: data.website || undefined,
      authSignatoryName: data.authSignatoryName,
      authSignatoryTitle: data.authSignatoryTitle,
      billingContactName: data.billingContactName,
      billingContactEmail: data.billingContactEmail,
      contactEmail: data.billingContactEmail,
      primaryUseCases: data.primaryUseCases,
      locationPreferences: data.locationPreferences || [],
      sovereigntyReqs: data.sovereigntyReqs || [],
      complianceReqs: data.complianceReqs || [],
      budgetRange: data.budgetRange,
      urgency: data.urgency,
    });

    const user = await User.create({
      email: data.email,
      role: 'customer',
      organizationId: org._id,
    });

    const token = signToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      organizationId: org._id,
    });

    await logAction({
      userId: user._id,
      action: 'REGISTER_CUSTOMER',
      targetModel: 'Organization',
      targetId: org._id,
      ipAddress: req.ip,
    });

    await sendRegistrationConfirmation(data.email, 'customer').catch(console.error);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        organizationId: org._id,
        organizationStatus: org.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const org = user.organizationId
      ? await Organization.findById(user.organizationId)
      : null;

    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      organizationStatus: org?.status,
      organizationType: org?.type,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { requestOtp, verifyOtpHandler, registerSupplier, registerCustomer, getMe };
