import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { DeckBuilderService } from '../services/deck-builder.service';
import { CardLibraryService } from '../services/card-library.service';
import { Card, Deck, CardTemplate } from '../models/card.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  template: `
    <div class="pokemon-home-shell">
      <header class="pokemon-home-header">
        <div>
        <p class="pokemon-kicker">Deck Lab</p>
          <h1>Build your collection</h1>
        </div>
        <div class="pokemon-header-badges">
          <button type="button" class="pokemon-header-battle-btn" [disabled]="!selectedDeckId" (click)="openBattleBoard()">Open Battle Board</button>
        </div>
      </header>
      <section class="pokemon-panel">
        <h2>Create a deck</h2>
        <div class="pokemon-form-row">
          <input [(ngModel)]="deckName" name="deckName" placeholder="Deck name" required />
          <input [(ngModel)]="deckDescription" name="deckDescription" placeholder="Description" />
          <button type="button" class="pokemon-secondary-btn" (click)="resetDeckForm()">New deck</button>
          <button type="button" class="pokemon-primary-btn" (click)="createDeck()">Create deck</button>
        </div>
        <p *ngIf="message" class="pokemon-info-text">{{ message }}</p>
        <p *ngIf="error" class="pokemon-error-text">{{ error }}</p>
      </section>

      <section class="pokemon-panel">
        <h2>Card library</h2>
        <div class="pokemon-search-row">
          <input [(ngModel)]="searchText" name="searchText" placeholder="Search cards" />
          <button type="button" class="pokemon-secondary-btn" (click)="searchCards()">Search</button>
        </div>
        <div *ngFor="let card of libraryCards" class="pokemon-card-item">
          <div>
            <img *ngIf="card.imageUrl" class="card-thumbnail" [src]="card.imageUrl" [alt]="card.name" loading="lazy" />
            <strong>{{ card.name }}</strong>
            <span> ({{ card.cardType }})</span>
          </div>
          <button type="button" class="pokemon-mini-btn" (click)="addCardToSelectedDeck(card)">Add to selected deck</button>
        </div>
      </section>

      <section *ngIf="decks.length || selectedDeckId" class="pokemon-panel">
        <h2>Your decks</h2>
        <div class="pokemon-select-row">
          <label>Select deck</label>
          <select [(ngModel)]="selectedDeckId" name="selectedDeckId" (ngModelChange)="onDeckSelected($event)">
            <option value="">Choose a deck to edit...</option>
            <option *ngFor="let deck of decks" [value]="deck.id">{{ deck.name }}</option>
          </select>
        </div>

        <ul class="pokemon-list">
          <li *ngFor="let deck of decks">
            <span>{{ deck.name }} ({{ deck.cardCount ?? 0 }} cards)</span>
            <button type="button" class="pokemon-mini-btn danger" (click)="removeDeck(deck.id)">Delete</button>
          </li>
        </ul>
      </section>

      <section *ngIf="selectedDeckId" class="pokemon-panel">
        <h2>Deck editor</h2>
        <button type="button" class="pokemon-primary-btn" (click)="openBattleBoard()">Open battle board</button>
        <ul class="pokemon-list">
          <li *ngFor="let card of deckCards">
            <img *ngIf="card.imageUrl" class="card-thumbnail" [src]="card.imageUrl" [alt]="card.name" loading="lazy" />
            <span>{{ card.name }} - {{ card.cardType }}</span>
            <button type="button" class="pokemon-mini-btn danger" (click)="removeCard(card.id)">Remove</button>
          </li>
        </ul>
      </section>

    </div>
  `
})
export class HomeComponent {
  deckName = '';
  deckDescription = '';
  searchText = '';
  message = '';
  error = '';
  decks: Deck[] = [];
  selectedDeckId = '';
  libraryCards: CardTemplate[] = [];
  deckCards: Card[] = [];
  constructor(
    private auth: AuthService,
    private deckBuilder: DeckBuilderService,
    private library: CardLibraryService,
    private router: Router
  ) {
    this.loadLibraryCards();
    this.auth.user$.subscribe(user => {
      if (user) {
        this.loadDecks(user.uid);
      }
    });
  }

  private async loadLibraryCards() {
    this.libraryCards = await this.library.getAll();
  }

  resetDeckForm() {
    this.deckName = '';
    this.deckDescription = '';
    this.selectedDeckId = '';
    this.deckCards = [];
    this.message = 'Ready to create a new deck.';
    this.error = '';
  }

  async createDeck() {
    this.message = '';
    this.error = '';
    const user = this.auth.currentUser;
    if (!user) {
      this.error = 'You must be logged in to create a deck.';
      return;
    }

    if (!this.deckName.trim()) {
      this.error = 'Please enter a deck name.';
      return;
    }

    try {
      const result = await this.deckBuilder.createDeck(user.uid, {
        name: this.deckName.trim(),
        description: this.deckDescription.trim(),
        format: 'custom',
        isPublic: false
      });
      this.deckName = '';
      this.deckDescription = '';
      this.message = 'Deck created successfully.';
      this.selectedDeckId = result.id;
      await this.loadDecks(user.uid);
    } catch (e: any) {
      this.error = e.message || 'Unable to create deck';
    }
  }

  async onDeckSelected(deckId: string) {
    if (!deckId) {
      this.selectedDeckId = '';
      this.deckCards = [];
      return;
    }

    this.selectedDeckId = deckId;
    const user = this.auth.currentUser;
    if (!user) return;

    await this.loadDeckCards(user.uid, deckId);
  }

  async searchCards() {
    this.libraryCards = this.searchText.trim() ? await this.library.search(this.searchText) : await this.library.getAll();
  }

  async addCardToSelectedDeck(cardTemplate: CardTemplate) {
    const user = this.auth.currentUser;
    if (!user || !this.selectedDeckId) {
      this.error = 'Select a deck before adding cards.';
      return;
    }

    const cardBase: any = {
      cardType: cardTemplate.cardType,
      name: cardTemplate.name,
      description: cardTemplate.description,
      rarity: cardTemplate.rarity,
      imageUrl: cardTemplate.imageUrl,
    };

    if (cardTemplate.cardType === 'pokemon') {
      Object.assign(cardBase, {
        hp: cardTemplate.hp || 50,
        element: cardTemplate.element,
        stage: 'basic',
        attacks: cardTemplate.attackNames?.map((name, index) => ({
          ...(cardTemplate.attacks?.[index] || {
            name,
            cost: [cardTemplate.element],
            damage: cardTemplate.power || 10 + index * 5,
            description: `${name} attack.`
          })
        })) || cardTemplate.attacks || []
      });
    }

    if (cardTemplate.cardType === 'trainer') {
      Object.assign(cardBase, {
        trainerType: 'item',
        effect: cardTemplate.description || ''
      });
    }

    if (cardTemplate.cardType === 'energy') {
      Object.assign(cardBase, {
        element: cardTemplate.element,
        effect: cardTemplate.description || ''
      });
    }

    const card: Card = cardBase as Card;

    try {
      await this.deckBuilder.addCardToDeck(user.uid, this.selectedDeckId, card);
      this.message = 'Card added to deck.';
      await this.loadDeckCards(user.uid, this.selectedDeckId);
      await this.loadDecks(user.uid);
    } catch (e: any) {
      this.error = e.message || 'Unable to add card';
    }
  }

  async removeDeck(deckId?: string) {
    if (!deckId) return;
    const user = this.auth.currentUser;
    if (!user) return;

    try {
      await this.deckBuilder.deleteDeck(user.uid, deckId);
      this.message = 'Deck deleted.';
      if (this.selectedDeckId === deckId) {
        this.selectedDeckId = '';
        this.deckCards = [];
      }
      await this.loadDecks(user.uid);
    } catch (e: any) {
      this.error = e.message || 'Unable to delete deck';
    }
  }

  async removeCard(cardId?: string) {
    if (!cardId || !this.selectedDeckId) return;
    const user = this.auth.currentUser;
    if (!user) return;

    try {
      await this.deckBuilder.removeCardFromDeck(user.uid, this.selectedDeckId, cardId);
      this.message = 'Card removed from deck.';
      await this.loadDeckCards(user.uid, this.selectedDeckId);
      await this.loadDecks(user.uid);
    } catch (e: any) {
      this.error = e.message || 'Unable to remove card';
    }
  }

  async loadDecks(uid: string) {
    this.decks = await this.deckBuilder.listDecks(uid);

    if (!this.selectedDeckId && this.decks.length) {
      this.selectedDeckId = this.decks[0].id ?? '';
    }

    if (this.selectedDeckId && !this.decks.some(deck => deck.id === this.selectedDeckId)) {
      this.selectedDeckId = '';
      this.deckCards = [];
      return;
    }

    if (this.selectedDeckId) {
      await this.loadDeckCards(uid, this.selectedDeckId);
    } else {
      this.deckCards = [];
    }
  }

  async loadDeckCards(uid: string, deckId: string) {
    this.deckCards = await this.deckBuilder.listCardsInDeck(uid, deckId);
  }

  openBattleBoard() {
    if (!this.selectedDeckId) {
      this.error = 'Select a deck before starting a battle.';
      return;
    }

    this.router.navigate(['/battle-board'], { queryParams: { deckId: this.selectedDeckId } });
  }
}
