import { EquipmentStats, EquipmentStatsData } from './EquipmentStats';

describe('EquipmentStats', () => {
  describe('コンストラクタ', () => {
    test('デフォルト値で初期化される', () => {
      const equipmentStats = new EquipmentStats();

      expect(equipmentStats.getAttack()).toBe(0);
      expect(equipmentStats.getDefense()).toBe(0);
      expect(equipmentStats.getSpeed()).toBe(0);
      expect(equipmentStats.getAccuracy()).toBe(0);
      expect(equipmentStats.getFortune()).toBe(0);
    });

    test('指定値で初期化される', () => {
      const equipmentStats = new EquipmentStats({
        attack: 15,
        defense: 10,
        speed: 5,
        accuracy: 8,
        fortune: 12,
      });

      expect(equipmentStats.getAttack()).toBe(15);
      expect(equipmentStats.getDefense()).toBe(10);
      expect(equipmentStats.getSpeed()).toBe(5);
      expect(equipmentStats.getAccuracy()).toBe(8);
      expect(equipmentStats.getFortune()).toBe(12);
    });

    test('部分的な値で初期化される', () => {
      const equipmentStats = new EquipmentStats({
        attack: 20,
        defense: 5,
      });

      expect(equipmentStats.getAttack()).toBe(20);
      expect(equipmentStats.getDefense()).toBe(5);
      expect(equipmentStats.getSpeed()).toBe(0);
      expect(equipmentStats.getAccuracy()).toBe(0);
      expect(equipmentStats.getFortune()).toBe(0);
    });
  });

  describe('ステータス操作', () => {
    let equipmentStats: EquipmentStats;

    beforeEach(() => {
      equipmentStats = new EquipmentStats({
        attack: 10,
        defense: 8,
        speed: 6,
        accuracy: 4,
        fortune: 2,
      });
    });

    test('ステータスを設定する', () => {
      equipmentStats.setAttack(25);
      equipmentStats.setDefense(15);
      equipmentStats.setSpeed(12);
      equipmentStats.setAccuracy(8);
      equipmentStats.setFortune(5);

      expect(equipmentStats.getAttack()).toBe(25);
      expect(equipmentStats.getDefense()).toBe(15);
      expect(equipmentStats.getSpeed()).toBe(12);
      expect(equipmentStats.getAccuracy()).toBe(8);
      expect(equipmentStats.getFortune()).toBe(5);
    });

    test('ステータスを加算する', () => {
      equipmentStats.addAttack(5);
      equipmentStats.addDefense(3);
      equipmentStats.addSpeed(-2);
      equipmentStats.addAccuracy(7);
      equipmentStats.addFortune(-1);

      expect(equipmentStats.getAttack()).toBe(15);
      expect(equipmentStats.getDefense()).toBe(11);
      expect(equipmentStats.getSpeed()).toBe(4);
      expect(equipmentStats.getAccuracy()).toBe(11);
      expect(equipmentStats.getFortune()).toBe(1);
    });

    test('別のEquipmentStatsを加算する', () => {
      const other = new EquipmentStats({
        attack: 5,
        defense: 2,
        speed: -1,
        accuracy: 3,
        fortune: 4,
      });

      equipmentStats.add(other);

      expect(equipmentStats.getAttack()).toBe(15);
      expect(equipmentStats.getDefense()).toBe(10);
      expect(equipmentStats.getSpeed()).toBe(5);
      expect(equipmentStats.getAccuracy()).toBe(7);
      expect(equipmentStats.getFortune()).toBe(6);
    });

    test('全てのステータスをクリアする', () => {
      equipmentStats.clear();

      expect(equipmentStats.getAttack()).toBe(0);
      expect(equipmentStats.getDefense()).toBe(0);
      expect(equipmentStats.getSpeed()).toBe(0);
      expect(equipmentStats.getAccuracy()).toBe(0);
      expect(equipmentStats.getFortune()).toBe(0);
    });
  });

  describe('ユーティリティメソッド', () => {
    test('合計値を計算する', () => {
      const equipmentStats = new EquipmentStats({
        attack: 10,
        defense: 5,
        speed: 8,
        accuracy: 3,
        fortune: 4,
      });

      expect(equipmentStats.getTotal()).toBe(30);
    });

    test('全てゼロかどうかを判定する', () => {
      const emptyStats = new EquipmentStats();
      expect(emptyStats.isEmpty()).toBe(true);

      const nonEmptyStats = new EquipmentStats({ attack: 1 });
      expect(nonEmptyStats.isEmpty()).toBe(false);
    });

    test('指定されたステータスタイプの値を取得する', () => {
      const equipmentStats = new EquipmentStats({
        attack: 12,
        defense: 8,
        speed: 6,
        accuracy: 10,
        fortune: 4,
      });

      expect(equipmentStats.getStat('attack')).toBe(12);
      expect(equipmentStats.getStat('defense')).toBe(8);
      expect(equipmentStats.getStat('speed')).toBe(6);
      expect(equipmentStats.getStat('accuracy')).toBe(10);
      expect(equipmentStats.getStat('fortune')).toBe(4);
    });

    test('指定されたステータスタイプの値を設定する', () => {
      const equipmentStats = new EquipmentStats();

      equipmentStats.setStat('attack', 15);
      equipmentStats.setStat('defense', 10);
      equipmentStats.setStat('speed', 8);
      equipmentStats.setStat('accuracy', 12);
      equipmentStats.setStat('fortune', 6);

      expect(equipmentStats.getAttack()).toBe(15);
      expect(equipmentStats.getDefense()).toBe(10);
      expect(equipmentStats.getSpeed()).toBe(8);
      expect(equipmentStats.getAccuracy()).toBe(12);
      expect(equipmentStats.getFortune()).toBe(6);
    });
  });

  describe('JSON シリアライゼーション', () => {
    test('toJSON で正しくシリアライズされる', () => {
      const equipmentStats = new EquipmentStats({
        attack: 20,
        defense: 15,
        speed: 10,
        accuracy: 12,
        fortune: 8,
      });

      const json = equipmentStats.toJSON();

      expect(json).toEqual({
        attack: 20,
        defense: 15,
        speed: 10,
        accuracy: 12,
        fortune: 8,
      });
    });

    test('fromJSON で正しく復元される', () => {
      const data: EquipmentStatsData = {
        attack: 25,
        defense: 18,
        speed: 12,
        accuracy: 15,
        fortune: 9,
      };

      const equipmentStats = EquipmentStats.fromJSON(data);

      expect(equipmentStats.getAttack()).toBe(25);
      expect(equipmentStats.getDefense()).toBe(18);
      expect(equipmentStats.getSpeed()).toBe(12);
      expect(equipmentStats.getAccuracy()).toBe(15);
      expect(equipmentStats.getFortune()).toBe(9);
    });

    test('不正なJSONデータでエラーが投げられる', () => {
      expect(() => EquipmentStats.fromJSON(null)).toThrow('Invalid equipment stats data format');
      expect(() => EquipmentStats.fromJSON({})).toThrow('Invalid equipment stats data format');
      expect(() => EquipmentStats.fromJSON({ attack: 'invalid' })).toThrow(
        'Invalid equipment stats data format'
      );
    });
  });

  describe('演算子オーバーロード的な操作', () => {
    test('コピーコンストラクタ的な操作', () => {
      const original = new EquipmentStats({
        attack: 10,
        defense: 5,
        speed: 8,
        accuracy: 3,
        fortune: 2,
      });

      const copy = new EquipmentStats(original.toJSON());

      expect(copy.getAttack()).toBe(10);
      expect(copy.getDefense()).toBe(5);
      expect(copy.getSpeed()).toBe(8);
      expect(copy.getAccuracy()).toBe(3);
      expect(copy.getFortune()).toBe(2);
    });

    test('静的メソッドでの加算', () => {
      const stats1 = new EquipmentStats({
        attack: 10,
        defense: 5,
        speed: 3,
        accuracy: 7,
        fortune: 2,
      });

      const stats2 = new EquipmentStats({
        attack: 5,
        defense: 8,
        speed: 2,
        accuracy: 1,
        fortune: 4,
      });

      const result = EquipmentStats.add(stats1, stats2);

      expect(result.getAttack()).toBe(15);
      expect(result.getDefense()).toBe(13);
      expect(result.getSpeed()).toBe(5);
      expect(result.getAccuracy()).toBe(8);
      expect(result.getFortune()).toBe(6);
    });
  });
});
