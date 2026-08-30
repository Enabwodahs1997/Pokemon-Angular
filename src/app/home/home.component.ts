import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { DeckBuilderService } from '../services/deck-builder.service';
import { Card, Deck } from '../models/card.model';

@Component({
  selector: 'app-home',
  template: `
    <h1>Pokemon Card Game</h1>

    <section>
      <h2>Create a deck</h2>
      <form (ngSubmit)="createDeck()">
        <input [(ngModel)]="deckName" name="deckName" placeholder="Deck name" required />
        <input [(ngModel)]="deckDescription" name="deckDescription" placeholder="Description" />
        <button type="submit">Create deck</button>
      </form>
      <p *ngIf="message">{{ message }}</p>
      <p *ngIf="error">{{ error }}</p>
    </section>

    <section *ngIf="decks.length">
      <h2>Your decks</h2>
      <ul>
        <li *ngFor="let deck of decks">
          {{ deck.name }} ({{ deck.cardCount ?? 0 }} cards)
          <button type="button" (click)="addSampleCard(deck.id)">Add sample card</button>
        </li>
      </ul>
    </section>
  `
})
export class HomeComponent {
  deckName = '';
  deckDescription = '';
  message = '';
  error = '';
  decks: Deck[] = [];

  constructor(private auth: AuthService, private deckBuilder: DeckBuilderService) {
    this.auth.user$.subscribe(user => {
      if (user) {
        this.loadDecks(user.uid);
      }
    });
  }

  async createDeck() {
    this.message = '';
    this.error = '';

    const user = this.auth.currentUser;
    if (!user) {
      this.error = 'You must be logged in to create a deck.';
      return;
    }

    try {
      await this.deckBuilder.createDeck(user.uid, {
        name: this.deckName,
        description: this.deckDescription,
        format: 'custom',
        isPublic: false
      });

      this.deckName = '';
      this.deckDescription = '';
      this.message = 'Deck created successfully.';
      await this.loadDecks(user.uid);
    } catch (e: any) {
      this.error = e.message || 'Unable to create deck';
    }
  }

  async addSampleCard(deckId?: string) {
    if (!deckId) return;

    const user = this.auth.currentUser;
    if (!user) {
      this.error = 'You must be logged in to add a card.';
      return;
    }

    const sampleCard: Card = {
      cardType: 'pokemon',
      name: 'Pikachu',
      hp: 60,
      element: 'lightning',
      stage: 'basic',
      attacks: [
        { name: 'Quick Attack', cost: ['lightning'], damage: 20, description: 'A quick jolt.' }
      ],
      weakness: { type: 'fighting', value: 'x2' },
      retreatCost: 1,
      description: 'Starter electric Pokemon',
      rarity: 'common'
    };

    try {
      await this.deckBuilder.addCardToDeck(user.uid, deckId, sampleCard);
      this.message = 'Sample card added to deck.';
      await this.loadDecks(user.uid);
    } catch (e: any) {
      this.error = e.message || 'Unable to add card';
    }
  }

  async loadDecks(uid: string) {
    this.decks = await this.deckBuilder.listDecks(uid);
  }
}
