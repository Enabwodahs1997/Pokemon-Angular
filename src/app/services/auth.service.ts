import { Injectable } from '@angular/core';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = getAuth();
  user$ = new BehaviorSubject<any>(null);

  constructor(private router: Router) {
    onAuthStateChanged(this.auth, user => {
      this.user$.next(user);
    });
  }

  async signIn(email: string, password: string) {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    this.user$.next(result.user);
    return result;
  }

  async register(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    this.user$.next(result.user);
    return result;
  }

  async signOut() {
    await signOut(this.auth);
    this.user$.next(null);
    this.router.navigate(['/login']);
  }

  get currentUser() {
    return this.user$.value;
  }
}
