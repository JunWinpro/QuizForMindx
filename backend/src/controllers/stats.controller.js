const mongoose = require('mongoose');
const User = require('../models/User');
const SrsData = require('../models/Srsdata');
const QuizResult = require('../models/Quizresult');


const getProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Chạy 3 queries song song — không await từng cái
    const [wordsLearned, quizAgg, user] = await Promise.all([

      // 1. Đếm từ đã học: SrsData có repetitions > 0
      SrsData.countDocuments({ userId, repetitions: { $gt: 0 } }),

      // 2. Accuracy TB + tổng quiz từ QuizResult
      QuizResult.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$score' },
            total: { $sum: 1 },
          },
        },
      ]),

      // 3. Streak từ User document
      User.findById(userId).select('stats'),
    ]);

    const averageAccuracy = quizAgg[0] ? Math.round(quizAgg[0].avgScore) : 0;
    const totalQuizzes = quizAgg[0] ? quizAgg[0].total : 0;
    const currentStreak = user?.stats?.streak ?? 0;
    const longestStreak = user?.stats?.longestStreak ?? 0;

    return res.status(200).json({
      success: true,
      data: {
        totalWordsLearned: wordsLearned,
        averageAccuracy,
        totalQuizzes,
        currentStreak,
        longestStreak,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/stats/activity
// Hoạt động 7 ngày qua: [{date, quizCount, avgScore, cardsReviewed}]
// Đảm bảo trả về đủ 7 phần tử kể cả ngày không có dữ liệu (fill 0)
// ─────────────────────────────────────────────────────────────────────────────
const getActivity = async (req, res) => {
  try {
    const userId = req.user.userId;

    // ── Xác định khoảng 7 ngày (today - 6 → today) ───────────────────────
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    // ── Aggregate song song ───────────────────────────────────────────────
    const [srsAgg, quizAgg] = await Promise.all([

      // Cards reviewed per day — group theo lastReview
      SrsData.aggregate([
        {
          $match: {
            userId: userId,
            lastReview: { $gte: weekAgo, $lte: today },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$lastReview',
                timezone: 'Asia/Ho_Chi_Minh',
              },
            },
            cardsReviewed: { $sum: 1 },
          },
        },
      ]),

      // Quiz stats per day — group theo createdAt
      QuizResult.aggregate([
        {
          $match: {
            userId: userId,
            createdAt: { $gte: weekAgo, $lte: today },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: 'Asia/Ho_Chi_Minh',
              },
            },
            quizCount: { $sum: 1 },
            avgScore: { $avg: '$score' },
          },
        },
      ]),
    ]);

    // ── Build lookup maps ─────────────────────────────────────────────────
    const srsMap = new Map(srsAgg.map((d) => [d._id, d.cardsReviewed]));
    const quizMap = new Map(quizAgg.map((d) => [d._id, d]));

    // ── Fill đủ 7 ngày (oldest → newest) ─────────────────────────────────
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10); // "2026-03-01"

      result.push({
        date: key,
        cardsReviewed: srsMap.get(key) ?? 0,
        quizCount: quizMap.get(key)?.quizCount ?? 0,
        avgScore: quizMap.has(key) ? Math.round(quizMap.get(key).avgScore) : 0,
      });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/stats/streak
// Gọi sau mỗi study session hoàn thành.
// Logic:
//   lastStudyDate == hôm nay  → không thay đổi (đã học rồi)
//   lastStudyDate == hôm qua  → streak++
//   ngày khác / null           → streak = 1 (reset hoặc bắt đầu mới)
// Luôn update lastStudyDate = now, cập nhật longestStreak nếu cần
// ─────────────────────────────────────────────────────────────────────────────
const updateStreak = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Normalize today + yesterday về 00:00:00 local (UTC+7 approximation)
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // Normalize lastStudyDate
    const rawLast = user.stats?.lastStudyDate;
    const lastDate = rawLast ? new Date(rawLast) : null;
    if (lastDate) lastDate.setHours(0, 0, 0, 0);

    let newStreak = user.stats?.streak ?? 0;

    if (!lastDate) {
      // Lần đầu học
      newStreak = 1;
    } else if (lastDate.getTime() === todayStart.getTime()) {
      // Đã học hôm nay rồi — không thay đổi streak
      // (chỉ update lastStudyDate timestamp)
    } else if (lastDate.getTime() === yesterdayStart.getTime()) {
      // Học liên tiếp → streak++
      newStreak += 1;
    } else {
      // Bỏ ngày → reset streak về 1
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, user.stats?.longestStreak ?? 0);

    // Update User document
    await User.findByIdAndUpdate(req.user.userId, {
      $set: {
        'stats.streak': newStreak,
        'stats.longestStreak': newLongest,
        'stats.lastStudyDate': now,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastStudyDate: now,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getProgress, getActivity, updateStreak };