const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SALT_ROUNDS = 12;

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const safeUser = (user) => {
  const obj = user.toObject();
  delete obj.passwordHash;
  return obj;
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, passwordHash, displayName: displayName || '' });

    const token = signToken(user);
    return res.status(201).json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user);
    return res.status(200).json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/profile
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

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/settings
const updateSettings = async (req, res) => {
  try {
    const LANGUAGE_WHITELIST = ['en', 'ja', 'ko', 'zh', 'fr', 'de', 'es', 'vi'];
    const { dailyGoal, defaultLanguage, notificationsEnabled } = req.body;

    const settingsUpdate = {};
    if (dailyGoal !== undefined) {
      const goal = Number(dailyGoal);
      if (goal < 1 || goal > 200) {
        return res.status(400).json({ success: false, message: 'dailyGoal must be 1-200' });
      }
      settingsUpdate['settings.dailyGoal'] = goal;
    }
    if (defaultLanguage !== undefined) {
      if (!LANGUAGE_WHITELIST.includes(defaultLanguage)) {
        return res.status(400).json({ success: false, message: 'Invalid language' });
      }
      settingsUpdate['settings.defaultLanguage'] = defaultLanguage;
    }
    if (notificationsEnabled !== undefined) {
      settingsUpdate['settings.notificationsEnabled'] = Boolean(notificationsEnabled);
    }

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

module.exports = { register, login, getMe, updateProfile, updateSettings };