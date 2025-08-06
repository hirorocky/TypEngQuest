import { EquipmentStats, EquipmentStatsData } from './EquipmentStats';

describe('EquipmentStats', () => {
  describe('コンストラクタ', () => {
    test('デフォルト値で初期化される', () => {
      const equipmentStats = new EquipmentStats();

      expect(equipmentStats.getStrength()).toBe(0);
      expect(equipmentStats.getWillpower()).toBe(0);
      expect(equipmentStats.getAgility()).toBe(0);
      expect(equipmentStats.getFortune()).toBe(0);
    });

    test('指定値で初期化される', () => {
      const equipmentStats = new EquipmentStats({
        strength: 15,
        willpower: 10,
        agility: 13,
        fortune: 12,
      });

      expect(equipmentStats.getStrength()).toBe(15);
      expect(equipmentStats.getWillpower()).toBe(10);
      expect(equipmentStats.getAgility()).toBe(13);
      expect(equipmentStats.getFortune()).toBe(12);
    });

    test('部分的な値で初期化される', () => {
      const equipmentStats = new EquipmentStats({
        strength: 20,
        willpower: 5,
      });

      expect(equipmentStats.getStrength()).toBe(20);
      expect(equipmentStats.getWillpower()).toBe(5);
      expect(equipmentStats.getAgility()).toBe(0);
      expect(equipmentStats.getFortune()).toBe(0);
    });
  });

  describe('ステータス操作', () => {
    let equipmentStats: EquipmentStats;

    beforeEach(() => {
      equipmentStats = new EquipmentStats({
        strength: 10,
        willpower: 8,
        agility: 10,
        fortune: 2,
      });
    });

    test('ステータスを設定する', () => {
      equipmentStats.setStrength(25);
      equipmentStats.setWillpower(15);
      equipmentStats.setAgility(20);
      equipmentStats.setFortune(5);

      expect(equipmentStats.getStrength()).toBe(25);
      expect(equipmentStats.getWillpower()).toBe(15);
      expect(equipmentStats.getAgility()).toBe(20);
      expect(equipmentStats.getFortune()).toBe(5);
    });

    test('ステータスを加算する', () => {
      equipmentStats.addStrength(5);
      equipmentStats.addWillpower(3);
      equipmentStats.addAgility(5);
      equipmentStats.addFortune(-1);

      expect(equipmentStats.getStrength()).toBe(15);
      expect(equipmentStats.getWillpower()).toBe(11);
      expect(equipmentStats.getAgility()).toBe(15);
      expect(equipmentStats.getFortune()).toBe(1);
    });

    test('別のEquipmentStatsを加算する', () => {
      const other = new EquipmentStats({
        strength: 5,
        willpower: 2,
        agility: 2,
        fortune: 4,
      });

      equipmentStats.add(other);

      expect(equipmentStats.getStrength()).toBe(15);
      expect(equipmentStats.getWillpower()).toBe(10);
      expect(equipmentStats.getAgility()).toBe(12);
      expect(equipmentStats.getFortune()).toBe(6);
    });

    test('全てのステータスをクリアする', () => {
      equipmentStats.clear();

      expect(equipmentStats.getStrength()).toBe(0);
      expect(equipmentStats.getWillpower()).toBe(0);
      expect(equipmentStats.getAgility()).toBe(0);
      expect(equipmentStats.getFortune()).toBe(0);
    });
  });

  describe('ユーティリティメソッド', () => {
    test('合計値を計算する', () => {
      const equipmentStats = new EquipmentStats({
        strength: 10,
        willpower: 5,
        agility: 11,
        fortune: 4,
      });

      expect(equipmentStats.getTotal()).toBe(30);
    });

    test('全てゼロかどうかを判定する', () => {
      const emptyStats = new EquipmentStats();
      expect(emptyStats.isEmpty()).toBe(true);

      const nonEmptyStats = new EquipmentStats({ strength: 1 });
      expect(nonEmptyStats.isEmpty()).toBe(false);
    });

    test('指定されたステータスタイプの値を取得する', () => {
      const equipmentStats = new EquipmentStats({
        strength: 12,
        willpower: 8,
        agility: 16,
        fortune: 4,
      });

      expect(equipmentStats.getStat('strength')).toBe(12);
      expect(equipmentStats.getStat('willpower')).toBe(8);
      expect(equipmentStats.getStat('agility')).toBe(16);
      expect(equipmentStats.getStat('fortune')).toBe(4);
    });

    test('指定されたステータスタイプの値を設定する', () => {
      const equipmentStats = new EquipmentStats();

      equipmentStats.setStat('strength', 15);
      equipmentStats.setStat('willpower', 10);
      equipmentStats.setStat('agility', 20);
      equipmentStats.setStat('fortune', 6);

      expect(equipmentStats.getStrength()).toBe(15);
      expect(equipmentStats.getWillpower()).toBe(10);
      expect(equipmentStats.getAgility()).toBe(20);
      expect(equipmentStats.getFortune()).toBe(6);
    });
  });

  describe('JSON シリアライゼーション', () => {
    test('toJSON で正しくシリアライズされる', () => {
      const equipmentStats = new EquipmentStats({
        strength: 20,
        willpower: 15,
        agility: 22,
        fortune: 8,
      });

      const json = equipmentStats.toJSON();

      expect(json).toEqual({
        strength: 20,
        willpower: 15,
        agility: 22,
        fortune: 8,
      });
    });

    test('fromJSON で正しく復元される', () => {
      const data: EquipmentStatsData = {
        strength: 25,
        willpower: 18,
        agility: 27,
        fortune: 9,
      };

      const equipmentStats = EquipmentStats.fromJSON(data);

      expect(equipmentStats.getStrength()).toBe(25);
      expect(equipmentStats.getWillpower()).toBe(18);
      expect(equipmentStats.getAgility()).toBe(27);
      expect(equipmentStats.getFortune()).toBe(9);
    });

    test('不正なJSONデータでエラーが投げられる', () => {
      expect(() => EquipmentStats.fromJSON(null)).toThrow('Invalid equipment stats data format');
      expect(() => EquipmentStats.fromJSON({})).toThrow('Invalid equipment stats data format');
      expect(() => EquipmentStats.fromJSON({ strength: 'invalid' })).toThrow(
        'Invalid equipment stats data format'
      );
    });
  });

  describe('演算子オーバーロード的な操作', () => {
    test('コピーコンストラクタ的な操作', () => {
      const original = new EquipmentStats({
        strength: 10,
        willpower: 5,
        agility: 11,
        fortune: 2,
      });

      const copy = new EquipmentStats(original.toJSON());

      expect(copy.getStrength()).toBe(10);
      expect(copy.getWillpower()).toBe(5);
      expect(copy.getAgility()).toBe(11);
      expect(copy.getFortune()).toBe(2);
    });

    test('静的メソッドでの加算', () => {
      const stats1 = new EquipmentStats({
        strength: 10,
        willpower: 5,
        agility: 10,
        fortune: 2,
      });

      const stats2 = new EquipmentStats({
        strength: 5,
        willpower: 8,
        agility: 3,
        fortune: 4,
      });

      const result = EquipmentStats.add(stats1, stats2);

      expect(result.getStrength()).toBe(15);
      expect(result.getWillpower()).toBe(13);
      expect(result.getAgility()).toBe(13);
      expect(result.getFortune()).toBe(6);
    });
  });
});
