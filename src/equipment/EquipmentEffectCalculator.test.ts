import { EquipmentEffectCalculator } from './EquipmentEffectCalculator';
import { EquipmentItem, EquipmentItemData } from '../items/EquipmentItem';
import { ItemType, ItemRarity } from '../items/Item';

describe('EquipmentEffectCalculator', () => {
  let calculator: EquipmentEffectCalculator;

  beforeEach(() => {
    calculator = new EquipmentEffectCalculator();
  });

  describe('calculateTotalStats', () => {
    it('単一の装備アイテムの場合、そのステータスを返す', () => {
      const equipmentData: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
          speed: 3,
          accuracy: 0,
          fortune: 0,
        },
        grade: 15, // 10+2+3+0+0=15
      };
      const equipment = new EquipmentItem(equipmentData);

      const totalStats = calculator.calculateTotalStats([equipment]);

      expect(totalStats.attack).toBe(10);
      expect(totalStats.defense).toBe(2);
      expect(totalStats.speed).toBe(3);
      expect(totalStats.accuracy).toBe(0);
      expect(totalStats.fortune).toBe(0);
    });

    it('複数の装備アイテムの場合、ステータスの合計を返す', () => {
      const equipment1Data: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
          speed: 3,
          accuracy: 0,
          fortune: 0,
        },
        grade: 15, // 10+2+3+0+0=15
      };

      const equipment2Data: EquipmentItemData = {
        id: 'shield',
        name: 'Wooden Shield',
        description: 'A basic shield',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 0,
          defense: 8,
          speed: 1,
          accuracy: 2,
          fortune: 1,
        },
        grade: 12, // 0+8+1+2+1=12
      };

      const equipment1 = new EquipmentItem(equipment1Data);
      const equipment2 = new EquipmentItem(equipment2Data);

      const totalStats = calculator.calculateTotalStats([equipment1, equipment2]);

      expect(totalStats.attack).toBe(10); // 10+0
      expect(totalStats.defense).toBe(10); // 2+8
      expect(totalStats.speed).toBe(4); // 3+1
      expect(totalStats.accuracy).toBe(2); // 0+2
      expect(totalStats.fortune).toBe(1); // 0+1
    });

    it('空の配列の場合、全てのステータスが0を返す', () => {
      const totalStats = calculator.calculateTotalStats([]);

      expect(totalStats.attack).toBe(0);
      expect(totalStats.defense).toBe(0);
      expect(totalStats.speed).toBe(0);
      expect(totalStats.accuracy).toBe(0);
      expect(totalStats.fortune).toBe(0);
    });

    it('5つの装備アイテムの場合、正しく合計される', () => {
      const equipmentDataList: EquipmentItemData[] = [
        {
          id: 'item1',
          name: 'Item 1',
          description: 'Item 1',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 2, defense: 1, speed: 0, accuracy: 0, fortune: 0 },
          grade: 3,
        },
        {
          id: 'item2',
          name: 'Item 2',
          description: 'Item 2',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 1, defense: 2, speed: 1, accuracy: 0, fortune: 0 },
          grade: 4,
        },
        {
          id: 'item3',
          name: 'Item 3',
          description: 'Item 3',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 0, defense: 0, speed: 2, accuracy: 1, fortune: 0 },
          grade: 3,
        },
        {
          id: 'item4',
          name: 'Item 4',
          description: 'Item 4',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 0, defense: 0, speed: 0, accuracy: 2, fortune: 1 },
          grade: 3,
        },
        {
          id: 'item5',
          name: 'Item 5',
          description: 'Item 5',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 1, defense: 1, speed: 1, accuracy: 1, fortune: 1 },
          grade: 5,
        },
      ];

      const equipments = equipmentDataList.map(data => new EquipmentItem(data));
      const totalStats = calculator.calculateTotalStats(equipments);

      expect(totalStats.attack).toBe(4); // 2+1+0+0+1
      expect(totalStats.defense).toBe(4); // 1+2+0+0+1
      expect(totalStats.speed).toBe(4); // 0+1+2+0+1
      expect(totalStats.accuracy).toBe(4); // 0+0+1+2+1
      expect(totalStats.fortune).toBe(2); // 0+0+0+1+1
    });
  });

  describe('calculateAverageGrade', () => {
    it('単一の装備アイテムの場合、そのグレードを返す', () => {
      const equipmentData: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
          speed: 3,
          accuracy: 0,
          fortune: 0,
        },
        grade: 15,
      };
      const equipment = new EquipmentItem(equipmentData);

      const averageGrade = calculator.calculateAverageGrade([equipment]);

      expect(averageGrade).toBe(15);
    });

    it('複数の装備アイテムの場合、平均グレード（小数点切り捨て）を返す', () => {
      const equipment1Data: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
          speed: 3,
          accuracy: 0,
          fortune: 0,
        },
        grade: 15,
      };

      const equipment2Data: EquipmentItemData = {
        id: 'shield',
        name: 'Wooden Shield',
        description: 'A basic shield',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 0,
          defense: 8,
          speed: 1,
          accuracy: 2,
          fortune: 1,
        },
        grade: 12,
      };

      const equipment1 = new EquipmentItem(equipment1Data);
      const equipment2 = new EquipmentItem(equipment2Data);

      const averageGrade = calculator.calculateAverageGrade([equipment1, equipment2]);

      expect(averageGrade).toBe(13); // (15+12)/2 = 13.5 → 13（小数点切り捨て）
    });

    it('空の配列の場合、1を返す', () => {
      const averageGrade = calculator.calculateAverageGrade([]);

      expect(averageGrade).toBe(1);
    });

    it('小数点以下がある場合、切り捨てされる', () => {
      const equipmentDataList: EquipmentItemData[] = [
        {
          id: 'item1',
          name: 'Item 1',
          description: 'Item 1',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 1, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 1,
        },
        {
          id: 'item2',
          name: 'Item 2',
          description: 'Item 2',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 1, defense: 1, speed: 0, accuracy: 0, fortune: 0 },
          grade: 2,
        },
        {
          id: 'item3',
          name: 'Item 3',
          description: 'Item 3',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 1, defense: 1, speed: 1, accuracy: 0, fortune: 0 },
          grade: 3,
        },
      ];

      const equipments = equipmentDataList.map(data => new EquipmentItem(data));
      const averageGrade = calculator.calculateAverageGrade(equipments);

      expect(averageGrade).toBe(2); // (1+2+3)/3 = 2.0
    });

    it('より複雑な小数点切り捨てのケース', () => {
      const equipmentDataList: EquipmentItemData[] = [
        {
          id: 'item1',
          name: 'Item 1',
          description: 'Item 1',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 1, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 1,
        },
        {
          id: 'item2',
          name: 'Item 2',
          description: 'Item 2',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 1, defense: 1, speed: 0, accuracy: 0, fortune: 0 },
          grade: 2,
        },
      ];

      const equipments = equipmentDataList.map(data => new EquipmentItem(data));
      const averageGrade = calculator.calculateAverageGrade(equipments);

      expect(averageGrade).toBe(1); // (1+2)/2 = 1.5 → 1（小数点切り捨て）
    });
  });

  describe('getAvailableSkills', () => {
    it('技を持つ装備がない場合、空の配列を返す', () => {
      const equipmentData: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
          speed: 3,
          accuracy: 0,
          fortune: 0,
        },
        grade: 15,
        skill: undefined,
      };
      const equipment = new EquipmentItem(equipmentData);

      const skills = calculator.getAvailableSkills([equipment]);

      expect(skills).toEqual([]);
    });

    it('技を持つ装備がある場合、その技を返す', () => {
      const equipmentData: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
          speed: 3,
          accuracy: 0,
          fortune: 0,
        },
        grade: 15,
        skill: {
          id: 'slash',
          name: 'Slash',
          mpCost: 5,
          successRate: 90,
          typingDifficulty: 2,
          effect: {
            type: 'damage',
            power: 50,
            target: 'enemy',
          },
        },
      };
      const equipment = new EquipmentItem(equipmentData);

      const skills = calculator.getAvailableSkills([equipment]);

      expect(skills).toHaveLength(1);
      expect(skills[0].id).toBe('slash');
      expect(skills[0].name).toBe('Slash');
    });

    it('複数の技を持つ装備がある場合、全ての技を返す', () => {
      const equipment1Data: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
          speed: 3,
          accuracy: 0,
          fortune: 0,
        },
        grade: 15,
        skill: {
          id: 'slash',
          name: 'Slash',
          mpCost: 5,
          successRate: 90,
          typingDifficulty: 2,
          effect: {
            type: 'damage',
            power: 50,
            target: 'enemy',
          },
        },
      };

      const equipment2Data: EquipmentItemData = {
        id: 'staff',
        name: 'Magic Staff',
        description: 'A magic staff',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 0,
          defense: 8,
          speed: 1,
          accuracy: 2,
          fortune: 1,
        },
        grade: 12,
        skill: {
          id: 'heal',
          name: 'Heal',
          mpCost: 10,
          successRate: 100,
          typingDifficulty: 1,
          effect: {
            type: 'heal',
            power: 30,
            target: 'self',
          },
        },
      };

      const equipment1 = new EquipmentItem(equipment1Data);
      const equipment2 = new EquipmentItem(equipment2Data);

      const skills = calculator.getAvailableSkills([equipment1, equipment2]);

      expect(skills).toHaveLength(2);
      expect(skills[0].id).toBe('slash');
      expect(skills[1].id).toBe('heal');
    });

    it('技を持つ装備と持たない装備が混在する場合、技を持つ装備の技のみ返す', () => {
      const equipment1Data: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
          speed: 3,
          accuracy: 0,
          fortune: 0,
        },
        grade: 15,
        skill: {
          id: 'slash',
          name: 'Slash',
          mpCost: 5,
          successRate: 90,
          typingDifficulty: 2,
          effect: {
            type: 'damage',
            power: 50,
            target: 'enemy',
          },
        },
      };

      const equipment2Data: EquipmentItemData = {
        id: 'shield',
        name: 'Wooden Shield',
        description: 'A basic shield',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 0,
          defense: 8,
          speed: 1,
          accuracy: 2,
          fortune: 1,
        },
        grade: 12,
        skill: undefined,
      };

      const equipment1 = new EquipmentItem(equipment1Data);
      const equipment2 = new EquipmentItem(equipment2Data);

      const skills = calculator.getAvailableSkills([equipment1, equipment2]);

      expect(skills).toHaveLength(1);
      expect(skills[0].id).toBe('slash');
    });
  });
});
