import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  template: `
    <div class="pokemon-login-shell">
      <div class="pokemon-login-card">
        <div class="brand-row">
          <span class="brand-badge">Pokémon</span>
          <span class="brand-sub">Trainer Signup</span>
        </div>

        <div class="header-block">
          <h2>Start your journey</h2>
          <p>Create a trainer account to build decks, battle, and grow your collection.</p>
        </div>

        <form (ngSubmit)="register()" class="login-form">
          <div class="field-group">
            <label for="email">Email</label>
            <input id="email" [(ngModel)]="email" name="email" type="email" placeholder="trainer@pokemon.com" required />
          </div>

          <div class="field-group">
            <label for="password">Password</label>
            <input id="password" type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required />
          </div>

          <button type="submit" class="primary-btn">Create account</button>
        </form>

        <div class="message-block">
          <p *ngIf="error" class="error-text">{{ error }}</p>
          <p *ngIf="success" class="success-text">{{ success }}</p>
        </div>

        <div class="bottom-links">
          <span>Already a trainer?</span>
          <a routerLink="/login">Login</a>
        </div>
      </div>

      <div class="pokemon-silhouette" aria-hidden="true">
        <div class="pokeball"></div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  email = '';
  password = '';
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  async register() {
    this.error = '';
    this.success = '';
    try {
      const result = await this.auth.register(this.email, this.password);
      await this.auth.sendVerificationEmail();
      this.success = 'Account created. Please verify your email before logging in.';
      this.auth.signOut();
      this.router.navigate(['/login']);
    } catch (e: any) {
      this.error = e.message || 'Registration failed';
    }
  }
}
