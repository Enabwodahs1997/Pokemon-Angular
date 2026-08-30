import { Injectable } from '@angular/core';
import { BattleState, BattleSideState, BoardPokemon, CardElement, Move } from '../models/card.model';

@Injectable({ providedIn: 'root' })
export class BattleService {
  private createMove(name: string, element: CardElement, damage: number, description: string): Move {
    return { name, element, damage, description };
  }

  private createMon(
    id: string,
    name: string,
    hp: number,
    element: CardElement,
    attackPower: number,
    moves: Move[],
    energyAttached = 0
  ): BoardPokemon {
    return {
      id,
      name,
      hp,
      maxHp: hp,
      element,
      attackPower,
      energyAttached,
      moves,
      weakness: this.getWeakness(element),
      resistance: this.getResistance(element),
      isDefeated: false
    };
  }

  private getWeakness(element: CardElement) {
    const map: Record<CardElement, { type: CardElement; value: number }> = {
      fire: { type: 'water', value: 2 },
      water: { type: 'grass', value: 2 },
      grass: { type: 'fire', value: 2 },
      lightning: { type: 'fighting', value: 2 },
      psychic: { type: 'dark', value: 2 },
      fighting: { type: 'psychic', value: 2 },
      dark: { type: 'fairy', value: 2 },
      metal: { type: 'fire', value: 2 },
      fairy: { type: 'dark', value: 2 },
      dragon: { type: 'fairy', value: 2 },
      normal: { type: 'fighting', value: 2 }
    };
    return map[element] || undefined;
  }

  private getResistance(element: CardElement) {
    const map: Record<CardElement, { type: CardElement; value: number }> = {
      fire: { type: 'grass', value: 10 },
      water: { type: 'fire', value: 10 },
      grass: { type: 'water', value: 10 },
      lightning: { type: 'metal', value: 10 },
      psychic: { type: 'fighting', value: 10 },
      fighting: { type: 'dark', value: 10 },
      dark: { type: 'psychic', value: 10 },
      metal: { type: 'lightning', value: 10 },
      fairy: { type: 'dragon', value: 10 },
      dragon: { type: 'fairy', value: 10 },
      normal: { type: 'grass', value: 5 }
    };
    return map[element] || undefined;
  }

  createInitialBattle(): BattleState {
    const player: BattleSideState = {
      active: this.createMon('p1', 'Pikachu', 60, 'lightning', 20, [
        this.createMove('Quick Attack', 'lightning', 20, 'A fast electric strike.'),
        this.createMove('Thunderbolt', 'lightning', 35, 'A powerful electric blast.')
      ]),
      bench: [this.createMon('p2', 'Bulbasaur', 70, 'grass', 18, [
        this.createMove('Vine Whip', 'grass', 18, 'A whipping vine strike.'),
        this.createMove('Solar Beam', 'grass', 30, 'A beam of solar energy.')
      ])],
      trainerEffects: []
    };

    const opponent: BattleSideState = {
      active: this.createMon('o1', 'Charmander', 60, 'fire', 22, [
        this.createMove('Ember', 'fire', 22, 'A small but intense flame.'),
        this.createMove('Flare Blitz', 'fire', 38, 'A heavy fire charge.')
      ]),
      bench: [this.createMon('o2', 'Squirtle', 70, 'water', 19, [
        this.createMove('Bubble Pulse', 'water', 20, 'A harmless-looking burst.'),
        this.createMove('Surf', 'water', 32, 'A crushing wave.')
      ])],
      trainerEffects: []
    };

    return {
      player,
      opponent,
      currentTurn: 1,
      phase: 'start',
      winner: null,
      log: ['Battle started. Player goes first.']
    };
  }

  getActivePokemon(side: BattleSideState) {
    return side.active && !side.active.isDefeated ? side.active : side.bench.find(monster => !monster.isDefeated) || null;
  }

  getAvailableMoves(monster: BoardPokemon | null) {
    return monster ? monster.moves : [];
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

  startTurn(state: BattleState): BattleState {
    const next = structuredClone(state);
    next.phase = 'main';
    next.log = [...next.log, `Turn ${next.currentTurn} began.`];
    return next;
  }

  attachEnergy(state: BattleState, side: 'player' | 'opponent'): BattleState {
    const next = structuredClone(state);
    const battleSide = side === 'player' ? next.player : next.opponent;
    const active = this.getActivePokemon(battleSide);

    if (!active) {
      next.log = [...next.log, `${side === 'player' ? 'Player' : 'Opponent'} has no active Pokémon.`];
      return next;
    }

    active.energyAttached += 1;
    active.attackPower += 5;
    next.log = [...next.log, `${active.name} attached an energy and gained +5 attack power.`];
    return next;
  }

  playTrainerCard(state: BattleState, side: 'player' | 'opponent'): BattleState {
    const next = structuredClone(state);
    const battleSide = side === 'player' ? next.player : next.opponent;
    const active = this.getActivePokemon(battleSide);

    if (!active) {
      next.log = [...next.log, `${side === 'player' ? 'Player' : 'Opponent'} has no active Pokémon.`];
      return next;
    }

    active.hp = Math.min(active.maxHp, active.hp + 15);
    active.attackPower += 8;
    battleSide.trainerEffects = [...battleSide.trainerEffects, 'Power Boost'];
    next.log = [...next.log, `${active.name} used a trainer effect: +15 heal and +8 attack.`];
    return next;
  }

  swapActivePokemon(state: BattleState, side: 'player' | 'opponent', benchId: string): BattleState {
    const next = structuredClone(state);
    const battleSide = side === 'player' ? next.player : next.opponent;
    const selected = battleSide.bench.find(monster => monster.id === benchId);

    if (!battleSide.active || !selected) {
      next.log = [...next.log, `${side === 'player' ? 'Player' : 'Opponent'} cannot swap that Pokémon.`];
      return next;
    }

    const currentActive = battleSide.active;
    battleSide.active = selected;
    battleSide.bench = battleSide.bench.filter(monster => monster.id !== benchId);
    battleSide.bench.push(currentActive);
    next.log = [...next.log, `${selected.name} replaced ${currentActive.name} as the active Pokémon.`];
    return next;
  }

  attackWithMove(state: BattleState, attackerSide: 'player' | 'opponent', moveName: string): BattleState {
    const next = structuredClone(state);
    const attackingSide = attackerSide === 'player' ? next.player : next.opponent;
    const defendingSide = attackerSide === 'player' ? next.opponent : next.player;
    const attacker = this.getActivePokemon(attackingSide);
    const defender = this.getActivePokemon(defendingSide);

    if (!attacker || !defender) {
      next.winner = attacker ? 'player' : 'opponent';
      next.log = [...next.log, `${attackerSide === 'player' ? 'Player' : 'Opponent'} wins by knockout.`];
      return next;
    }

    const chosenMove = attacker.moves.find(move => move.name === moveName) || attacker.moves[0];
    if (!chosenMove) {
      next.log = [...next.log, `${attacker.name} has no moves available.`];
      return next;
    }

    let damage = chosenMove.damage + attacker.energyAttached * 2;
    const elementMultiplier = this.damageForElement(chosenMove.element, defender.element);
    damage = Math.round(damage * elementMultiplier);

    if (defender.weakness && defender.weakness.type === chosenMove.element) {
      damage = Math.round(damage * defender.weakness.value);
    }

    if (defender.resistance && defender.resistance.type === chosenMove.element) {
      damage = Math.max(0, damage - defender.resistance.value);
    }

    defender.hp -= damage;
    next.log = [...next.log, `${attacker.name} used ${chosenMove.name} for ${damage} damage.`];

    if (defender.hp <= 0) {
      defender.hp = 0;
      defender.isDefeated = true;
      next.log = [...next.log, `${defender.name} fainted.`];

      const replacement = defendingSide.bench.find(monster => !monster.isDefeated);
      if (replacement) {
        defendingSide.active = replacement;
        defendingSide.bench = defendingSide.bench.filter(monster => monster.id !== replacement.id);
        next.log = [...next.log, `${defender.name} was replaced by ${replacement.name}.`];
      }
    }

    const playerAlive = next.player.active && !next.player.active.isDefeated;
    const opponentAlive = next.opponent.active && !next.opponent.active.isDefeated;

    if (!playerAlive && !opponentAlive) next.winner = 'draw';
    else if (!playerAlive) next.winner = 'opponent';
    else if (!opponentAlive) next.winner = 'player';

    next.phase = next.winner ? 'end' : 'end';
    next.currentTurn += 1;
    next.log = [...next.log, `Turn ${next.currentTurn - 1} ended.`];
    return next;
  }

  resolveTurn(state: BattleState, attackerSide: 'player' | 'opponent'): BattleState {
    const next = structuredClone(state);
    const active = this.getActivePokemon(attackerSide === 'player' ? next.player : next.opponent);

    if (!active) {
      next.winner = attackerSide === 'player' ? 'opponent' : 'player';
      return next;
    }

    const move = active.moves[0];
    return this.attackWithMove(next, attackerSide, move.name);
  }
}
