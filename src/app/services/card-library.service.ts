import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Attack, CardElement, CardTemplate, CardType } from '../models/card.model';

const POKE_API_URL = 'https://pokeapi.co/api/v2';

@Injectable({ providedIn: 'root' })
export class CardLibraryService {
  readonly apiConfigured = true;
  private readonly fallbackTrainerCards: CardTemplate[] = [
    {
      id: 'potion-fallback',
      name: 'Potion',
      cardType: 'trainer',
      element: 'normal',
      description: 'Heal the active Pokémon and gain +8 attack.',
      power: 0,
      rarity: 'uncommon'
    },
    {
      id: 'switch-fallback',
      name: 'Switch',
      cardType: 'trainer',
      element: 'normal',
      description: 'Recover and reposition the active Pokémon.',
      power: 0,
      rarity: 'common'
    },
    {
      id: 'bill-fallback',
      name: 'Bill',
      cardType: 'trainer',
      element: 'normal',
      description: 'Draw another tactical advantage.',
      power: 0,
      rarity: 'common'
    },
    {
      id: 'professor-oak-fallback',
      name: 'Professor Oak',
      cardType: 'trainer',
      element: 'normal',
      description: 'Strengthen the active Pokémon with expert guidance.',
      power: 0,
      rarity: 'uncommon'
    }
  ];

  private readonly fallbackImageUrls: Record<string, string> = {
    pikachu: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    bulbasaur: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
    charmander: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',
    squirtle: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png',
    mewtwo: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png'
  };

  private library: CardTemplate[] = [
    {
      id: 'pikachu-basic',
      name: 'Pikachu',
      cardType: 'pokemon',
      element: 'lightning',
      imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
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
      imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
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
      imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',
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
      imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png',
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
      imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
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
    if (normalized === 'pokémon' || normalized === 'pokemon') {
      return 'pokemon';
    }
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

  private normalizeAttackDamage(value?: string | number) {
    const damage = Number(String(value || '0').replace(/[^0-9]/g, ''));
    return damage || 10;
  }

  private async mapApiPokemon(pokemon: any): Promise<CardTemplate> {
    const primaryType = pokemon.types?.[0]?.type?.name || 'normal';
    const moveDetails = await Promise.all((pokemon.moves || []).slice(0, 4).map((move: any) => this.http.get<any>(move.move.url).toPromise()));
    const moves: Attack[] = moveDetails.map((move: any): Attack => ({
      name: this.toTitleCase(move.name || 'Move'),
      cost: [this.normalizeElement(move.type?.name || primaryType)],
      damage: Number(move.power || 0),
      description: move.effect_entries?.find((entry: any) => entry.language?.name === 'en')?.short_effect || `${this.toTitleCase(move.name || 'Move')} move from PokeAPI.`
    }));
    const imageUrl = pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default;
    const baseAttack = Number(pokemon.stats?.find((stat: any) => stat.stat?.name === 'attack')?.base_stat || 20);

    return {
      id: `pokeapi-${pokemon.id}`,
      name: this.toTitleCase(pokemon.name),
      cardType: 'pokemon',
      element: this.normalizeElement(primaryType),
      imageUrl,
      hp: Number(pokemon.stats?.find((stat: any) => stat.stat?.name === 'hp')?.base_stat || 60),
      abilities: (pokemon.abilities || []).map((ability: any) => this.toTitleCase(ability.ability?.name || '')).filter(Boolean),
      height: Number(pokemon.height || 0) / 10,
      weight: Number(pokemon.weight || 0) / 10,
      baseAttack,
      description: `${this.toTitleCase(pokemon.name)} from PokeAPI.`,
      attackNames: moves.map(move => move.name),
      attacks: moves,
      power: moves[0]?.damage || 10,
      rarity: 'common'
    };
  }

  private toTitleCase(value: string) {
    return value.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  private async loadLiveCards() {
    try {
      const cards = await this.getAll();
      if (cards.length) {
        this.library = cards;
      }
    } catch {
      this.library = [...this.library];
    }
  }

  private fetchPokemonList(limit = 250, offset = 0) {
    return this.http.get<any>(`${POKE_API_URL}/pokemon`, { params: { limit, offset } });
  }

  private fetchPokemon(name: string) {
    return this.http.get<any>(`${POKE_API_URL}/pokemon/${name.toLowerCase()}`);
  }

  private async loadPokemonDetails(names: string[]) {
    const details = await Promise.all(names.map(name => this.fetchPokemon(name).toPromise()));
    return Promise.all(details.map(pokemon => this.mapApiPokemon(pokemon)));
  }

  async getAll() {
    try {
      const result = await this.fetchPokemonList().toPromise();
      const cards = await this.loadPokemonDetails((result?.results || []).map((pokemon: any) => pokemon.name));
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
      const result = await this.fetchPokemonList(2000).toPromise();
      const matchingNames = (result?.results || [])
        .map((pokemon: any) => pokemon.name)
        .filter((name: string) => !cleanQuery || name.includes(cleanQuery.toLowerCase()));
      const cards = await this.loadPokemonDetails(matchingNames);
      if (cards.length) {
        this.library = cards;
        return [...cards];
      }
    } catch {
      // Fall back to local library if the live API is unavailable.
    }

    return this.library.filter(card => !cleanQuery || card.name.toLowerCase().includes(cleanQuery.toLowerCase()));
  }

  async getRandomPokemonCards(count = 5): Promise<CardTemplate[]> {
    try {
      const result = await this.fetchPokemonList(2000).toPromise();
      const names = (result?.results || [])
        .map((pokemon: any) => pokemon.name)
        .sort(() => Math.random() - 0.5)
        .slice(0, count);
      return await this.loadPokemonDetails(names);
    } catch {
      return this.library.filter(card => card.cardType === 'pokemon').sort(() => Math.random() - 0.5).slice(0, count);
    }
  }

  async getRandomTrainerCard(): Promise<CardTemplate> {
    try {
      const result = await this.http.get<any>(`${POKE_API_URL}/item`, { params: { limit: 2000, offset: 0 } }).toPromise();
      const names = (result?.results || []).map((item: any) => item.name).sort(() => Math.random() - 0.5);
      const item = await this.http.get<any>(`${POKE_API_URL}/item/${names[0]}`).toPromise();
      return {
        id: `pokeapi-item-${item.id}`,
        name: this.toTitleCase(item.name),
        cardType: 'trainer',
        element: 'normal',
        imageUrl: item.sprites?.default,
        description: item.effect_entries?.find((entry: any) => entry.language?.name === 'en')?.short_effect || 'Use this item to boost the active Pokémon.',
        power: 0,
        rarity: 'common'
      };
    } catch {
      // Use a local trainer-like fallback if PokeAPI item data is unavailable.
    }

    const fallbackPool = this.fallbackTrainerCards;
    return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  }

  async getExpansions(): Promise<any[]> {
    return [];
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
