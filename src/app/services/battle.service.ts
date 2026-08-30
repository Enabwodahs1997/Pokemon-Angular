import { Injectable } from '@angular/core';
import { BattleState, BattleSideState, BoardPokemon, BattleLogEntry, CardElement, Move, TurnActionState } from '../models/card.model';

@Injectable({ providedIn: 'root' })
export class BattleService {
  private createLogEntry(message: string, type: BattleLogEntry['type'], side?: 'player' | 'opponent', damage?: number): BattleLogEntry {
    return { message, type, side, damage };
  }

  private createMove(name: string, element: CardElement, damage: number, description: string, cost: CardElement[] = []): Move {
    return { name, element, damage, description, cost };
  }

  private createTurnActions(): TurnActionState {
    return {
      maxAttacks: 1,
      attacksUsed: 0,
      maxEnergy: 1,
      energyUsed: 0,
      maxTrainer: 1,
      trainerUsed: 0,
      maxSwaps: 1,
      swapsUsed: 0,
      hasEndedTurn: false
    };
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
        this.createMove('Quick Attack', 'lightning', 20, 'A fast electric strike.', ['lightning']),
        this.createMove('Thunderbolt', 'lightning', 35, 'A powerful electric blast.', ['lightning', 'lightning'])
      ], 2),
      bench: [this.createMon('p2', 'Bulbasaur', 70, 'grass', 18, [
        this.createMove('Vine Whip', 'grass', 18, 'A whipping vine strike.', ['grass']),
        this.createMove('Solar Beam', 'grass', 30, 'A beam of solar energy.', ['grass', 'grass'])
      ], 2)],
      trainerEffects: []
    };

    const opponent: BattleSideState = {
      active: this.createMon('o1', 'Charmander', 60, 'fire', 22, [
        this.createMove('Ember', 'fire', 22, 'A small but intense flame.', ['fire']),
        this.createMove('Flare Blitz', 'fire', 38, 'A heavy fire charge.', ['fire', 'fire'])
      ], 2),
      bench: [this.createMon('o2', 'Squirtle', 70, 'water', 19, [
        this.createMove('Bubble Pulse', 'water', 20, 'A harmless-looking burst.', ['water']),
        this.createMove('Surf', 'water', 32, 'A crushing wave.', ['water', 'water'])
      ], 2)],
      trainerEffects: []
    };

    return {
      player,
      opponent,
      currentTurn: 1,
      turnOwner: 'player',
      phase: 'start',
      turnActions: this.createTurnActions(),
      winner: null,
      log: [this.createLogEntry('Battle started. Player goes first.', 'info', 'player')]
    };
  }

  getActivePokemon(side: BattleSideState) {
    return side.active && !side.active.isDefeated ? side.active : side.bench.find(monster => !monster.isDefeated) || null;
  }

  getAvailableMoves(monster: BoardPokemon | null) {
    return monster ? monster.moves : [];
  }

  canUseMove(monster: BoardPokemon | null, move: Move | null) {
    if (!monster || !move) {
      return false;
    }

    return monster.energyAttached >= move.cost.length;
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

  startTurn(state: BattleState, side: 'player' | 'opponent' = 'player'): BattleState {
    const next = structuredClone(state);
    if (next.winner) {
      return next;
    }

    next.turnOwner = side;
    next.phase = 'main';
    next.turnActions = this.createTurnActions();
    next.log = [...next.log, this.createLogEntry(`${side === 'player' ? 'Player' : 'Opponent'} turn started.`, 'turn', side)];
    return next;
  }

  endTurn(state: BattleState, side: 'player' | 'opponent' = 'player'): BattleState {
    const next = structuredClone(state);
    if (next.winner) {
      return next;
    }

    if (next.turnOwner !== side) {
      next.log = [...next.log, this.createLogEntry(`${side === 'player' ? 'Player' : 'Opponent'} cannot end the turn right now.`, 'status', side)];
      return next;
    }

    const nextSide = side === 'player' ? 'opponent' : 'player';
    next.turnActions.hasEndedTurn = true;
    next.phase = 'end';
    next.turnOwner = nextSide;
    if (side === 'player') {
      next.currentTurn += 1;
    }
    next.log = [...next.log, this.createLogEntry(`${side === 'player' ? 'Player' : 'Opponent'} ended the turn. ${nextSide === 'player' ? 'Player' : 'Opponent'} turn begins.`, 'turn', side)];
    return next;
  }

  attachEnergy(state: BattleState, side: 'player' | 'opponent'): BattleState {
    const next = structuredClone(state);
    if (next.winner) {
      return next;
    }

    if (next.turnOwner !== side) {
      next.log = [...next.log, this.createLogEntry(`${side === 'player' ? 'Player' : 'Opponent'} cannot attach energy during the other side's turn.`, 'status', side)];
      return next;
    }

    if (next.phase !== 'main') {
      next.log = [...next.log, this.createLogEntry(`${side === 'player' ? 'Player' : 'Opponent'} must use the main phase to attach energy.`, 'status', side)];
      return next;
    }

    if (next.turnActions.energyUsed >= next.turnActions.maxEnergy) {
      next.log = [...next.log, this.createLogEntry(`${side === 'player' ? 'Player' : 'Opponent'} has already attached energy this turn.`, 'status', side)];
      return next;
    }

    const battleSide = side === 'player' ? next.player : next.opponent;
    const active = this.getActivePokemon(battleSide);

    if (!active) {
      next.log = [...next.log, this.createLogEntry(`${side === 'player' ? 'Player' : 'Opponent'} has no active Pokémon.`, 'status', side)];
      return next;
    }

    active.energyAttached += 1;
    active.attackPower += 5;
    next.turnActions.energyUsed += 1;
    next.log = [...next.log, this.createLogEntry(`${active.name} attached an energy and gained +5 attack power.`, 'status', side)];
    return next;
  }

  playTrainerCard(state: BattleState, side: 'player' | 'opponent'): BattleState {
    const next = structuredClone(state);
    if (next.winner) {
      return next;
    }

    if (next.turnOwner !== side) {
      next.log = [...next.log, this.createLogEntry(`${side === 'player' ? 'Player' : 'Opponent'} cannot play a trainer during the other side's turn.`, 'status', side)];
      return next;
    }

    if (next.phase !== 'main') {
      next.log = [...next.log, this.createLogEntry(`${side === 'player' ? 'Player' : 'Opponent'} must play trainer cards during the main phase.`, 'status', side)];
      return next;
    }

    if (next.turnActions.trainerUsed >= next.turnActions.maxTrainer) {
      next.log = [...next.log, this.createLogEntry(`${side === 'player' ? 'Player' : 'Opponent'} has already used a trainer action this turn.`, 'status', side)];
      return next;
    }

    const battleSide = side === 'player' ? next.player : next.opponent;
    const active = this.getActivePokemon(battleSide);

    if (!active) {
      next.log = [...next.log, this.createLogEntry(`${side === 'player' ? 'Player' : 'Opponent'} has no active Pokémon.`, 'status', side)];
      return next;
    }

    active.hp = Math.min(active.maxHp, active.hp + 15);
    active.attackPower += 8;
    battleSide.trainerEffects = [...battleSide.trainerEffects, 'Power Boost'];
    next.turnActions.trainerUsed += 1;
    next.log = [...next.log, this.createLogEntry(`${active.name} used a trainer effect: +15 heal and +8 attack.`, 'heal', side)];
    return next;
  }

  swapActivePokemon(state: BattleState, side: 'player' | 'opponent', benchId: string): BattleState {
    const next = structuredClone(state);
    if (next.winner) {
      return next;
    }

    if (next.turnOwner !== side) {
      next.log = [...next.log, this.createLogEntry(`${side === 'player' ? 'Player' : 'Opponent'} cannot swap while it is the other side's turn.`, 'status', side)];
      return next;
    }

    if (next.phase !== 'main') {
      next.log = [...next.log, this.createLogEntry(`${side === 'player' ? 'Player' : 'Opponent'} can only swap during the main phase.`, 'status', side)];
      return next;
    }

    if (next.turnActions.swapsUsed >= next.turnActions.maxSwaps) {
      next.log = [...next.log, this.createLogEntry(`${side === 'player' ? 'Player' : 'Opponent'} has already used a swap this turn.`, 'status', side)];
      return next;
    }

    const battleSide = side === 'player' ? next.player : next.opponent;
    const selected = battleSide.bench.find(monster => monster.id === benchId);

    if (!battleSide.active || !selected) {
      next.log = [...next.log, this.createLogEntry(`${side === 'player' ? 'Player' : 'Opponent'} cannot swap that Pokémon.`, 'status', side)];
      return next;
    }

    const currentActive = battleSide.active;
    battleSide.active = selected;
    battleSide.bench = battleSide.bench.filter(monster => monster.id !== benchId);
    battleSide.bench.push(currentActive);
    next.turnActions.swapsUsed += 1;
    next.log = [...next.log, this.createLogEntry(`${selected.name} replaced ${currentActive.name} as the active Pokémon.`, 'swap', side)];
    return next;
  }

  attackWithMove(state: BattleState, attackerSide: 'player' | 'opponent', moveName: string): BattleState {
    const next = structuredClone(state);
    if (next.winner) {
      return next;
    }

    if (next.turnOwner !== attackerSide) {
      next.log = [...next.log, this.createLogEntry(`${attackerSide === 'player' ? 'Player' : 'Opponent'} cannot attack on the other side's turn.`, 'status', attackerSide)];
      return next;
    }

    if (next.phase !== 'main' && next.phase !== 'attack') {
      next.log = [...next.log, this.createLogEntry(`${attackerSide === 'player' ? 'Player' : 'Opponent'} can only attack during the main or attack phase.`, 'status', attackerSide)];
      return next;
    }

    if (next.turnActions.attacksUsed >= next.turnActions.maxAttacks) {
      next.log = [...next.log, this.createLogEntry(`${attackerSide === 'player' ? 'Player' : 'Opponent'} has already attacked this turn.`, 'status', attackerSide)];
      return next;
    }

    const attackingSide = attackerSide === 'player' ? next.player : next.opponent;
    const defendingSide = attackerSide === 'player' ? next.opponent : next.player;
    const attacker = this.getActivePokemon(attackingSide);
    const defender = this.getActivePokemon(defendingSide);

    if (!attacker || !defender) {
      next.winner = attacker ? 'player' : 'opponent';
      next.log = [...next.log, this.createLogEntry(`${attackerSide === 'player' ? 'Player' : 'Opponent'} wins by knockout.`, 'status', attackerSide)];
      return next;
    }

    const chosenMove = attacker.moves.find(move => move.name === moveName) || attacker.moves[0];
    if (!chosenMove) {
      next.log = [...next.log, this.createLogEntry(`${attacker.name} has no moves available.`, 'status', attackerSide)];
      return next;
    }

    if (!this.canUseMove(attacker, chosenMove)) {
      next.log = [...next.log, this.createLogEntry(`${attacker.name} does not have enough energy to use ${chosenMove.name}.`, 'status', attackerSide)];
      return next;
    }

    const spentEnergy = Math.min(attacker.energyAttached, chosenMove.cost.length);
    attacker.energyAttached = Math.max(0, attacker.energyAttached - spentEnergy);
    next.turnActions.attacksUsed += 1;

    let damage = chosenMove.damage + spentEnergy * 2;
    const elementMultiplier = this.damageForElement(chosenMove.element, defender.element);
    damage = Math.round(damage * elementMultiplier);

    if (defender.weakness && defender.weakness.type === chosenMove.element) {
      damage = Math.round(damage * defender.weakness.value);
    }

    if (defender.resistance && defender.resistance.type === chosenMove.element) {
      damage = Math.max(0, damage - defender.resistance.value);
    }

    defender.hp -= damage;
    next.log = [...next.log, this.createLogEntry(`${attacker.name} used ${chosenMove.name}.`, 'attack', attackerSide, damage)];

    if (defender.hp <= 0) {
      defender.hp = 0;
      defender.isDefeated = true;
      next.log = [...next.log, this.createLogEntry(`${defender.name} fainted.`, 'faint', defendingSide === next.player ? 'player' : 'opponent')];

      const replacement = defendingSide.bench.find(monster => !monster.isDefeated);
      if (replacement) {
        defendingSide.active = replacement;
        defendingSide.bench = defendingSide.bench.filter(monster => monster.id !== replacement.id);
        next.log = [...next.log, this.createLogEntry(`${defender.name} was replaced by ${replacement.name}.`, 'status', defendingSide === next.player ? 'player' : 'opponent')];
      }
    }

    const playerAlive = next.player.active && !next.player.active.isDefeated;
    const opponentAlive = next.opponent.active && !next.opponent.active.isDefeated;

    if (!playerAlive && !opponentAlive) next.winner = 'draw';
    else if (!playerAlive) next.winner = 'opponent';
    else if (!opponentAlive) next.winner = 'player';

    next.phase = next.winner ? 'end' : 'end';
    next.log = [...next.log, this.createLogEntry('Attack phase complete.', 'status', attackerSide)];
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
