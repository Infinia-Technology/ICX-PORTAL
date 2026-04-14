const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
const MAX_ATTEMPTS = 3;
const RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN) || 60;

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const createOtp = async (email, purpose = 'login') => {
  // Invalidate any existing OTPs for this email in PostgreSQL
  await prisma.otp.deleteMany({
    where: { email: email.toLowerCase() }
  });

  const code = generateOtp();
  const hashedCode = await bcrypt.hash(code, 10);

  const otp = await prisma.otp.create({
    data: {
      email: email.toLowerCase(),
      code: hashedCode,
      purpose,
      expires_at: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });

  return { otp, plainCode: code };
};

const verifyOtp = async (email, code) => {
  const otp = await prisma.otp.findFirst({
    where: {
      email: email.toLowerCase(),
      verified: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: 'desc' }
  });

  if (!otp) {
    return { valid: false, error: 'OTP expired or not found. Please request a new one.' };
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    await prisma.otp.delete({ where: { id: otp.id } });
    return { valid: false, error: 'Too many attempts. Please request a new OTP.' };
  }

  const isMatch = await bcrypt.compare(code, otp.code);

  if (!isMatch) {
    const updated = await prisma.otp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } }
    });
    const remaining = MAX_ATTEMPTS - updated.attempts;
    return { valid: false, error: `Invalid OTP. ${remaining} attempt(s) remaining.` };
  }

  await prisma.otp.update({
    where: { id: otp.id },
    data: { verified: true }
  });

  return { valid: true, purpose: otp.purpose };
};

const canResendOtp = async (email) => {
  const lastOtp = await prisma.otp.findFirst({
    where: { email: email.toLowerCase() },
    orderBy: { created_at: 'desc' }
  });

  if (!lastOtp) return { allowed: true };

  const elapsed = (Date.now() - lastOtp.created_at.getTime()) / 1000;
  if (elapsed < RESEND_COOLDOWN_SECONDS) {
    const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
    return { allowed: false, retryAfter: wait };
  }

  return { allowed: true };
};

module.exports = { createOtp, verifyOtp, canResendOtp, RESEND_COOLDOWN_SECONDS };
