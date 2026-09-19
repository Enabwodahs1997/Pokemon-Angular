import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Attack, CardElement, CardTemplate, CardType } from '../models/card.model';

const POKEMON_TCG_API_KEY = 'c6d102fa-7c57-49bc-8efd-dbce0d244884';
const POKEMON_TCG_API_URL = 'https://api.pokemontcg.io/v2';

@Injectable({ providedIn: 'root' })
export class CardLibraryService {
  private readonly fallbackTrainerCards: CardTemplate[] = [
    {
      id: 'potion-fallback',
      name: 'Potion',
      cardType: 'trainer',
      element: 'normal',
      imageUrl: 'https://images.pokemontcg.io/base1/83.png',
      description: 'Heal the active Pokémon and gain +8 attack.',
      power: 0,
      rarity: 'uncommon'
    },
    {
      id: 'switch-fallback',
      name: 'Switch',
      cardType: 'trainer',
      element: 'normal',
      imageUrl: 'https://images.pokemontcg.io/base1/95.png',
      description: 'Recover and reposition the active Pokémon.',
      power: 0,
      rarity: 'common'
    },
    {
      id: 'bill-fallback',
      name: 'Bill',
      cardType: 'trainer',
      element: 'normal',
      imageUrl: 'https://images.pokemontcg.io/base1/91.png',
      description: 'Draw another tactical advantage.',
      power: 0,
      rarity: 'common'
    },
    {
      id: 'professor-oak-fallback',
      name: 'Professor Oak',
      cardType: 'trainer',
      element: 'normal',
      imageUrl: 'https://images.pokemontcg.io/base1/88.png',
      description: 'Strengthen the active Pokémon with expert guidance.',
      power: 0,
      rarity: 'uncommon'
    }
  ];

  private readonly fallbackImageUrls: Record<string, string> = {
    pikachu: 'https://images.pokemontcg.io/base1/58.png',
    bulbasaur: 'https://images.pokemontcg.io/base1/44.png',
    charmander: 'https://images.pokemontcg.io/base1/46.png',
    squirtle: 'https://images.pokemontcg.io/base1/63.png',
    mewtwo: 'https://images.pokemontcg.io/base1/10.png'
  };

  private library: CardTemplate[] = [
    {
      id: 'pikachu-basic',
      name: 'Pikachu',
      cardType: 'pokemon',
      element: 'lightning',
      imageUrl: 'https://images.pokemontcg.io/base1/58.png',
      hp: 60,
      description: 'Fast electric attacker.',
      attackNames: ['Quick Attack', 'Thunder Shock'],
      power: 20,
      rarity: 'common'
    },
    {
      id: 'bulbasaur-basic',
      name: 'Bulbasaur',
      cardType: 'pokemon',
      element: 'grass',
      imageUrl: 'https://images.pokemontcg.io/base1/44.png',
      hp: 70,
      description: 'Steady grass starter.',
      attackNames: ['Vine Whip', 'Razor Leaf'],
      power: 25,
      rarity: 'common'
    },
    {
      id: 'charmander-basic',
      name: 'Charmander',
      cardType: 'pokemon',
      element: 'fire',
      imageUrl: 'https://images.pokemontcg.io/base1/46.png',
      hp: 60,
      description: 'Explosive fire attacker.',
      attackNames: ['Flame Burst', 'Ember'],
      power: 22,
      rarity: 'common'
    },
    {
      id: 'squirtle-basic',
      name: 'Squirtle',
      cardType: 'pokemon',
      element: 'water',
      imageUrl: 'https://images.pokemontcg.io/base1/63.png',
      hp: 70,
      description: 'Tough water defender.',
      attackNames: ['Bubble Shot', 'Water Pulse'],
      power: 24,
      rarity: 'common'
    },
    {
      id: 'mewtwo-legend',
      name: 'Mewtwo',
      cardType: 'pokemon',
      element: 'psychic',
      imageUrl: 'https://images.pokemontcg.io/base1/10.png',
      hp: 120,
      description: 'Legendary psychic powerhouse.',
      attackNames: ['Psychic Burst', 'Future Sight'],
      power: 45,
      rarity: 'legendary'
    },
    {
      id: 'potion-item',
      name: 'Potion',
      cardType: 'trainer',
      element: 'normal',
      imageUrl: 'https://images.pokemontcg.io/base1/83.png',
      description: 'Heal 30 damage from a Pokémon.',
      power: 0,
      rarity: 'uncommon'
    },
    {
      id: 'energy-fire',
      name: 'Fire Energy',
      cardType: 'energy',
      element: 'fire',
      description: 'Energy for fire attacks.',
      power: 0,
      rarity: 'common'
    }
  ];

  constructor(private http: HttpClient) {
    this.loadLiveCards();
  }

  private normalizeElement(value?: string): CardElement {
    const normalized = (value || 'normal').toLowerCase();
    const validTypes: CardElement[] = ['fire', 'water', 'grass', 'lightning', 'psychic', 'fighting', 'dark', 'metal', 'fairy', 'dragon', 'normal'];
    return validTypes.includes(normalized as CardElement) ? normalized as CardElement : 'normal';
  }

  private normalizeCardType(value?: string): CardType {
    const normalized = (value || 'pokemon').toLowerCase();
    if (normalized === 'trainer' || normalized === 'energy') {
      return normalized as CardType;
    }
    return 'pokemon';
  }

  private normalizeRarity(value?: string) {
    const normalized = (value || 'common').toLowerCase();
    const valid = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
    return valid.includes(normalized as any) ? normalized as any : 'common';
  }

  private normalizeAttackElement(value?: string): CardElement {
    return this.normalizeElement(value === 'Colorless' ? 'normal' : value);
  }

  private normalizeAttackDamage(value?: string | number) {
    const damage = Number(String(value || '0').replace(/[^0-9]/g, ''));
    return damage || 10;
  }

  private mapApiCard(card: any): CardTemplate | null {
    const cardType = this.normalizeCardType(card.supertype);
    const name = card.name || 'Unknown Card';
    const description = card.flavorText || card.text?.join(' ') || '';
    const imageUrl = card.images?.large || card.images?.small;

    if (cardType === 'pokemon') {
      return {
        id: card.id,
        name,
        cardType,
        element: this.normalizeElement(card.types?.[0]),
        imageUrl,
        hp: Number(card.hp || 0),
        description,
        attackNames: (card.attacks || []).map((attack: any) => attack.name),
        attacks: (card.attacks || []).map((attack: any): Attack => ({
          name: attack.name || 'Attack',
          cost: (attack.cost || []).map((element: string) => this.normalizeAttackElement(element)),
          damage: this.normalizeAttackDamage(attack.damage),
          damageText: attack.damage ? String(attack.damage) : undefined,
          description: attack.text?.join(' ') || `${attack.name || 'Attack'} attack.`
        })),
        power: Math.max(0, ...(card.attacks || []).map((attack: any) => Number(attack.damage?.replace(/[^0-9]/g, '') || 0))),
        rarity: this.normalizeRarity(card.rarity)
      };
    }

    if (cardType === 'trainer') {
      return {
        id: card.id,
        name,
        cardType,
        element: this.normalizeElement(card.types?.[0] || 'normal'),
        imageUrl,
        description,
        power: 0,
        rarity: this.normalizeRarity(card.rarity)
      };
    }

    return {
      id: card.id,
      name,
      cardType,
      element: this.normalizeElement(card.types?.[0] || 'normal'),
      imageUrl,
      description,
      power: 0,
      rarity: this.normalizeRarity(card.rarity)
    };
  }

  private async loadLiveCards() {
    try {
      const cards = await this.search('');
      if (cards.length) {
        this.library = cards;
      }
    } catch {
      this.library = [...this.library];
    }
  }

  private fetchFromApi(query?: string) {
    const headers = new HttpHeaders({ 'X-API-Key': POKEMON_TCG_API_KEY });
    const params: any = {
      pageSize: 20
    };

    if (query && query.trim()) {
      params.q = `name:*${query.trim()}*`;
    }

    return this.http.get<any>(`${POKEMON_TCG_API_URL}/cards`, { headers, params });
  }

  async getAll() {
    try {
      const result = await this.fetchFromApi().toPromise();
      const cards = (result?.data || []).map((card: any) => this.mapApiCard(card)).filter(Boolean) as CardTemplate[];
      if (cards.length) {
        this.library = cards;
      }
      return [...this.library];
    } catch {
      return [...this.library];
    }
  }

  async search(query: string) {
    const cleanQuery = query.trim();
    try {
      const result = await this.fetchFromApi(cleanQuery).toPromise();
      const cards = (result?.data || []).map((card: any) => this.mapApiCard(card)).filter(Boolean) as CardTemplate[];
      if (cards.length) {
        this.library = cards;
        return [...cards];
      }
    } catch {
      // Fall back to local library if the live API is unavailable.
    }

    return this.library.filter(card => !cleanQuery || card.name.toLowerCase().includes(cleanQuery.toLowerCase()));
  }

  async getRandomTrainerCard(): Promise<CardTemplate> {
    try {
      const headers = new HttpHeaders({ 'X-API-Key': POKEMON_TCG_API_KEY });
      const result = await this.http.get<any>(`${POKEMON_TCG_API_URL}/cards`, {
        headers,
        params: { q: 'supertype:Trainer', pageSize: 50 }
      }).toPromise();
      const trainers = (result?.data || []).map((card: any) => this.mapApiCard(card)).filter((card: CardTemplate | null): card is CardTemplate => card?.cardType === 'trainer');
      if (trainers.length) {
        return trainers[Math.floor(Math.random() * trainers.length)];
      }
    } catch {
      // Use the local trainer when the API is unavailable.
    }

    const localTrainers = this.library.filter(card => card.cardType === 'trainer');
    const fallbackPool = localTrainers.length ? localTrainers : this.fallbackTrainerCards;
    return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  }

  getById(id: string) {
    return this.library.find(card => card.id === id) || null;
  }

  async getImageForName(name: string) {
    const normalizedName = name.trim().toLowerCase();
    const fallbackName = Object.keys(this.fallbackImageUrls).find(key => normalizedName.includes(key));
    const fallbackImage = fallbackName ? this.fallbackImageUrls[fallbackName] : undefined;
    if (fallbackImage) {
      return fallbackImage;
    }

    const localMatch = this.library.find(card => card.name.toLowerCase() === normalizedName);
    if (localMatch?.imageUrl) {
      return localMatch.imageUrl;
    }

    try {
      const matches = await this.search(name);
      return matches.find(card => card.name.toLowerCase() === normalizedName)?.imageUrl;
    } catch {
      return undefined;
    }
  }
}
