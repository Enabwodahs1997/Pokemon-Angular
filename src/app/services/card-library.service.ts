import { Injectable } from '@angular/core';
import { CardTemplate } from '../models/card.model';

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

  getAll() {
    return [...this.library];
  }

  search(query: string) {
    const q = query.toLowerCase();
    return this.library.filter(card => card.name.toLowerCase().includes(q));
  }

  getById(id: string) {
    return this.library.find(card => card.id === id) || null;
  }
}
