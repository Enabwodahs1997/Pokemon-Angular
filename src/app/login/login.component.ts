import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  template: `
    <div class="pokemon-login-shell">
      <div class="pokemon-login-card">
        <div class="brand-row">
          <span class="brand-badge">Pokémon</span>
          <span class="brand-sub">Trainer Login</span>
        </div>

        <div class="header-block">
          <h2>Welcome back, trainer!</h2>
          <p>Log in to continue your deckbuilding and battle adventures.</p>
        </div>

        <form (ngSubmit)="login()" class="login-form">
          <div class="field-group">
            <label for="email">Email</label>
            <input id="email" [(ngModel)]="email" name="email" type="email" placeholder="trainer@pokemon.com" required />
          </div>

          <div class="field-group">
            <label for="password">Password</label>
            <input id="password" type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required />
          </div>

          <button type="submit" class="primary-btn">Log in</button>
        </form>

        <div class="message-block">
          <p *ngIf="error" class="error-text">{{ error }}</p>
          <p *ngIf="success" class="success-text">{{ success }}</p>
        </div>

        <div class="bottom-links">
          <span>New trainer?</span>
          <a routerLink="/register">Create account</a>
        </div>

        <button type="button" class="secondary-btn" (click)="resetPassword()">Reset password</button>
      </div>

      <div class="pokemon-silhouette" aria-hidden="true">
        <div class="pokeball"></div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  async login() {
    this.error = '';
    this.success = '';
    try {
      const result = await this.auth.signIn(this.email, this.password);
      if (!result.user.emailVerified) {
        this.error = 'Please verify your email before continuing.';
        await this.auth.sendVerificationEmail();
        return;
      }

      await this.router.navigateByUrl('/');
    } catch (e: any) {
      this.error = e.message || 'Login failed';
    }
  }

  async resetPassword() {
    this.error = '';
    this.success = '';
    try {
      await this.auth.resetPassword(this.email);
      this.success = 'Password reset email sent.';
    } catch (e: any) {
      this.error = e.message || 'Password reset failed';
    }
  }
}
