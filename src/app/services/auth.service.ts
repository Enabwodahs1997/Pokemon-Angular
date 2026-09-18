import { Injectable } from '@angular/core';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = getAuth();
  user$ = new BehaviorSubject<User | null | undefined>(undefined);
  private authReady = new Promise<void>(resolve => {
    onAuthStateChanged(this.auth, user => {
      this.user$.next(user);
      resolve();
    });
  });

  constructor(private router: Router) {}

  async signIn(email: string, password: string) {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    this.user$.next(result.user);
    return result;
  }

  async signInWithGoogle() {
    const result = await signInWithPopup(this.auth, new GoogleAuthProvider());
    this.user$.next(result.user);
    return result;
  }

  async register(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    this.user$.next(result.user);
    return result;
  }

  async sendVerificationEmail() {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in.');
    }
    await sendEmailVerification(user);
  }

  async resetPassword(email: string) {
    await sendPasswordResetEmail(this.auth, email);
  }

  async signOut() {
    await signOut(this.auth);
    this.user$.next(null);
    this.router.navigate(['/login']);
  }

  get currentUser() {
    return this.user$.value ?? null;
  }
}
