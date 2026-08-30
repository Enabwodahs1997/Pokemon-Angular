import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <nav>
      <a routerLink="/">Home</a> |
      <a routerLink="/profile" *ngIf="auth.currentUser">Profile</a> |
      <a routerLink="/login" *ngIf="!(auth.user$ | async)">Login</a>
      <span *ngIf="auth.user$ | async as user">
        Logged in: {{ user.email }} |
        <a (click)="signOut()" style="cursor:pointer">Sign out</a>
      </span>
    </nav>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  constructor(public auth: AuthService) {}

  signOut() {
    this.auth.signOut();
  }
}
