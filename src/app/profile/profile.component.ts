import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FirestoreService } from '../services/firestore.service';

@Component({
  selector: 'app-profile',
  template: `
    <h2>Profile</h2>

    <div *ngIf="user as currentUser">
      <p>Email: {{ currentUser.email }}</p>
      <p>Email verified: {{ currentUser.emailVerified ? 'Yes' : 'No' }}</p>

      <form (ngSubmit)="saveProfile()">
        <label>
          Display name
          <input [(ngModel)]="displayName" name="displayName" />
        </label>
        <br />
        <label>
          Favorite starter
          <input [(ngModel)]="favoriteStarter" name="favoriteStarter" />
        </label>
        <br />
        <button type="submit">Save profile</button>
      </form>

      <p *ngIf="message">{{ message }}</p>
      <p *ngIf="error">{{ error }}</p>
      <button type="button" (click)="sendVerificationEmail()" *ngIf="!currentUser.emailVerified">Verify email</button>
    </div>
  `
})
export class ProfileComponent {
  user: any = null;
  displayName = '';
  favoriteStarter = '';
  message = '';
  error = '';

  constructor(public auth: AuthService, private firestore: FirestoreService) {
    this.auth.user$.subscribe(user => {
      this.user = user;
      if (user) {
        this.loadProfile(user.uid);
      }
    });
  }

  async loadProfile(uid: string) {
    const profile = await this.firestore.getUserProfile(uid);
    this.displayName = profile?.displayName || '';
    this.favoriteStarter = profile?.favoriteStarter || '';
  }

  async saveProfile() {
    this.message = '';
    this.error = '';
    try {
      if (!this.user) {
        this.error = 'You must be logged in to save your profile.';
        return;
      }
      await this.firestore.saveUserProfile(this.user.uid, {
        displayName: this.displayName,
        favoriteStarter: this.favoriteStarter,
        updatedAt: new Date().toISOString()
      });
      this.message = 'Profile updated.';
    } catch (e: any) {
      this.error = e.message || 'Unable to save profile';
    }
  }

  async sendVerificationEmail() {
    this.message = '';
    this.error = '';
    try {
      await this.auth.sendVerificationEmail();
      this.message = 'Verification email sent.';
    } catch (e: any) {
      this.error = e.message || 'Could not send verification email';
    }
  }
}
