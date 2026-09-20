import { BattleService } from './battle.service';

describe('BattleService', () => {
  it('creates a battle that can enter the player main phase', () => {
    const service = new BattleService();
    const initial = service.createInitialBattle();
    const ready = service.startTurn(initial, 'player');

    expect(initial.phase).toBe('start');
    expect(ready.phase).toBe('main');
    expect(ready.turnOwner).toBe('player');
    expect(service.canUseMove(ready.player.active, ready.player.active?.moves[0] || null)).toBeTrue();
  });

  it('applies a player attack during a playable turn', () => {
    const service = new BattleService();
    const ready = service.startTurn(service.createInitialBattle(), 'player');
    const next = service.attackWithMove(ready, 'player', ready.player.active!.moves[0].name);

    expect(next.opponent.active!.hp).toBeLessThan(60);
    expect(next.turnActions.attacksUsed).toBe(1);
  });

  it('uses the selected Pokémon card attacks as battle moves', () => {
    const service = new BattleService();
    const battle = service.createInitialBattle([{
      cardType: 'pokemon',
      name: 'API Pikachu',
      hp: 70,
      element: 'lightning',
      stage: 'basic',
      attacks: [{
        name: 'Thunder Jolt',
        cost: ['lightning', 'normal'],
        damage: 40,
        description: 'A real card attack.'
      }]
    }]);

    expect(battle.player.active?.moves[0].name).toBe('Thunder Jolt');
    expect(battle.player.active?.moves[0].damage).toBe(40);
    expect(battle.player.active?.moves[0].damageText).toBeUndefined();
    expect(battle.player.active?.moves[0].description).toBe('A real card attack.');
  });

  it('draws up to five Pokémon for both players', () => {
    const service = new BattleService();
    const cards = Array.from({ length: 6 }, (_, index) => ({
      cardType: 'pokemon' as const,
      name: `Deck Pokemon ${index}`,
      hp: 60,
      element: 'fire' as const,
      stage: 'basic' as const,
      attacks: []
    }));
    const battle = service.createInitialBattle(cards);

    expect(battle.player.bench.length).toBe(4);
    expect(battle.opponent.bench.length).toBe(4);
    expect(battle.player.bench.length + 1).toBeLessThanOrEqual(5);
    expect(battle.opponent.bench.length + 1).toBeLessThanOrEqual(5);
  });

  it('uses a supplied second deck for Player 2', () => {
    const service = new BattleService();
    const playerTwoCards = [{
      cardType: 'pokemon' as const,
      name: 'Player Two Charizard',
      hp: 120,
      element: 'fire' as const,
      stage: 'basic' as const,
      attacks: []
    }];
    const battle = service.createInitialBattle([], playerTwoCards);

    expect(battle.opponent.active?.name).toBe('Player Two Charizard');
  });
});
