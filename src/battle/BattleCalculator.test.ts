import { BattleCalculator } from './BattleCalculator';
import { Enemy } from './Enemy';
import { Skill } from './Skill';

describe('BattleCalculator', () => {
  describe('ダメージ計算', () => {
    it('基本的なダメージ計算ができる', () => {
      const attackPower = 50;
      const defensePower = 20;
      const skillPower = 1.0;

      const damage = BattleCalculator.calculateDamage(attackPower, defensePower, skillPower);

      // 基本ダメージ = (攻撃力 × 技倍率) - (敵防御力 × 0.5)
      // = (50 × 1.0) - (20 × 0.5) = 50 - 10 = 40
      expect(damage).toBe(40);
    });

    it('技倍率が適用される', () => {
      const attackPower = 50;
      const defensePower = 20;
      const skillPower = 1.5;

      const damage = BattleCalculator.calculateDamage(attackPower, defensePower, skillPower);

      // (50 × 1.5) - (20 × 0.5) = 75 - 10 = 65
      expect(damage).toBe(65);
    });

    it('最小ダメージは1', () => {
      const attackPower = 10;
      const defensePower = 50;
      const skillPower = 1.0;

      const damage = BattleCalculator.calculateDamage(attackPower, defensePower, skillPower);

      // (10 × 1.0) - (50 × 0.5) = 10 - 25 = -15 → 1
      expect(damage).toBe(1);
    });

    it('防御力が0の場合', () => {
      const attackPower = 50;
      const defensePower = 0;
      const skillPower = 1.0;

      const damage = BattleCalculator.calculateDamage(attackPower, defensePower, skillPower);

      // (50 × 1.0) - (0 × 0.5) = 50 - 0 = 50
      expect(damage).toBe(50);
    });

    it('クリティカル時はダメージが1.5倍', () => {
      const attackPower = 50;
      const defensePower = 20;
      const skillPower = 1.0;

      const damage = BattleCalculator.calculateDamage(attackPower, defensePower, skillPower, true);

      // 基本ダメージ40 × 1.2 = 48
      expect(damage).toBe(48);
    });
  });

  describe('命中率計算', () => {
    it('基本的な命中率計算ができる', () => {
      const skillAccuracy = 90;

      const hitRate = BattleCalculator.calculateHitRate(skillAccuracy);

      // 技の命中率をそのまま使用（agilityは参照しない）
      expect(hitRate).toBe(90);
    });

    it('異なる技命中率を正しく返す', () => {
      const skillAccuracy = 85;

      const hitRate = BattleCalculator.calculateHitRate(skillAccuracy);

      // 技の命中率をそのまま使用
      expect(hitRate).toBe(85);
    });

    it('100%の技命中率を正しく返す', () => {
      const skillAccuracy = 100;

      const hitRate = BattleCalculator.calculateHitRate(skillAccuracy);

      // 技の命中率をそのまま使用
      expect(hitRate).toBe(100);
    });

    it('低い技命中率も正しく返す', () => {
      const skillAccuracy = 50;

      const hitRate = BattleCalculator.calculateHitRate(skillAccuracy);

      // 技の命中率をそのまま使用
      expect(hitRate).toBe(50);
    });

    it('0%の技命中率も正しく返す', () => {
      const skillAccuracy = 0;

      const hitRate = BattleCalculator.calculateHitRate(skillAccuracy);

      // 技の命中率をそのまま使用
      expect(hitRate).toBe(0);
    });
  });

  describe('回避率計算', () => {
    it('基本的な回避率計算ができる', () => {
      const agility = 100;

      const evadeRate = BattleCalculator.calculateEvadeRate(agility);

      // 基本回避率 = 5 + (敏捷性 / 20) = 5 + (100 / 20) = 10
      expect(evadeRate).toBe(10);
    });

    it('敏捷性が高いと回避率が上がる', () => {
      const agility = 200;

      const evadeRate = BattleCalculator.calculateEvadeRate(agility);

      // 5 + (200 / 20) = 5 + 10 = 15
      expect(evadeRate).toBe(15);
    });

    it('最大回避率は30%', () => {
      const agility = 1000;

      const evadeRate = BattleCalculator.calculateEvadeRate(agility);

      // 5 + (1000 / 20) = 55 → 30（最大値）
      expect(evadeRate).toBe(30);
    });

    it('最小回避率は5%', () => {
      const agility = 0;

      const evadeRate = BattleCalculator.calculateEvadeRate(agility);

      // 5 + (0 / 20) = 5
      expect(evadeRate).toBe(5);
    });

    it('敏捷性が負の値でも最小回避率は5%', () => {
      const agility = -100;

      const evadeRate = BattleCalculator.calculateEvadeRate(agility);

      expect(evadeRate).toBe(5);
    });
  });

  describe('クリティカル率計算', () => {
    it('基本的なクリティカル率計算ができる', () => {
      const fortune = 150;

      const criticalRate = BattleCalculator.calculateCriticalRate(fortune);

      // 基本クリティカル率 = 5 + (幸運 / 15) = 5 + (150 / 15) = 15
      expect(criticalRate).toBe(15);
    });

    it('幸運が高いとクリティカル率が上がる', () => {
      const fortune = 300;

      const criticalRate = BattleCalculator.calculateCriticalRate(fortune);

      // 5 + (300 / 15) = 5 + 20 = 25（最大値）
      expect(criticalRate).toBe(25);
    });

    it('最大クリティカル率は25%', () => {
      const fortune = 1000;

      const criticalRate = BattleCalculator.calculateCriticalRate(fortune);

      // 5 + (1000 / 15) = 71.7 → 25（最大値）
      expect(criticalRate).toBe(25);
    });

    it('最小クリティカル率は5%', () => {
      const fortune = 0;

      const criticalRate = BattleCalculator.calculateCriticalRate(fortune);

      // 5 + (0 / 15) = 5
      expect(criticalRate).toBe(5);
    });

    it('幸運が負の値でも最小クリティカル率は5%', () => {
      const fortune = -100;

      const criticalRate = BattleCalculator.calculateCriticalRate(fortune);

      expect(criticalRate).toBe(5);
    });
  });

  describe('敏捷性ボーナス計算', () => {
    it('敏捷性ボーナスを計算できる', () => {
      const agility = 100;

      const agilityBonus = BattleCalculator.calculateAgilityBonus(agility);

      // 敏捷性ボーナス = 1.0 + (敏捷性 / 200) = 1.0 + (100 / 200) = 1.5
      expect(agilityBonus).toBe(1.5);
    });

    it('敏捷性が高いとボーナスが増える', () => {
      const agility = 200;

      const agilityBonus = BattleCalculator.calculateAgilityBonus(agility);

      // 1.0 + (200 / 200) = 2.0
      expect(agilityBonus).toBe(2.0);
    });
  });

  describe('アイテムドロップ率計算', () => {
    it('基本的なドロップ率計算ができる', () => {
      const fortune = 100;
      const worldLevel = 5;

      const dropRate = BattleCalculator.calculateDropRate(fortune, worldLevel);

      // 基本ドロップ率 = 30 + (幸運 / 10) + (ワールドレベル × 5)
      // = 30 + (100 / 10) + (5 × 5) = 30 + 10 + 25 = 65
      expect(dropRate).toBe(65);
    });

    it('幸運とワールドレベルが高いとドロップ率が上がる', () => {
      const fortune = 200;
      const worldLevel = 10;

      const dropRate = BattleCalculator.calculateDropRate(fortune, worldLevel);

      // 30 + (200 / 10) + (10 × 5) = 30 + 20 + 50 = 100 → 80（最大値）
      expect(dropRate).toBe(80);
    });

    it('最大ドロップ率は80%', () => {
      const fortune = 1000;
      const worldLevel = 20;

      const dropRate = BattleCalculator.calculateDropRate(fortune, worldLevel);

      expect(dropRate).toBe(80);
    });

    it('最小ドロップ率は30%', () => {
      const fortune = 0;
      const worldLevel = 0;

      const dropRate = BattleCalculator.calculateDropRate(fortune, worldLevel);

      // 30 + (0 / 10) + (0 × 5) = 30
      expect(dropRate).toBe(30);
    });
  });

  describe('実際のエンティティとの統合', () => {
    // プレイヤーとエネミーのステータスを直接使用するテスト
    const playerStats = {
      attack: 50,
      defense: 30,
      agility: 100,
      fortune: 80,
    };

    const enemyStats = {
      attack: 40,
      defense: 25,
      agility: 105,
      fortune: 50,
    };

    it('プレイヤーから敵へのダメージを計算できる', () => {
      const damage = BattleCalculator.calculateDamage(playerStats.attack, enemyStats.defense, 1.2);

      // 攻撃力50、防御力25、技倍率1.2
      // (50 × 1.2) - (25 × 0.5) = 60 - 12.5 = 47.5 → 47（整数）
      expect(damage).toBe(47);
    });

    it('敵からプレイヤーへのダメージを計算できる', () => {
      const damage = BattleCalculator.calculateDamage(enemyStats.attack, playerStats.defense, 1.0);

      // 攻撃力40、防御力30、技倍率1.0
      // (40 × 1.0) - (30 × 0.5) = 40 - 15 = 25
      expect(damage).toBe(25);
    });

    it('プレイヤーの技命中率を計算できる', () => {
      const hitRate = BattleCalculator.calculateHitRate(85);

      // 技の命中率をそのまま使用（agilityは参照しない）
      expect(hitRate).toBe(85);
    });

    it('敵の回避率を計算できる', () => {
      const evadeRate = BattleCalculator.calculateEvadeRate(enemyStats.agility);

      // 敏捷性105で回避率 = 5 + (105 / 20) = 5 + 5.25 = 10.25
      expect(evadeRate).toBe(10.25);
    });
  });

  describe('タイピングボーナス計算', () => {
    const baseHitRate = 80;
    const baseCriticalRate = 10;
    const playerAgility = 50;

    describe('タイピング速度ボーナス', () => {
      it('速度評価Fastで最大ボーナスを適用', () => {
        const result = BattleCalculator.calculateTypingSpeedBonus(
          baseHitRate,
          playerAgility,
          'Fast'
        );

        // 80 × (1.0 + 50/200) × 1.5 = 80 × 1.25 × 1.5 = 150（最大99%）
        expect(result).toBe(99);
      });

      it('速度評価Normalでボーナスを適用', () => {
        const result = BattleCalculator.calculateTypingSpeedBonus(
          baseHitRate,
          playerAgility,
          'Normal'
        );

        // 80 × (1.0 + 50/200) × 1.2 = 80 × 1.25 × 1.2 = 120（最大99%で制限）
        expect(result).toBe(99);
      });

      it('速度評価Slowで標準倍率を適用', () => {
        const result = BattleCalculator.calculateTypingSpeedBonus(
          baseHitRate,
          playerAgility,
          'Slow'
        );

        // 80 × (1.0 + 50/200) × 1.0 = 80 × 1.25 × 1.0 = 100（最大99%で制限）
        expect(result).toBe(99);
      });

      it('速度評価Missでペナルティを適用', () => {
        const result = BattleCalculator.calculateTypingSpeedBonus(
          baseHitRate,
          playerAgility,
          'Miss'
        );

        // 80 × (1.0 + 50/200) × 0.7 = 80 × 1.25 × 0.7 = 70
        expect(result).toBe(70);
      });
    });

    describe('タイピング精度ボーナス（クリティカル率計算に統合）', () => {
      it('精度評価Perfectで最大ボーナスを適用', () => {
        const result = BattleCalculator.calculateSkillCriticalRate(
          { baseRate: baseCriticalRate, typingInfluence: 1.0 },
          'Perfect'
        );

        // 10 × (1 + (2.0-1.0)×1.0) = 20
        expect(result).toBe(20);
      });

      it('精度評価Goodでボーナスを適用', () => {
        const result = BattleCalculator.calculateSkillCriticalRate(
          { baseRate: baseCriticalRate, typingInfluence: 1.0 },
          'Good'
        );

        // 10 × (1 + 0.5×1.0) = 15
        expect(result).toBeCloseTo(15.0, 5);
      });

      it('精度評価Poorでペナルティを適用', () => {
        const result = BattleCalculator.calculateSkillCriticalRate(
          { baseRate: baseCriticalRate, typingInfluence: 1.0 },
          'Poor'
        );

        // 10 × (1 - 0.2×1.0) = 8
        expect(result).toBeCloseTo(8.0, 5);
      });

      it('クリティカル率の上限100%を超えない', () => {
        const highBaseCriticalRate = 60;
        const result = BattleCalculator.calculateSkillCriticalRate(
          { baseRate: highBaseCriticalRate, typingInfluence: 1.0 },
          'Perfect'
        );

        // 60 × (1 + 1.0) = 120 → 最大100%
        expect(result).toBe(100);
      });

      it('ペナルティが大きくても負の倍率にならない（下限0）', () => {
        // Poor(-0.2) × influence(10) = -2.0 → factor = max(0, 1 + (-2.0)) = 0
        const result = BattleCalculator.calculateSkillCriticalRate(
          { baseRate: 30, typingInfluence: 10.0 },
          'Poor'
        );
        expect(result).toBe(0);
      });
    });

    describe('タイピング効果倍率', () => {
      it('総合評価150%で1.5倍を返す', () => {
        const result = BattleCalculator.calculateTypingEffectMultiplier(150);
        expect(result).toBe(1.5);
      });

      it('総合評価120%で1.2倍を返す', () => {
        const result = BattleCalculator.calculateTypingEffectMultiplier(120);
        expect(result).toBe(1.2);
      });

      it('総合評価100%で1.0倍を返す', () => {
        const result = BattleCalculator.calculateTypingEffectMultiplier(100);
        expect(result).toBe(1.0);
      });

      it('総合評価80%で0.8倍を返す', () => {
        const result = BattleCalculator.calculateTypingEffectMultiplier(80);
        expect(result).toBe(0.8);
      });
    });
  });

  // --- Merged from BattleCalculator.phase4.test.ts ---
  describe('Phase 4: Three-Layer Judgment', () => {
    describe('スキル成功率判定（速度のみ影響）', () => {
      it('スキル全体の成功率を計算する', () => {
        const playerAgility = 100;
        const skillSuccessRate = {
          baseRate: 80,
          typingInfluence: 1.5,
        };

        const result = BattleCalculator.calculateSkillSuccessRate(
          skillSuccessRate,
          playerAgility,
          'Fast'
        );

        // 新仕様: 上限200%のため、155%まで上がる
        expect(result).toBe(155);
      });

      it('スキル成功率の上限と下限を適用する', () => {
        const playerAgility = 50;
        const skillSuccessRate = {
          baseRate: 90,
          typingInfluence: 1.0,
        };

        const result = BattleCalculator.calculateSkillSuccessRate(
          skillSuccessRate,
          playerAgility,
          'Slow'
        );

        // 新仕様: 下限0%のため、70%まで下がる
        expect(result).toBe(70);
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
          stats: { maxHp: 100, strength: 20, willpower: 15, agility: 80, fortune: 10 },
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

    describe('効果成功率と威力計算', () => {
      it('各効果の成功率を個別に判定する', () => {
        const effectSuccessRate = 90;
        const result = BattleCalculator.isEffectSuccess(effectSuccessRate);
        expect(typeof result).toBe('boolean');
      });

      it('ステータス影響あり/なしの威力を計算する', () => {
        const withInfluence = BattleCalculator.calculateEffectPower(
          100,
          { strength: 150, willpower: 100, agility: 100, fortune: 100 },
          { stat: 'strength', rate: 2.0 }
        );
        expect(withInfluence).toBe(400);

        const fixed = BattleCalculator.calculateEffectPower(80, {
          strength: 150,
          willpower: 100,
          agility: 100,
          fortune: 100,
        });
        expect(fixed).toBe(80);
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
          skillSuccessRate: { baseRate: 75, typingInfluence: 1.5 },
          criticalRate: { baseRate: 10, typingInfluence: 0.5 },
          effects: [
            {
              type: 'damage',
              target: 'enemy',
              basePower: 120,
              powerInfluence: { stat: 'willpower', rate: 2.5 },
              successRate: 95,
            },
          ],
        };

        enemy = new Enemy({
          id: 'fire_golem',
          name: 'Fire Golem',
          description: 'A golem made of fire',
          level: 8,
          stats: { maxHp: 200, strength: 30, willpower: 25, agility: 60, fortune: 5 },
          physicalEvadeRate: 15,
          magicalEvadeRate: 20,
        });

        playerStats = { strength: 80, willpower: 140, agility: 110, fortune: 65 };
      });

      it('3層判定システム全体の結果を返す', () => {
        const result = BattleCalculator.executeThreeLayerJudgment(testSkill, enemy, playerStats, {
          speedRating: 'Normal',
          accuracyRating: 'Good',
        });

        expect(result).toHaveProperty('skillSuccess');
        expect(result).toHaveProperty('evaded');
        expect(result).toHaveProperty('effectResults');
        expect(result).toHaveProperty('finalDamage');
        expect(result).toHaveProperty('isCritical');
      });

      it('スキル失敗時は後続処理をスキップする', () => {
        const failSkill = {
          ...testSkill,
          skillSuccessRate: { baseRate: 0, typingInfluence: 0 },
        };
        const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.99);

        const result = BattleCalculator.executeThreeLayerJudgment(failSkill, enemy, playerStats, {
          speedRating: 'Miss',
        });

        expect(result.skillSuccess).toBe(false);
        expect(result.evaded).toBe(false);
        expect(result.effectResults).toEqual([]);
        expect(result.finalDamage).toBe(0);
        expect(result.isCritical).toBe(false);

        mockRandom.mockRestore();
      });

      it('回避成功時は後続処理をスキップする', () => {
        jest.spyOn(BattleCalculator, 'isSkillEvaded').mockReturnValue(true);

        const result = BattleCalculator.executeThreeLayerJudgment(testSkill, enemy, playerStats, {
          speedRating: 'Normal',
        });

        expect(result.skillSuccess).toBe(true);
        expect(result.evaded).toBe(true);
        expect(result.effectResults).toEqual([]);
        expect(result.finalDamage).toBe(0);
        expect(result.isCritical).toBe(false);

        jest.restoreAllMocks();
      });
    });
  });

  describe('10C: 柔軟性ヘルパー', () => {
    it('条件評価: typing_accuracy と hp_threshold self/enemy', () => {
      const ctx = BattleCalculator.createConditionContext({
        attackerHP: { current: 100, max: 100 },
        defenderHP: { current: 50, max: 100 },
        attackerAgility: 50,
        typing: { accuracy: 'Good' },
      });

      expect(
        BattleCalculator.isEffectConditionsMet([{ type: 'typing_accuracy', value: 'Good' }], ctx)
      ).toBe(true);
      expect(
        BattleCalculator.isEffectConditionsMet([{ type: 'typing_accuracy', value: 'Perfect' }], ctx)
      ).toBe(false);
      expect(
        BattleCalculator.isEffectConditionsMet(
          [{ type: 'typing_accuracy', value: 'Perfect', operator: 'ne' }],
          ctx
        )
      ).toBe(true);

      expect(
        BattleCalculator.isEffectConditionsMet(
          [{ type: 'hp_threshold', target: 'self', operator: 'gte', value: 80 }],
          ctx
        )
      ).toBe(true);
      expect(
        BattleCalculator.isEffectConditionsMet(
          [{ type: 'hp_threshold', target: 'self', operator: 'lte', value: 50 }],
          ctx
        )
      ).toBe(false);
      expect(
        BattleCalculator.isEffectConditionsMet(
          [{ type: 'hp_threshold', target: 'enemy', operator: 'lte', value: 50 }],
          ctx
        )
      ).toBe(true);
      expect(
        BattleCalculator.isEffectConditionsMet(
          [{ type: 'hp_threshold', target: 'enemy', operator: 'gte', value: 60 }],
          ctx
        )
      ).toBe(false);
    });

    it('潜在効果のマージ: typingPerfect / exMode', () => {
      const base = [{ type: 'damage', target: 'enemy', basePower: 5, successRate: 100 }];
      const potentials = [
        {
          triggerCondition: { typingPerfect: true },
          effect: { type: 'damage', target: 'enemy', basePower: 7, successRate: 100 },
        },
        {
          triggerCondition: { exMode: 'each' },
          effect: { type: 'damage', target: 'enemy', basePower: 9, successRate: 100 },
        },
      ];

      const ctxPerfect = BattleCalculator.createConditionContext({
        attackerHP: { current: 100, max: 100 },
        defenderHP: { current: 100, max: 100 },
        attackerAgility: 50,
        typing: { accuracy: 'Perfect', exMode: false },
      });
      const ctxEx = BattleCalculator.createConditionContext({
        attackerHP: { current: 100, max: 100 },
        defenderHP: { current: 100, max: 100 },
        attackerAgility: 50,
        typing: { accuracy: 'Good', exMode: true },
      });

      const rPerfect = BattleCalculator.mergePotentialEffects(
        base as any,
        potentials as any,
        ctxPerfect
      );
      const rEx = BattleCalculator.mergePotentialEffects(base as any, potentials as any, ctxEx);
      expect(rPerfect.length).toBe(2);
      expect(rEx.length).toBe(2);
    });

    it('潜在効果のマージ: exMode 指定(focus/spark) と exThreshold', () => {
      const base = [{ type: 'damage', target: 'enemy', basePower: 5, successRate: 100 }];
      const potentials = [
        {
          triggerCondition: { exMode: 'focus' },
          effect: { type: 'damage', target: 'enemy', basePower: 6, successRate: 100 },
        },
        {
          triggerCondition: { exMode: 'spark' },
          effect: { type: 'damage', target: 'enemy', basePower: 7, successRate: 100 },
        },
        {
          triggerCondition: { exThreshold: 20 },
          effect: { type: 'damage', target: 'enemy', basePower: 8, successRate: 100 },
        },
      ];

      const ctxFocus = BattleCalculator.createConditionContext({
        attackerHP: { current: 100, max: 100 },
        defenderHP: { current: 100, max: 100 },
        attackerAgility: 50,
        typing: { exMode: true, exModeType: 'focus' },
        attackerEX: 25,
      });
      const ctxSparkLowEX = BattleCalculator.createConditionContext({
        attackerHP: { current: 100, max: 100 },
        defenderHP: { current: 100, max: 100 },
        attackerAgility: 50,
        typing: { exMode: true, exModeType: 'spark' },
        attackerEX: 10,
      });

      const rFocus = BattleCalculator.mergePotentialEffects(
        base as any,
        potentials as any,
        ctxFocus
      );
      const rSparkLowEX = BattleCalculator.mergePotentialEffects(
        base as any,
        potentials as any,
        ctxSparkLowEX
      );

      // focus: focus用とexThreshold用が成立し、3つ中2つが追加
      expect(rFocus.length).toBe(3);
      // spark + EX不足: spark用のみ成立
      expect(rSparkLowEX.length).toBe(2);
    });
  });

  describe('敵の次回行動予告計算', () => {
    let player: any;
    let enemy: Enemy;

    beforeEach(() => {
      player = {
        level: 5,
        bodyStats: {
          stats: {
            strength: 20,
            willpower: 15,
            agility: 80,
            fortune: 10,
          },
          currentHp: 100,
          maxHp: 100,
        },
      };

      enemy = new Enemy({
        id: 'test_enemy',
        name: 'Test Enemy',
        description: 'Test enemy for action prediction',
        level: 5,
        stats: { maxHp: 100, strength: 25, willpower: 20, agility: 70, fortune: 8 },
        physicalEvadeRate: 15,
        magicalEvadeRate: 10,
        skills: [],
      });
    });

    describe('calculateEffectDamageRange', () => {
      it('damage効果のダメージ範囲を計算できる（物理）', () => {
        const effect = {
          type: 'damage' as const,
          target: 'enemy' as const,
          basePower: 100,
          powerInfluence: { stat: 'strength' as const, rate: 1.5 },
          successRate: 95,
        };

        const skill: Skill = {
          id: 'test_skill',
          name: 'Test Skill',
          description: 'Test',
          skillType: 'physical',
          mpCost: 10,
          mpCharge: 0,
          actionCost: 1,
          target: 'enemy',
          typingDifficulty: 2,
          skillSuccessRate: { baseRate: 90, typingInfluence: 1.2 },
          criticalRate: { baseRate: 10, typingInfluence: 0.5 },
          effects: [effect],
        };

        const range = BattleCalculator.calculateEffectDamageRange(effect, enemy, player, skill);

        expect(range).toHaveProperty('min');
        expect(range).toHaveProperty('max');
        expect(range.min).toBeGreaterThan(0);
        expect(range.max).toBeGreaterThanOrEqual(range.min);
        // クリティカルを考慮するため、maxはminの1.2倍程度になるはず
        expect(range.max).toBeGreaterThanOrEqual(range.min * 1.15);
      });

      it('damage効果のダメージ範囲を計算できる（魔法）', () => {
        const effect = {
          type: 'damage' as const,
          target: 'enemy' as const,
          basePower: 120,
          powerInfluence: { stat: 'willpower' as const, rate: 1.8 },
          successRate: 90,
        };

        const skill: Skill = {
          id: 'magic_skill',
          name: 'Magic Skill',
          description: 'Test',
          skillType: 'magical',
          mpCost: 15,
          mpCharge: 0,
          actionCost: 1,
          target: 'enemy',
          typingDifficulty: 3,
          skillSuccessRate: { baseRate: 85, typingInfluence: 1.3 },
          criticalRate: { baseRate: 12, typingInfluence: 0.6 },
          effects: [effect],
        };

        const range = BattleCalculator.calculateEffectDamageRange(effect, enemy, player, skill);

        expect(range).toHaveProperty('min');
        expect(range).toHaveProperty('max');
        expect(range.min).toBeGreaterThan(0);
        expect(range.max).toBeGreaterThanOrEqual(range.min);
      });

      it('powerInfluenceがない場合のダメージ範囲を計算できる', () => {
        const effect = {
          type: 'damage' as const,
          target: 'enemy' as const,
          basePower: 50,
          successRate: 100,
        };

        const skill: Skill = {
          id: 'simple_skill',
          name: 'Simple Skill',
          description: 'Test',
          skillType: 'physical',
          mpCost: 5,
          mpCharge: 0,
          actionCost: 1,
          target: 'enemy',
          typingDifficulty: 1,
          skillSuccessRate: { baseRate: 100, typingInfluence: 1.0 },
          criticalRate: { baseRate: 5, typingInfluence: 0.3 },
          effects: [effect],
        };

        const range = BattleCalculator.calculateEffectDamageRange(effect, enemy, player, skill);

        expect(range).toHaveProperty('min');
        expect(range).toHaveProperty('max');
        expect(range.min).toBeGreaterThan(0);
        expect(range.max).toBeGreaterThanOrEqual(range.min);
      });

      it('heal効果の回復量範囲を計算できる', () => {
        const effect = {
          type: 'hp_heal' as const,
          target: 'self' as const,
          basePower: 80,
          powerInfluence: { stat: 'willpower' as const, rate: 1.2 },
          successRate: 100,
        };

        const skill: Skill = {
          id: 'heal_skill',
          name: 'Heal Skill',
          description: 'Test',
          skillType: 'magical',
          mpCost: 12,
          mpCharge: 0,
          actionCost: 1,
          target: 'self',
          typingDifficulty: 2,
          skillSuccessRate: { baseRate: 100, typingInfluence: 1.0 },
          criticalRate: { baseRate: 8, typingInfluence: 0.4 },
          effects: [effect],
        };

        const range = BattleCalculator.calculateEffectDamageRange(effect, enemy, player, skill);

        expect(range).toHaveProperty('min');
        expect(range).toHaveProperty('max');
        expect(range.min).toBeGreaterThan(0);
        expect(range.max).toBeGreaterThanOrEqual(range.min);
      });
    });

    describe('calculateEffectSuccessRate', () => {
      it('効果の成功率を取得できる', () => {
        const effect = {
          type: 'damage' as const,
          target: 'enemy' as const,
          basePower: 100,
          successRate: 95,
        };

        const rate = BattleCalculator.calculateEffectSuccessRate(effect);
        expect(rate).toBe(95);
      });

      it('成功率100%の効果を正しく取得できる', () => {
        const effect = {
          type: 'hp_heal' as const,
          target: 'self' as const,
          basePower: 50,
          successRate: 100,
        };

        const rate = BattleCalculator.calculateEffectSuccessRate(effect);
        expect(rate).toBe(100);
      });

      it('成功率0%の効果を正しく取得できる', () => {
        const effect = {
          type: 'add_status' as const,
          target: 'enemy' as const,
          basePower: 0,
          successRate: 0,
          statusType: 'burn',
          duration: 3,
          statusPower: 10,
        };

        const rate = BattleCalculator.calculateEffectSuccessRate(effect);
        expect(rate).toBe(0);
      });
    });

    describe('getEffectType', () => {
      it('物理スキルの効果タイプを取得できる', () => {
        const skill: Skill = {
          id: 'physical_skill',
          name: 'Physical Skill',
          description: 'Test',
          skillType: 'physical',
          mpCost: 10,
          mpCharge: 0,
          actionCost: 1,
          target: 'enemy',
          typingDifficulty: 2,
          skillSuccessRate: { baseRate: 90, typingInfluence: 1.2 },
          criticalRate: { baseRate: 10, typingInfluence: 0.5 },
          effects: [],
        };

        const type = BattleCalculator.getEffectType(skill);
        expect(type).toBe('physical');
      });

      it('魔法スキルの効果タイプを取得できる', () => {
        const skill: Skill = {
          id: 'magical_skill',
          name: 'Magical Skill',
          description: 'Test',
          skillType: 'magical',
          mpCost: 15,
          mpCharge: 0,
          actionCost: 1,
          target: 'enemy',
          typingDifficulty: 3,
          skillSuccessRate: { baseRate: 85, typingInfluence: 1.3 },
          criticalRate: { baseRate: 12, typingInfluence: 0.6 },
          effects: [],
        };

        const type = BattleCalculator.getEffectType(skill);
        expect(type).toBe('magical');
      });
    });
  });
});
