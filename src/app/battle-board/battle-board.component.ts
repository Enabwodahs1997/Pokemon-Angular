import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BattleService } from '../services/battle.service';
import { DeckBuilderService } from '../services/deck-builder.service';
import { CardLibraryService } from '../services/card-library.service';
import { BattleState, Card, Deck } from '../models/card.model';

@Component({
  selector: 'app-battle-board',
  template: `
    <div class="pokemon-home-shell">
      <header class="pokemon-home-header">
        <div>
          <p class="pokemon-kicker">Battle Board</p>
          <h1>Trainer battle</h1>
        </div>
        <button type="button" class="pokemon-secondary-btn" (click)="backToDeckLab()">Back to Deck Lab</button>
      </header>

      <section *ngIf="!battleState" class="pokemon-panel">
        <h2>Choose a deck</h2>
        <p class="pokemon-info-text">Select a deck to load its Pokémon into battle.</p>
        <select [(ngModel)]="selectedDeckId" name="battleDeck" (ngModelChange)="loadSelectedDeck()">
          <option value="">Choose a deck...</option>
          <option *ngFor="let deck of decks" [value]="deck.id">{{ deck.name }}</option>
        </select>
        <p *ngIf="error" class="pokemon-error-text">{{ error }}</p>
      </section>

      <section *ngIf="battleState" class="pokemon-panel battle-panel">
        <div class="battle-heading-row">
          <div>
            <h2>Battle Board</h2>
            <p class="pokemon-battle-meta">Turn: {{ battleState.currentTurn }} | Turn owner: {{ battleState.turnOwner }} | Phase: {{ battleState.phase }} | Winner: {{ battleState.winner || 'ongoing' }}</p>
            <p class="pokemon-battle-meta">Actions: attacks {{ battleState.turnActions.attacksUsed }}/{{ battleState.turnActions.maxAttacks }} | energy {{ battleState.turnActions.energyUsed }}/{{ battleState.turnActions.maxEnergy }} | trainer {{ battleState.turnActions.trainerUsed }}/{{ battleState.turnActions.maxTrainer }} | swaps {{ battleState.turnActions.swapsUsed }}/{{ battleState.turnActions.maxSwaps }}</p>
          </div>
          <button type="button" class="pokemon-secondary-btn" (click)="startNewBattle()">Restart battle</button>
        </div>

        <div *ngIf="battleState.winner === 'player'" class="battle-result battle-result-win" role="status" aria-live="polite">
          <strong>You win!</strong>
          <span>All opposing Pokémon have been defeated.</span>
          <button type="button" class="pokemon-primary-btn" (click)="startNewBattle()">Play again</button>
        </div>

        <div *ngIf="floatingDamage.length" class="battle-damage-area">
          <div *ngFor="let effect of floatingDamage" class="damage-bubble" [ngClass]="effect.side === 'player' ? 'player-damage' : 'opponent-damage'">-{{ effect.damage }}</div>
        </div>

        <div class="pokemon-battle-grid">
          <div class="pokemon-battle-side player-side">
            <h3>Player</h3>
            <div *ngFor="let mon of [battleState.player.active]" class="pokemon-mon-card player-mon">
              <img *ngIf="mon?.imageUrl" class="battle-card-image" [src]="mon?.imageUrl" [alt]="mon?.name" />
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
              <img *ngIf="mon.imageUrl" class="battle-card-image bench-card-image" [src]="mon.imageUrl" [alt]="mon.name" />
              <strong>{{ mon.name }}</strong>
              <div>{{ mon.hp }}/{{ mon.maxHp }} HP</div>
              <button type="button" class="pokemon-mini-btn" [disabled]="!canSwap('player', mon.id)" (click)="swapActive('player', mon.id)">Swap in</button>
            </div>
          </div>

          <div class="pokemon-battle-side opponent-side">
            <h3>Opponent</h3>
            <div *ngFor="let mon of [battleState.opponent.active]" class="pokemon-mon-card opponent-mon">
              <img *ngIf="mon?.imageUrl" class="battle-card-image" [src]="mon?.imageUrl" [alt]="mon?.name" />
              <strong>{{ mon?.name || 'No active Pokémon' }}</strong>
              <div>{{ mon?.hp || 0 }}/{{ mon?.maxHp || 0 }} HP</div>
              <div>Element: {{ mon?.element || '-' }}</div>
              <div>Energy: {{ mon?.energyAttached || 0 }}</div>
            </div>
            <div>Bench</div>
            <div *ngFor="let mon of battleState.opponent.bench" class="pokemon-bench-card">
              <img *ngIf="mon.imageUrl" class="battle-card-image bench-card-image" [src]="mon.imageUrl" [alt]="mon.name" />
              <strong>{{ mon.name }}</strong>
              <div>{{ mon.hp }}/{{ mon.maxHp }} HP</div>
            </div>
          </div>
        </div>

        <div class="pokemon-action-row">
          <button type="button" class="pokemon-secondary-btn" (click)="attachEnergy('player')">Attach energy</button>
          <button type="button" class="pokemon-secondary-btn" (click)="playTrainer('player')">Play trainer</button>
          <button type="button" class="pokemon-secondary-btn" (click)="opponentTurn()">Opponent attack</button>
          <button type="button" class="pokemon-primary-btn" [disabled]="opponentThinking" (click)="endTurn()">
            {{ opponentThinking ? 'Opponent thinking...' : 'End turn' }}
          </button>
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
export class BattleBoardComponent {
  decks: Deck[] = [];
  selectedDeckId = '';
  deckCards: Card[] = [];
  battleState: BattleState | null = null;
  error = '';
  opponentThinking = false;

  get floatingDamage() {
    return this.battleState?.log.filter(entry => typeof entry.damage === 'number' && entry.damage > 0).slice(-4).reverse() || [];
  }

  constructor(
    private auth: AuthService,
    private deckBuilder: DeckBuilderService,
    private battleService: BattleService,
    private cardLibrary: CardLibraryService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.auth.user$.subscribe(user => {
      if (user) {
        this.loadDecks(user.uid);
      }
    });
  }

  async loadDecks(uid: string) {
    this.decks = await this.deckBuilder.listDecks(uid);
    this.route.queryParams.subscribe(params => {
      this.selectedDeckId = params['deckId'] || this.decks[0]?.id || '';
      if (this.selectedDeckId) {
        this.startNewBattle();
      }
    });
  }

  async loadSelectedDeck() {
    const user = this.auth.currentUser;
    if (!user || !this.selectedDeckId) {
      this.battleState = null;
      return;
    }
    await this.loadCardsAndStart(user.uid);
  }

  private async loadCardsAndStart(uid: string) {
    try {
      const savedCards = await this.deckBuilder.listCardsInDeck(uid, this.selectedDeckId);
      this.deckCards = await Promise.all(savedCards.map(async card => ({
        ...card,
        imageUrl: card.imageUrl || await this.cardLibrary.getImageForName(card.name)
      })));
      this.battleState = this.battleService.startTurn(this.battleService.createInitialBattle(this.deckCards), 'player');
      this.error = '';
    } catch (e: any) {
      this.error = e.message || 'Unable to load that deck.';
    }
  }

  startNewBattle() {
    const user = this.auth.currentUser;
    if (user && this.selectedDeckId) {
      this.loadCardsAndStart(user.uid);
    }
  }

  backToDeckLab() {
    this.router.navigate(['/deck-lab']);
  }

  canUseMove(side: 'player' | 'opponent', moveName: string) {
    if (!this.battleState) return false;
    const active = side === 'player' ? this.battleState.player.active : this.battleState.opponent.active;
    const move = active?.moves.find(item => item.name === moveName) || null;
    return this.battleState.turnOwner === side && this.battleState.turnActions.attacksUsed < this.battleState.turnActions.maxAttacks && this.battleService.canUseMove(active, move) && this.battleState.phase !== 'end';
  }

  canSwap(side: 'player' | 'opponent', benchId: string) {
    if (!this.battleState) return false;
    const bench = side === 'player' ? this.battleState.player.bench : this.battleState.opponent.bench;
    return this.battleState.turnOwner === side && this.battleState.turnActions.swapsUsed < this.battleState.turnActions.maxSwaps && this.battleState.phase === 'main' && bench.some(monster => monster.id === benchId);
  }

  attachEnergy(side: 'player' | 'opponent') { if (this.battleState) this.battleState = this.battleService.attachEnergy(this.battleState, side); }
  playTrainer(side: 'player' | 'opponent') { if (this.battleState) this.battleState = this.battleService.playTrainerCard(this.battleState, side); }
  attackWithMove(side: 'player' | 'opponent', moveName: string) { if (this.battleState) this.battleState = this.battleService.attackWithMove(this.battleState, side, moveName); }
  swapActive(side: 'player' | 'opponent', benchId: string) { if (this.battleState) this.battleState = this.battleService.swapActivePokemon(this.battleState, side, benchId); }
  async endTurn() {
    if (!this.battleState || this.opponentThinking || this.battleState.turnOwner !== 'player' || this.battleState.winner) {
      return;
    }

    this.battleState = this.battleService.endTurn(this.battleState, 'player');
    this.opponentThinking = true;

    await new Promise(resolve => setTimeout(resolve, 600));

    if (this.battleState && !this.battleState.winner) {
      this.battleState = this.battleService.startTurn(this.battleState, 'opponent');
      const move = this.battleState.opponent.active?.moves[0];
      if (move) {
        this.battleState = this.battleService.attackWithMove(this.battleState, 'opponent', move.name);
      }
    }

    if (this.battleState && !this.battleState.winner) {
      this.battleState = this.battleService.startTurn(this.battleState, 'player');
    }

    this.opponentThinking = false;
  }

  opponentTurn() {
    if (!this.battleState) return;
    const move = this.battleState.opponent.active?.moves[0];
    if (!move) return;
    this.battleState = this.battleService.startTurn(this.battleState, 'opponent');
    this.battleState = this.battleService.attackWithMove(this.battleState, 'opponent', move.name);
  }
}
