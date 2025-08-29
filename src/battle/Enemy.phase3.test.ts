import { Enemy } from './Enemy';

describe('Enemy Phase 3: 回避率システムとMP除去', () => {
  describe('回避率システム（物理・魔法）', () => {
    let enemy: Enemy;

    beforeEach(() => {
      enemy = new Enemy({
        id: 'agile_rogue',
        name: 'Agile Rogue',
        description: 'A nimble enemy with different evasion rates',
        level: 6,
        stats: {
          maxHp: 100,
          strength: 15,
          willpower: 12,
          agility: 120,
          fortune: 20,
        },
        physicalEvadeRate: 25,
        magicalEvadeRate: 10,
      });
    });

    it('物理回避率を持つ', () => {
      expect(enemy.physicalEvadeRate).toBe(25);
    });

    it('魔法回避率を持つ', () => {
      expect(enemy.magicalEvadeRate).toBe(10);
    });

    it('回避率が0-100範囲外の場合はエラーになる', () => {
      expect(() => {
        new Enemy({
          id: 'invalid',
          name: 'Invalid',
          description: 'Invalid',
          level: 1,
          stats: {
            maxHp: 50,
            strength: 10,
            willpower: 5,
            agility: 78,
            fortune: 5,
          },
          physicalEvadeRate: 101,
          magicalEvadeRate: 5,
        });
      }).toThrow('Evade rate must be between 0 and 100');

      expect(() => {
        new Enemy({
          id: 'invalid2',
          name: 'Invalid2',
          description: 'Invalid2',
          level: 1,
          stats: {
            maxHp: 50,
            strength: 10,
            willpower: 5,
            agility: 78,
            fortune: 5,
          },
          physicalEvadeRate: 5,
          magicalEvadeRate: -1,
        });
      }).toThrow('Evade rate must be between 0 and 100');
    });
  });

  describe('MP除去による簡素化', () => {
    let enemy: Enemy;

    beforeEach(() => {
      enemy = new Enemy({
        id: 'simple_enemy',
        name: 'Simple Enemy',
        description: 'An enemy without MP system',
        level: 3,
        stats: {
          maxHp: 80,
          strength: 12,
          willpower: 8,
          agility: 85,
          fortune: 10,
        },
        physicalEvadeRate: 15,
        magicalEvadeRate: 8,
      });
    });

    it('MPプロパティを持たない', () => {
      expect((enemy as any).currentMp).toBeUndefined();
      expect((enemy as any).maxMp).toBeUndefined();
      expect((enemy.stats as any).maxMp).toBeUndefined();
    });

    it('MP関連メソッドを持たない', () => {
      expect((enemy as any).consumeMp).toBeUndefined();
      expect((enemy as any).recoverMp).toBeUndefined();
    });

    it('技選択にMPの制限がない', () => {
      const enemyWithSkills = new Enemy({
        id: 'skill_enemy',
        name: 'Skill Enemy',
        description: 'An enemy with skills but no MP',
        level: 5,
        stats: {
          maxHp: 120,
          strength: 20,
          willpower: 15,
          agility: 95,
          fortune: 12,
        },
        physicalEvadeRate: 20,
        magicalEvadeRate: 5,
        skills: [
          {
            id: 'powerful_strike',
            name: 'Powerful Strike',
            description: 'A strong attack',
            skillType: 'physical',
            mpCost: 10,
            mpCharge: 0,
            actionCost: 1,
            target: 'enemy',
            typingDifficulty: 2,
            skillSuccessRate: {
              baseRate: 80,
              agilityInfluence: 1.0,
              typingInfluence: 1.5,
            },
            criticalRate: {
              baseRate: 15,
              fortuneInfluence: 0.8,
            },
            effects: [
              {
                type: 'damage',
                target: 'enemy',
                basePower: 120,
                powerInfluence: {
                  stat: 'strength',
                  rate: 2.0,
                },
                successRate: 95,
              },
            ],
          },
        ],
      });

      const selectedSkill = enemyWithSkills.selectSkill();
      expect(selectedSkill?.id).toBe('powerful_strike');
    });

    it('基本的なHP管理機能は維持', () => {
      expect(enemy.currentHp).toBe(80);
      expect(enemy.stats.maxHp).toBe(80);

      enemy.takeDamage(30);
      expect(enemy.currentHp).toBe(50);

      enemy.heal(20);
      expect(enemy.currentHp).toBe(70);

      expect(enemy.isDefeated()).toBe(false);
      enemy.takeDamage(80);
      expect(enemy.isDefeated()).toBe(true);
    });
  });
});
