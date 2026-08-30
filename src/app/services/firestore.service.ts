import { Injectable } from '@angular/core';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

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
}
