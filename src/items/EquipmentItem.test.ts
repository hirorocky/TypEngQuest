import { EquipmentItem, EquipmentItemData, EquipmentStats, Skill } from './EquipmentItem';
import { ItemType, ItemRarity } from './Item';
import { Player } from '../player/Player';

describe('EquipmentItem', () => {
  // テスト用のスキルデータ
  const sampleSkill: Skill = {
    id: 'slash',
    name: 'Slash',
    mpCost: 5,
    successRate: 90,
    typingDifficulty: 2,
    effect: {
      type: 'damage',
      value: 50,
      element: 'physical',
    },
  };

  const sampleSkill2: Skill = {
    id: 'heal',
    name: 'Heal',
    mpCost: 10,
    successRate: 100,
    typingDifficulty: 1,
    effect: {
      type: 'heal',
      value: 30,
    },
  };

  // テスト用の装備データ
  const sampleEquipmentData: EquipmentItemData = {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'A sturdy iron sword',
    type: ItemType.EQUIPMENT,
    rarity: ItemRarity.COMMON,
    stats: {
      attack: 10,
      defense: 0,
      speed: 5,
      accuracy: 0,
      fortune: 0,
    },
    grade: 2,
    skills: [sampleSkill],
  };

  describe('コンストラクタ', () => {
    it('正常な引数で初期化できる', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);

      expect(equipment.getId()).toBe('iron_sword');
      expect(equipment.getName()).toBe('Iron Sword');
      expect(equipment.getDescription()).toBe('A sturdy iron sword');
      expect(equipment.getType()).toBe(ItemType.EQUIPMENT);
      expect(equipment.getRarity()).toBe(ItemRarity.COMMON);
      expect(equipment.getGrade()).toBe(2);
    });

    it('グレードが無効な場合エラーを投げる', () => {
      expect(() => {
        new EquipmentItem({
          ...sampleEquipmentData,
          grade: 0,
        });
      }).toThrow('Grade must be between 1 and 5');

      expect(() => {
        new EquipmentItem({
          ...sampleEquipmentData,
          grade: 6,
        });
      }).toThrow('Grade must be between 1 and 5');
    });

    it('ステータスがundefinedの場合デフォルト値が設定される', () => {
      const equipment = new EquipmentItem({
        ...sampleEquipmentData,
        stats: undefined as any,
      });

      const stats = equipment.getStats();
      expect(stats.attack).toBe(0);
      expect(stats.defense).toBe(0);
      expect(stats.speed).toBe(0);
      expect(stats.accuracy).toBe(0);
      expect(stats.fortune).toBe(0);
    });

    it('技がundefinedの場合空配列が設定される', () => {
      const equipment = new EquipmentItem({
        ...sampleEquipmentData,
        skills: undefined as any,
      });

      expect(equipment.getSkills()).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('装備のステータスを取得できる', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);
      const stats = equipment.getStats();

      expect(stats.attack).toBe(10);
      expect(stats.defense).toBe(0);
      expect(stats.speed).toBe(5);
      expect(stats.accuracy).toBe(0);
      expect(stats.fortune).toBe(0);
    });
  });

  describe('getSkills', () => {
    it('装備の技リストを取得できる', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);
      const skills = equipment.getSkills();

      expect(skills).toHaveLength(1);
      expect(skills[0].id).toBe('slash');
      expect(skills[0].name).toBe('Slash');
    });

    it('複数の技を持つ装備の技リストを取得できる', () => {
      const equipment = new EquipmentItem({
        ...sampleEquipmentData,
        skills: [sampleSkill, sampleSkill2],
      });
      const skills = equipment.getSkills();

      expect(skills).toHaveLength(2);
      expect(skills[0].id).toBe('slash');
      expect(skills[1].id).toBe('heal');
    });
  });

  describe('getSkillById', () => {
    it('IDで技を検索できる', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);
      const skill = equipment.getSkillById('slash');

      expect(skill).toBeDefined();
      expect(skill?.name).toBe('Slash');
    });

    it('存在しないIDの場合undefinedを返す', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);
      const skill = equipment.getSkillById('nonexistent');

      expect(skill).toBeUndefined();
    });
  });

  describe('hasSkill', () => {
    it('技を持っているか確認できる', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);

      expect(equipment.hasSkill('slash')).toBe(true);
      expect(equipment.hasSkill('nonexistent')).toBe(false);
    });
  });

  describe('canUse', () => {
    it('装備アイテムは使用できない', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);
      const mockPlayer = {} as Player;

      expect(equipment.canUse(mockPlayer)).toBe(false);
    });
  });

  describe('use', () => {
    it('装備アイテムの使用はエラーを投げる', async () => {
      const equipment = new EquipmentItem(sampleEquipmentData);
      const mockPlayer = {} as Player;

      await expect(equipment.use(mockPlayer)).rejects.toThrow(
        'Equipment items cannot be used directly'
      );
    });
  });

  describe('equals', () => {
    it('同じ装備アイテムで真を返す', () => {
      const equipment1 = new EquipmentItem(sampleEquipmentData);
      const equipment2 = new EquipmentItem(sampleEquipmentData);

      expect(equipment1.equals(equipment2)).toBe(true);
    });

    it('異なるグレードの装備で偽を返す', () => {
      const equipment1 = new EquipmentItem(sampleEquipmentData);
      const equipment2 = new EquipmentItem({
        ...sampleEquipmentData,
        grade: 3,
      });

      expect(equipment1.equals(equipment2)).toBe(false);
    });

    it('異なるステータスの装備で偽を返す', () => {
      const equipment1 = new EquipmentItem(sampleEquipmentData);
      const equipment2 = new EquipmentItem({
        ...sampleEquipmentData,
        stats: {
          attack: 15,
          defense: 0,
          speed: 5,
          accuracy: 0,
          fortune: 0,
        },
      });

      expect(equipment1.equals(equipment2)).toBe(false);
    });

    it('異なる技を持つ装備で偽を返す', () => {
      const equipment1 = new EquipmentItem(sampleEquipmentData);
      const equipment2 = new EquipmentItem({
        ...sampleEquipmentData,
        skills: [sampleSkill2],
      });

      expect(equipment1.equals(equipment2)).toBe(false);
    });

    it('Itemクラスのインスタンスと比較した場合偽を返す', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);
      const item = {
        getId: () => 'iron_sword',
        getName: () => 'Iron Sword',
        getDescription: () => 'A sturdy iron sword',
        getType: () => ItemType.EQUIPMENT,
        getRarity: () => ItemRarity.COMMON,
        equals: () => false,
      } as any;

      expect(equipment.equals(item)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('正しいJSONデータを返す', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);
      const json = equipment.toJSON();

      expect(json).toEqual({
        id: 'iron_sword',
        name: 'Iron Sword',
        description: 'A sturdy iron sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 0,
          speed: 5,
          accuracy: 0,
          fortune: 0,
        },
        grade: 2,
        skills: [sampleSkill],
      });
    });
  });

  describe('fromJSON', () => {
    it('正しいJSONデータからインスタンスを作成できる', () => {
      const json: EquipmentItemData = {
        id: 'iron_sword',
        name: 'Iron Sword',
        description: 'A sturdy iron sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 0,
          speed: 5,
          accuracy: 0,
          fortune: 0,
        },
        grade: 2,
        skills: [sampleSkill],
      };

      const equipment = EquipmentItem.fromJSON(json);

      expect(equipment.getId()).toBe('iron_sword');
      expect(equipment.getName()).toBe('Iron Sword');
      expect(equipment.getGrade()).toBe(2);
      expect(equipment.getStats().attack).toBe(10);
      expect(equipment.getSkills()).toHaveLength(1);
    });

    it('不正なタイプのJSONデータでエラーを投げる', () => {
      const json = {
        ...sampleEquipmentData,
        type: ItemType.CONSUMABLE,
      };

      expect(() => {
        EquipmentItem.fromJSON(json);
      }).toThrow('Invalid equipment item data: type must be equipment');
    });

    it('gradeが数値でない場合エラーを投げる', () => {
      const json = {
        ...sampleEquipmentData,
        grade: '2' as any,
      };

      expect(() => {
        EquipmentItem.fromJSON(json);
      }).toThrow('Invalid equipment item data');
    });

    it('statsが不正な形式の場合エラーを投げる', () => {
      const json = {
        ...sampleEquipmentData,
        stats: 'invalid' as any,
      };

      expect(() => {
        EquipmentItem.fromJSON(json);
      }).toThrow('Invalid equipment item data');
    });

    it('skillsが配列でない場合エラーを投げる', () => {
      const json = {
        ...sampleEquipmentData,
        skills: 'invalid' as any,
      };

      expect(() => {
        EquipmentItem.fromJSON(json);
      }).toThrow('Invalid equipment item data');
    });

    it('無効なスキルデータの場合エラーを投げる', () => {
      const json = {
        ...sampleEquipmentData,
        skills: [{ invalid: 'skill' }] as any,
      };

      expect(() => {
        EquipmentItem.fromJSON(json);
      }).toThrow('Invalid equipment item data');
    });
  });

  describe('validateStats', () => {
    it('正しいステータスオブジェクトを検証できる', () => {
      const stats: EquipmentStats = {
        attack: 10,
        defense: 5,
        speed: 8,
        accuracy: 3,
        fortune: 2,
      };

      expect(EquipmentItem.validateStats(stats)).toBe(true);
    });

    it('ステータスが欠けている場合falseを返す', () => {
      const stats = {
        attack: 10,
        defense: 5,
        // speed missing
        accuracy: 3,
        fortune: 2,
      } as any;

      expect(EquipmentItem.validateStats(stats)).toBe(false);
    });

    it('ステータスが数値でない場合falseを返す', () => {
      const stats = {
        attack: '10',
        defense: 5,
        speed: 8,
        accuracy: 3,
        fortune: 2,
      } as any;

      expect(EquipmentItem.validateStats(stats)).toBe(false);
    });
  });

  describe('validateSkill', () => {
    it('正しいスキルオブジェクトを検証できる', () => {
      expect(EquipmentItem.validateSkill(sampleSkill)).toBe(true);
    });

    it('必須プロパティが欠けている場合falseを返す', () => {
      const invalidSkill = {
        id: 'slash',
        // name missing
        mpCost: 5,
        successRate: 90,
        typingDifficulty: 2,
        effect: {
          type: 'damage',
          value: 50,
        },
      } as any;

      expect(EquipmentItem.validateSkill(invalidSkill)).toBe(false);
    });

    it('効果が不正な場合falseを返す', () => {
      const invalidSkill = {
        ...sampleSkill,
        effect: 'invalid' as any,
      };

      expect(EquipmentItem.validateSkill(invalidSkill)).toBe(false);
    });

    it('効果タイプが不正な場合falseを返す', () => {
      const invalidSkill = {
        ...sampleSkill,
        effect: {
          type: 'invalid',
          value: 50,
        },
      };

      expect(EquipmentItem.validateSkill(invalidSkill)).toBe(false);
    });
  });
});
