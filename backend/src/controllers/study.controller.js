const Card = require('../models/Card');
const Deck = require('../models/Deck');
const SrsData = require('../models/Srsdata');

// ── Fisher-Yates shuffle ──────────────────────────────────────────────────
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/study/:deckId/init-srs
// Tạo SrsData records cho tất cả cards trong deck (upsert, idempotent)
// ─────────────────────────────────────────────────────────────────────────────
const initSrs = async (req, res) => {
  try {
    const { deckId } = req.params;
    const userId = req.user.userId;

    const deck = await Deck.findById(deckId);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }

    // Chỉ cho phép nếu deck public hoặc user là owner
    const isOwner = String(deck.ownerId) === userId;
    if (!deck.isPublic && !isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const cards = await Card.find({ deckId }).select('_id');
    if (cards.length === 0) {
      return res.status(200).json({ success: true, message: 'No cards to init', count: 0 });
    }

    // bulkWrite upsert — gọi nhiều lần không bị lỗi
    const ops = cards.map((card) => ({
      updateOne: {
        filter: { userId, cardId: card._id },
        update: {
          $setOnInsert: {
            userId,
            cardId: card._id,
            deckId,
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0,
            nextReview: new Date(),
            lastReview: null,
          },
        },
        upsert: true,
      },
    }));

    const result = await SrsData.bulkWrite(ops, { ordered: false });

    return res.status(200).json({
      success: true,
      message: 'SRS initialized',
      count: cards.length,
      inserted: result.upsertedCount,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/study/:deckId/session
// Trả về cards cần học hôm nay (due cards trước, còn lại sau), đã shuffle
// ─────────────────────────────────────────────────────────────────────────────
const getStudySession = async (req, res) => {
  try {
    const { deckId } = req.params;
    const userId = req.user.userId;

    const deck = await Deck.findById(deckId);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }

    const isOwner = String(deck.ownerId) === userId;
    if (!deck.isPublic && !isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Lấy tất cả cards của deck
    const allCards = await Card.find({ deckId });
    if (allCards.length === 0) {
      return res.status(200).json({ success: true, data: [], dueCount: 0 });
    }

    const cardIds = allCards.map((c) => c._id);

    // Lấy SRS data hiện có cho user + deck này
    const now = new Date();
    const srsRecords = await SrsData.find({
      userId,
      cardId: { $in: cardIds },
    });

    const srsMap = new Map(srsRecords.map((r) => [String(r.cardId), r]));

    // Phân loại: due (nextReview <= now) vs new/future
    const dueCards = [];
    const futureCards = [];

    for (const card of allCards) {
      const srs = srsMap.get(String(card._id));
      const cardObj = card.toObject();

      if (!srs || srs.nextReview <= now) {
        // Chưa có SRS data => mới, hoặc đến hạn review
        dueCards.push({
          ...cardObj,
          _srsInterval: srs?.interval ?? 1,
          _srsDue: true,
        });
      } else {
        futureCards.push({
          ...cardObj,
          _srsInterval: srs.interval,
          _srsDue: false,
        });
      }
    }

    // Due cards trước (shuffle), future cards sau (shuffle)
    const ordered = [...shuffle(dueCards), ...shuffle(futureCards)];

    return res.status(200).json({
      success: true,
      data: ordered,
      dueCount: dueCards.length,
      totalCount: allCards.length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { initSrs, getStudySession };