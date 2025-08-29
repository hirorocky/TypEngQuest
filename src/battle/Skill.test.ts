import {
  Skill,
  SkillType,
  StatInfluence,
  SkillEffect,
  SkillSuccessRate,
  SkillCriticalRate,
} from './Skill';

describe('Skill', () => {
  describe('SkillType型', () => {
    test('physicalタイプが定義されている', () => {
      const skillType: SkillType = 'physical';
      expect(skillType).toBe('physical');
    });

    test('magicalタイプが定義されている', () => {
      const skillType: SkillType = 'magical';
      expect(skillType).toBe('magical');
    });
  });

  describe('StatInfluence インターフェース', () => {
    test('strength影響の StatInfluence が作成できる', () => {
      const influence: StatInfluence = {
        stat: 'strength',
        rate: 2.0,
      };

      expect(influence.stat).toBe('strength');
      expect(influence.rate).toBe(2.0);
    });

    test('willpower影響の StatInfluence が作成できる', () => {
      const influence: StatInfluence = {
        stat: 'willpower',
        rate: 1.8,
      };

      expect(influence.stat).toBe('willpower');
      expect(influence.rate).toBe(1.8);
    });

    test('agility影響の StatInfluence が作成できる', () => {
      const influence: StatInfluence = {
        stat: 'agility',
        rate: 1.5,
      };

      expect(influence.stat).toBe('agility');
      expect(influence.rate).toBe(1.5);
    });

    test('fortune影響の StatInfluence が作成できる', () => {
      const influence: StatInfluence = {
        stat: 'fortune',
        rate: 0.8,
      };

      expect(influence.stat).toBe('fortune');
      expect(influence.rate).toBe(0.8);
    });
  });

  describe('拡張された Skill インターフェース', () => {
    test('skillType を持つ物理スキルが作成できる', () => {
      const skill: Skill = {
        id: 'power_strike',
        name: 'Power Strike',
        description: '強力な物理攻撃',
        skillType: 'physical',
        mpCost: 10,
        mpCharge: 0,
        actionCost: 1,
        target: 'enemy',
        typingDifficulty: 2,
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
            basePower: 80,
            powerInfluence: {
              stat: 'strength',
              rate: 2.0,
            },
            successRate: 95,
          },
        ],
      };

      expect(skill.skillType).toBe('physical');
      expect(skill.skillSuccessRate.baseRate).toBe(75);
      expect(skill.criticalRate.fortuneInfluence).toBe(0.5);
      expect(skill.effects[0].basePower).toBe(80);
      expect(skill.effects[0].powerInfluence?.stat).toBe('strength');
    });

    test('skillType を持つ魔法スキルが作成できる', () => {
      const skill: Skill = {
        id: 'heal_spell',
        name: 'Heal Spell',
        description: '回復魔法',
        skillType: 'magical',
        mpCost: 15,
        mpCharge: 0,
        actionCost: 1,
        target: 'self',
        typingDifficulty: 3,
        skillSuccessRate: {
          baseRate: 85,
          agilityInfluence: 0.2,
          typingInfluence: 2.0,
        },
        criticalRate: {
          baseRate: 5,
          fortuneInfluence: 0.3,
        },
        effects: [
          {
            type: 'hp_heal',
            target: 'self',
            basePower: 40,
            powerInfluence: {
              stat: 'willpower',
              rate: 1.8,
            },
            successRate: 100,
          },
        ],
      };

      expect(skill.skillType).toBe('magical');
      expect(skill.effects[0].powerInfluence?.stat).toBe('willpower');
    });

    test('powerInfluence なしの固定威力スキルが作成できる', () => {
      const skill: Skill = {
        id: 'fixed_heal',
        name: 'Fixed Heal',
        description: '固定回復',
        skillType: 'magical',
        mpCost: 8,
        mpCharge: 0,
        actionCost: 1,
        target: 'self',
        typingDifficulty: 1,
        skillSuccessRate: {
          baseRate: 90,
          agilityInfluence: 0.1,
          typingInfluence: 1.0,
        },
        criticalRate: {
          baseRate: 0,
          fortuneInfluence: 0,
        },
        effects: [
          {
            type: 'hp_heal',
            target: 'self',
            basePower: 30,
            // powerInfluence なし = 固定威力
            successRate: 100,
          },
        ],
      };

      expect(skill.effects[0].basePower).toBe(30);
      expect(skill.effects[0].powerInfluence).toBeUndefined();
    });
  });

  describe('SkillSuccessRate インターフェース', () => {
    test('baseRate, agilityInfluence, typingInfluence が設定できる', () => {
      const successRate: SkillSuccessRate = {
        baseRate: 80,
        agilityInfluence: 1.2,
        typingInfluence: 1.8,
      };

      expect(successRate.baseRate).toBe(80);
      expect(successRate.agilityInfluence).toBe(1.2);
      expect(successRate.typingInfluence).toBe(1.8);
    });
  });

  describe('SkillCriticalRate インターフェース', () => {
    test('baseRate, fortuneInfluence が設定できる', () => {
      const criticalRate: SkillCriticalRate = {
        baseRate: 15,
        fortuneInfluence: 0.8,
      };

      expect(criticalRate.baseRate).toBe(15);
      expect(criticalRate.fortuneInfluence).toBe(0.8);
    });
  });

  describe('拡張された SkillEffect', () => {
    test('basePower と powerInfluence を持つダメージ効果が作成できる', () => {
      const effect: SkillEffect = {
        type: 'damage',
        target: 'enemy',
        basePower: 100,
        powerInfluence: {
          stat: 'strength',
          rate: 2.5,
        },
        successRate: 90,
      };

      expect(effect.basePower).toBe(100);
      expect(effect.powerInfluence?.stat).toBe('strength');
      expect(effect.powerInfluence?.rate).toBe(2.5);
      expect(effect.successRate).toBe(90);
    });

    test('powerInfluence なしの固定威力効果が作成できる', () => {
      const effect: SkillEffect = {
        type: 'hp_heal',
        target: 'self',
        basePower: 50,
        successRate: 100,
      };

      expect(effect.basePower).toBe(50);
      expect(effect.powerInfluence).toBeUndefined();
      expect(effect.successRate).toBe(100);
    });
  });
});
