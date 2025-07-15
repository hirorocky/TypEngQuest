import { TemporaryStatus, TemporaryStatusData, TemporaryStatusType } from './TemporaryStatus';

describe('TemporaryStatus', () => {
  describe('TemporaryStatusの基本プロパティ', () => {
    test('TemporaryStatusオブジェクトの基本プロパティが正しく設定される', () => {
      const status: TemporaryStatus = {
        id: 'buff-attack-001',
        name: 'Attack Up',
        type: 'buff',
        effects: {
          attack: 10,
        },
        duration: 3,
        stackable: false,
      };

      expect(status.id).toBe('buff-attack-001');
      expect(status.name).toBe('Attack Up');
      expect(status.type).toBe('buff');
      expect(status.effects.attack).toBe(10);
      expect(status.duration).toBe(3);
      expect(status.stackable).toBe(false);
    });

    test('複数の効果を持つTemporaryStatusが正しく定義される', () => {
      const status: TemporaryStatus = {
        id: 'buff-multi-001',
        name: 'All Stats Up',
        type: 'buff',
        effects: {
          attack: 5,
          defense: 5,
          speed: 3,
          accuracy: 3,
          fortune: 2,
        },
        duration: 5,
        stackable: true,
      };

      expect(status.effects.attack).toBe(5);
      expect(status.effects.defense).toBe(5);
      expect(status.effects.speed).toBe(3);
      expect(status.effects.accuracy).toBe(3);
      expect(status.effects.fortune).toBe(2);
      expect(status.stackable).toBe(true);
    });

    test('デバフ効果が正しく定義される', () => {
      const status: TemporaryStatus = {
        id: 'debuff-attack-001',
        name: 'Attack Down',
        type: 'debuff',
        effects: {
          attack: -5,
        },
        duration: 2,
        stackable: false,
      };

      expect(status.type).toBe('debuff');
      expect(status.effects.attack).toBe(-5);
    });

    test('状態異常が正しく定義される', () => {
      const status: TemporaryStatus = {
        id: 'poison-001',
        name: 'Poison',
        type: 'status_ailment',
        effects: {
          hpPerTurn: -3,
          cannotRun: true,
        },
        duration: 3,
        stackable: false,
      };

      expect(status.type).toBe('status_ailment');
      expect(status.effects.hpPerTurn).toBe(-3);
      expect(status.effects.cannotRun).toBe(true);
    });

    test('永続効果（duration: -1）が正しく設定される', () => {
      const status: TemporaryStatus = {
        id: 'permanent-001',
        name: 'Attack Up',
        type: 'buff',
        effects: {
          attack: 1,
        },
        duration: -1,
        stackable: true,
      };

      expect(status.duration).toBe(-1);
    });
  });

  describe('効果の型定義テスト', () => {
    test('すべてのステータス効果が正しく定義される', () => {
      const status: TemporaryStatus = {
        id: 'test-all-effects',
        name: 'All Stats Up',
        type: 'buff',
        effects: {
          attack: 1,
          defense: 2,
          speed: 3,
          accuracy: 4,
          fortune: 5,
          hpPerTurn: 1,
          mpPerTurn: 2,
          cannotAct: false,
          cannotRun: false,
        },
        duration: 1,
        stackable: false,
      };

      expect(typeof status.effects.attack).toBe('number');
      expect(typeof status.effects.defense).toBe('number');
      expect(typeof status.effects.speed).toBe('number');
      expect(typeof status.effects.accuracy).toBe('number');
      expect(typeof status.effects.fortune).toBe('number');
      expect(typeof status.effects.hpPerTurn).toBe('number');
      expect(typeof status.effects.mpPerTurn).toBe('number');
      expect(typeof status.effects.cannotAct).toBe('boolean');
      expect(typeof status.effects.cannotRun).toBe('boolean');
    });

    test('TemporaryStatusType列挙型が正しく定義される', () => {
      const types: TemporaryStatusType[] = ['buff', 'debuff', 'status_ailment'];

      expect(types).toContain('buff');
      expect(types).toContain('debuff');
      expect(types).toContain('status_ailment');
    });
  });

  describe('JSON シリアライゼーションテスト', () => {
    test('TemporaryStatusがJSONに正しく変換される', () => {
      const status: TemporaryStatus = {
        id: 'test-serialize',
        name: 'Attack Up',
        type: 'buff',
        effects: {
          attack: 10,
          defense: 5,
        },
        duration: 3,
        stackable: true,
      };

      const json = JSON.stringify(status);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe('test-serialize');
      expect(parsed.name).toBe('Attack Up');
      expect(parsed.type).toBe('buff');
      expect(parsed.effects.attack).toBe(10);
      expect(parsed.effects.defense).toBe(5);
      expect(parsed.duration).toBe(3);
      expect(parsed.stackable).toBe(true);
    });

    test('JSONからTemporaryStatusが正しく復元される', () => {
      const data: TemporaryStatusData = {
        id: 'test-deserialize',
        name: 'Speed Down',
        type: 'debuff',
        effects: {
          speed: -3,
          cannotAct: true,
        },
        duration: 2,
        stackable: false,
      };

      const json = JSON.stringify(data);
      const parsed: TemporaryStatus = JSON.parse(json);

      expect(parsed.id).toBe('test-deserialize');
      expect(parsed.name).toBe('Speed Down');
      expect(parsed.type).toBe('debuff');
      expect(parsed.effects.speed).toBe(-3);
      expect(parsed.effects.cannotAct).toBe(true);
      expect(parsed.duration).toBe(2);
      expect(parsed.stackable).toBe(false);
    });

    test('部分的な効果を持つTemporaryStatusがJSONで正しく扱われる', () => {
      const status: TemporaryStatus = {
        id: 'partial-effects',
        name: 'Poison',
        type: 'status_ailment',
        effects: {
          hpPerTurn: -1,
        }, // 他の効果は undefined
        duration: 5,
        stackable: false,
      };

      const json = JSON.stringify(status);
      const parsed: TemporaryStatus = JSON.parse(json);

      expect(parsed.effects.hpPerTurn).toBe(-1);
      expect(parsed.effects.attack).toBeUndefined();
      expect(parsed.effects.defense).toBeUndefined();
      expect(parsed.effects.cannotAct).toBeUndefined();
    });
  });
});
