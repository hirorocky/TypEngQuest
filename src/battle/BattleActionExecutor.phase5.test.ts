import { BattleActionExecutor } from './BattleActionExecutor';
import { Enemy } from './Enemy';
import { Skill } from './Skill';
import { Player } from '../player/Player';
import { AccuracyRating, SpeedRating } from '../typing/types';

describe('BattleActionExecutor Phase 5: 新システム統合', () => {
  let player: Player;
  let enemy: Enemy;
  let physicalSkill: Skill;
  let magicalSkill: Skill;

  beforeEach(() => {
    // プレイヤー初期化（簡易版）
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

    // 新形式の敵（MP除去、回避率追加）
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

    // 新形式の物理スキル
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

    // 新形式の魔法スキル
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

      // executePlayerSkillが新しい3層判定システムを使用することをテスト
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

    it('敵のスキル実行でもMP制約がない', () => {
      // 敵はMPを持たないが、スキルにmpCostが設定されている場合もエラーにならない
      const result = BattleActionExecutor.executeEnemySkill(
        physicalSkill, // mpCost: 10だが、敵はMP制約なし
        enemy,
        player
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('damage');
      expect(result).toHaveProperty('isCritical');
      expect(result).toHaveProperty('message');
    });

    it('スキル失敗時の処理が正しく動作する', () => {
      // 失敗スキル（成功率0%）
      const failSkill: Skill = {
        ...physicalSkill,
        skillSuccessRate: {
          baseRate: 0,
          agilityInfluence: 0,
          typingInfluence: 0,
        },
      };

      const result = BattleActionExecutor.executePlayerSkill(failSkill, player, enemy, {
        isSuccess: true,
        accuracyRating: 'Good',
        speedRating: 'Fast',
        totalRating: 110,
        timeTaken: 1400,
        accuracy: 92,
      });

      expect(result.success).toBe(false);
      expect(result.damage).toBe(0);
      expect(result.isCritical).toBe(false);
      expect(result.message).toEqual(expect.arrayContaining([expect.stringContaining('失敗')]));
    });

    it('回避成功時の処理が正しく動作する', () => {
      // 回避スキル（100%回避）
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
        physicalEvadeRate: 100, // 物理攻撃を100%回避
        magicalEvadeRate: 0,
      });

      // BattleCalculatorをモック化して確実に回避させる
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
      expect(result.message).toEqual(expect.arrayContaining([expect.stringContaining('回避')]));

      jest.restoreAllMocks();
    });
  });
});
