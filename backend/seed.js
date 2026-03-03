require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const Deck = require('./src/models/Deck');
const Card = require('./src/models/Card');

const seed = async () => {
  await connectDB();

  await Deck.deleteMany();
  await Card.deleteMany();

  const decks = await Deck.insertMany([
    {
      name: 'English Basics',
      description: 'Basic English words',
      language: 'en',
      isPublic: true,
      ownerId: null,
      cardCount: 10,
    },
    {
      name: 'Japanese N5',
      description: 'JLPT N5 vocabulary',
      language: 'ja',
      isPublic: true,
      ownerId: null,
      cardCount: 10,
    },
    {
      name: 'Korean Beginner',
      description: 'Basic Korean words',
      language: 'ko',
      isPublic: true,
      ownerId: null,
      cardCount: 10,
    },
  ]);

  for (const deck of decks) {
    const cards = Array.from({ length: 10 }).map((_, i) => ({
      deckId: deck._id,
      front: `Word ${i + 1}`,
      back: `Meaning ${i + 1}`,
    }));

    await Card.insertMany(cards);
  }

  console.log('🌱 Seed completed');
  process.exit();
};

seed();