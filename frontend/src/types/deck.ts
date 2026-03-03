// src/types/deck.ts
export interface Deck {
  _id: string;
  name: string;
  description?: string;
  language: string;
  cardCount?: number;
  level?: string;
  color?: string;
}