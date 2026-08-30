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
  `
})
export class RegisterComponent {
  email = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  async register() {
    this.error = '';
    try {
      await this.auth.register(this.email, this.password);
      this.router.navigate(['/']);
    } catch (e: any) {
      this.error = e.message || 'Registration failed';
    }
  }
}
