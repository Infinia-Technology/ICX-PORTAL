const { z } = require('zod');
const prisma = require('../config/prisma');
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

const isDev = process.env.NODE_ENV !== 'production';

// --- Dynamic role assignment ---
const VENDOR_ROLE_MAP = {
  'Broker': 'broker',
  'Advisor': 'broker',
  'Other Intermediary': 'broker',
};

function resolveRole(registrationType, vendorType) {
  if (registrationType === 'supplier' && vendorType) {
    return VENDOR_ROLE_MAP[vendorType] || 'supplier';
  }
  return registrationType === 'customer' ? 'customer' : 'supplier';
}

// Validation schemas (Extended)
const supplierRegisterSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  name: z.string().optional(),
  vendorType: z.string().optional(),
  companyName: z.string().optional(),
});

const customerRegisterSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  name: z.string().optional(),
  companyName: z.string().optional(),
});

// POST /api/auth/otp/request
const requestOtp = async (req, res, next) => {
  try {
    const { email } = otpRequestSchema.parse(req.body);

    const { plainCode } = await createOtp(email, 'login');

    if (isDev) {
      console.log(`[DEV] OTP for ${email}: ${plainCode}`);
    }

    try {
      await sendOtpEmail(email, plainCode);
    } catch (emailErr) {
      console.error('[EMAIL] Failed to send OTP:', emailErr.message);
      if (!isDev) throw emailErr;
    }

    logAction({ action: 'OTP_REQUESTED', changes: { email }, ipAddress: req.ip }).catch(() => {});

    res.json({ message: 'OTP sent to your email', cooldown: RESEND_COOLDOWN_SECONDS });
  } catch (err) {
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

    let user = await prisma.user.findUnique({ 
      where: { email },
      include: { organization: true }
    });

    if (!user) {
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

    // Existing user — issue JWT with organization_id
    user = await prisma.user.update({
      where: { id: user.id },
      data: { updated_at: new Date() }
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id,
    });

    await logAction({
      userId: user.id,
      action: 'LOGIN',
      ipAddress: req.ip,
    });

    res.json({
      authenticated: true,
      registered: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        kyc_status: user.kyc_status,
        organization_id: user.organization_id,
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

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const role = resolveRole('supplier', data.vendorType);
    const orgType = (role === 'broker') ? 'BROKER' : 'SUPPLIER';

    // Atomic transaction for Organization + User
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          type: orgType,
          status: 'SUBMITTED',
          contact_email: data.email,
          company_name: data.companyName,
          vendor_type: data.vendorType
        }
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          role: role,
          kyc_status: 'submitted',
          organization_id: organization.id
        }
      });

      return { user, organization };
    });

    const token = signToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      organization_id: result.user.organization_id,
    });

    await logAction({
      userId: result.user.id,
      action: 'REGISTER_SUPPLIER',
      targetModel: 'User',
      targetId: result.user.id,
      ipAddress: req.ip,
    });

    await sendRegistrationConfirmation(data.email, result.user.role).catch(console.error);

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        kyc_status: result.user.kyc_status,
        organization_id: result.user.organization_id,
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

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          type: 'CUSTOMER',
          status: 'SUBMITTED',
          contact_email: data.email,
          company_name: data.companyName
        }
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          role: 'customer',
          kyc_status: 'submitted',
          organization_id: organization.id
        }
      });

      return { user, organization };
    });

    const token = signToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      organization_id: result.user.organization_id,
    });

    await logAction({
      userId: result.user.id,
      action: 'REGISTER_CUSTOMER',
      targetModel: 'User',
      targetId: result.user.id,
      ipAddress: req.ip,
    });

    await sendRegistrationConfirmation(data.email, result.user.role).catch(console.error);

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        kyc_status: result.user.kyc_status,
        organization_id: result.user.organization_id,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.userId },
      include: { organization: true }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      kyc_status: user.kyc_status,
      isActive: user.isActive,
      organization_id: user.organization_id,
      organization: user.organization,
      createdAt: user.created_at,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { requestOtp, resendOtp, verifyOtpHandler, registerSupplier, registerCustomer, getMe };
