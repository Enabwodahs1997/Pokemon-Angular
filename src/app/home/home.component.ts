import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { DeckBuilderService } from '../services/deck-builder.service';
import { BattleService } from '../services/battle.service';
import { CardLibraryService } from '../services/card-library.service';
import { Card, Deck, CardTemplate, BattleState, BoardPokemon } from '../models/card.model';

@Component({
  selector: 'app-home',
  template: `
    <div class="pokemon-home-shell">
      <header class="pokemon-home-header">
        <div>
          <p class="pokemon-kicker">Battle Arena</p>
          <h1>Pokémon Card Game</h1>
        </div>
        <div class="pokemon-header-badges">
          <span>Deck Lab</span>
          <span>Battle Board</span>
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
        <button type="button" class="pokemon-primary-btn" (click)="startBattle()">Start battle</button>
        <ul class="pokemon-list">
          <li *ngFor="let card of deckCards">
            <span>{{ card.name }} - {{ card.cardType }}</span>
            <button type="button" class="pokemon-mini-btn danger" (click)="removeCard(card.id)">Remove</button>
          </li>
        </ul>
      </section>

      <section *ngIf="battleState" class="pokemon-panel battle-panel">
        <h2>Battle Board</h2>
        <p class="pokemon-battle-meta">Turn: {{ battleState.currentTurn }} | Turn owner: {{ battleState.turnOwner }} | Phase: {{ battleState.phase }} | Winner: {{ battleState.winner || 'ongoing' }}</p>
        <p class="pokemon-battle-meta">Actions this turn: attacks {{ battleState.turnActions.attacksUsed }}/{{ battleState.turnActions.maxAttacks }} | energy {{ battleState.turnActions.energyUsed }}/{{ battleState.turnActions.maxEnergy }} | trainer {{ battleState.turnActions.trainerUsed }}/{{ battleState.turnActions.maxTrainer }} | swaps {{ battleState.turnActions.swapsUsed }}/{{ battleState.turnActions.maxSwaps }}</p>

        <div *ngIf="floatingDamage.length" style="position:relative; height: 70px; margin-bottom: 8px;">
          <div *ngFor="let effect of floatingDamage" class="damage-bubble" [ngClass]="effect.side === 'player' ? 'player-damage' : 'opponent-damage'" style="position:absolute; top:{{ 12 + (floatingDamage.indexOf(effect) * 18) }}px; left:{{ effect.side === 'player' ? 10 : 70 }}%;">-{{ effect.damage }}</div>
        </div>

        <div class="pokemon-battle-grid">
          <div class="pokemon-battle-side player-side">
            <h3>Player</h3>
            <div *ngFor="let mon of [battleState.player.active]" class="pokemon-mon-card player-mon">
              <strong>{{ mon?.name || 'No active Pokémon' }}</strong>
              <div>{{ mon?.hp || 0 }}/{{ mon?.maxHp || 0 }} HP</div>
              <div>Element: {{ mon?.element || '-' }}</div>
              <div>Energy: {{ mon?.energyAttached || 0 }}</div>
              <div *ngIf="mon" class="pokemon-move-list">
                <button *ngFor="let move of mon.moves" type="button" [disabled]="!canUseMove('player', move.name)" (click)="attackWithMove('player', move.name)">
                  {{ move.name }} ({{ move.damage }}, cost {{ move.cost.length }})
                </button>
              </div>
            </div>
            <div>Bench</div>
            <div *ngFor="let mon of battleState.player.bench" class="pokemon-bench-card">
              <strong>{{ mon.name }}</strong>
              <div>{{ mon.hp }}/{{ mon.maxHp }} HP</div>
              <button type="button" class="pokemon-mini-btn" [disabled]="!canSwap('player', mon.id)" (click)="swapActive('player', mon.id)">Swap in</button>
            </div>
          </div>

          <div class="pokemon-battle-side opponent-side">
            <h3>Opponent</h3>
            <div *ngFor="let mon of [battleState.opponent.active]" class="pokemon-mon-card opponent-mon">
              <strong>{{ mon?.name || 'No active Pokémon' }}</strong>
              <div>{{ mon?.hp || 0 }}/{{ mon?.maxHp || 0 }} HP</div>
              <div>Element: {{ mon?.element || '-' }}</div>
              <div>Energy: {{ mon?.energyAttached || 0 }}</div>
              <div *ngIf="mon" class="pokemon-move-list">
                <button *ngFor="let move of mon.moves" type="button" [disabled]="!canUseMove('opponent', move.name)" (click)="attackWithMove('opponent', move.name)">
                  {{ move.name }} ({{ move.damage }}, cost {{ move.cost.length }})
                </button>
              </div>
            </div>
            <div>Bench</div>
            <div *ngFor="let mon of battleState.opponent.bench" class="pokemon-bench-card">
              <strong>{{ mon.name }}</strong>
              <div>{{ mon.hp }}/{{ mon.maxHp }} HP</div>
              <button type="button" class="pokemon-mini-btn" [disabled]="!canSwap('opponent', mon.id)" (click)="swapActive('opponent', mon.id)">Swap in</button>
            </div>
          </div>
        </div>

        <div class="pokemon-action-row">
          <button type="button" class="pokemon-secondary-btn" (click)="startPlayerTurn()">Start player turn</button>
          <button type="button" class="pokemon-secondary-btn" (click)="startOpponentTurn()">Start opponent turn</button>
          <button type="button" class="pokemon-secondary-btn" (click)="attachEnergy('player')">Attach energy</button>
          <button type="button" class="pokemon-secondary-btn" (click)="playTrainer('player')">Play trainer</button>
          <button type="button" class="pokemon-secondary-btn" (click)="opponentTurn()">Opponent attack</button>
          <button type="button" class="pokemon-primary-btn" (click)="endTurn()">End turn</button>
        </div>

        <ul class="pokemon-log-list">
          <li *ngFor="let entry of battleState.log" class="pokemon-log-item">
            <span class="pokemon-log-tag">{{ entry.type }}</span>
            <span>{{ entry.message }}</span>
            <span *ngIf="entry.damage" class="pokemon-damage">-{{ entry.damage }}</span>
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
  battleState: BattleState | null = null;

  get floatingDamage() {
    if (!this.battleState) {
      return [];
    }

    return this.battleState.log
      .filter(entry => typeof entry.damage === 'number' && entry.damage! > 0)
      .slice(-4)
      .reverse();
  }

  constructor(
    private auth: AuthService,
    private deckBuilder: DeckBuilderService,
    private library: CardLibraryService,
    private battleService: BattleService
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
      rarity: cardTemplate.rarity
    };

    if (cardTemplate.cardType === 'pokemon') {
      Object.assign(cardBase, {
        hp: cardTemplate.hp || 50,
        element: cardTemplate.element,
        stage: 'basic',
        attacks: cardTemplate.attackNames?.map((name, index) => ({
          name,
          cost: [cardTemplate.element],
          damage: cardTemplate.power || 10 + index * 5,
          description: `${name} attack.`
        })) || []
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

  canUseMove(side: 'player' | 'opponent', moveName: string): boolean {
    if (!this.battleState) {
      return false;
    }

    const active = side === 'player' ? this.battleState.player.active : this.battleState.opponent.active;
    const move = active?.moves.find(item => item.name === moveName) || null;
    const isTurnOwner = this.battleState.turnOwner === side;
    const hasAttackAvailable = this.battleState.turnActions.attacksUsed < this.battleState.turnActions.maxAttacks;
    return isTurnOwner && hasAttackAvailable && this.battleService.canUseMove(active, move) && this.battleState.phase !== 'end';
  }

  canSwap(side: 'player' | 'opponent', benchId: string): boolean {
    if (!this.battleState) {
      return false;
    }

    const bench = side === 'player' ? this.battleState.player.bench : this.battleState.opponent.bench;
    const isTurnOwner = this.battleState.turnOwner === side;
    const hasSwapAvailable = this.battleState.turnActions.swapsUsed < this.battleState.turnActions.maxSwaps;
    return isTurnOwner && hasSwapAvailable && this.battleState.phase === 'main' && bench.some(monster => monster.id === benchId);
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

  startBattle() {
    this.battleState = this.battleService.createInitialBattle();
  }

  startPlayerTurn() {
    if (!this.battleState) return;
    this.battleState = this.battleService.startTurn(this.battleState, 'player');
  }

  startOpponentTurn() {
    if (!this.battleState) return;
    this.battleState = this.battleService.startTurn(this.battleState, 'opponent');
  }

  attachEnergy(side: 'player' | 'opponent') {
    if (!this.battleState) return;
    this.battleState = this.battleService.attachEnergy(this.battleState, side);
  }

  playTrainer(side: 'player' | 'opponent') {
    if (!this.battleState) return;
    this.battleState = this.battleService.playTrainerCard(this.battleState, side);
  }

  attackWithMove(side: 'player' | 'opponent', moveName: string) {
    if (!this.battleState) return;
    this.battleState = this.battleService.attackWithMove(this.battleState, side, moveName);
  }

  swapActive(side: 'player' | 'opponent', benchId: string) {
    if (!this.battleState) return;
    this.battleState = this.battleService.swapActivePokemon(this.battleState, side, benchId);
  }

  opponentTurn() {
    if (!this.battleState) return;
    const move = this.battleState.opponent.active?.moves[0];
    if (!move) return;
    this.battleState = this.battleService.startTurn(this.battleState, 'opponent');
    this.battleState = this.battleService.attackWithMove(this.battleState, 'opponent', move.name);
  }

  endTurn() {
    if (!this.battleState) return;
    this.battleState = this.battleService.endTurn(this.battleState, this.battleState.turnOwner);
  }
}
