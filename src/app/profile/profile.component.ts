import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FirestoreService } from '../services/firestore.service';

@Component({
  selector: 'app-profile',
  template: `
    <div class="pokemon-profile-shell" *ngIf="user as currentUser">
      <section class="pokemon-profile-card">
        <div class="profile-header">
          <div class="profile-avatar">{{ currentUser.email?.charAt(0)?.toUpperCase() || 'T' }}</div>
          <div>
            <p class="profile-kicker">Trainer Card</p>
            <h2>{{ displayName || 'Unnamed Trainer' }}</h2>
          </div>
        </div>

        <div class="profile-meta-row">
          <div class="meta-item">
            <span class="meta-label">Email</span>
            <strong>{{ currentUser.email }}</strong>
          </div>
          <div class="meta-item">
            <span class="meta-label">Verification</span>
            <strong>{{ currentUser.emailVerified ? 'Verified' : 'Unverified' }}</strong>
          </div>
        </div>

        <form (ngSubmit)="saveProfile()" class="profile-form">
          <div class="field-group">
            <label for="displayName">Display name</label>
            <input id="displayName" [(ngModel)]="displayName" name="displayName" placeholder="Trainer name" />
          </div>

          <div class="field-group">
            <label for="favoriteStarter">Favorite starter</label>
            <input id="favoriteStarter" [(ngModel)]="favoriteStarter" name="favoriteStarter" placeholder="Pikachu, Charmander, Bulbasaur..." />
          </div>

          <button type="submit" class="pokemon-primary-btn">Save profile</button>
        </form>

        <div class="profile-actions">
          <button type="button" class="pokemon-secondary-btn" (click)="sendVerificationEmail()" *ngIf="!currentUser.emailVerified">
            Verify email
          </button>
        </div>

        <p *ngIf="message" class="pokemon-info-text">{{ message }}</p>
        <p *ngIf="error" class="pokemon-error-text">{{ error }}</p>
      </section>
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
