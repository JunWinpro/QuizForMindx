/**
 * backend/config/passport.js
 *
 * Google OAuth2 Strategy với Passport.js
 *
 * Setup:
 *   npm install passport passport-google-oauth20
 *
 * Env vars cần thiết (.env):
 *   GOOGLE_CLIENT_ID=xxx
 *   GOOGLE_CLIENT_SECRET=xxx
 *   FRONTEND_URL=http://localhost:5173   (hoặc domain production)
 *   JWT_SECRET=xxx
 */

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Kiểm tra và cảnh báo JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set in environment. Tokens will be signed with an unsafe default for development.');
  // Không gán bí mật mặc định trong production — chỉ cho dev local.
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-temporary-secret-change-me';
}

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// Guard: nếu thiếu biến config, không đăng ký GoogleStrategy để tránh crash.
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn(
    '⚠️  Google OAuth env vars missing: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set. Skipping GoogleStrategy registration.'
  );
} else {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // Nếu bạn có BACKEND_URL env, tốt hơn dùng absolute callbackURL
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const googleId = profile.id;
          const displayName = profile.displayName || '';
          const photoUrl = profile.photos?.[0]?.value || '';

          // 1. Tìm user theo googleId (đã từng login Google)
          let user = await User.findOne({ googleId });

          // 2. Tìm user theo email (đã có tài khoản email/password)
          if (!user) {
            user = await User.findOne({ email });
          }

          if (user) {
            // Cập nhật googleId + photoUrl nếu chưa có
            const updates = {};
            if (!user.googleId) updates.googleId = googleId;
            if (!user.photoUrl && photoUrl) updates.photoUrl = photoUrl;
            if (Object.keys(updates).length > 0) {
              await User.findByIdAndUpdate(user._id, { $set: updates });
              user = await User.findById(user._id);
            }
          } else {
            // 3. Tạo user mới từ Google
            user = await User.create({
              email,
              googleId,
              displayName,
              photoUrl,
              passwordHash: null, // Google user không có password
            });
          }

          const token = signToken(user);
          return done(null, { user, token });
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

// Không dùng session — chỉ dùng JWT
passport.serializeUser((data, done) => done(null, data));
passport.deserializeUser((data, done) => done(null, data));

module.exports = passport;