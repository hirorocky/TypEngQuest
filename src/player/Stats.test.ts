import { Stats } from './Stats';
import { TemporaryStatus } from './TemporaryStatus';

describe('Stats', () => {
  describe('初期化', () => {
    test('デフォルト値で初期化される', () => {
      const stats = new Stats();

      expect(stats.getMaxHP()).toBe(100); // 基本HP: 100 + (レベル0 × 20)
      expect(stats.getMaxMP()).toBe(50); // 基本MP: 50 + (レベル0 × 10)
      expect(stats.getCurrentHP()).toBe(100);
      expect(stats.getCurrentMP()).toBe(50);
      expect(stats.getAttack()).toBe(10);
      expect(stats.getDefense()).toBe(10);
      expect(stats.getSpeed()).toBe(10);
      expect(stats.getAccuracy()).toBe(10);
      expect(stats.getFortune()).toBe(10);
    });

    test('レベルを指定して初期化される', () => {
      const stats = new Stats(3);

      expect(stats.getMaxHP()).toBe(160); // 基本HP: 100 + (レベル3 × 20)
      expect(stats.getMaxMP()).toBe(80); // 基本MP: 50 + (レベル3 × 10)
      expect(stats.getCurrentHP()).toBe(160);
      expect(stats.getCurrentMP()).toBe(80);
    });

    test('負のレベルは0にクランプされる', () => {
      const stats = new Stats(-5);

      expect(stats.getMaxHP()).toBe(100); // レベル0として扱われる
      expect(stats.getMaxMP()).toBe(50);
    });
  });

  describe('HP管理', () => {
    test('ダメージを受けて現在HPが減少する', () => {
      const stats = new Stats(1);
      const initialHP = stats.getCurrentHP();

      stats.takeDamage(30);

      expect(stats.getCurrentHP()).toBe(initialHP - 30);
    });

    test('ダメージで現在HPが0未満にならない', () => {
      const stats = new Stats(1);

      stats.takeDamage(999);

      expect(stats.getCurrentHP()).toBe(0);
    });

    test('HPを回復する', () => {
      const stats = new Stats(1);
      stats.takeDamage(50);
      const damagedHP = stats.getCurrentHP();

      stats.healHP(20);

      expect(stats.getCurrentHP()).toBe(damagedHP + 20);
    });

    test('HP回復で最大HPを超えない', () => {
      const stats = new Stats(1);
      const maxHP = stats.getMaxHP();

      stats.healHP(999);

      expect(stats.getCurrentHP()).toBe(maxHP);
    });

    test('HP全回復', () => {
      const stats = new Stats(1);
      stats.takeDamage(50);

      stats.fullHealHP();

      expect(stats.getCurrentHP()).toBe(stats.getMaxHP());
    });

    test('HP0で死亡状態判定', () => {
      const stats = new Stats(1);

      expect(stats.isDead()).toBe(false);

      stats.takeDamage(999);

      expect(stats.isDead()).toBe(true);
    });
  });

  describe('MP管理', () => {
    test('MPを消費する', () => {
      const stats = new Stats(1);
      const initialMP = stats.getCurrentMP();

      stats.consumeMP(15);

      expect(stats.getCurrentMP()).toBe(initialMP - 15);
    });

    test('MP消費で現在MPが0未満にならない', () => {
      const stats = new Stats(1);

      stats.consumeMP(999);

      expect(stats.getCurrentMP()).toBe(0);
    });

    test('MPを回復する', () => {
      const stats = new Stats(1);
      stats.consumeMP(20);
      const currentMP = stats.getCurrentMP();

      stats.healMP(10);

      expect(stats.getCurrentMP()).toBe(currentMP + 10);
    });

    test('MP回復で最大MPを超えない', () => {
      const stats = new Stats(1);
      const maxMP = stats.getMaxMP();

      stats.healMP(999);

      expect(stats.getCurrentMP()).toBe(maxMP);
    });

    test('MP全回復', () => {
      const stats = new Stats(1);
      stats.consumeMP(30);

      stats.fullHealMP();

      expect(stats.getCurrentMP()).toBe(stats.getMaxMP());
    });

    test('MP不足チェック', () => {
      const stats = new Stats(1);
      const currentMP = stats.getCurrentMP();

      expect(stats.hasEnoughMP(currentMP)).toBe(true);
      expect(stats.hasEnoughMP(currentMP + 1)).toBe(false);
    });
  });

  describe('ステータス計算式', () => {
    test('HP計算式: 100 + (レベル × 20)', () => {
      expect(new Stats(0).getMaxHP()).toBe(100);
      expect(new Stats(1).getMaxHP()).toBe(120);
      expect(new Stats(5).getMaxHP()).toBe(200);
      expect(new Stats(10).getMaxHP()).toBe(300);
    });

    test('MP計算式: 50 + (レベル × 10)', () => {
      expect(new Stats(0).getMaxMP()).toBe(50);
      expect(new Stats(1).getMaxMP()).toBe(60);
      expect(new Stats(5).getMaxMP()).toBe(100);
      expect(new Stats(10).getMaxMP()).toBe(150);
    });
  });

  describe('バフ・デバフシステム', () => {
    test('一時的なステータス強化を適用する', () => {
      const stats = new Stats(1);
      const baseAttack = stats.getAttack();

      stats.applyTemporaryBoost('attack', 15);

      expect(stats.getAttack()).toBe(baseAttack + 15);
    });

    test('一時的なステータス弱化を適用する', () => {
      const stats = new Stats(1);
      const baseDefense = stats.getDefense();

      stats.applyTemporaryBoost('defense', -5);

      expect(stats.getDefense()).toBe(baseDefense - 5);
    });

    test('一時的な効果をクリアする', () => {
      const stats = new Stats(1);
      const baseSpeed = stats.getSpeed();

      stats.applyTemporaryBoost('speed', 20);
      expect(stats.getSpeed()).toBe(baseSpeed + 20);

      stats.clearTemporaryBoosts();
      expect(stats.getSpeed()).toBe(baseSpeed);
    });

    test('複数の一時的な効果を重複適用する', () => {
      const stats = new Stats(1);
      const baseAccuracy = stats.getAccuracy();

      stats.applyTemporaryBoost('accuracy', 10);
      stats.applyTemporaryBoost('accuracy', 5);

      expect(stats.getAccuracy()).toBe(baseAccuracy + 15);
    });
  });

  describe('JSONシリアライゼーション', () => {
    test('Statsオブジェクトを正常にJSONに変換できる', () => {
      const stats = new Stats(3);
      stats.takeDamage(20);
      stats.consumeMP(10);
      stats.applyTemporaryBoost('attack', 5);

      const json = stats.toJSON();

      expect(json).toEqual({
        level: 3,
        currentHP: 140, // 160 - 20
        currentMP: 70, // 80 - 10
        baseAttack: 10,
        baseDefense: 10,
        baseSpeed: 10,
        baseAccuracy: 10,
        baseFortune: 10,
        temporaryBoosts: {
          attack: 5,
          defense: 0,
          speed: 0,
          accuracy: 0,
          fortune: 0,
        },
        temporaryStatuses: [],
      });
    });

    test('JSONからStatsオブジェクトを正常に復元できる', () => {
      const jsonData = {
        level: 2,
        currentHP: 80,
        currentMP: 45,
        baseAttack: 15,
        baseDefense: 12,
        baseSpeed: 8,
        baseAccuracy: 11,
        baseFortune: 9,
        temporaryBoosts: {
          attack: 3,
          defense: -2,
          speed: 0,
          accuracy: 0,
          fortune: 0,
        },
      };

      const stats = Stats.fromJSON(jsonData);

      expect(stats.getCurrentHP()).toBe(80);
      expect(stats.getCurrentMP()).toBe(45);
      expect(stats.getMaxHP()).toBe(140); // 100 + (2 × 20)
      expect(stats.getMaxMP()).toBe(70); // 50 + (2 × 10)
      expect(stats.getAttack()).toBe(18); // 15 + 3
      expect(stats.getDefense()).toBe(10); // 12 - 2
    });

    test('不正なJSONデータでエラーが発生する', () => {
      const invalidJson = {
        level: -1,
        currentHP: -50,
        // 必須フィールドが不足
      };

      expect(() => Stats.fromJSON(invalidJson)).toThrow();
    });
  });

  describe('データバリデーション', () => {
    test('レベルが負の値の場合は0にクランプされる', () => {
      const stats = new Stats(-10);
      expect(stats.getMaxHP()).toBe(100);
      expect(stats.getMaxMP()).toBe(50);
    });

    test('基本ステータスが負の値にならない', () => {
      const stats = new Stats(1);
      stats.applyTemporaryBoost('attack', -999);

      expect(stats.getAttack()).toBe(0); // 負の値にはならない
    });
  });

  describe('一時ステータス管理システム', () => {
    describe('addTemporaryStatus', () => {
      test('一時ステータスを追加する', () => {
        const stats = new Stats(1);
        const status: TemporaryStatus = {
          id: 'buff-attack-001',
          name: '攻撃力アップ',
          type: 'buff',
          effects: { attack: 10 },
          duration: 3,
          stackable: false,
        };

        stats.addTemporaryStatus(status);
        const statuses = stats.getTemporaryStatuses();

        expect(statuses).toHaveLength(1);
        expect(statuses[0]).toEqual(status);
      });

      test('同じIDの一時ステータスは上書きされる', () => {
        const stats = new Stats(1);
        const status1: TemporaryStatus = {
          id: 'same-id',
          name: '最初の効果',
          type: 'buff',
          effects: { attack: 5 },
          duration: 2,
          stackable: false,
        };
        const status2: TemporaryStatus = {
          id: 'same-id',
          name: '上書きする効果',
          type: 'buff',
          effects: { attack: 10 },
          duration: 4,
          stackable: false,
        };

        stats.addTemporaryStatus(status1);
        stats.addTemporaryStatus(status2);
        const statuses = stats.getTemporaryStatuses();

        expect(statuses).toHaveLength(1);
        expect(statuses[0].name).toBe('上書きする効果');
        expect(statuses[0].effects.attack).toBe(10);
      });

      test('stackable=falseの同じ名前の効果は上書きされる', () => {
        const stats = new Stats(1);
        const status1: TemporaryStatus = {
          id: 'attack-buff-1',
          name: '攻撃力アップ',
          type: 'buff',
          effects: { attack: 5 },
          duration: 2,
          stackable: false,
        };
        const status2: TemporaryStatus = {
          id: 'attack-buff-2',
          name: '攻撃力アップ',
          type: 'buff',
          effects: { attack: 8 },
          duration: 3,
          stackable: false,
        };

        stats.addTemporaryStatus(status1);
        stats.addTemporaryStatus(status2);
        const statuses = stats.getTemporaryStatuses();

        expect(statuses).toHaveLength(1);
        expect(statuses[0].id).toBe('attack-buff-2');
        expect(statuses[0].effects.attack).toBe(8);
      });

      test('stackable=trueの同じ名前の効果は両方保持される', () => {
        const stats = new Stats(1);
        const status1: TemporaryStatus = {
          id: 'stack-1',
          name: 'スタック可能効果',
          type: 'buff',
          effects: { attack: 3 },
          duration: 2,
          stackable: true,
        };
        const status2: TemporaryStatus = {
          id: 'stack-2',
          name: 'スタック可能効果',
          type: 'buff',
          effects: { attack: 4 },
          duration: 3,
          stackable: true,
        };

        stats.addTemporaryStatus(status1);
        stats.addTemporaryStatus(status2);
        const statuses = stats.getTemporaryStatuses();

        expect(statuses).toHaveLength(2);
        expect(statuses.find(s => s.id === 'stack-1')).toBeDefined();
        expect(statuses.find(s => s.id === 'stack-2')).toBeDefined();
      });
    });

    describe('removeTemporaryStatus', () => {
      test('指定されたIDの一時ステータスを削除する', () => {
        const stats = new Stats(1);
        const status1: TemporaryStatus = {
          id: 'remove-test-1',
          name: '削除テスト1',
          type: 'buff',
          effects: { attack: 5 },
          duration: 3,
          stackable: false,
        };
        const status2: TemporaryStatus = {
          id: 'remove-test-2',
          name: '削除テスト2',
          type: 'buff',
          effects: { defense: 3 },
          duration: 2,
          stackable: false,
        };

        stats.addTemporaryStatus(status1);
        stats.addTemporaryStatus(status2);
        expect(stats.getTemporaryStatuses()).toHaveLength(2);

        stats.removeTemporaryStatus('remove-test-1');
        const statuses = stats.getTemporaryStatuses();

        expect(statuses).toHaveLength(1);
        expect(statuses[0].id).toBe('remove-test-2');
      });

      test('存在しないIDを指定しても例外が発生しない', () => {
        const stats = new Stats(1);

        expect(() => {
          stats.removeTemporaryStatus('non-existent-id');
        }).not.toThrow();
      });
    });

    describe('getTemporaryStatuses', () => {
      test('一時ステータスの配列を取得する', () => {
        const stats = new Stats(1);
        const status: TemporaryStatus = {
          id: 'get-test',
          name: '取得テスト',
          type: 'debuff',
          effects: { speed: -2 },
          duration: 1,
          stackable: false,
        };

        expect(stats.getTemporaryStatuses()).toEqual([]);

        stats.addTemporaryStatus(status);
        expect(stats.getTemporaryStatuses()).toEqual([status]);
      });
    });

    describe('getActiveStatusAilments', () => {
      test('状態異常のみを取得する', () => {
        const stats = new Stats(1);
        const buff: TemporaryStatus = {
          id: 'buff-test',
          name: 'バフテスト',
          type: 'buff',
          effects: { attack: 5 },
          duration: 3,
          stackable: false,
        };
        const ailment: TemporaryStatus = {
          id: 'poison-test',
          name: '毒',
          type: 'status_ailment',
          effects: { hpPerTurn: -2 },
          duration: 4,
          stackable: false,
        };

        stats.addTemporaryStatus(buff);
        stats.addTemporaryStatus(ailment);

        const ailments = stats.getActiveStatusAilments();
        expect(ailments).toHaveLength(1);
        expect(ailments[0].id).toBe('poison-test');
      });

      test('状態異常がない場合は空の配列を返す', () => {
        const stats = new Stats(1);
        const buff: TemporaryStatus = {
          id: 'buff-only',
          name: 'バフのみ',
          type: 'buff',
          effects: { attack: 5 },
          duration: 3,
          stackable: false,
        };

        stats.addTemporaryStatus(buff);
        expect(stats.getActiveStatusAilments()).toEqual([]);
      });
    });
  });
});
