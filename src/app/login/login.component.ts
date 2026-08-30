import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  template: `
    <h2>Login</h2>
    <form (ngSubmit)="login()">
      <label>
        Email
        <input [(ngModel)]="email" name="email" required />
      </label>
      <br />
      <label>
        Password
        <input type="password" [(ngModel)]="password" name="password" required />
      </label>
      <br />
      <button type="submit">Login</button>
    </form>
    <p *ngIf="error">{{ error }}</p>
    <p *ngIf="success">{{ success }}</p>
    <p>Don't have an account? <a routerLink="/register">Register</a></p>
    <p><button type="button" (click)="resetPassword()">Reset password</button></p>
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
      this.router.navigate(['/']);
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
