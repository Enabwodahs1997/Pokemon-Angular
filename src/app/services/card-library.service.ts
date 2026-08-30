import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CardElement, CardTemplate, CardType } from '../models/card.model';

const POKEMON_TCG_API_KEY = 'c6d102fa-7c57-49bc-8efd-dbce0d244884';
const POKEMON_TCG_API_URL = 'https://api.pokemontcg.io/v2';

@Injectable({ providedIn: 'root' })
export class CardLibraryService {
  private library: CardTemplate[] = [
    {
      id: 'pikachu-basic',
      name: 'Pikachu',
      cardType: 'pokemon',
      element: 'lightning',
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

  private mapApiCard(card: any): CardTemplate | null {
    const cardType = this.normalizeCardType(card.supertype);
    const name = card.name || 'Unknown Card';
    const description = card.flavorText || card.text?.join(' ') || '';

    if (cardType === 'pokemon') {
      return {
        id: card.id,
        name,
        cardType,
        element: this.normalizeElement(card.types?.[0]),
        hp: Number(card.hp || 0),
        description,
        attackNames: (card.attacks || []).map((attack: any) => attack.name),
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

  getById(id: string) {
    return this.library.find(card => card.id === id) || null;
  }
}
