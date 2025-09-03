import { BattleActionExecutor } from './BattleActionExecutor';
import { Player } from '../player/Player';
import { Enemy } from './Enemy';
import { Skill } from './Skill';
import { AccuracyRating, SpeedRating } from '../typing/types';

describe('BattleActionExecutor', () => {
  let player: Player;
  let enemy: Enemy;
  let skill: Skill;

  beforeEach(() => {
    player = new Player('Test Player');
    // プレイヤーの現在MP設定（初期は0）
    player.getBodyStats().healMP(10);

    enemy = new Enemy({
      id: 'test_enemy',
      name: 'Test Enemy',
      description: 'Test enemy',
      level: 1,
      stats: {
        maxHp: 100,
        strength: 10,
        willpower: 8,
        agility: 12,
        fortune: 5,
      },
      physicalEvadeRate: 15,
      magicalEvadeRate: 10,
      skills: [],
      drops: [],
    });

    skill = {
      id: 'test_skill',
      name: 'Test Skill',
      description: 'Test skill',
      skillType: 'physical',
      mpCost: 5,
      mpCharge: 0,
      actionCost: 1,
      target: 'enemy',
      typingDifficulty: 1,
      skillSuccessRate: {
        baseRate: 100,
        agilityInfluence: 0.1,
        typingInfluence: 0.2,
      },
      criticalRate: {
        baseRate: 5,
        fortuneInfluence: 0.1,
      },
      effects: [
        {
          type: 'damage',
          target: 'enemy',
          basePower: 1.0,
          successRate: 100,
        },
      ],
    };
  });

  describe('executePlayerSkill', () => {
    it('プレイヤーのスキルを正常に実行する', () => {
      // Math.randomを3層判定システム用に複数回の判定に対応
      // 1. スキル成功率判定, 2. 回避率判定, 3. 効果成功率判定, 4. クリティカル率判定
      const mockRandom = jest
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.01) // スキル成功（90%成功率）
        .mockReturnValueOnce(0.99) // 回避失敗（敵の回避率より高い値）
        .mockReturnValueOnce(0.01) // 効果成功（95%成功率）
        .mockReturnValueOnce(0.95); // クリティカル失敗（10%クリティカル率）

      const result = BattleActionExecutor.executePlayerSkill(skill, player, enemy);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(0);
      expect(result.message).toContain('Test Skill');

      mockRandom.mockRestore();
    });

    it('MPが不足している場合は失敗する', () => {
      const currentMP = player.getBodyStats().getCurrentMP();

      const expensiveSkill = {
        ...skill,
        mpCost: currentMP + 1, // 現在MPより1多いコスト
      };

      const result = BattleActionExecutor.executePlayerSkill(expensiveSkill, player, enemy);

      expect(result.success).toBe(false);
      expect(result.message[0]).toContain('Not enough MP');
    });

    it('タイピング結果が正しく適用される', () => {
      // Math.randomを3層判定システム用に複数回の判定に対応
      const mockRandom = jest
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.01) // スキル成功
        .mockReturnValueOnce(0.99) // 回避失敗
        .mockReturnValueOnce(0.01) // 効果成功
        .mockReturnValueOnce(0.95); // クリティカル失敗

      const typingResult = {
        speedRating: 'Fast' as const,
        accuracyRating: 'Perfect' as const,
        totalRating: 150,
        timeTaken: 1000,
        accuracy: 100,
        isSuccess: true,
      };

      const result = BattleActionExecutor.executePlayerSkill(skill, player, enemy, typingResult);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(0);

      mockRandom.mockRestore();
    });
  });

  describe('executeEnemySkill', () => {
    it('敵のスキルを正常に実行する', () => {
      // Math.randomを3層判定システム用に複数回の判定に対応
      const mockRandom = jest
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.01) // スキル成功
        .mockReturnValueOnce(0.99) // 回避失敗
        .mockReturnValueOnce(0.01) // 効果成功
        .mockReturnValueOnce(0.95); // クリティカル失敗

      const result = BattleActionExecutor.executeEnemySkill(skill, enemy, player);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(0);
      expect(result.message).toContain('Test Enemy');

      mockRandom.mockRestore();
    });
  });
});

// 追加: Phase5の新システム統合テストを本ファイルに統合
describe('BattleActionExecutor Phase 5: 新システム統合', () => {
  let player: Player;
  let enemy: Enemy;
  let physicalSkill: Skill;
  let magicalSkill: Skill;

  beforeEach(() => {
    const mockBodyStats = {
      getCurrentHP: jest.fn().mockReturnValue(100),
      getCurrentMP: jest.fn().mockReturnValue(50),
      consumeMP: jest.fn().mockReturnValue(true),
      healMP: jest.fn(),
      takeDamage: jest.fn(),
      heal: jest.fn(),
    };

    player = {
      id: 'test_player',
      name: 'Test Player',
      level: 5,
      getBodyStats: jest.fn().mockReturnValue(mockBodyStats),
      getTotalStats: jest.fn().mockReturnValue({
        strength: 120,
        willpower: 100,
        agility: 110,
        fortune: 80,
      }),
      isDefeated: jest.fn().mockReturnValue(false),
    } as any;

    enemy = new Enemy({
      id: 'test_enemy',
      name: 'Test Enemy',
      description: 'A test enemy',
      level: 5,
      stats: {
        maxHp: 150,
        strength: 100,
        willpower: 80,
        agility: 90,
        fortune: 60,
      },
      physicalEvadeRate: 20,
      magicalEvadeRate: 15,
    });

    physicalSkill = {
      id: 'sword_slash',
      name: 'Sword Slash',
      description: 'A physical sword attack',
      skillType: 'physical',
      mpCost: 10,
      mpCharge: 5,
      actionCost: 1,
      target: 'enemy',
      typingDifficulty: 2,
      skillSuccessRate: {
        baseRate: 85,
        agilityInfluence: 0.8,
        typingInfluence: 1.2,
      },
      criticalRate: {
        baseRate: 12,
        fortuneInfluence: 0.6,
      },
      effects: [
        {
          type: 'damage',
          target: 'enemy',
          basePower: 100,
          powerInfluence: {
            stat: 'strength',
            rate: 1.8,
          },
          successRate: 95,
        },
      ],
    };

    magicalSkill = {
      id: 'fire_bolt',
      name: 'Fire Bolt',
      description: 'A magical fire attack',
      skillType: 'magical',
      mpCost: 15,
      mpCharge: 3,
      actionCost: 1,
      target: 'enemy',
      typingDifficulty: 3,
      skillSuccessRate: {
        baseRate: 80,
        agilityInfluence: 0.3,
        typingInfluence: 1.8,
      },
      criticalRate: {
        baseRate: 8,
        fortuneInfluence: 0.4,
      },
      effects: [
        {
          type: 'damage',
          target: 'enemy',
          basePower: 90,
          powerInfluence: {
            stat: 'willpower',
            rate: 2.2,
          },
          successRate: 90,
        },
      ],
    };
  });

  describe('新システム統合テスト', () => {
    it('物理スキル実行で新システムを使用する', () => {
      const typingResult = {
        isSuccess: true,
        accuracyRating: 'Good' as AccuracyRating,
        speedRating: 'Fast' as SpeedRating,
        totalRating: 120,
        timeTaken: 1500,
        accuracy: 95,
      };

      const result = BattleActionExecutor.executePlayerSkill(
        physicalSkill,
        player,
        enemy,
        typingResult
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('damage');
      expect(result).toHaveProperty('isCritical');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.damage).toBe('number');
      expect(typeof result.isCritical).toBe('boolean');
      expect(Array.isArray(result.message)).toBe(true);
    });

    it('魔法スキル実行で新システムを使用する', () => {
      const typingResult = {
        isSuccess: true,
        accuracyRating: 'Perfect' as AccuracyRating,
        speedRating: 'Normal' as SpeedRating,
        totalRating: 135,
        timeTaken: 1200,
        accuracy: 98,
      };

      const result = BattleActionExecutor.executePlayerSkill(
        magicalSkill,
        player,
        enemy,
        typingResult
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('damage');
      expect(result).toHaveProperty('isCritical');
      expect(result).toHaveProperty('message');
    });

    it('回避成功時の処理が正しく動作する', () => {
      const evadeEnemy = new Enemy({
        id: 'dodge_master',
        name: 'Dodge Master',
        description: 'Perfect evasion enemy',
        level: 10,
        stats: {
          maxHp: 200,
          strength: 50,
          willpower: 50,
          agility: 200,
          fortune: 50,
        },
        physicalEvadeRate: 100,
        magicalEvadeRate: 0,
      });

      jest
        .spyOn(require('./BattleCalculator').BattleCalculator, 'executeThreeLayerJudgment')
        .mockReturnValue({
          skillSuccess: true,
          evaded: true,
          effectResults: [],
          finalDamage: 0,
          isCritical: false,
        });

      const result = BattleActionExecutor.executePlayerSkill(physicalSkill, player, evadeEnemy, {
        isSuccess: true,
        accuracyRating: 'Good',
        speedRating: 'Fast',
        totalRating: 110,
        timeTaken: 1600,
        accuracy: 89,
      });

      expect(result.success).toBe(true);
      expect(result.damage).toBe(0);
      expect(result.message).toEqual(expect.arrayContaining([expect.stringContaining('evaded')]));

      jest.restoreAllMocks();
    });
  });
});
