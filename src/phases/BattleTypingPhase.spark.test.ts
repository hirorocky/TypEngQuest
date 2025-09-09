import { BattleTypingPhase } from './BattleTypingPhase';
import { Player } from '../player/Player';
import { Enemy } from '../battle/Enemy';
import { Battle } from '../battle/Battle';

describe('BattleTypingPhase Spark Mode', () => {
  test('単文字成功回数に応じて連続実行される', async () => {
    const player = new Player('Hero');
    const enemy = new Enemy({
      id: 'e1',
      name: 'Slime',
      description: 'dummy',
      level: 1,
      stats: { maxHp: 50, strength: 10, willpower: 5, agility: 5, fortune: 5 },
      // テスト安定化のためSparkシーケンス中の回避を0にする
      physicalEvadeRate: 0,
      magicalEvadeRate: 0,
      skills: [],
      drops: [],
    });
    const battle = new Battle(player, enemy);
    battle.start();

    const phase = new BattleTypingPhase({
      skills: [
        {
          id: 'strike',
          name: 'Strike',
          description: 'simple hit',
          skillType: 'physical',
          mpCost: 0,
          mpCharge: 0,
          actionCost: 0,
          target: 'enemy',
          typingDifficulty: 1,
          skillSuccessRate: { baseRate: 100, typingInfluence: 0 },
          criticalRate: { baseRate: 0, typingInfluence: 0 },
          effects: [{ type: 'damage', target: 'enemy', basePower: 5, successRate: 100 }],
        },
      ],
      battle,
      exMode: 'spark',
    });

    // 内部の生成と判定をモック: 3回成功→1回失敗
    (phase as any).generateSingleCharChallenges = () => ['a', 'b', 'c', 'd'];
    (phase as any).singleCharTyping = jest
      .fn()
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false });

    await phase.initialize();
    const hpBefore = enemy.currentHp;
    const result = (await phase.startInputLoop())!;
    const hpAfter = enemy.currentHp;

    expect(result?.nextPhase).toBe('battle');
    // 3回成功 → 3回分ダメージ
    expect(hpBefore - hpAfter).toBeGreaterThanOrEqual(15);
  });
});
