const Card = require('../models/Card');
const Deck = require('../models/Deck');
const QuizResult = require('../models/Quizresult');

// ── Fisher-Yates shuffle (dùng lại từ study controller) ──────────────────────
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/quiz/:deckId/generate?count=20
//
// Tạo danh sách câu hỏi trắc nghiệm từ bộ flashcard:
//   - Lấy `count` cards ngẫu nhiên làm câu hỏi (câu hỏi = mặt "front")
//   - Với mỗi câu: tạo 4 lựa chọn gồm 1 đáp án đúng + 3 sai (random từ deck)
//   - Shuffle thứ tự 4 options
//   - Trả về [{cardId, question, options[], correctIndex}]
//   - Xử lý edge case: deck < 4 cards
// ─────────────────────────────────────────────────────────────────────────────
const generateQuiz = async (req, res) => {
  try {
    const { deckId } = req.params;
    const userId = req.user.userId;

    // ── Validate deck tồn tại + quyền truy cập ───────────────────────────
    const deck = await Deck.findById(deckId);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }

    const isOwner = String(deck.ownerId) === userId;
    if (!deck.isPublic && !isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // ── Lấy tất cả cards của deck ─────────────────────────────────────────
    const allCards = await Card.find({ deckId }).select('_id front back');

    // Edge case: deck cần ít nhất 2 cards để tạo quiz (1 đúng + ít nhất 1 sai)
    if (allCards.length < 2) {
      return res.status(400).json({
        success: false,
        message: `Deck cần ít nhất 2 cards để tạo quiz (hiện có ${allCards.length})`,
      });
    }

    // ── Xác định số câu hỏi thực tế ──────────────────────────────────────
    // count tối đa = số cards trong deck; mặc định 20
    const requestedCount = Math.max(1, parseInt(req.query.count) || 20);
    const questionCount = Math.min(requestedCount, allCards.length);

    // ── Chọn ngẫu nhiên `questionCount` cards làm câu hỏi ────────────────
    const questionCards = shuffle(allCards).slice(0, questionCount);

    // ── Build câu hỏi ─────────────────────────────────────────────────────
    const questions = questionCards.map((correctCard) => {
      // Pool các cards sai = tất cả cards TRỪ card đúng
      const wrongPool = allCards.filter(
        (c) => String(c._id) !== String(correctCard._id)
      );

      // Số lựa chọn sai: tối đa 3, nhưng không vượt quá số cards trong pool
      const wrongCount = Math.min(3, wrongPool.length);
      const wrongOptions = shuffle(wrongPool).slice(0, wrongCount);

      // Gộp đáp án đúng + sai, shuffle thứ tự
      const allOptions = shuffle([correctCard, ...wrongOptions]);

      // Tìm vị trí đáp án đúng sau khi shuffle
      const correctIndex = allOptions.findIndex(
        (opt) => String(opt._id) === String(correctCard._id)
      );

      return {
        cardId: correctCard._id,
        question: correctCard.front,      // Hiển thị mặt trước cho user
        options: allOptions.map((opt) => opt.back),  // Đáp án = mặt sau (nghĩa)
        correctIndex,                      // 0-based index trong options[]
      };
    });

    return res.status(200).json({
      success: true,
      data: questions,
      meta: {
        deckId,
        deckName: deck.name,
        totalQuestions: questions.length,
        totalCards: allCards.length,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/quiz/result
//
// Lưu kết quả quiz sau khi user hoàn thành session.
// Body: {
//   deckId, deckName, score, correctCount, totalQuestions,
//   wrongCards: [{cardId, front, back, selectedAnswer, correctAnswer}],
//   duration
// }
// ─────────────────────────────────────────────────────────────────────────────
const saveResult = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      deckId,
      deckName,
      score,
      correctCount,
      totalQuestions,
      wrongCards,
      duration,
    } = req.body;

    // ── Validate bắt buộc ─────────────────────────────────────────────────
    if (!deckId) {
      return res.status(400).json({ success: false, message: 'deckId is required' });
    }
    if (score === undefined || score === null) {
      return res.status(400).json({ success: false, message: 'score is required' });
    }
    if (correctCount === undefined || correctCount === null) {
      return res.status(400).json({ success: false, message: 'correctCount is required' });
    }
    if (!totalQuestions || totalQuestions < 1) {
      return res.status(400).json({
        success: false,
        message: 'totalQuestions must be >= 1',
      });
    }
    if (duration === undefined || duration === null || duration < 0) {
      return res.status(400).json({
        success: false,
        message: 'duration (seconds) is required and must be >= 0',
      });
    }

    // ── Validate score hợp lệ ─────────────────────────────────────────────
    const scoreNum = Number(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'score must be a number between 0 and 100',
      });
    }

    // ── Lấy deckName từ DB nếu FE không gửi ──────────────────────────────
    let resolvedDeckName = deckName || '';
    if (!resolvedDeckName) {
      const deck = await Deck.findById(deckId).select('name');
      if (deck) resolvedDeckName = deck.name;
    }

    // ── Tạo QuizResult document ───────────────────────────────────────────
    const result = await QuizResult.create({
      userId,
      deckId,
      deckName: resolvedDeckName,
      score: scoreNum,
      correctCount: Number(correctCount),
      totalQuestions: Number(totalQuestions),
      wrongCards: Array.isArray(wrongCards) ? wrongCards : [],
      duration: Number(duration),
    });

    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/quiz/history?page=1&limit=10&deckId=<optional>
//
// Lấy lịch sử quiz của user hiện tại.
// - Sort theo createdAt DESC (mới nhất trước)
// - Hỗ trợ filter theo deckId (optional)
// - Pagination: page + limit
// ─────────────────────────────────────────────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { deckId } = req.query;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // ── Build query ───────────────────────────────────────────────────────
    const query = { userId };
    if (deckId) {
      query.deckId = deckId;
    }

    const [results, total] = await Promise.all([
      QuizResult.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-wrongCards'),  // Không trả wrongCards trong danh sách để giảm payload
      QuizResult.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/quiz/history/:resultId
//
// Lấy chi tiết 1 kết quả quiz (bao gồm wrongCards)
// ─────────────────────────────────────────────────────────────────────────────
const getResultDetail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { resultId } = req.params;

    const result = await QuizResult.findOne({ _id: resultId, userId });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Quiz result not found' });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { generateQuiz, saveResult, getHistory, getResultDetail };