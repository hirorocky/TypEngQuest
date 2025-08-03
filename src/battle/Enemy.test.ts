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
          attack: 10,
          defense: 5,
          speed: 8,
          accuracy: 70,
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
            attack: 10,
            defense: 5,
            speed: 8,
            accuracy: 70,
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
          attack: 15,
          defense: 8,
          speed: 12,
          accuracy: 75,
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
      expect(enemy.stats.attack).toBe(15);
      expect(enemy.stats.defense).toBe(8);
      expect(enemy.stats.speed).toBe(12);
      expect(enemy.stats.accuracy).toBe(75);
      expect(enemy.stats.fortune).toBe(10);
    });

    it('ステータスは不変', () => {
      const stats = enemy.stats;
      expect(() => {
        (stats as any).attack = 999;
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
          attack: 20,
          defense: 10,
          speed: 15,
          accuracy: 80,
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
          attack: 35,
          defense: 20,
          speed: 18,
          accuracy: 85,
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

    it('技リストは不変', () => {
      const skills = enemy.skills;
      expect(() => {
        (skills as any).push({} as Skill);
      }).toThrow();
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
          attack: 5,
          defense: 2,
          speed: 5,
          accuracy: 60,
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
          attack: 1,
          defense: 1,
          speed: 1,
          accuracy: 50,
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
          attack: 12,
          defense: 8,
          speed: 20,
          accuracy: 70,
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
          attack: 8,
          defense: 3,
          speed: 15,
          accuracy: 90,
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
            attack: 5,
            defense: 2,
            speed: 5,
            accuracy: 60,
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
            attack: 5,
            defense: 2,
            speed: 5,
            accuracy: 60,
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
          attack: 28,
          defense: 15,
          speed: 10,
          accuracy: 75,
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
          attack: 28,
          defense: 15,
          speed: 10,
          accuracy: 75,
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
          attack: 18,
          defense: 12,
          speed: 8,
          accuracy: 70,
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
