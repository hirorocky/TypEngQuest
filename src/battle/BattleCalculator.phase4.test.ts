import { BattleCalculator } from './BattleCalculator';
import { Skill } from './Skill';
import { Enemy } from './Enemy';

describe('BattleCalculator Phase 4: 3層判定システム', () => {
  describe('スキル成功率判定', () => {
    it('スキル全体の成功率を計算する', () => {
      const playerAgility = 100;
      const typingScore = 120; // 120%のタイピング評価

      const skillSuccessRate = {
        baseRate: 80,
        agilityInfluence: 1.0,
        typingInfluence: 1.5,
      };

      const result = BattleCalculator.calculateSkillSuccessRate(
        skillSuccessRate,
        playerAgility,
        typingScore
      );

      // 期待値: 80 + (100 * 1.0) + (20 * 1.5) = 210% → 100%上限
      expect(result).toBe(100);
    });

    it('スキル成功率の上限と下限を適用する', () => {
      const playerAgility = 50;
      const typingScore = 80;

      const skillSuccessRate = {
        baseRate: 90,
        agilityInfluence: 0.5,
        typingInfluence: 1.0,
      };

      const result = BattleCalculator.calculateSkillSuccessRate(
        skillSuccessRate,
        playerAgility,
        typingScore
      );

      // 期待値: 90 + (50 * 0.5) + (-20 * 1.0) = 95%
      expect(result).toBe(95);
    });
  });

  describe('物理・魔法回避判定', () => {
    let enemy: Enemy;

    beforeEach(() => {
      enemy = new Enemy({
        id: 'test_enemy',
        name: 'Test Enemy',
        description: 'Test',
        level: 5,
        stats: {
          maxHp: 100,
          strength: 20,
          willpower: 15,
          agility: 80,
          fortune: 10,
        },
        physicalEvadeRate: 25,
        magicalEvadeRate: 10,
      });
    });

    it('物理攻撃の回避判定を行う', () => {
      const isEvaded = BattleCalculator.isSkillEvaded('physical', enemy);
      expect(typeof isEvaded).toBe('boolean');
    });

    it('魔法攻撃の回避判定を行う', () => {
      const isEvaded = BattleCalculator.isSkillEvaded('magical', enemy);
      expect(typeof isEvaded).toBe('boolean');
    });
  });

  describe('効果成功率判定', () => {
    it('各効果の成功率を個別に判定する', () => {
      const effectSuccessRate = 90;
      const result = BattleCalculator.isEffectSuccess(effectSuccessRate);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('威力計算（ステータス影響）', () => {
    it('ステータス影響ありの威力を計算する', () => {
      const basePower = 100;
      const playerStrength = 150;
      const statInfluence = {
        stat: 'strength' as const,
        rate: 2.0,
      };

      const result = BattleCalculator.calculateEffectPower(
        basePower,
        { strength: playerStrength, willpower: 100, agility: 100, fortune: 100 },
        statInfluence
      );

      // 期待値: 100 + (150 * 2.0) = 400
      expect(result).toBe(400);
    });

    it('ステータス影響なしの固定威力を計算する', () => {
      const basePower = 80;
      const playerStats = { strength: 150, willpower: 100, agility: 100, fortune: 100 };

      const result = BattleCalculator.calculateEffectPower(basePower, playerStats);

      // ステータス影響なし = 固定威力
      expect(result).toBe(80);
    });

    it('異なるステータスの影響を計算する', () => {
      const basePower = 50;
      const playerWillpower = 120;
      const statInfluence = {
        stat: 'willpower' as const,
        rate: 1.8,
      };

      const result = BattleCalculator.calculateEffectPower(
        basePower,
        { strength: 100, willpower: playerWillpower, agility: 100, fortune: 100 },
        statInfluence
      );

      // 期待値: 50 + (120 * 1.8) = 266
      expect(result).toBe(266);
    });
  });

  describe('クリティカル率計算（新仕様）', () => {
    it('スキルのクリティカル率設定を使用する', () => {
      const playerFortune = 80;
      const criticalRate = {
        baseRate: 15,
        fortuneInfluence: 0.8,
      };

      const result = BattleCalculator.calculateSkillCriticalRate(criticalRate, playerFortune);

      // 期待値: 15 + (80 * 0.8) = 79%
      expect(result).toBe(79);
    });

    it('クリティカル率の上限を適用する', () => {
      const playerFortune = 200; // 高いFortune値
      const criticalRate = {
        baseRate: 30,
        fortuneInfluence: 1.0,
      };

      const result = BattleCalculator.calculateSkillCriticalRate(criticalRate, playerFortune);

      // 上限95%を適用
      expect(result).toBe(95);
    });
  });

  describe('3層統合判定', () => {
    let testSkill: Skill;
    let enemy: Enemy;
    let playerStats: { strength: number; willpower: number; agility: number; fortune: number };

    beforeEach(() => {
      testSkill = {
        id: 'fire_blast',
        name: 'Fire Blast',
        description: 'A magical fire attack',
        skillType: 'magical',
        mpCost: 15,
        mpCharge: 0,
        actionCost: 1,
        target: 'enemy',
        typingDifficulty: 3,
        skillSuccessRate: {
          baseRate: 75,
          agilityInfluence: 1.0,
          typingInfluence: 1.5,
        },
        criticalRate: {
          baseRate: 10,
          fortuneInfluence: 0.5,
        },
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            basePower: 120,
            powerInfluence: {
              stat: 'willpower',
              rate: 2.5,
            },
            successRate: 95,
          },
        ],
      };

      enemy = new Enemy({
        id: 'fire_golem',
        name: 'Fire Golem',
        description: 'A golem made of fire',
        level: 8,
        stats: {
          maxHp: 200,
          strength: 30,
          willpower: 25,
          agility: 60,
          fortune: 5,
        },
        physicalEvadeRate: 15,
        magicalEvadeRate: 20,
      });

      playerStats = {
        strength: 80,
        willpower: 140,
        agility: 110,
        fortune: 65,
      };
    });

    it('3層判定システム全体の結果を返す', () => {
      const typingScore = 110;

      const result = BattleCalculator.executeThreeLayerJudgment(
        testSkill,
        enemy,
        playerStats,
        typingScore
      );

      expect(result).toHaveProperty('skillSuccess');
      expect(result).toHaveProperty('evaded');
      expect(result).toHaveProperty('effectResults');
      expect(result).toHaveProperty('finalDamage');
      expect(result).toHaveProperty('isCritical');

      expect(typeof result.skillSuccess).toBe('boolean');
      expect(typeof result.evaded).toBe('boolean');
      expect(Array.isArray(result.effectResults)).toBe(true);
      expect(typeof result.finalDamage).toBe('number');
      expect(typeof result.isCritical).toBe('boolean');
    });

    it('スキル失敗時は後続処理をスキップする', () => {
      // 成功率を0にして確実に失敗させる
      const failSkill = {
        ...testSkill,
        skillSuccessRate: {
          baseRate: 0,
          agilityInfluence: 0,
          typingInfluence: 0,
        },
      };

      // Math.randomをモックして確実に失敗させる（0%成功率に対して99を返す）
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.99);

      const result = BattleCalculator.executeThreeLayerJudgment(failSkill, enemy, playerStats, 100);

      expect(result.skillSuccess).toBe(false);
      expect(result.evaded).toBe(false);
      expect(result.effectResults).toEqual([]);
      expect(result.finalDamage).toBe(0);
      expect(result.isCritical).toBe(false);

      mockRandom.mockRestore();
    });

    it('回避成功時は後続処理をスキップする', () => {
      // モックして回避を確実に成功させる
      jest.spyOn(BattleCalculator, 'isSkillEvaded').mockReturnValue(true);

      const result = BattleCalculator.executeThreeLayerJudgment(testSkill, enemy, playerStats, 100);

      expect(result.skillSuccess).toBe(true);
      expect(result.evaded).toBe(true);
      expect(result.effectResults).toEqual([]);
      expect(result.finalDamage).toBe(0);
      expect(result.isCritical).toBe(false);

      jest.restoreAllMocks();
    });
  });
});
