import { Enemy } from './Enemy';
import { Skill } from './Skill';

describe('Enemy', () => {
  describe('基本情報管理', () => {
    it('基本情報を持つ敵を作成できる', () => {
      const enemy = new Enemy({
        id: 'slime_001',
        name: 'Blue Slime',
        description: 'A small, bouncy creature',
        level: 1,
        stats: {
          maxHp: 50,
          maxMp: 10,
          strength: 10,
          willpower: 5,
          agility: 78,
          fortune: 5,
        },
      });

      expect(enemy.id).toBe('slime_001');
      expect(enemy.name).toBe('Blue Slime');
      expect(enemy.description).toBe('A small, bouncy creature');
      expect(enemy.level).toBe(1);
    });

    it('レベルが負の値の場合はエラーになる', () => {
      expect(() => {
        new Enemy({
          id: 'invalid',
          name: 'Invalid Enemy',
          description: 'Invalid',
          level: -1,
          stats: {
            maxHp: 50,
            maxMp: 10,
            strength: 10,
            willpower: 5,
            agility: 78,
            fortune: 5,
          },
        });
      }).toThrow('Level must be positive');
    });
  });

  describe('ステータス管理', () => {
    let enemy: Enemy;

    beforeEach(() => {
      enemy = new Enemy({
        id: 'goblin_001',
        name: 'Forest Goblin',
        description: 'A mischievous creature',
        level: 3,
        stats: {
          maxHp: 100,
          maxMp: 20,
          strength: 15,
          willpower: 8,
          agility: 87,
          fortune: 10,
        },
      });
    });

    it('初期HPとMPは最大値と同じ', () => {
      expect(enemy.currentHp).toBe(100);
      expect(enemy.currentMp).toBe(20);
      expect(enemy.stats.maxHp).toBe(100);
      expect(enemy.stats.maxMp).toBe(20);
    });

    it('各ステータスを取得できる', () => {
      expect(enemy.stats.strength).toBe(15);
      expect(enemy.stats.willpower).toBe(8);
      expect(enemy.stats.agility).toBe(87);
      expect(enemy.stats.fortune).toBe(10);
    });

    it('ステータスは不変', () => {
      const stats = enemy.stats;
      expect(() => {
        (stats as any).strength = 999;
      }).toThrow();
    });
  });

  describe('ダメージ・回復処理', () => {
    let enemy: Enemy;

    beforeEach(() => {
      enemy = new Enemy({
        id: 'wolf_001',
        name: 'Wild Wolf',
        description: 'A fierce predator',
        level: 5,
        stats: {
          maxHp: 150,
          maxMp: 30,
          strength: 20,
          willpower: 10,
          agility: 95,
          fortune: 12,
        },
      });
    });

    it('ダメージを受けるとHPが減少する', () => {
      enemy.takeDamage(50);
      expect(enemy.currentHp).toBe(100);
    });

    it('最大HPを超えるダメージを受けても0未満にはならない', () => {
      enemy.takeDamage(200);
      expect(enemy.currentHp).toBe(0);
    });

    it('負のダメージを受けるとエラーになる', () => {
      expect(() => enemy.takeDamage(-10)).toThrow('Damage must be non-negative');
    });

    it('HP回復ができる', () => {
      enemy.takeDamage(50);
      enemy.heal(30);
      expect(enemy.currentHp).toBe(130);
    });

    it('最大HPを超えて回復しない', () => {
      enemy.takeDamage(10);
      enemy.heal(50);
      expect(enemy.currentHp).toBe(150);
    });

    it('負の値で回復しようとするとエラーになる', () => {
      expect(() => enemy.heal(-10)).toThrow('Heal amount must be non-negative');
    });

    it('MP消費ができる', () => {
      enemy.consumeMp(10);
      expect(enemy.currentMp).toBe(20);
    });

    it('MPが不足している場合はfalseを返す', () => {
      expect(enemy.consumeMp(50)).toBe(false);
      expect(enemy.currentMp).toBe(30);
    });

    it('MP回復ができる', () => {
      enemy.consumeMp(10);
      enemy.recoverMp(5);
      expect(enemy.currentMp).toBe(25);
    });

    it('最大MPを超えて回復しない', () => {
      enemy.recoverMp(50);
      expect(enemy.currentMp).toBe(30);
    });

    it('戦闘不能状態を判定できる', () => {
      expect(enemy.isDefeated()).toBe(false);
      enemy.takeDamage(150);
      expect(enemy.isDefeated()).toBe(true);
    });
  });

  describe('技リスト管理', () => {
    let enemy: Enemy;
    const mockSkill1: Skill = {
      id: 'tackle',
      name: 'Tackle',
      description: 'A basic physical attack',
      mpCost: 0,
      power: 1.2,
      accuracy: 90,
      target: 'enemy',
      element: 'physical',
      typingDifficulty: 1,
    };

    const mockSkill2: Skill = {
      id: 'fire_breath',
      name: 'Fire Breath',
      description: 'Breathes fire at the enemy',
      mpCost: 5,
      power: 1.8,
      accuracy: 85,
      target: 'enemy',
      element: 'fire',
      typingDifficulty: 3,
    };

    beforeEach(() => {
      enemy = new Enemy({
        id: 'dragon_001',
        name: 'Young Dragon',
        description: 'A small but fierce dragon',
        level: 10,
        stats: {
          maxHp: 300,
          maxMp: 50,
          strength: 35,
          willpower: 20,
          agility: 103,
          fortune: 15,
        },
        skills: [mockSkill1, mockSkill2],
      });
    });

    it('技リストを取得できる', () => {
      const skills = enemy.skills;
      expect(skills).toHaveLength(2);
      expect(skills[0]).toEqual(mockSkill1);
      expect(skills[1]).toEqual(mockSkill2);
    });

    it('技リストへの変更は元のデータに影響しない', () => {
      const skills1 = enemy.skills;
      const skills2 = enemy.skills;

      // 新しい配列が返されることを確認
      expect(skills1).not.toBe(skills2);

      // 取得した配列を変更しても元のskillsに影響しないことを確認
      (skills1 as any).push({} as Skill);
      expect(enemy.skills).toHaveLength(2); // 元のサイズのまま
    });

    it('技リストが空の敵も作成できる', () => {
      const weakEnemy = new Enemy({
        id: 'slime_002',
        name: 'Weak Slime',
        description: 'A very weak slime',
        level: 1,
        stats: {
          maxHp: 30,
          maxMp: 5,
          strength: 5,
          willpower: 2,
          agility: 65,
          fortune: 3,
        },
      });

      expect(weakEnemy.skills).toHaveLength(0);
    });

    it('使用可能な技を選択できる（AI）', () => {
      const skill = enemy.selectSkill();
      expect([mockSkill1, mockSkill2]).toContainEqual(skill);
    });

    it('MPが足りない場合は使用可能な技のみ選択する', () => {
      enemy.consumeMp(48); // MP残り2
      const skill = enemy.selectSkill();
      expect(skill).toEqual(mockSkill1); // MP0のTackleのみ使用可能
    });

    it('使用可能な技がない場合はnullを返す', () => {
      const noSkillEnemy = new Enemy({
        id: 'dummy',
        name: 'Dummy',
        description: 'No skills',
        level: 1,
        stats: {
          maxHp: 10,
          maxMp: 0,
          strength: 1,
          willpower: 1,
          agility: 51,
          fortune: 1,
        },
      });

      expect(noSkillEnemy.selectSkill()).toBeNull();
    });
  });

  describe('ドロップアイテム設定', () => {
    it('ドロップアイテム設定を持てる', () => {
      const enemy = new Enemy({
        id: 'treasure_goblin',
        name: 'Treasure Goblin',
        description: 'A goblin that hoards treasures',
        level: 5,
        stats: {
          maxHp: 80,
          maxMp: 20,
          strength: 12,
          willpower: 8,
          agility: 90,
          fortune: 30,
        },
        drops: [
          { itemId: 'potion', dropRate: 50 },
          { itemId: 'gold_coin', dropRate: 80 },
          { itemId: 'rare_gem', dropRate: 10 },
        ],
      });

      expect(enemy.drops).toHaveLength(3);
      expect(enemy.drops[0]).toEqual({ itemId: 'potion', dropRate: 50 });
    });

    it('ドロップアイテムなしでも作成できる', () => {
      const enemy = new Enemy({
        id: 'ghost',
        name: 'Ghost',
        description: 'An ethereal being',
        level: 3,
        stats: {
          maxHp: 60,
          maxMp: 30,
          strength: 8,
          willpower: 3,
          agility: 105,
          fortune: 5,
        },
      });

      expect(enemy.drops).toHaveLength(0);
    });

    it('ドロップ率が範囲外の場合はエラーになる', () => {
      expect(() => {
        new Enemy({
          id: 'invalid',
          name: 'Invalid',
          description: 'Invalid',
          level: 1,
          stats: {
            maxHp: 10,
            maxMp: 5,
            strength: 5,
            willpower: 2,
            agility: 65,
            fortune: 3,
          },
          drops: [{ itemId: 'item', dropRate: 101 }],
        });
      }).toThrow('Drop rate must be between 0 and 100');

      expect(() => {
        new Enemy({
          id: 'invalid2',
          name: 'Invalid2',
          description: 'Invalid2',
          level: 1,
          stats: {
            maxHp: 10,
            maxMp: 5,
            strength: 5,
            willpower: 2,
            agility: 65,
            fortune: 3,
          },
          drops: [{ itemId: 'item', dropRate: -1 }],
        });
      }).toThrow('Drop rate must be between 0 and 100');
    });
  });

  describe('JSON シリアライゼーション', () => {
    it('JSONに変換できる', () => {
      const enemy = new Enemy({
        id: 'orc_001',
        name: 'Mountain Orc',
        description: 'A powerful warrior',
        level: 7,
        stats: {
          maxHp: 200,
          maxMp: 25,
          strength: 28,
          willpower: 15,
          agility: 85,
          fortune: 8,
        },
        skills: [
          {
            id: 'heavy_swing',
            name: 'Heavy Swing',
            description: 'A powerful swing',
            mpCost: 3,
            power: 1.5,
            accuracy: 80,
            target: 'enemy',
            element: 'physical',
            typingDifficulty: 2,
          },
        ],
        drops: [{ itemId: 'orc_fang', dropRate: 30 }],
      });

      enemy.takeDamage(50);
      enemy.consumeMp(5);

      const json = enemy.toJSON();
      expect(json).toEqual({
        id: 'orc_001',
        name: 'Mountain Orc',
        description: 'A powerful warrior',
        level: 7,
        stats: {
          maxHp: 200,
          maxMp: 25,
          strength: 28,
          willpower: 15,
          agility: 85,
          fortune: 8,
        },
        currentHp: 150,
        currentMp: 20,
        skills: [
          {
            id: 'heavy_swing',
            name: 'Heavy Swing',
            description: 'A powerful swing',
            mpCost: 3,
            power: 1.5,
            accuracy: 80,
            target: 'enemy',
            element: 'physical',
            typingDifficulty: 2,
          },
        ],
        drops: [{ itemId: 'orc_fang', dropRate: 30 }],
      });
    });

    it('JSONから復元できる', () => {
      const json = {
        id: 'skeleton_001',
        name: 'Skeleton Warrior',
        description: 'An undead warrior',
        level: 4,
        stats: {
          maxHp: 120,
          maxMp: 15,
          strength: 18,
          willpower: 12,
          agility: 78,
          fortune: 3,
        },
        currentHp: 80,
        currentMp: 10,
        skills: [],
        drops: [{ itemId: 'bone', dropRate: 60 }],
      };

      const enemy = Enemy.fromJSON(json);
      expect(enemy.id).toBe('skeleton_001');
      expect(enemy.name).toBe('Skeleton Warrior');
      expect(enemy.currentHp).toBe(80);
      expect(enemy.currentMp).toBe(10);
      expect(enemy.drops).toHaveLength(1);
    });
  });
});
