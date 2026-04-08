const express = require('express');
const router = express.Router();
const { otpRequestLimiter, otpVerifyLimiter } = require('../middleware/rateLimiter');
const authenticate = require('../middleware/auth');
const {
  requestOtp,
  verifyOtpHandler,
  registerSupplier,
  registerCustomer,
  getMe,
} = require('../controllers/auth.controller');

router.post('/otp/request', otpRequestLimiter, requestOtp);
router.post('/otp/verify', otpVerifyLimiter, verifyOtpHandler);
router.post('/register/supplier', registerSupplier);
router.post('/register/customer', registerCustomer);
router.get('/me', authenticate, getMe);

module.exports = router;
