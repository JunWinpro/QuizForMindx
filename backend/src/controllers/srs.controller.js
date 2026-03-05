const SrsData = require('../models/Srsdata');
const Card = require('../models/Card');
const Deck = require('../models/Deck');
const { calculateSM2 } = require('../utils/sm2');

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/srs/update-batch
// Cập nhật SRS data cho nhiều cards sau một study session
// Body: { results: [{ cardId, quality }] }
// ─────────────────────────────────────────────────────────────────────────────
const updateBatch = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { results } = req.body;

    // ── Validate input ────────────────────────────────────────────────────
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'results must be a non-empty array',
      });
    }

    for (const item of results) {
      if (!item.cardId) {
        return res.status(400).json({ success: false, message: 'Each result must have cardId' });
      }
      const q = Number(item.quality);
      if (isNaN(q) || q < 0 || q > 5) {
        return res.status(400).json({
          success: false,
          message: `quality must be 0-5 (got: ${item.quality} for card ${item.cardId})`,
        });
      }
    }

    // ── Lấy SRS records hiện tại (1 DB query) ────────────────────────────
    const cardIds = results.map((r) => r.cardId);
    const existingRecords = await SrsData.find({ userId, cardId: { $in: cardIds } });

    // Map cardId → SrsData record (dùng string key)
    const srsMap = new Map(existingRecords.map((r) => [String(r.cardId), r]));

    // ── Build bulkWrite ops (1 DB roundtrip cho toàn bộ session) ─────────
    const now = new Date();
    const bulkOps = results.map((item) => {
      const quality = Number(item.quality);
      const existing = srsMap.get(String(item.cardId));

      // Lấy state hiện tại hoặc dùng defaults nếu chưa có SRS record
      const interval = existing?.interval ?? 1;
      const easeFactor = existing?.easeFactor ?? 2.5;
      const repetitions = existing?.repetitions ?? 0;

      const { newInterval, newEaseFactor, newRepetitions, nextReviewDate } =
        calculateSM2(quality, interval, easeFactor, repetitions);

      return {
        updateOne: {
          filter: { userId, cardId: item.cardId },
          update: {
            $set: {
              interval: newInterval,
              easeFactor: newEaseFactor,
              repetitions: newRepetitions,
              nextReview: nextReviewDate,
              lastReview: now,
            },
            // Đảm bảo deckId tồn tại nếu record chưa có (upsert case)
            $setOnInsert: {
              userId,
              cardId: item.cardId,
            },
          },
          upsert: true,
        },
      };
    });

    const bulkResult = await SrsData.bulkWrite(bulkOps, { ordered: false });

    return res.status(200).json({
      success: true,
      message: 'SRS updated',
      modified: bulkResult.modifiedCount,
      upserted: bulkResult.upsertedCount,
      total: results.length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/srs/due?deckId=<id>
// Lấy danh sách cards due hôm nay (nextReview <= now), populate card data
// ─────────────────────────────────────────────────────────────────────────────
const getDueCards = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { deckId } = req.query;

    const now = new Date();

    // ── Build query ───────────────────────────────────────────────────────
    const query = {
      userId,
      nextReview: { $lte: now },
    };

    if (deckId) {
      // Validate deck tồn tại + user có quyền truy cập
      const deck = await Deck.findById(deckId);
      if (!deck) {
        return res.status(404).json({ success: false, message: 'Deck not found' });
      }
      const isOwner = String(deck.ownerId) === userId;
      if (!deck.isPublic && !isOwner) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      query.deckId = deckId;
    }

    // ── Query + populate Card data ────────────────────────────────────────
    const dueRecords = await SrsData.find(query)
      .sort({ nextReview: 1 })         // Sort nextReview ASC (overdue nhất trước)
      .populate({
        path: 'cardId',
        model: 'Card',
        select: 'front back example phonetic audioUrl imageUrl deckId',
      });

    // ── Flatten: merge SRS fields vào card object ─────────────────────────
    const cards = dueRecords
      .filter((r) => r.cardId != null)  // Loại bỏ records có card đã bị xóa
      .map((r) => ({
        ...r.cardId.toObject(),
        _srsId: r._id,
        _srsInterval: r.interval,
        _srsEaseFactor: r.easeFactor,
        _srsRepetitions: r.repetitions,
        _nextReview: r.nextReview,
        _lastReview: r.lastReview,
      }));

    return res.status(200).json({
      success: true,
      data: cards,
      dueCount: cards.length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/srs/schedule
// Lịch ôn tập 7 ngày tới: [{date, count}]
// MongoDB aggregation pipeline
// ─────────────────────────────────────────────────────────────────────────────
const getSchedule = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { deckId } = req.query;

    // ── Xác định khoảng thời gian: today → today + 6 ngày ─────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    // ── Build match stage ─────────────────────────────────────────────────
    const matchStage = {
      userId,
      nextReview: { $gte: today, $lte: endDate },
    };
    if (deckId) {
      matchStage.deckId = require('mongoose').Types.ObjectId.isValid(deckId)
        ? new (require('mongoose').Types.ObjectId)(deckId)
        : deckId;
    }

    // ── Aggregation pipeline ──────────────────────────────────────────────
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$nextReview',
              timezone: 'Asia/Ho_Chi_Minh', // UTC+7
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
    ];

    const rawData = await SrsData.aggregate(pipeline);

    // ── Fill in ngày không có card (count = 0) để trả về đủ 7 ngày ───────
    const dataMap = new Map(rawData.map((d) => [d.date, d.count]));

    const schedule = [];
    for (let i = 0; i <= 6; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      schedule.push({
        date: dateStr,
        count: dataMap.get(dateStr) ?? 0,
      });
    }

    return res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { updateBatch, getDueCards, getSchedule };