// src/types/deck.ts
export interface Deck {
  _id: string;
  name: string;
  description?: string;
  language: string;
  isPublic: boolean;
  cardCount: number;
  ownerId?: string;
  ownerName?: string;
  createdAt?: string;
  updatedAt?: string;
}