import { BattleTypingPhase } from './BattleTypingPhase';
import { Player } from '../player/Player';
import { Enemy } from '../battle/Enemy';
import { Battle } from '../battle/Battle';
import { TypingResult } from '../typing/types';

describe('BattleTypingPhase EXポイント統合', () => {
  test('タイピング結果に応じてEXポイントが加算される', async () => {
    const player = new Player('Hero');
    const enemy = new Enemy({
      id: 'e1',
      name: 'Slime',
      description: 'dummy',
      level: 1,
      stats: { maxHp: 30, strength: 5, willpower: 5, agility: 5, fortune: 5 },
      physicalEvadeRate: 5,
      magicalEvadeRate: 5,
      skills: [],
      drops: [],
    });
    const battle = new Battle(player, enemy);
    battle.start();

    const phase = new BattleTypingPhase({
      skills: [
        {
          id: 'test-skill',
          name: 'Test Skill',
          description: 'test',
          skillType: 'physical',
          mpCost: 0,
          mpCharge: 0,
          actionCost: 1,
          target: 'enemy',
          typingDifficulty: 5,
          skillSuccessRate: { baseRate: 100, typingInfluence: 0 },
          criticalRate: { baseRate: 0, typingInfluence: 0 },
          effects: [{ type: 'damage', target: 'enemy', basePower: 1, successRate: 100 }],
        },
      ],
      battle,
    });

    const before = player.getExPoints();
    expect(before).toBe(0);

    const typingResult: TypingResult = {
      speedRating: 'Fast',
      accuracyRating: 'Perfect',
      totalRating: 150,
      timeTaken: 1000,
      accuracy: 100,
      isSuccess: true,
    };

    // プライベートメソッドを直接呼び出し（テスト用）
    await (phase as any).applySkillEffect((phase as any).skills[0], typingResult);

    expect(player.getExPoints()).toBe(20); // 5 × 2.0 × 2.0 = 20
  });
});
