const rateLimit = require('express-rate-limit');

// General API rate limiter - increased limits
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 1000, // 1000 requestova po IP (povećano sa 100)
  message: {
    message: 'Previše zahtjeva, pokušaj ponovno za nekoliko minuta'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter za login/register - increased
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 20, // 20 pokušaja (povećano sa 5)
  message: {
    message: 'Previše pokušaja prijave, pokušaj ponovno za 15 minuta'
  },
  skipSuccessfulRequests: true,
});

// Limiter za file upload - increased
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 sat
  max: 50, // 50 uploada po satu (povećano sa 10)
  message: {
    message: 'Previše uploada, pokušaj ponovno za 1 sat'
  }
});

// Limiter za chat poruke - increased
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuta
  max: 60, // 60 poruka po minuti (povećano sa 20)
  message: {
    message: 'Previše poruka, uspori malo!'
  }
});

// Limiter za email sending - increased
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 sat
  max: 20, // 20 emailova po satu (povećano sa 5)
  message: {
    message: 'Previše poslanih emailova, pokušaj kasnije'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  chatLimiter,
  emailLimiter
};