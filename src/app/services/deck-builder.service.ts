import { Injectable } from '@angular/core';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { Card, Deck } from '../models/card.model';

function sanitizeForFirestore(value: any): any {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined);
  }

  if (value && typeof value === 'object') {
    const sanitized: Record<string, any> = {};
    Object.entries(value).forEach(([key, entryValue]) => {
      const cleaned = sanitizeForFirestore(entryValue);
      if (cleaned !== undefined) {
        sanitized[key] = cleaned;
      }
    });
    return sanitized;
  }

  return value;
}

@Injectable({ providedIn: 'root' })
export class DeckBuilderService {
  private db = getFirestore();

  private deckPath(uid: string) {
    return `users/${uid}/decks`;
  }

  private cardPath(uid: string, deckId: string) {
    return `users/${uid}/decks/${deckId}/cards`;
  }

  async createDeck(uid: string, deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'cardCount'>) {
    const ref = collection(this.db, this.deckPath(uid));
    const payload = sanitizeForFirestore({
      ...deck,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cardCount: 0,
      isPublic: false
    });
    return addDoc(ref, payload);
  }

  async updateDeck(uid: string, deckId: string, update: Partial<Deck>) {
    const ref = doc(this.db, this.deckPath(uid), deckId);
    await setDoc(ref, { ...update, updatedAt: new Date().toISOString() }, { merge: true });
  }

  async deleteDeck(uid: string, deckId: string) {
    await deleteDoc(doc(this.db, this.deckPath(uid), deckId));
  }

  async addCardToDeck(uid: string, deckId: string, card: Card) {
    const ref = collection(this.db, this.cardPath(uid, deckId));
    const payload = sanitizeForFirestore({
      ...card,
      createdAt: new Date().toISOString()
    });
    const created = await addDoc(ref, payload);

    const deckRef = doc(this.db, this.deckPath(uid), deckId);
    const deckSnap = await getDoc(deckRef);
    const currentCount = deckSnap.data()?.cardCount ?? 0;
    await setDoc(deckRef, { cardCount: currentCount + 1, updatedAt: new Date().toISOString() }, { merge: true });

    return created;
  }

  async removeCardFromDeck(uid: string, deckId: string, cardId: string) {
    await deleteDoc(doc(this.db, this.cardPath(uid, deckId), cardId));

    const deckRef = doc(this.db, this.deckPath(uid), deckId);
    const deckSnap = await getDoc(deckRef);
    const currentCount = deckSnap.data()?.cardCount ?? 0;
    await setDoc(deckRef, { cardCount: Math.max(currentCount - 1, 0), updatedAt: new Date().toISOString() }, { merge: true });
  }

  async listDecks(uid: string): Promise<Deck[]> {
    const q = query(collection(this.db, this.deckPath(uid)), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Deck));
  }

  async listCardsInDeck(uid: string, deckId: string): Promise<Card[]> {
    const q = query(collection(this.db, this.cardPath(uid, deckId)), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Card));
  }
}
