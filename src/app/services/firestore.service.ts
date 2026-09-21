import { Injectable } from '@angular/core';
import { addDoc, arrayUnion, collection, getDocs, getFirestore, doc, setDoc, getDoc, increment, limit, orderBy, query, serverTimestamp } from 'firebase/firestore';

export interface Review {
  id?: string;
  ownerId?: string;
  userName: string;
  rating: number;
  text: string;
  createdAt?: any;
}

export interface BattleStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  lostTo: string[];
  beatenPlayers: string[];
}

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private db = getFirestore();

  async saveUserProfile(uid: string, profile: any) {
    const ref = doc(this.db, 'users', uid);
    await setDoc(ref, profile, { merge: true });
  }

  async getUserProfile(uid: string) {
    const ref = doc(this.db, 'users', uid);
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? snapshot.data() : null;
  }

  async getBattleStats(uid: string): Promise<BattleStats> {
    const snapshot = await getDoc(doc(this.db, 'users', uid, 'stats', 'summary'));
    const data = snapshot.exists() ? snapshot.data() : {};
    return {
      gamesPlayed: data['gamesPlayed'] || 0,
      gamesWon: data['gamesWon'] || 0,
      gamesLost: data['gamesLost'] || 0,
      lostTo: data['lostTo'] || [],
      beatenPlayers: data['beatenPlayers'] || []
    };
  }

  async recordBattleResult(uid: string, won: boolean, opponentName: string) {
    await setDoc(doc(this.db, 'users', uid, 'stats', 'summary'), {
      gamesPlayed: increment(1),
      gamesWon: increment(won ? 1 : 0),
      gamesLost: increment(won ? 0 : 1),
      ...(won ? { beatenPlayers: arrayUnion(opponentName) } : { lostTo: arrayUnion(opponentName) })
    }, { merge: true });
  }

  async getReviews(): Promise<Review[]> {
    const reviewsQuery = query(collection(this.db, 'reviews'), orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(reviewsQuery);
    return snapshot.docs.map(review => ({ id: review.id, ...review.data() } as Review));
  }

  async addReview(ownerId: string, review: Omit<Review, 'id' | 'createdAt' | 'ownerId'>) {
    await addDoc(collection(this.db, 'reviews'), {
      ownerId,
      userName: review.userName,
      rating: review.rating,
      text: review.text.trim(),
      createdAt: serverTimestamp()
    });
  }

  async updateReview(ownerId: string, reviewId: string, review: Omit<Review, 'id' | 'createdAt' | 'ownerId'>) {
    await setDoc(doc(this.db, 'reviews', reviewId), {
      ownerId,
      userName: review.userName,
      rating: review.rating,
      text: review.text.trim(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
}
