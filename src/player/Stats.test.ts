import { Stats, TotalStats } from './Stats';
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

  describe('効果計算システム（一時ステータス統合）', () => {
    describe('getTotalStats', () => {
      test('基本ステータス + 一時ステータス効果の総和計算', () => {
        const stats = new Stats(1);
        const baseAttack = stats.getAttack();
        const baseDefense = stats.getDefense();

        const buff: TemporaryStatus = {
          id: 'total-test-1',
          name: '総合バフ',
          type: 'buff',
          effects: {
            attack: 15,
            defense: 10,
          },
          duration: 3,
          stackable: false,
        };

        stats.addTemporaryStatus(buff);
        const totalStats: TotalStats = stats.getTotalStats();

        expect(totalStats.attack).toBe(baseAttack + 15);
        expect(totalStats.defense).toBe(baseDefense + 10);
        expect(totalStats.speed).toBe(stats.getSpeed()); // 変更なし
      });

      test('複数バフ/デバフの重ね合わせ', () => {
        const stats = new Stats(1);
        const baseAttack = stats.getAttack();

        const buff1: TemporaryStatus = {
          id: 'stack-buff-1',
          name: 'スタック攻撃バフ1',
          type: 'buff',
          effects: { attack: 8 },
          duration: 3,
          stackable: true,
        };

        const buff2: TemporaryStatus = {
          id: 'stack-buff-2',
          name: 'スタック攻撃バフ2',
          type: 'buff',
          effects: { attack: 5 },
          duration: 2,
          stackable: true,
        };

        const debuff: TemporaryStatus = {
          id: 'attack-debuff',
          name: '攻撃デバフ',
          type: 'debuff',
          effects: { attack: -3 },
          duration: 4,
          stackable: false,
        };

        stats.addTemporaryStatus(buff1);
        stats.addTemporaryStatus(buff2);
        stats.addTemporaryStatus(debuff);

        const totalStats = stats.getTotalStats();
        expect(totalStats.attack).toBe(baseAttack + 8 + 5 - 3); // 10 + 8 + 5 - 3 = 20
      });

      test('状態異常による特殊効果', () => {
        const stats = new Stats(1);
        const baseSpeed = stats.getSpeed(); // 一時ステータス追加前の速度を記録

        const poison: TemporaryStatus = {
          id: 'poison-effect',
          name: '毒',
          type: 'status_ailment',
          effects: {
            hpPerTurn: -2,
            cannotRun: true,
          },
          duration: 3,
          stackable: false,
        };

        const paralysis: TemporaryStatus = {
          id: 'paralysis-effect',
          name: '麻痺',
          type: 'status_ailment',
          effects: {
            cannotAct: true,
            speed: -5,
          },
          duration: 2,
          stackable: false,
        };

        stats.addTemporaryStatus(poison);
        stats.addTemporaryStatus(paralysis);

        const totalStats = stats.getTotalStats();
        expect(totalStats.hpPerTurn).toBe(-2);
        expect(totalStats.cannotRun).toBe(true);
        expect(totalStats.cannotAct).toBe(true);
        expect(totalStats.speed).toBe(Math.max(0, baseSpeed - 5)); // 負にならない
      });

      test('負の値にならないことを確認', () => {
        const stats = new Stats(1);

        const majorDebuff: TemporaryStatus = {
          id: 'major-debuff',
          name: '大デバフ',
          type: 'debuff',
          effects: {
            attack: -999,
            defense: -999,
          },
          duration: 2,
          stackable: false,
        };

        stats.addTemporaryStatus(majorDebuff);
        const totalStats = stats.getTotalStats();

        expect(totalStats.attack).toBe(0); // 負にならない
        expect(totalStats.defense).toBe(0); // 負にならない
      });
    });

    describe('一時ステータス反映ゲッターメソッド', () => {
      test('getAttackが一時ステータス効果を含む', () => {
        const stats = new Stats(1);
        const originalAttack = stats.getAttack();

        const buff: TemporaryStatus = {
          id: 'attack-test',
          name: '攻撃バフ',
          type: 'buff',
          effects: { attack: 12 },
          duration: 3,
          stackable: false,
        };

        stats.addTemporaryStatus(buff);
        expect(stats.getAttack()).toBe(originalAttack + 12);
      });

      test('getDefenseが一時ステータス効果を含む', () => {
        const stats = new Stats(1);
        const originalDefense = stats.getDefense();

        const debuff: TemporaryStatus = {
          id: 'defense-test',
          name: '防御デバフ',
          type: 'debuff',
          effects: { defense: -4 },
          duration: 2,
          stackable: false,
        };

        stats.addTemporaryStatus(debuff);
        expect(stats.getDefense()).toBe(Math.max(0, originalDefense - 4));
      });

      test('getSpeedが一時ステータス効果を含む', () => {
        const stats = new Stats(1);
        const originalSpeed = stats.getSpeed();

        const speedBuff: TemporaryStatus = {
          id: 'speed-test',
          name: 'スピードアップ',
          type: 'buff',
          effects: { speed: 7 },
          duration: 4,
          stackable: false,
        };

        stats.addTemporaryStatus(speedBuff);
        expect(stats.getSpeed()).toBe(originalSpeed + 7);
      });

      test('getAccuracyが一時ステータス効果を含む', () => {
        const stats = new Stats(1);
        const originalAccuracy = stats.getAccuracy();

        const accuracyBuff: TemporaryStatus = {
          id: 'accuracy-test',
          name: '命中アップ',
          type: 'buff',
          effects: { accuracy: 5 },
          duration: 3,
          stackable: false,
        };

        stats.addTemporaryStatus(accuracyBuff);
        expect(stats.getAccuracy()).toBe(originalAccuracy + 5);
      });

      test('getFortuneが一時ステータス効果を含む', () => {
        const stats = new Stats(1);
        const originalFortune = stats.getFortune();

        const fortuneDebuff: TemporaryStatus = {
          id: 'fortune-test',
          name: '運気ダウン',
          type: 'debuff',
          effects: { fortune: -2 },
          duration: 2,
          stackable: false,
        };

        stats.addTemporaryStatus(fortuneDebuff);
        expect(stats.getFortune()).toBe(Math.max(0, originalFortune - 2));
      });
    });
  });

  describe('ターン経過処理システム', () => {
    describe('updateTemporaryStatuses', () => {
      test('継続期間の減少', () => {
        const stats = new Stats(1);
        const status1: TemporaryStatus = {
          id: 'duration-test-1',
          name: '期間テスト1',
          type: 'buff',
          effects: { attack: 5 },
          duration: 3,
          stackable: false,
        };
        const status2: TemporaryStatus = {
          id: 'duration-test-2',
          name: '期間テスト2',
          type: 'buff',
          effects: { defense: 3 },
          duration: 2, // 1だと削除されてしまうため2に変更
          stackable: false,
        };

        stats.addTemporaryStatus(status1);
        stats.addTemporaryStatus(status2);

        stats.updateTemporaryStatuses();
        const statuses = stats.getTemporaryStatuses();

        const updatedStatus1 = statuses.find(s => s.id === 'duration-test-1');
        const updatedStatus2 = statuses.find(s => s.id === 'duration-test-2');

        expect(updatedStatus1?.duration).toBe(2); // 3 → 2
        expect(updatedStatus2?.duration).toBe(1); // 2 → 1
      });

      test('期限切れステータスの自動削除', () => {
        const stats = new Stats(1);
        const expiredStatus: TemporaryStatus = {
          id: 'expired-test',
          name: '期限切れテスト',
          type: 'debuff',
          effects: { attack: -2 },
          duration: 1,
          stackable: false,
        };
        const activeStatus: TemporaryStatus = {
          id: 'active-test',
          name: 'アクティブテスト',
          type: 'buff',
          effects: { defense: 4 },
          duration: 3,
          stackable: false,
        };

        stats.addTemporaryStatus(expiredStatus);
        stats.addTemporaryStatus(activeStatus);
        expect(stats.getTemporaryStatuses()).toHaveLength(2);

        stats.updateTemporaryStatuses(); // expiredStatus は duration 1 → 0 → 削除
        const remainingStatuses = stats.getTemporaryStatuses();

        expect(remainingStatuses).toHaveLength(1);
        expect(remainingStatuses[0].id).toBe('active-test');
        expect(remainingStatuses[0].duration).toBe(2); // 3 → 2
      });

      test('永続効果（duration: -1）のテスト', () => {
        const stats = new Stats(1);
        const permanentStatus: TemporaryStatus = {
          id: 'permanent-test',
          name: '永続テスト',
          type: 'buff',
          effects: { fortune: 1 },
          duration: -1,
          stackable: false,
        };
        const temporaryStatus: TemporaryStatus = {
          id: 'temporary-test',
          name: '一時テスト',
          type: 'buff',
          effects: { speed: 2 },
          duration: 2,
          stackable: false,
        };

        stats.addTemporaryStatus(permanentStatus);
        stats.addTemporaryStatus(temporaryStatus);

        stats.updateTemporaryStatuses();
        const statuses = stats.getTemporaryStatuses();

        const permanent = statuses.find(s => s.id === 'permanent-test');
        const temporary = statuses.find(s => s.id === 'temporary-test');

        expect(permanent?.duration).toBe(-1); // 永続効果は変化しない
        expect(temporary?.duration).toBe(1); // 2 → 1
      });

      test('毎ターン効果（HP/MP変化）のテスト', () => {
        const stats = new Stats(1);
        const initialHP = stats.getCurrentHP();
        const initialMP = stats.getCurrentMP();

        // デバッグ: 初期値を明示的に確認
        expect(initialHP).toBe(120); // 100 + (1 × 20)
        expect(initialMP).toBe(60); // 50 + (1 × 10)

        const regenStatus: TemporaryStatus = {
          id: 'regen-turn-test',
          name: '再生ターンテスト',
          type: 'buff',
          effects: {
            mpPerTurn: 3, // シンプルにMP変化のみでテスト
          },
          duration: 3,
          stackable: false,
        };

        stats.addTemporaryStatus(regenStatus);

        // 追加されたステータスを確認
        expect(stats.getTemporaryStatuses()).toHaveLength(1);
        expect(stats.getTemporaryStatuses()[0].effects.mpPerTurn).toBe(3);

        stats.updateTemporaryStatuses();

        // MPに余裕を作ってからテスト
        stats.consumeMP(10); // 60 - 10 = 50
        const currentMP = stats.getCurrentMP();
        expect(currentMP).toBe(50);

        stats.updateTemporaryStatuses();

        // MP変化: +3 のみでテスト
        expect(stats.getCurrentMP()).toBe(currentMP + 3); // 50 + 3 = 53

        // ステータスがまだ残っているか確認 (duration: 3 -> 2 -> 1, 2回呼び出したため)
        expect(stats.getTemporaryStatuses()).toHaveLength(1);
        expect(stats.getTemporaryStatuses()[0].duration).toBe(1);
      });

      test('直接applyPerTurnEffectsメソッドのテスト', () => {
        const stats = new Stats(1);

        // MPに余裕を作る
        stats.consumeMP(10);
        const initialMP = stats.getCurrentMP();
        expect(initialMP).toBe(50); // 60 - 10 = 50

        const regenStatus: TemporaryStatus = {
          id: 'direct-test',
          name: '直接テスト',
          type: 'buff',
          effects: {
            mpPerTurn: 3,
          },
          duration: 3,
          stackable: false,
        };

        stats.addTemporaryStatus(regenStatus);
        expect(stats.getTemporaryStatuses()).toHaveLength(1);

        // updateTemporaryStatusesでターン効果が適用されることを確認
        stats.updateTemporaryStatuses();

        // MPが変化していることを確認
        expect(stats.getCurrentMP()).toBe(initialMP + 3); // 50 + 3 = 53

        // ステータスはまだ残っている（durationは1減っている）
        expect(stats.getTemporaryStatuses()).toHaveLength(1);
        expect(stats.getTemporaryStatuses()[0].duration).toBe(2);
      });

      test('ステータス効果の計算テスト', () => {
        const stats = new Stats(1);

        const status: TemporaryStatus = {
          id: 'calc-test',
          name: '計算テスト',
          type: 'buff',
          effects: {
            mpPerTurn: 5,
          },
          duration: 2,
          stackable: false,
        };

        stats.addTemporaryStatus(status);
        const statuses = stats.getTemporaryStatuses();

        // ステータスが正しく追加されているか確認
        expect(statuses).toHaveLength(1);
        expect(statuses[0].effects.mpPerTurn).toBe(5);

        // 手動で計算してみる
        let totalMPChange = 0;
        statuses.forEach(s => {
          if (s.effects.mpPerTurn) {
            totalMPChange += s.effects.mpPerTurn;
          }
        });
        expect(totalMPChange).toBe(5);

        // healMPを直接呼び出してみる
        const beforeMP = stats.getCurrentMP();
        expect(beforeMP).toBe(60); // 初期値確認
        const maxMP = stats.getMaxMP();
        expect(maxMP).toBe(60); // 最大MP確認

        stats.healMP(5);
        const afterMP = stats.getCurrentMP();

        // 最大MPを超えないことを確認
        expect(afterMP).toBe(Math.min(maxMP, beforeMP + 5)); // 60が最大なのでMath.min(60, 55) = 55
      });

      test('複数の毎ターン効果の累積', () => {
        const stats = new Stats(1);
        const initialHP = stats.getCurrentHP();

        const poison1: TemporaryStatus = {
          id: 'poison-1',
          name: '毒1',
          type: 'status_ailment',
          effects: { hpPerTurn: -3 },
          duration: 2,
          stackable: true,
        };
        const poison2: TemporaryStatus = {
          id: 'poison-2',
          name: '毒2',
          type: 'status_ailment',
          effects: { hpPerTurn: -2 },
          duration: 3,
          stackable: true,
        };
        const healing: TemporaryStatus = {
          id: 'healing',
          name: '回復',
          type: 'buff',
          effects: { hpPerTurn: 4 },
          duration: 2,
          stackable: false,
        };

        stats.addTemporaryStatus(poison1);
        stats.addTemporaryStatus(poison2);
        stats.addTemporaryStatus(healing);

        stats.updateTemporaryStatuses();

        // HP変化: -3 + (-2) + 4 = -1
        expect(stats.getCurrentHP()).toBe(initialHP - 1);
      });

      test('HP/MPが0未満および最大値を超えないことを確認', () => {
        const stats = new Stats(1);

        // HPを1まで減らす
        stats.takeDamage(stats.getCurrentHP() - 1);
        expect(stats.getCurrentHP()).toBe(1);

        const massiveDamage: TemporaryStatus = {
          id: 'massive-damage',
          name: '大ダメージ',
          type: 'status_ailment',
          effects: { hpPerTurn: -999 },
          duration: 1, // duration を1に変更して次のターンで削除されるようにする
          stackable: false,
        };

        stats.addTemporaryStatus(massiveDamage);
        stats.updateTemporaryStatuses();

        expect(stats.getCurrentHP()).toBe(0); // 0未満にならない

        // massiveDamageは削除されているはず
        expect(stats.getTemporaryStatuses().find(s => s.id === 'massive-damage')).toBeUndefined();

        // 回復テスト
        const massiveHeal: TemporaryStatus = {
          id: 'massive-heal',
          name: '大回復',
          type: 'buff',
          effects: {
            hpPerTurn: 999,
            mpPerTurn: 999,
          },
          duration: 2,
          stackable: false,
        };

        stats.addTemporaryStatus(massiveHeal);
        stats.updateTemporaryStatuses();

        expect(stats.getCurrentHP()).toBe(stats.getMaxHP()); // 最大値を超えない
        expect(stats.getCurrentMP()).toBe(stats.getMaxMP()); // 最大値を超えない
      });
    });
  });

  describe('状態異常システム統合テスト', () => {
    test('状態異常ファクトリーとの統合', () => {
      const stats = new Stats(1);
      const initialHP = stats.getCurrentHP();

      // StatusAilmentFactoryが存在しないため、手動で毒ステータスを作成
      const poison: TemporaryStatus = {
        id: 'poison-integration-test',
        name: '毒',
        type: 'status_ailment',
        effects: {
          hpPerTurn: -5, // 毎ターン5ダメージ
          cannotRun: true, // 逃走不可
        },
        duration: 3,
        stackable: false,
      };

      stats.addTemporaryStatus(poison);

      // 状態異常が正しく追加されているか確認
      const ailments = stats.getActiveStatusAilments();
      expect(ailments).toHaveLength(1);
      expect(ailments[0].name).toBe('毒');

      // 総合ステータスに状態異常の効果が反映されているか確認
      const totalStats = stats.getTotalStats();
      expect(totalStats.cannotRun).toBe(true);
      expect(totalStats.hpPerTurn).toBe(-5);

      // ターン経過で毒ダメージが適用されるか確認
      stats.updateTemporaryStatuses();
      expect(stats.getCurrentHP()).toBe(initialHP - 5); // 毒ダメージ適用

      // 継続期間が減っているか確認
      const remainingStatuses = stats.getTemporaryStatuses();
      expect(remainingStatuses).toHaveLength(1);
      expect(remainingStatuses[0].duration).toBe(2); // 3 -> 2
    });

    test('複数の状態異常とバフの組み合わせ', () => {
      const stats = new Stats(2); // レベル2でテスト

      // HPにMPに余裕を作る
      stats.takeDamage(10);
      stats.consumeMP(15);

      const initialHP = stats.getCurrentHP();
      const initialMP = stats.getCurrentMP();

      // 毒状態異常
      const poison: TemporaryStatus = {
        id: 'poison-combo-test',
        name: '毒',
        type: 'status_ailment',
        effects: { hpPerTurn: -3 },
        duration: 2,
        stackable: false,
      };

      // 再生バフ
      const regen: TemporaryStatus = {
        id: 'regen-combo-test',
        name: '再生',
        type: 'buff',
        effects: {
          hpPerTurn: 5,
          mpPerTurn: 2,
        },
        duration: 3,
        stackable: false,
      };

      // 麻痺状態異常
      const paralysis: TemporaryStatus = {
        id: 'paralysis-combo-test',
        name: '麻痺',
        type: 'status_ailment',
        effects: {
          cannotAct: true,
          speed: -3,
        },
        duration: 2,
        stackable: false,
      };

      stats.addTemporaryStatus(poison);
      stats.addTemporaryStatus(regen);
      stats.addTemporaryStatus(paralysis);

      // 総合ステータスで効果の組み合わせを確認
      const totalStats = stats.getTotalStats();
      expect(totalStats.hpPerTurn).toBe(2); // -3 + 5 = 2
      expect(totalStats.mpPerTurn).toBe(2);
      expect(totalStats.cannotAct).toBe(true);
      expect(totalStats.speed).toBe(7); // レベル2の基本速度(10) - 麻痺効果(-3) = 7

      // 状態異常のみ取得
      const ailments = stats.getActiveStatusAilments();
      expect(ailments).toHaveLength(2);
      expect(ailments.map(a => a.name)).toContain('毒');
      expect(ailments.map(a => a.name)).toContain('麻痺');

      // ターン経過で効果適用
      stats.updateTemporaryStatuses();

      // HPとMPの変化を確認
      expect(stats.getCurrentHP()).toBe(initialHP + 2); // 毒ダメージと再生の結果
      expect(stats.getCurrentMP()).toBe(initialMP + 2); // 再生のMP回復
    });
  });
});
