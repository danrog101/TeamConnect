const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyCode,
  resendVerificationCode,
  refreshToken,
  logout,
  getCurrentUser,
  forgotPassword,
  verifyResetCode,
  resetPassword
} = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../middleware/validators');
const { authLimiter, emailLimiter } = require('../middleware/rateLimiter');
const auth = require('../middleware/auth');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-code', authLimiter, verifyCode);
router.post('/verify', authLimiter, verifyCode);
router.post('/resend-code', emailLimiter, resendVerificationCode);
router.post('/refresh-token', refreshToken);
router.post('/logout', auth, logout);
router.get('/me', auth, getCurrentUser);

// Password reset routes
router.post('/forgot-password', emailLimiter, forgotPassword);
router.post('/verify-reset-code', authLimiter, verifyResetCode);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;