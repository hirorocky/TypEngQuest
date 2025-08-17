import { Player } from '../../../player/Player';
import { Battle } from '../../../battle/Battle';
import { Enemy } from '../../../battle/Enemy';

describe('Simple Integration Test', () => {
  it('バトルシステムの基本的な統合', () => {
    const player = new Player('Test Player');
    const enemy = new Enemy({
      id: 'test_enemy',
      name: 'Test Enemy',
      description: 'Test enemy for integration testing',
      level: 1,
      stats: {
        maxHp: 50,
        maxMp: 30,
        strength: 8,
        willpower: 6,
        agility: 10,
        fortune: 5,
      },
      skills: [],
      drops: [],
    });

    const battle = new Battle(player, enemy);
    battle.start();

    expect(battle.isActive).toBe(true);
    expect(typeof battle.getCurrentTurnActor).toBe('function');
    expect(typeof battle.checkBattleEnd).toBe('function');
    expect(typeof battle.calculatePlayerActionPoints).toBe('function');
  });
});