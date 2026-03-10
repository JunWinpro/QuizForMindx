const express    = require('express');
const passport   = require('passport');
const authMiddleware = require('../middlewares/auth.middleware');
const {
  register,
  login,
  getMe,
  updateProfile,
  updateSettings,
  changePassword,
  googleCallback,
} = require('../controllers/auth.controller');

const router = express.Router();

// ── Email / Password ─────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login',    login);

// ── Google OAuth ─────────────────────────────────────────────────────────────
// Bước 1: Redirect tới Google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);


router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
  }),
  googleCallback
);

// ── Protected ─────────────────────────────────────────────────────────────────
router.get('/me',               authMiddleware, getMe);
router.put('/profile',          authMiddleware, updateProfile);
router.put('/me',               authMiddleware, updateProfile);       // alias
router.put('/settings',         authMiddleware, updateSettings);
router.put('/change-password',  authMiddleware, changePassword);

module.exports = router;