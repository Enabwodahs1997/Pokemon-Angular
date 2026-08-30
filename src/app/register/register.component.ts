import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  template: `
    <h2>Register</h2>
    <form (ngSubmit)="register()">
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
      <button type="submit">Register</button>
    </form>
    <p *ngIf="error">{{ error }}</p>
    <p *ngIf="success">{{ success }}</p>
    <p>Already have an account? <a routerLink="/login">Login</a></p>
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
