const { z } = require('zod');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { createOtp, verifyOtp, canResendOtp, RESEND_COOLDOWN_SECONDS } = require('../services/otp.service');
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

const isDev = process.env.NODE_ENV !== 'production';

// --- Dynamic role assignment ---
// Maps registration context to a user role. Easy to extend with new roles.
const VENDOR_ROLE_MAP = {
  'Broker': 'broker',
  'Advisor': 'broker',
  'Other Intermediary': 'broker',
  // All other vendor types default to 'supplier'
};

const REGISTRATION_TYPE_ROLE_MAP = {
  supplier: 'supplier',   // default for supplier registration
  customer: 'customer',
};

function resolveRole(registrationType, vendorType) {
  if (registrationType === 'supplier' && vendorType) {
    return VENDOR_ROLE_MAP[vendorType] || 'supplier';
  }
  return REGISTRATION_TYPE_ROLE_MAP[registrationType] || 'supplier';
}

function resolveOrgType(role) {
  const ORG_TYPE_MAP = { broker: 'BROKER', supplier: 'SUPPLIER', customer: 'CUSTOMER' };
  return ORG_TYPE_MAP[role] || 'SUPPLIER';
}

// POST /api/auth/otp/request
const requestOtp = async (req, res, next) => {
  try {
    const { email } = otpRequestSchema.parse(req.body);

    const { plainCode } = await createOtp(email, 'login');

    if (isDev) {
      console.log(`[DEV] OTP for ${email}: ${plainCode}`);
    }

    // Attempt email delivery; in dev mode, don't fail if email can't be sent
    try {
      await sendOtpEmail(email, plainCode);
    } catch (emailErr) {
      console.error('[EMAIL] Failed to send OTP:', emailErr.message);
      if (!isDev) throw emailErr;
    }

    logAction({ action: 'OTP_REQUESTED', changes: { email }, ipAddress: req.ip }).catch(() => {});

    res.json({ message: 'OTP sent to your email', cooldown: RESEND_COOLDOWN_SECONDS });
  } catch (err) {
    logAction({ action: 'OTP_REQUEST_FAILED', changes: { email: req.body?.email, error: err.message }, ipAddress: req.ip }).catch(() => {});
    next(err);
  }
};

// POST /api/auth/otp/resend
const resendOtp = async (req, res, next) => {
  try {
    const { email } = otpRequestSchema.parse(req.body);

    const { allowed, retryAfter } = await canResendOtp(email);
    if (!allowed) {
      return res.status(429).json({
        error: `Please wait ${retryAfter} seconds before requesting a new code`,
        retryAfter,
      });
    }

    const { plainCode } = await createOtp(email, 'login');

    if (isDev) {
      console.log(`[DEV] OTP for ${email}: ${plainCode}`);
    }

    try {
      await sendOtpEmail(email, plainCode);
    } catch (emailErr) {
      console.error('[EMAIL] Failed to resend OTP:', emailErr.message);
      if (!isDev) throw emailErr;
    }

    logAction({ action: 'OTP_RESENT', changes: { email }, ipAddress: req.ip }).catch(() => {});

    res.json({ message: 'OTP resent to your email', cooldown: RESEND_COOLDOWN_SECONDS });
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
      logAction({ action: 'OTP_VERIFY_FAILED', changes: { email, reason: result.error }, ipAddress: req.ip }).catch(() => {});
      return res.status(400).json({ error: result.error });
    }

    logAction({ action: 'OTP_VERIFIED', changes: { email }, ipAddress: req.ip }).catch(() => {});

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

    // Dynamic role assignment based on vendor type
    const role = resolveRole('supplier', data.vendorType);
    const orgType = resolveOrgType(role);

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

    const role = resolveRole('customer');

    const org = await Organization.create({
      type: resolveOrgType(role),
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
      action: 'REGISTER_CUSTOMER',
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

module.exports = { requestOtp, resendOtp, verifyOtpHandler, registerSupplier, registerCustomer, getMe };
