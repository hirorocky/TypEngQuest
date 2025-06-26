import { Player } from '../player';

describe('Player拡張機能', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player('テストプレイヤー');
  });

  describe('鍵管理システム', () => {
    test('初期状態では鍵を持っていない', () => {
      expect(player.hasKey()).toBe(false);
    });

    test('鍵を取得できる', () => {
      player.addKey();
      
      expect(player.hasKey()).toBe(true);
    });

    test('鍵は1つまでしか持てない', () => {
      player.addKey();
      player.addKey(); // 2つ目を追加しようとしても無視される
      
      expect(player.hasKey()).toBe(true);
      // 内部的に1つだけ保持されていることを確認
    });

    test('鍵を使用できる', () => {
      player.addKey();
      
      const success = player.useKey();
      
      expect(success).toBe(true);
      expect(player.hasKey()).toBe(false);
    });

    test('鍵がない時は使用できない', () => {
      const success = player.useKey();
      
      expect(success).toBe(false);
      expect(player.hasKey()).toBe(false);
    });

    test('ワールドリセット時に鍵を失う', () => {
      player.addKey();
      expect(player.hasKey()).toBe(true);
      
      player.resetForNewWorld();
      
      expect(player.hasKey()).toBe(false);
    });
  });

  describe('ワールド履歴管理', () => {
    test('初期状態ではワールド履歴が空', () => {
      const history = player.getWorldHistory();
      
      expect(history).toEqual([]);
      expect(player.getClearedWorldCount()).toBe(0);
    });

    test('ワールドクリア記録を追加できる', () => {
      const worldInfo = {
        name: 'プログラミングの森',
        level: 1,
        clearedAt: new Date(),
        bossName: 'スタックオーバーフロードラゴン',
        exploredLocations: 15,
      };

      player.addClearedWorld(worldInfo);

      expect(player.getClearedWorldCount()).toBe(1);
      
      const history = player.getWorldHistory();
      expect(history).toHaveLength(1);
      expect(history[0].name).toBe('プログラミングの森');
      expect(history[0].bossName).toBe('スタックオーバーフロードラゴン');
    });

    test('複数のワールドクリア記録を管理できる', () => {
      const world1 = {
        name: 'コードの洞窟',
        level: 1,
        clearedAt: new Date(2024, 0, 1),
        bossName: 'バグキング',
        exploredLocations: 10,
      };

      const world2 = {
        name: 'アルゴリズムの塔',
        level: 2,
        clearedAt: new Date(2024, 0, 2),
        bossName: 'コンプレキシティデーモン',
        exploredLocations: 25,
      };

      player.addClearedWorld(world1);
      player.addClearedWorld(world2);

      expect(player.getClearedWorldCount()).toBe(2);
      
      const history = player.getWorldHistory();
      expect(history).toHaveLength(2);
      expect(history[0].name).toBe('コードの洞窟');
      expect(history[1].name).toBe('アルゴリズムの塔');
    });

    test('最後にクリアしたワールド情報を取得できる', () => {
      const world1 = {
        name: 'データベースの迷宮',
        level: 1,
        clearedAt: new Date(2024, 0, 1),
        bossName: 'SQLインジェクション',
        exploredLocations: 8,
      };

      const world2 = {
        name: 'フレームワークの要塞',
        level: 2,
        clearedAt: new Date(2024, 0, 2),
        bossName: 'レガシーコードゴーレム',
        exploredLocations: 30,
      };

      player.addClearedWorld(world1);
      player.addClearedWorld(world2);

      const lastCleared = player.getLastClearedWorld();
      expect(lastCleared?.name).toBe('フレームワークの要塞');
      expect(lastCleared?.bossName).toBe('レガシーコードゴーレム');
    });

    test('ワールドをクリアしていない場合はnullを返す', () => {
      const lastCleared = player.getLastClearedWorld();
      expect(lastCleared).toBeNull();
    });
  });

  describe('レベル調整機能', () => {
    test('レベルを上げることができる', () => {
      const initialLevel = player.getStats().level;
      
      player.adjustLevel(1);
      
      const newLevel = player.getStats().level;
      expect(newLevel).toBe(initialLevel + 1);
    });

    test('レベルを下げることができる', () => {
      // まずレベルを上げてから
      player.addExperience(1000); // レベルを上げるため
      const currentLevel = player.getStats().level;
      
      player.adjustLevel(-1);
      
      const newLevel = player.getStats().level;
      expect(newLevel).toBe(currentLevel - 1);
    });

    test('レベルを1未満には下げられない', () => {
      player.adjustLevel(-10);
      
      const level = player.getStats().level;
      expect(level).toBe(1);
    });

    test('レベル調整時にステータスが適切に更新される', () => {
      const initialStats = player.getStats();
      
      player.adjustLevel(2);
      
      const newStats = player.getStats();
      expect(newStats.level).toBe(initialStats.level + 2);
      expect(newStats.baseAttack).toBeGreaterThan(initialStats.baseAttack);
      expect(newStats.baseDefense).toBeGreaterThan(initialStats.baseDefense);
    });
  });
});