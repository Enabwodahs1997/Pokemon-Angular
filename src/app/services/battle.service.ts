import { Injectable } from '@angular/core';
import { BattleState, BoardPokemon, CardElement } from '../models/card.model';

@Injectable({ providedIn: 'root' })
export class BattleService {
  createInitialBattle(): BattleState {
    const player: BoardPokemon[] = [
      { id: 'p1', name: 'Pikachu', hp: 60, maxHp: 60, element: 'lightning', attackPower: 20, isDefeated: false },
      { id: 'p2', name: 'Bulbasaur', hp: 70, maxHp: 70, element: 'grass', attackPower: 18, isDefeated: false }
    ];

    const opponent: BoardPokemon[] = [
      { id: 'o1', name: 'Charmander', hp: 60, maxHp: 60, element: 'fire', attackPower: 22, isDefeated: false },
      { id: 'o2', name: 'Squirtle', hp: 70, maxHp: 70, element: 'water', attackPower: 19, isDefeated: false }
    ];

    return {
      player,
      opponent,
      currentTurn: 1,
      winner: null,
      log: ['Battle started.']
    };
  }

  getNextLivingPokemon(list: BoardPokemon[]) {
    return list.find(monster => !monster.isDefeated) || null;
  }

  damageForElement(attacker: CardElement, defender: CardElement) {
    const strongAgainst: Record<CardElement, CardElement[]> = {
      fire: ['grass'],
      water: ['fire'],
      grass: ['water'],
      lightning: ['water'],
      psychic: ['fighting'],
      fighting: ['dark'],
      dark: ['psychic'],
      normal: [],
      metal: ['fairy'],
      fairy: ['dragon'],
      dragon: ['fairy']
    };

    const isStrong = strongAgainst[attacker]?.includes(defender) ?? false;
    return isStrong ? 1.5 : 1;
  }

  resolveTurn(state: BattleState, attackerSide: 'player' | 'opponent'): BattleState {
    const next = structuredClone(state);
    const attackingTeam = attackerSide === 'player' ? next.player : next.opponent;
    const defendingTeam = attackerSide === 'player' ? next.opponent : next.player;

    const attacker = this.getNextLivingPokemon(attackingTeam);
    const defender = this.getNextLivingPokemon(defendingTeam);

    if (!attacker || !defender) {
      next.winner = attacker ? 'player' : 'opponent';
      next.log = [...next.log, `${attackerSide === 'player' ? 'Player' : 'Opponent'} wins by elimination.`];
      return next;
    }

    const multiplier = this.damageForElement(attacker.element, defender.element);
    const damage = Math.max(5, Math.round(attacker.attackPower * multiplier));
    defender.hp -= damage;
    next.log = [...next.log, `${attackerSide === 'player' ? 'Player' : 'Opponent'} used ${attacker.name} for ${damage} damage.`];

    if (defender.hp <= 0) {
      defender.hp = 0;
      defender.isDefeated = true;
      next.log = [...next.log, `${defender.name} is knocked out.`];
    }

    const playerAlive = next.player.some(monster => !monster.isDefeated);
    const opponentAlive = next.opponent.some(monster => !monster.isDefeated);

    if (!playerAlive && !opponentAlive) {
      next.winner = 'draw';
    } else if (!playerAlive) {
      next.winner = 'opponent';
    } else if (!opponentAlive) {
      next.winner = 'player';
    }

    next.currentTurn += 1;
    return next;
  }
}
