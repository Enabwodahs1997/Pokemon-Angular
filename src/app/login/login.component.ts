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
    <p>Don't have an account? <a routerLink="/register">Register</a></p>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  async login() {
    this.error = '';
    try {
      await this.auth.signIn(this.email, this.password);
      this.router.navigate(['/']);
    } catch (e: any) {
      this.error = e.message || 'Login failed';
    }
  }
}
