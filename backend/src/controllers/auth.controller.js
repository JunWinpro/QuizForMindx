/**
 * backend/controllers/auth.controller.js
 */
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

const SALT_ROUNDS = 12;

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const safeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  return obj;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, passwordHash, displayName: displayName || '' });

    const token = signToken(user);
    return res.status(201).json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Google-only user không có passwordHash
    if (!user.passwordHash)
      return res.status(401).json({ success: false, message: 'Tài khoản này dùng đăng nhập Google. Vui lòng đăng nhập bằng Google.' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = signToken(user);
    return res.status(200).json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/google           → redirect to Google
// GET /api/auth/google/callback  → handled by Passport, then calls googleCallback
// ─────────────────────────────────────────────────────────────────────────────
const googleCallback = (req, res) => {
  try {
    // req.user được set bởi Passport strategy: { user, token }
    const { user, token } = req.user;
    const safeU = safeUser(user);
    const encoded = encodeURIComponent(JSON.stringify(safeU));
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Redirect về frontend kèm token + user trong query
    return res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encoded}`);
  } catch (err) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/me   (đổi tên, photoUrl)
// ─────────────────────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const allowed = ['displayName', 'photoUrl'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    // Trả về token mới + user (để frontend cập nhật AuthContext)
    const token = signToken(user);
    return res.status(200).json({ success: true, token, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/change-password
// ─────────────────────────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'currentPassword và newPassword là bắt buộc' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Mật khẩu mới tối thiểu 6 ký tự' });

    const user = await User.findById(req.user.userId);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.passwordHash)
      return res.status(400).json({ success: false, message: 'Tài khoản Google không thể đổi mật khẩu' });

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match)
      return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await User.findByIdAndUpdate(req.user.userId, { $set: { passwordHash } });
    return res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/settings
// ─────────────────────────────────────────────────────────────────────────────
const updateSettings = async (req, res) => {
  try {
    const LANGUAGE_WHITELIST = ['en', 'ja', 'ko', 'zh', 'fr', 'de', 'es', 'vi'];
    const { dailyGoal, defaultLanguage, notificationsEnabled } = req.body;

    const settingsUpdate = {};
    if (dailyGoal !== undefined) {
      const goal = Number(dailyGoal);
      if (goal < 1 || goal > 200)
        return res.status(400).json({ success: false, message: 'dailyGoal must be 1-200' });
      settingsUpdate['settings.dailyGoal'] = goal;
    }
    if (defaultLanguage !== undefined) {
      if (!LANGUAGE_WHITELIST.includes(defaultLanguage))
        return res.status(400).json({ success: false, message: 'Invalid language' });
      settingsUpdate['settings.defaultLanguage'] = defaultLanguage;
    }
    if (notificationsEnabled !== undefined)
      settingsUpdate['settings.notificationsEnabled'] = Boolean(notificationsEnabled);

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: settingsUpdate },
      { new: true }
    ).select('-passwordHash');

    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, updateSettings, googleCallback };