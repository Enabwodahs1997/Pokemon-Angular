import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { DeckBuilderService } from '../services/deck-builder.service';
import { BattleService } from '../services/battle.service';
import { CardLibraryService } from '../services/card-library.service';
import { Card, Deck, CardTemplate, BattleState } from '../models/card.model';

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

    <section>
      <h2>Card library</h2>
      <input [(ngModel)]="searchText" name="searchText" placeholder="Search cards" />
      <button type="button" (click)="searchCards()">Search</button>
      <div *ngFor="let card of libraryCards" style="border:1px solid #ddd; margin:8px 0; padding:8px;">
        <strong>{{ card.name }}</strong> ({{ card.cardType }})
        <button type="button" (click)="addCardToSelectedDeck(card)">Add to selected deck</button>
      </div>
    </section>

    <section *ngIf="decks.length">
      <h2>Your decks</h2>
      <div>
        <label>Select deck</label>
        <select [(ngModel)]="selectedDeckId" name="selectedDeckId">
          <option *ngFor="let deck of decks" [value]="deck.id">{{ deck.name }}</option>
        </select>
      </div>

      <ul>
        <li *ngFor="let deck of decks">
          {{ deck.name }} ({{ deck.cardCount ?? 0 }} cards)
          <button type="button" (click)="removeDeck(deck.id)">Delete</button>
        </li>
      </ul>
    </section>

    <section *ngIf="selectedDeckId">
      <h2>Deck editor</h2>
      <button type="button" (click)="startBattle()">Start battle</button>
      <ul>
        <li *ngFor="let card of deckCards">
          {{ card.name }} - {{ card.cardType }}
          <button type="button" (click)="removeCard(card.id)">Remove</button>
        </li>
      </ul>
    </section>

    <section *ngIf="battleState">
      <h2>Battle</h2>
      <p>Turn: {{ battleState.currentTurn }} | Winner: {{ battleState.winner || 'ongoing' }}</p>
      <div>
        <h3>Player</h3>
        <ul>
          <li *ngFor="let mon of battleState.player">{{ mon.name }}: {{ mon.hp }}/{{ mon.maxHp }} HP</li>
        </ul>
      </div>
      <div>
        <h3>Opponent</h3>
        <ul>
          <li *ngFor="let mon of battleState.opponent">{{ mon.name }}: {{ mon.hp }}/{{ mon.maxHp }} HP</li>
        </ul>
      </div>
      <button type="button" (click)="playerTurn()">Player turn</button>
      <button type="button" (click)="opponentTurn()">Opponent turn</button>
      <ul>
        <li *ngFor="let entry of battleState.log">{{ entry }}</li>
      </ul>
    </section>
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
  battleState: BattleState | null = null;

  constructor(
    private auth: AuthService,
    private deckBuilder: DeckBuilderService,
    private library: CardLibraryService,
    private battleService: BattleService
  ) {
    this.libraryCards = this.library.getAll();
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
      const result = await this.deckBuilder.createDeck(user.uid, {
        name: this.deckName,
        description: this.deckDescription,
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

  async searchCards() {
    this.libraryCards = this.searchText.trim() ? this.library.search(this.searchText) : this.library.getAll();
  }

  async addCardToSelectedDeck(cardTemplate: CardTemplate) {
    const user = this.auth.currentUser;
    if (!user || !this.selectedDeckId) {
      this.error = 'Select a deck before adding cards.';
      return;
    }

    const card: Card = {
      cardType: cardTemplate.cardType,
      name: cardTemplate.name,
      hp: cardTemplate.hp || 50,
      element: cardTemplate.element,
      stage: 'basic',
      attacks: cardTemplate.attackNames?.map((name, index) => ({
        name,
        cost: [cardTemplate.element],
        damage: cardTemplate.power || 10 + index * 5,
        description: `${name} attack.`
      })) || [],
      description: cardTemplate.description,
      rarity: cardTemplate.rarity,
      trainerType: cardTemplate.cardType === 'trainer' ? 'item' : undefined,
      effect: cardTemplate.description || '',
      ...(cardTemplate.cardType === 'energy' ? { element: cardTemplate.element } : {})
    } as Card;

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
    if (this.selectedDeckId && !this.decks.some(deck => deck.id === this.selectedDeckId)) {
      this.selectedDeckId = '';
      this.deckCards = [];
    }
    if (this.selectedDeckId) {
      await this.loadDeckCards(uid, this.selectedDeckId);
    }
  }

  async loadDeckCards(uid: string, deckId: string) {
    this.deckCards = await this.deckBuilder.listCardsInDeck(uid, deckId);
  }

  async startBattle() {
    this.battleState = this.battleService.createInitialBattle();
  }

  playerTurn() {
    if (!this.battleState) return;
    this.battleState = this.battleService.resolveTurn(this.battleState, 'player');
  }

  opponentTurn() {
    if (!this.battleState) return;
    this.battleState = this.battleService.resolveTurn(this.battleState, 'opponent');
  }
}
