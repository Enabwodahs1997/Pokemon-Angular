import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="pokemon-app-shell">
      <header class="pokemon-topbar">
        <div class="pokemon-brand-wrap">
          <span class="pokemon-brand-mark">Pokémon</span>
          <span class="pokemon-brand-sub">Trainer Hub</span>
        </div>

        <nav class="pokemon-nav" aria-label="Main navigation">
          <a routerLink="/" class="nav-link">Home</a>
          <a routerLink="/profile" *ngIf="auth.currentUser" class="nav-link">Profile</a>
          <a routerLink="/login" *ngIf="!(auth.user$ | async)" class="nav-link">Login</a>

          <div *ngIf="auth.user$ | async as user" class="user-menu">
            <span class="user-tag">{{ user.email }}</span>
            <button type="button" class="nav-signout" (click)="signOut()">Sign out</button>
          </div>
        </nav>
      </header>

      <main class="pokemon-page-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppComponent {
  constructor(public auth: AuthService) {}

  signOut() {
    this.auth.signOut();
  }
}
