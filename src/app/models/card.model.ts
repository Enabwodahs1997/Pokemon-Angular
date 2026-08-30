export type CardType = 'pokemon' | 'trainer' | 'energy';
export type CardElement = 'fire' | 'water' | 'grass' | 'lightning' | 'psychic' | 'fighting' | 'dark' | 'metal' | 'fairy' | 'dragon' | 'normal';
export type DeckFormat = 'custom' | 'standard' | 'expanded';

export interface Attack {
  name: string;
  cost: CardElement[];
  damage: number;
  description: string;
}

export interface PokemonCard {
  id?: string;
  cardType: 'pokemon';
  name: string;
  hp: number;
  element: CardElement;
  stage: 'basic' | 'stage1' | 'stage2';
  evolvesFrom?: string;
  attacks: Attack[];
  weakness?: { type: CardElement; value: string };
  retreatCost?: number;
  imageUrl?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  description?: string;
  createdAt?: string;
}

export interface TrainerCard {
  id?: string;
  cardType: 'trainer';
  name: string;
  trainerType: 'item' | 'supporter' | 'stadium';
  effect: string;
  cost?: CardElement[];
  description?: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface EnergyCard {
  id?: string;
  cardType: 'energy';
  name: string;
  element: CardElement;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
}

export type Card = PokemonCard | TrainerCard | EnergyCard;

export interface CardTemplate {
  id: string;
  name: string;
  cardType: CardType;
  element: CardElement;
  hp?: number;
  description?: string;
  attackNames?: string[];
  power?: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface Deck {
  id?: string;
  name: string;
  description?: string;
  format: DeckFormat;
  createdAt?: string;
  updatedAt?: string;
  cardCount?: number;
  isPublic?: boolean;
}

export interface Move {
  name: string;
  element: CardElement;
  damage: number;
  description: string;
}

export interface BoardPokemon {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  element: CardElement;
  attackPower: number;
  energyAttached: number;
  moves: Move[];
  weakness?: { type: CardElement; value: number };
  resistance?: { type: CardElement; value: number };
  isDefeated: boolean;
}

export interface BattleSideState {
  active: BoardPokemon | null;
  bench: BoardPokemon[];
  trainerEffects: string[];
}

export interface BattleState {
  player: BattleSideState;
  opponent: BattleSideState;
  currentTurn: number;
  phase: 'start' | 'main' | 'attack' | 'end';
  winner: 'player' | 'opponent' | 'draw' | null;
  log: string[];
}
