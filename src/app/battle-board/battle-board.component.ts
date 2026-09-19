import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BattleService } from '../services/battle.service';
import { DeckBuilderService } from '../services/deck-builder.service';
import { CardLibraryService } from '../services/card-library.service';
import { FirestoreService } from '../services/firestore.service';
import { BattleState, Card, CardTemplate, Deck } from '../models/card.model';

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
        <button type="button" class="pokemon-secondary-btn" (click)="toggleLocalMode()">
          {{ localMultiplayer ? 'Play against CPU' : 'Play against another player' }}
        </button>
        <div class="battle-deck-picker battle-deck-picker-setup">
          <label for="battleDeck">Player 1 deck</label>
          <select id="battleDeck" [(ngModel)]="selectedDeckId" name="battleDeck" (ngModelChange)="loadSelectedDeck()">
            <option value="">Choose a deck...</option>
            <option *ngFor="let deck of decks" [value]="deck.id">{{ deck.name }}</option>
          </select>
        </div>
        <div *ngIf="localMultiplayer" class="battle-deck-picker">
          <label for="playerTwoDeck">Player 2 deck</label>
          <select id="playerTwoDeck" [(ngModel)]="playerTwoDeckId" name="playerTwoDeck" (ngModelChange)="loadPlayerTwoDeck()">
            <option value="">Choose Player 2 deck...</option>
            <option *ngFor="let deck of decks" [value]="deck.id">{{ deck.name }}</option>
          </select>
        </div>
        <button type="button" class="pokemon-primary-btn draw-cards-btn" [disabled]="!canDrawCards" (click)="drawCards()">
          {{ loadingDeck ? 'Loading deck...' : 'Draw starting Pokémon' }}
        </button>
        <p *ngIf="selectedDeckId && deckCards.length && !localMultiplayer" class="pokemon-info-text">Your deck is ready. Draw up to five Pokémon to begin.</p>
        <p *ngIf="localMultiplayer && playerTwoDeckCards.length" class="pokemon-info-text">Both decks are ready. Draw up to five Pokémon for each player.</p>
        <p *ngIf="error" class="pokemon-error-text">{{ error }}</p>
      </section>

      <section *ngIf="battleState" class="pokemon-panel battle-panel">
        <div class="battle-heading-row">
          <div>
            <h2>Battle Board</h2>
            <p class="pokemon-battle-meta">{{ localMultiplayer ? 'Local two-player battle' : 'Battle against CPU Trainer' }}</p>
            <div class="battle-deck-picker">
              <label for="activeBattleDeck">Battle deck</label>
              <select id="activeBattleDeck" [(ngModel)]="selectedDeckId" name="activeBattleDeck" (ngModelChange)="loadSelectedDeck()">
                <option value="">Choose a deck...</option>
                <option *ngFor="let deck of decks" [value]="deck.id">{{ deck.name }}</option>
              </select>
            </div>
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
              <div *ngIf="mon && (!localMultiplayer || battleState.turnOwner === 'player')" class="pokemon-move-list">
                <button *ngFor="let move of mon.moves" type="button" [disabled]="!canUseMove('player', move.name)" (click)="attackWithMove('player', move.name)">
                  {{ move.name }} ({{ move.damageText || move.damage }} base, {{ getMoveDamage(mon, move) }} now, cost {{ move.cost.length }})
                </button>
              </div>
            </div>
            <div *ngIf="playerTrainerCard" class="battle-trainer-card">
              <img *ngIf="playerTrainerCard.imageUrl" class="battle-trainer-image" [src]="playerTrainerCard.imageUrl" [alt]="playerTrainerCard.name" />
              <div><strong>{{ playerTrainerCard.name }}</strong><p>{{ playerTrainerCard.description }}</p></div>
              <button *ngIf="!localMultiplayer || battleState.turnOwner === 'player'" type="button" class="pokemon-primary-btn" (click)="useTrainer('player')">Use</button>
              <button *ngIf="!localMultiplayer || battleState.turnOwner === 'player'" type="button" class="pokemon-mini-btn danger" (click)="trashTrainer('player')">Trash</button>
            </div>
            <div>Bench</div>
            <div *ngFor="let mon of battleState.player.bench" class="pokemon-bench-card">
              <img *ngIf="mon.imageUrl" class="battle-card-image bench-card-image" [src]="mon.imageUrl" [alt]="mon.name" />
              <strong>{{ mon.name }}</strong>
              <div>{{ mon.hp }}/{{ mon.maxHp }} HP</div>
              <button *ngIf="!localMultiplayer || battleState.turnOwner === 'player'" type="button" class="pokemon-mini-btn" [disabled]="!canSwap('player', mon.id)" (click)="swapActive('player', mon.id)">Swap in</button>
            </div>
          </div>

          <div class="pokemon-battle-side opponent-side">
            <h3>{{ localMultiplayer ? 'Player 2' : 'Opponent' }}</h3>
            <div *ngFor="let mon of [battleState.opponent.active]" class="pokemon-mon-card opponent-mon">
              <img *ngIf="mon?.imageUrl" class="battle-card-image" [src]="mon?.imageUrl" [alt]="mon?.name" />
              <strong>{{ mon?.name || 'No active Pokémon' }}</strong>
              <div>{{ mon?.hp || 0 }}/{{ mon?.maxHp || 0 }} HP</div>
              <div>Element: {{ mon?.element || '-' }}</div>
              <div>Energy: {{ mon?.energyAttached || 0 }}</div>
              <div *ngIf="localMultiplayer && mon && battleState.turnOwner === 'opponent'" class="pokemon-move-list">
                <button *ngFor="let move of mon.moves" type="button" [disabled]="!canUseMove('opponent', move.name)" (click)="attackWithMove('opponent', move.name)">
                  {{ move.name }} ({{ move.damageText || move.damage }} base, {{ getMoveDamage(mon, move) }} now, cost {{ move.cost.length }})
                </button>
              </div>
            </div>
            <div *ngIf="opponentTrainerCard" class="battle-trainer-card">
              <img *ngIf="opponentTrainerCard.imageUrl" class="battle-trainer-image" [src]="opponentTrainerCard.imageUrl" [alt]="opponentTrainerCard.name" />
              <div><strong>{{ opponentTrainerCard.name }}</strong><p>{{ opponentTrainerCard.description }}</p></div>
              <button *ngIf="localMultiplayer && battleState.turnOwner === 'opponent'" type="button" class="pokemon-primary-btn" (click)="useTrainer('opponent')">Use</button>
              <button *ngIf="localMultiplayer && battleState.turnOwner === 'opponent'" type="button" class="pokemon-mini-btn danger" (click)="trashTrainer('opponent')">Trash</button>
            </div>
            <div>Bench</div>
            <div *ngFor="let mon of battleState.opponent.bench" class="pokemon-bench-card">
              <img *ngIf="mon.imageUrl" class="battle-card-image bench-card-image" [src]="mon.imageUrl" [alt]="mon.name" />
              <strong>{{ mon.name }}</strong>
              <div>{{ mon.hp }}/{{ mon.maxHp }} HP</div>
              <button *ngIf="localMultiplayer && battleState.turnOwner === 'opponent'" type="button" class="pokemon-mini-btn" [disabled]="!canSwap('opponent', mon.id)" (click)="swapActive('opponent', mon.id)">Swap in</button>
            </div>
          </div>
        </div>

        <div class="pokemon-action-row">
          <button *ngIf="!localMultiplayer || battleState.turnOwner === 'player'" type="button" class="pokemon-secondary-btn" (click)="attachEnergy('player')">Attach energy</button>
          <button *ngIf="!localMultiplayer || battleState.turnOwner === 'player'" type="button" class="pokemon-secondary-btn" [disabled]="playerTrainerCard || trainerLoading || battleState.turnActions.trainerDrawn" (click)="drawTrainer('player')">{{ trainerLoading === 'player' ? 'Drawing trainer...' : battleState.turnActions.trainerDrawn ? 'Trainer drawn' : 'Draw trainer card' }}</button>
          <button *ngIf="localMultiplayer && battleState.turnOwner === 'opponent'" type="button" class="pokemon-secondary-btn" (click)="attachEnergy('opponent')">Player 2 energy</button>
          <button *ngIf="localMultiplayer && battleState.turnOwner === 'opponent'" type="button" class="pokemon-secondary-btn" [disabled]="opponentTrainerCard || trainerLoading || battleState.turnActions.trainerDrawn" (click)="drawTrainer('opponent')">{{ trainerLoading === 'opponent' ? 'Drawing trainer...' : battleState.turnActions.trainerDrawn ? 'Trainer drawn' : 'Player 2 draw trainer' }}</button>
          <button *ngIf="!localMultiplayer" type="button" class="pokemon-secondary-btn" (click)="opponentTurn()">Opponent attack</button>
          <button *ngIf="localMultiplayer && battleState.turnOwner === 'opponent'" type="button" class="pokemon-primary-btn" (click)="endPlayerTwoTurn()">Player 2 end turn</button>
          <button *ngIf="!localMultiplayer || battleState.turnOwner === 'player'" type="button" class="pokemon-primary-btn" [disabled]="opponentThinking" (click)="endTurn()">
            {{ opponentThinking ? 'Opponent thinking...' : 'Player 1 end turn' }}
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
  playerTwoDeckId = '';
  playerTwoDeckCards: Card[] = [];
  localMultiplayer = false;
  playerTrainerCard: CardTemplate | null = null;
  opponentTrainerCard: CardTemplate | null = null;
  trainerLoading: 'player' | 'opponent' | null = null;
  battleState: BattleState | null = null;
  error = '';
  opponentThinking = false;
  loadingDeck = false;
  private battleResultRecorded = false;

  get floatingDamage() {
    return this.battleState?.log.filter(entry => typeof entry.damage === 'number' && entry.damage > 0).slice(-4).reverse() || [];
  }

  get canDrawCards() {
    return !!this.selectedDeckId && !this.loadingDeck && this.deckCards.length > 0 && (!this.localMultiplayer || (!!this.playerTwoDeckId && this.playerTwoDeckCards.length > 0));
  }

  constructor(
    private auth: AuthService,
    private deckBuilder: DeckBuilderService,
    private battleService: BattleService,
    private cardLibrary: CardLibraryService,
    private firestore: FirestoreService,
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
      this.playerTwoDeckId = this.playerTwoDeckId || this.decks.find(deck => deck.id !== this.selectedDeckId)?.id || '';
      if (this.selectedDeckId) {
        this.loadSelectedDeck();
      }
    });
  }

  async loadSelectedDeck() {
    const user = this.auth.currentUser;
    if (!user || !this.selectedDeckId) {
      this.battleState = null;
      return;
    }
    this.battleState = null;
    await this.loadCards(user.uid);
    if (this.localMultiplayer && this.playerTwoDeckId) {
      await this.loadPlayerTwoDeck();
    }
  }

  private async loadCards(uid: string) {
    this.loadingDeck = true;
    try {
      this.deckCards = await this.loadCardsForDeck(uid, this.selectedDeckId);
      this.error = '';
    } catch (e: any) {
      this.error = e.message || 'Unable to load that deck.';
    } finally {
      this.loadingDeck = false;
    }
  }

  private async loadCardsForDeck(uid: string, deckId: string) {
    const savedCards = await this.deckBuilder.listCardsInDeck(uid, deckId);
    return Promise.all(savedCards.map(async card => ({
      ...card,
      imageUrl: card.imageUrl || await this.cardLibrary.getImageForName(card.name)
    })));
  }

  async loadPlayerTwoDeck() {
    const user = this.auth.currentUser;
    this.battleState = null;
    this.playerTwoDeckCards = [];
    if (!user || !this.playerTwoDeckId) {
      return;
    }
    if (this.playerTwoDeckId === this.selectedDeckId) {
      this.error = 'Player 2 must choose a different deck.';
      return;
    }
    try {
      this.playerTwoDeckCards = await this.loadCardsForDeck(user.uid, this.playerTwoDeckId);
      this.error = '';
    } catch (e: any) {
      this.error = e.message || 'Unable to load Player 2 deck.';
    }
  }

  toggleLocalMode() {
    this.localMultiplayer = !this.localMultiplayer;
    this.battleState = null;
    this.error = '';
    if (this.localMultiplayer && this.playerTwoDeckId) {
      this.loadPlayerTwoDeck();
    }
  }

  startNewBattle() {
    const user = this.auth.currentUser;
    if (user && this.selectedDeckId) {
      this.battleState = null;
      this.drawCards();
    }
  }

  drawCards() {
    if (!this.selectedDeckId || !this.deckCards.length) {
      return;
    }

    this.battleState = this.battleService.startTurn(
      this.battleService.createInitialBattle(this.deckCards, this.localMultiplayer ? this.playerTwoDeckCards : []),
      'player'
    );
    this.battleResultRecorded = false;
    this.playerTrainerCard = null;
    this.opponentTrainerCard = null;
    this.error = '';
  }

  async drawTrainer(side: 'player' | 'opponent') {
    if (!this.battleState || this.battleState.turnOwner !== side || this.trainerLoading || this.battleState.turnActions.trainerDrawn) {
      return;
    }

    if ((side === 'player' && this.playerTrainerCard) || (side === 'opponent' && this.opponentTrainerCard)) {
      return;
    }

    this.trainerLoading = side;
    try {
      const card = await this.cardLibrary.getRandomTrainerCard();
      if (side === 'player') {
        this.playerTrainerCard = card;
      } else {
        this.opponentTrainerCard = card;
      }
      this.battleState = {
        ...this.battleState,
        turnActions: {
          ...this.battleState.turnActions,
          trainerDrawn: true
        }
      };
    } catch (e: any) {
      this.error = e.message || 'Unable to draw a trainer card.';
    } finally {
      this.trainerLoading = null;
    }
  }

  useTrainer(side: 'player' | 'opponent') {
    const card = side === 'player' ? this.playerTrainerCard : this.opponentTrainerCard;
    if (!this.battleState || !card || this.battleState.turnOwner !== side) {
      return;
    }

    this.battleState = this.battleService.playTrainerCard(this.battleState, side);
    if (side === 'player') {
      this.playerTrainerCard = null;
    } else {
      this.opponentTrainerCard = null;
    }
  }

  trashTrainer(side: 'player' | 'opponent') {
    if (side === 'player') {
      this.playerTrainerCard = null;
    } else {
      this.opponentTrainerCard = null;
    }
  }

  backToDeckLab() {
    this.router.navigate(['/deck-lab']);
  }

  private recordBattleResultIfNeeded() {
    if (!this.battleState?.winner || this.battleResultRecorded || this.battleState.winner === 'draw') {
      return;
    }

    const user = this.auth.currentUser;
    if (!user) {
      return;
    }

    this.battleResultRecorded = true;
    void this.firestore.recordBattleResult(user.uid, this.battleState.winner === 'player', 'CPU Trainer');
  }

  canUseMove(side: 'player' | 'opponent', moveName: string) {
    if (!this.battleState) return false;
    const active = side === 'player' ? this.battleState.player.active : this.battleState.opponent.active;
    const move = active?.moves.find(item => item.name === moveName) || null;
    return this.battleState.turnOwner === side && this.battleState.turnActions.attacksUsed < this.battleState.turnActions.maxAttacks && this.battleService.canUseMove(active, move) && this.battleState.phase !== 'end';
  }

  getMoveDamage(mon: { energyAttached: number }, move: { damage: number; cost: string[] }) {
    const energyUsed = Math.min(mon.energyAttached, move.cost.length);
    return move.damage + energyUsed * 2;
  }

  canSwap(side: 'player' | 'opponent', benchId: string) {
    if (!this.battleState) return false;
    const bench = side === 'player' ? this.battleState.player.bench : this.battleState.opponent.bench;
    return this.battleState.turnOwner === side && this.battleState.turnActions.swapsUsed < this.battleState.turnActions.maxSwaps && this.battleState.phase === 'main' && bench.some(monster => monster.id === benchId);
  }

  attachEnergy(side: 'player' | 'opponent') { if (this.battleState) this.battleState = this.battleService.attachEnergy(this.battleState, side); }
  playTrainer(side: 'player' | 'opponent') { if (this.battleState) this.battleState = this.battleService.playTrainerCard(this.battleState, side); }
  attackWithMove(side: 'player' | 'opponent', moveName: string) {
    if (this.battleState) {
      this.battleState = this.battleService.attackWithMove(this.battleState, side, moveName);
      this.recordBattleResultIfNeeded();
    }
  }
  swapActive(side: 'player' | 'opponent', benchId: string) { if (this.battleState) this.battleState = this.battleService.swapActivePokemon(this.battleState, side, benchId); }
  async endTurn() {
    if (!this.battleState || this.opponentThinking || this.battleState.turnOwner !== 'player' || this.battleState.winner) {
      return;
    }

    this.battleState = this.battleService.endTurn(this.battleState, 'player');

    if (this.localMultiplayer) {
      if (!this.battleState.winner) {
        this.battleState = this.battleService.startTurn(this.battleState, 'opponent');
      }
      return;
    }

    this.opponentThinking = true;

    await new Promise(resolve => setTimeout(resolve, 600));

    if (this.battleState && !this.battleState.winner) {
      this.battleState = this.battleService.startTurn(this.battleState, 'opponent');
      const move = this.battleState.opponent.active?.moves[0];
      if (move) {
        this.battleState = this.battleService.attackWithMove(this.battleState, 'opponent', move.name);
        this.recordBattleResultIfNeeded();
      }
    }

    if (this.battleState && !this.battleState.winner) {
      this.battleState = this.battleService.startTurn(this.battleState, 'player');
    }

    this.opponentThinking = false;
  }

  endPlayerTwoTurn() {
    if (!this.localMultiplayer || !this.battleState || this.battleState.turnOwner !== 'opponent' || this.battleState.winner) {
      return;
    }

    this.battleState = this.battleService.endTurn(this.battleState, 'opponent');
    if (!this.battleState.winner) {
      this.battleState = this.battleService.startTurn(this.battleState, 'player');
    }
  }

  opponentTurn() {
    if (!this.battleState) return;
    const move = this.battleState.opponent.active?.moves[0];
    if (!move) return;
    this.battleState = this.battleService.startTurn(this.battleState, 'opponent');
    this.battleState = this.battleService.attackWithMove(this.battleState, 'opponent', move.name);
    this.recordBattleResultIfNeeded();
  }
}
