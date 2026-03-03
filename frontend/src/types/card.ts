// src/types/card.ts
export interface Card {
  _id: string;
  deckId?: string;
  front: string;
  back: string;
  example?: string;
  phonetic?: string;
}