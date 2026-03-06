const SavedDeck = require('../models/SavedDeck');
const Deck = require('../models/Deck');
const Card = require('../models/Card');
const SrsData = require('../models/Srsdata');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/saved-decks/:deckId
// Lưu một deck (của mình hoặc public) vào danh sách
// ─────────────────────────────────────────────────────────────────────────────
const saveDeck = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { deckId } = req.params;

    // Kiểm tra deck tồn tại và quyền truy cập
    const deck = await Deck.findById(deckId);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });

    if (!deck.isPublic && String(deck.ownerId) !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // upsert để idempotent (gọi nhiều lần không lỗi)
    const saved = await SavedDeck.findOneAndUpdate(
      { userId, deckId },
      { userId, deckId },
      { upsert: true, new: true }
    );

    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/saved-decks/:deckId
// Bỏ lưu một deck
// ─────────────────────────────────────────────────────────────────────────────
const unsaveDeck = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { deckId } = req.params;

    const result = await SavedDeck.findOneAndDelete({ userId, deckId });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Saved deck not found' });
    }

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/saved-decks
// Lấy toàn bộ danh sách deck đã lưu, kèm progress của từng deck
//
// Progress được tính từ SrsData (không phải quiz):
//   - learnedPercent : % cards có repetitions >= 1 (đã ôn ít nhất 1 lần thành công)
//   - masteredPercent: % cards có repetitions >= 3 (đã thuộc vững)
//
// Lý do dùng SRS thay vì quiz score:
//   - SRS phản ánh quá trình học dài hạn, không chỉ 1 lần kiểm tra
//   - repetitions >= 1 = "đã bắt đầu học card này"
//   - repetitions >= 3 = "card này đã thực sự vào đầu"
// ─────────────────────────────────────────────────────────────────────────────
const getSavedDecks = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Lấy danh sách entries đã lưu
    const savedEntries = await SavedDeck.find({ userId }).sort({ createdAt: -1 });
    if (savedEntries.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const deckIds = savedEntries.map((e) => e.deckId);

    // Lấy thông tin các deck song song với cards
    const [decks, allCards] = await Promise.all([
      Deck.find({ _id: { $in: deckIds } }),
      Card.find({ deckId: { $in: deckIds } }).select('_id deckId'),
    ]);

    const deckMap = new Map(decks.map((d) => [String(d._id), d]));

    // Group card IDs theo deckId
    const cardsByDeck = new Map();
    for (const card of allCards) {
      const key = String(card.deckId);
      if (!cardsByDeck.has(key)) cardsByDeck.set(key, []);
      cardsByDeck.get(key).push(card._id);
    }

    // Lấy SrsData cho tất cả cards của user trong 1 query
    const allCardIds = allCards.map((c) => c._id);
    const srsRecords = await SrsData.find({
      userId,
      cardId: { $in: allCardIds },
    }).select('cardId repetitions');

    // Map: cardId (string) → repetitions
    const srsMap = new Map(srsRecords.map((r) => [String(r.cardId), r.repetitions]));

    // Build kết quả cuối
    const data = savedEntries
      .map((entry) => {
        const deckId = String(entry.deckId);
        const deck = deckMap.get(deckId);
        if (!deck) return null; // deck bị xóa sau khi user lưu

        const cardIds = cardsByDeck.get(deckId) || [];
        const totalCards = cardIds.length;

        let learnedCount = 0;
        let masteredCount = 0;

        for (const cardId of cardIds) {
          const reps = srsMap.get(String(cardId)) ?? 0;
          if (reps >= 1) learnedCount++;
          if (reps >= 3) masteredCount++;
        }

        return {
          savedAt: entry.createdAt,
          isOwner: String(deck.ownerId) === userId,
          deck: {
            _id: deck._id,
            name: deck.name,
            description: deck.description,
            language: deck.language,
            frontLanguage: deck.frontLanguage,
            backLanguage: deck.backLanguage,
            isPublic: deck.isPublic,
            cardCount: deck.cardCount,
            ownerName: deck.ownerName,
            ownerId: deck.ownerId,
          },
          progress: {
            totalCards,
            learnedCards: learnedCount,   // đã ôn >= 1 lần
            masteredCards: masteredCount, // đã thuộc >= 3 lần
            learnedPercent: totalCards > 0 ? Math.round((learnedCount / totalCards) * 100) : 0,
            masteredPercent: totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0,
          },
        };
      })
      .filter(Boolean);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/saved-decks/:deckId/progress
// Progress chi tiết của 1 deck: từng card ở trạng thái nào
//
// Card status:
//   - "new"       : chưa có SRS record (chưa bao giờ học)
//   - "learning"  : có SRS record nhưng repetitions = 0 (đang học, chưa pass lần nào)
//   - "reviewing" : repetitions 1-2 (đã học, đang củng cố)
//   - "mastered"  : repetitions >= 3 (đã thuộc vững)
// ─────────────────────────────────────────────────────────────────────────────
const getDeckProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { deckId } = req.params;

    const deck = await Deck.findById(deckId);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });

    if (!deck.isPublic && String(deck.ownerId) !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const cards = await Card.find({ deckId }).select('_id front back');
    const totalCards = cards.length;

    const srsRecords = await SrsData.find({
      userId,
      cardId: { $in: cards.map((c) => c._id) },
    }).select('cardId repetitions interval easeFactor nextReview lastReview');

    const srsMap = new Map(srsRecords.map((r) => [String(r.cardId), r]));

    const cardDetails = cards.map((card) => {
      const srs = srsMap.get(String(card._id));
      const repetitions = srs?.repetitions ?? 0;

      let status;
      if (!srs) status = 'new';
      else if (repetitions === 0) status = 'learning';
      else if (repetitions < 3) status = 'reviewing';
      else status = 'mastered';

      return {
        cardId: card._id,
        front: card.front,
        back: card.back,
        status,
        repetitions,
        interval: srs?.interval ?? 1,
        easeFactor: srs?.easeFactor ?? 2.5,
        nextReview: srs?.nextReview ?? null,
        lastReview: srs?.lastReview ?? null,
      };
    });

    const counts = {
      new: cardDetails.filter((c) => c.status === 'new').length,
      learning: cardDetails.filter((c) => c.status === 'learning').length,
      reviewing: cardDetails.filter((c) => c.status === 'reviewing').length,
      mastered: cardDetails.filter((c) => c.status === 'mastered').length,
    };

    const learnedCount = counts.reviewing + counts.mastered;

    return res.status(200).json({
      success: true,
      data: {
        deck: {
          _id: deck._id,
          name: deck.name,
          description: deck.description,
          cardCount: deck.cardCount,
        },
        progress: {
          totalCards,
          ...counts,
          learnedCards: learnedCount,
          learnedPercent: totalCards > 0 ? Math.round((learnedCount / totalCards) * 100) : 0,
          masteredPercent:
            totalCards > 0 ? Math.round((counts.mastered / totalCards) * 100) : 0,
        },
        cards: cardDetails,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { saveDeck, unsaveDeck, getSavedDecks, getDeckProgress };