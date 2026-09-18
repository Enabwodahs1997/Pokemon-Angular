import { Injectable } from '@angular/core';
import { arrayUnion, getFirestore, doc, setDoc, getDoc, increment } from 'firebase/firestore';

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
}
