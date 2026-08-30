import { Injectable } from '@angular/core';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class CardService {
  private db = getFirestore();

  // Create a deck under a user's subcollection: users/{uid}/decks
  async createDeck(uid: string, deck: { name: string; description?: string }) {
    const decksCol = collection(this.db, 'users', uid, 'decks');
    return addDoc(decksCol, deck);
  }

  // Add a card into a deck: users/{uid}/decks/{deckId}/cards
  async addCard(uid: string, deckId: string, card: any) {
    const cardsCol = collection(this.db, 'users', uid, 'decks', deckId, 'cards');
    return addDoc(cardsCol, card);
  }

  // List user decks
  async listDecks(uid: string) {
    const decksCol = collection(this.db, 'users', uid, 'decks');
    const snapshot = await getDocs(decksCol);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // List cards in a deck
  async listCards(uid: string, deckId: string) {
    const cardsCol = collection(this.db, 'users', uid, 'decks', deckId, 'cards');
    const snapshot = await getDocs(cardsCol);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}
