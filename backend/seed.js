/**
 * seed.js — LexiLearn
 * Creates 3 public sample decks (English, Japanese, Korean) with 10 cards each.
 * Run once: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const Deck = require('./src/models/Deck');
const Card = require('./src/models/Card');

const DECKS_DATA = [
  {
    deck: {
      name: 'Essential English Vocabulary',
      description: '10 must-know English words for beginners',
      language: 'en',
      isPublic: true,
      ownerId: null,
      ownerName: 'LexiLearn',
    },
    cards: [
      { front: 'apple', back: 'quả táo', example: 'I eat an apple every morning.', phonetic: '/ˈæpəl/' },
      { front: 'beautiful', back: 'đẹp', example: 'She has a beautiful smile.', phonetic: '/ˈbjuːtɪfəl/' },
      { front: 'challenge', back: 'thách thức', example: 'Learning a language is a challenge.', phonetic: '/ˈtʃælɪndʒ/' },
      { front: 'dream', back: 'giấc mơ / ước mơ', example: 'Follow your dream.', phonetic: '/driːm/' },
      { front: 'effort', back: 'nỗ lực', example: 'Success requires effort.', phonetic: '/ˈefərt/' },
      { front: 'freedom', back: 'tự do', example: 'Freedom is a basic human right.', phonetic: '/ˈfriːdəm/' },
      { front: 'grateful', back: 'biết ơn', example: 'I am grateful for your help.', phonetic: '/ˈɡreɪtfəl/' },
      { front: 'happiness', back: 'hạnh phúc', example: 'Happiness is a choice.', phonetic: '/ˈhæpɪnəs/' },
      { front: 'inspire', back: 'truyền cảm hứng', example: 'Her story inspired many people.', phonetic: '/ɪnˈspaɪər/' },
      { front: 'journey', back: 'hành trình', example: 'Life is a journey, not a destination.', phonetic: '/ˈdʒɜːrni/' },
    ],
  },
  {
    deck: {
      name: '日本語 基礎単語 (Japanese Basics)',
      description: '10 essential Japanese words for beginners',
      language: 'ja',
      isPublic: true,
      ownerId: null,
      ownerName: 'LexiLearn',
    },
    cards: [
      { front: 'ありがとう', back: 'Cảm ơn', example: 'ありがとうございます。— Cảm ơn rất nhiều.', phonetic: 'arigatou' },
      { front: 'すみません', back: 'Xin lỗi / Xin phép', example: 'すみません、トイレはどこですか？', phonetic: 'sumimasen' },
      { front: 'はい', back: 'Vâng / Có', example: 'はい、わかりました。— Vâng, tôi hiểu rồi.', phonetic: 'hai' },
      { front: 'いいえ', back: 'Không', example: 'いいえ、結構です。— Không, cảm ơn.', phonetic: 'iie' },
      { front: '水 (みず)', back: 'Nước', example: '水をください。— Cho tôi nước.', phonetic: 'mizu' },
      { front: '食べる (たべる)', back: 'Ăn', example: '何を食べますか？— Bạn ăn gì?', phonetic: 'taberu' },
      { front: '飲む (のむ)', back: 'Uống', example: 'コーヒーを飲みます。— Tôi uống cà phê.', phonetic: 'nomu' },
      { front: '学校 (がっこう)', back: 'Trường học', example: '学校に行きます。— Tôi đi học.', phonetic: 'gakkou' },
      { front: '友達 (ともだち)', back: 'Bạn bè', example: '友達と遊ぶ。— Chơi với bạn bè.', phonetic: 'tomodachi' },
      { front: '愛 (あい)', back: 'Tình yêu', example: '愛してる。— Tôi yêu bạn.', phonetic: 'ai' },
    ],
  },
  {
    deck: {
      name: '한국어 기초 어휘 (Korean Basics)',
      description: '10 essential Korean words for beginners',
      language: 'ko',
      isPublic: true,
      ownerId: null,
      ownerName: 'LexiLearn',
    },
    cards: [
      { front: '안녕하세요', back: 'Xin chào', example: '안녕하세요! 만나서 반가워요.', phonetic: 'annyeonghaseyo' },
      { front: '감사합니다', back: 'Cảm ơn', example: '도와주셔서 감사합니다.', phonetic: 'gamsahamnida' },
      { front: '죄송합니다', back: 'Xin lỗi', example: '늦어서 죄송합니다.', phonetic: 'joesonghamnida' },
      { front: '네', back: 'Vâng / Có', example: '네, 알겠습니다.', phonetic: 'ne' },
      { front: '아니요', back: 'Không', example: '아니요, 괜찮아요.', phonetic: 'aniyo' },
      { front: '물', back: 'Nước', example: '물 한 잔 주세요.', phonetic: 'mul' },
      { front: '밥', back: 'Cơm / Bữa ăn', example: '밥 먹었어요?', phonetic: 'bap' },
      { front: '학교', back: 'Trường học', example: '학교에 가요.', phonetic: 'hakgyo' },
      { front: '친구', back: 'Bạn bè', example: '친구랑 놀아요.', phonetic: 'chingu' },
      { front: '사랑', back: 'Tình yêu', example: '사랑해요.', phonetic: 'sarang' },
    ],
  },
];

const seed = async () => {
  await connectDB();

  console.log('🌱 Starting seed...');

  for (const { deck: deckData, cards: cardsData } of DECKS_DATA) {
    // Remove existing seed deck with same name to allow re-running
    await Deck.deleteOne({ name: deckData.name, ownerId: null });

    const deck = await Deck.create({ ...deckData, cardCount: cardsData.length });

    const cards = cardsData.map((c) => ({ ...c, deckId: deck._id }));
    await Card.insertMany(cards);

    console.log(`✅ Created deck: "${deck.name}" (${cardsData.length} cards)`);
  }

  console.log('🎉 Seed completed!');
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});