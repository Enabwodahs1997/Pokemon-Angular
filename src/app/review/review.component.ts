import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FirestoreService, Review } from '../services/firestore.service';

@Component({
  selector: 'app-review',
  template: `
    <div class="pokemon-profile-shell">
      <section class="pokemon-profile-card review-page-card">
        <div class="profile-header">
          <div class="profile-avatar">★</div>
          <div>
            <p class="profile-kicker">Trainer feedback</p>
            <h2>Leave a review</h2>
          </div>
        </div>

        <form (ngSubmit)="submitReview()" class="profile-form">
          <div class="field-group">
            <label for="reviewName">Name shown publicly</label>
            <input id="reviewName" [(ngModel)]="userName" name="userName" maxlength="40" required />
          </div>
          <div class="field-group">
            <label for="reviewRating">Rating</label>
            <select id="reviewRating" [(ngModel)]="rating" name="rating">
              <option [ngValue]="5">5 stars</option>
              <option [ngValue]="4">4 stars</option>
              <option [ngValue]="3">3 stars</option>
              <option [ngValue]="2">2 stars</option>
              <option [ngValue]="1">1 star</option>
            </select>
          </div>
          <div class="field-group">
            <label for="reviewText">Review</label>
            <textarea id="reviewText" [(ngModel)]="text" name="text" maxlength="500" rows="5" required></textarea>
          </div>
          <button type="submit" class="pokemon-primary-btn" [disabled]="saving">{{ saving ? 'Saving...' : editingReviewId ? 'Save changes' : 'Publish review' }}</button>
        </form>

        <p *ngIf="message" class="pokemon-info-text">{{ message }}</p>
        <p *ngIf="error" class="pokemon-error-text">{{ error }}</p>
        <section *ngIf="myReviews.length" class="my-reviews">
          <h3>Reviews you have written</h3>
          <article *ngFor="let review of myReviews" class="my-review-item">
            <div><strong>{{ stars(review.rating) }}</strong><span>{{ review.text }}</span></div>
            <button type="button" class="pokemon-mini-btn" (click)="editReview(review)">Edit</button>
          </article>
        </section>
        <button type="button" class="pokemon-secondary-btn" (click)="goBack()">Back to Deck Lab</button>
      </section>
    </div>
  `
})
export class ReviewComponent {
  userName = '';
  rating = 5;
  text = '';
  saving = false;
  message = '';
  error = '';
  myReviews: Review[] = [];
  editingReviewId = '';

  constructor(private auth: AuthService, private firestore: FirestoreService, private router: Router) {
    const user = this.auth.currentUser;
    this.userName = user?.displayName || user?.email?.split('@')[0] || 'Trainer';
    this.loadReviews();
  }

  async loadReviews() {
    const user = this.auth.currentUser;
    if (!user) return;
    this.myReviews = (await this.firestore.getReviews()).filter(review => review.ownerId === user.uid);
  }

  async submitReview() {
    this.error = '';
    this.message = '';
    if (!this.text.trim() || !this.userName.trim()) {
      this.error = 'Please enter a name and review.';
      return;
    }

    this.saving = true;
    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('You must be signed in to save a review.');
      const review = { userName: this.userName.trim(), rating: this.rating, text: this.text };
      if (this.editingReviewId) {
        await this.firestore.updateReview(user.uid, this.editingReviewId, review);
      } else {
        await this.firestore.addReview(user.uid, review);
      }
      this.text = '';
      this.editingReviewId = '';
      this.message = 'Your review was saved.';
      await this.loadReviews();
    } catch (e: any) {
      this.error = e.message || 'Unable to publish review.';
    } finally {
      this.saving = false;
    }
  }

  editReview(review: Review) {
    this.editingReviewId = review.id || '';
    this.userName = review.userName;
    this.rating = review.rating;
    this.text = review.text;
    this.message = 'Editing your review.';
    this.error = '';
  }

  goBack() {
    this.router.navigate(['/deck-lab']);
  }
}
