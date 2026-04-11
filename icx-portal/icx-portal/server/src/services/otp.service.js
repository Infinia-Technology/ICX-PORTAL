const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Otp = require('../models/Otp');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
const MAX_ATTEMPTS = 3;
const RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN) || 60;

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const createOtp = async (email, purpose = 'login') => {
  // Invalidate any existing OTPs for this email
  await Otp.deleteMany({ email: email.toLowerCase() });

  const code = generateOtp();
  const hashedCode = await bcrypt.hash(code, 10);

  const otp = await Otp.create({
    email: email.toLowerCase(),
    code: hashedCode,
    purpose,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
  });

  return { otp, plainCode: code };
};

const verifyOtp = async (email, code) => {
  const otp = await Otp.findOne({
    email: email.toLowerCase(),
    verified: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otp) {
    return { valid: false, error: 'OTP expired or not found. Please request a new one.' };
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: otp._id });
    return { valid: false, error: 'Too many attempts. Please request a new OTP.' };
  }

  const isMatch = await bcrypt.compare(code, otp.code);

  if (!isMatch) {
    otp.attempts += 1;
    await otp.save();
    const remaining = MAX_ATTEMPTS - otp.attempts;
    return { valid: false, error: `Invalid OTP. ${remaining} attempt(s) remaining.` };
  }

  otp.verified = true;
  await otp.save();

  return { valid: true, purpose: otp.purpose };
};

const canResendOtp = async (email) => {
  const lastOtp = await Otp.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 });

  if (!lastOtp) return { allowed: true };

  const elapsed = (Date.now() - lastOtp.createdAt.getTime()) / 1000;
  if (elapsed < RESEND_COOLDOWN_SECONDS) {
    const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
    return { allowed: false, retryAfter: wait };
  }

  return { allowed: true };
};

module.exports = { createOtp, verifyOtp, canResendOtp, RESEND_COOLDOWN_SECONDS };
