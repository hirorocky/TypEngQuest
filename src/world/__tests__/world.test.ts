import { World } from '../world';
import { Boss } from '../boss';
import { Map } from '../map';
import { Location, LocationType } from '../location';

describe('Worldクラス', () => {
  let world: World;
  let map: Map;

  beforeEach(() => {
    map = new Map();
    world = new World('テストワールド', 1, map);
  });

  describe('基本プロパティ', () => {
    test('ワールド名を正しく設定できる', () => {
      expect(world.getName()).toBe('テストワールド');
    });

    test('ワールドレベルを正しく設定できる', () => {
      expect(world.getLevel()).toBe(1);
    });

    test('初期状態では未クリア', () => {
      expect(world.isCleared()).toBe(false);
    });

    test('マップを正しく関連付けている', () => {
      expect(world.getMap()).toBe(map);
    });

    test('初期状態ではボスが設定されていない', () => {
      expect(world.getBoss()).toBeNull();
    });
  });

  describe('ボス管理', () => {
    test('ボスを設定できる', () => {
      const boss = new Boss('テストボス', 'スタックオーバーフロードラゴン', 100, 20);
      
      world.setBoss(boss);
      
      expect(world.getBoss()).toBe(boss);
      expect(world.hasBoss()).toBe(true);
    });

    test('ボスを倒すとワールドがクリア状態になる', () => {
      const boss = new Boss('テストボス', 'バグキング', 100, 20);
      world.setBoss(boss);
      
      world.defeatBoss();
      
      expect(world.isCleared()).toBe(true);
      expect(world.getBoss()?.isDefeated()).toBe(true);
    });

    test('ボスが設定されていない状態でdefeatBossを呼ぶとエラー', () => {
      expect(() => world.defeatBoss()).toThrow('No boss set for this world');
    });
  });

  describe('ボスディレクトリ管理', () => {
    test('ボスディレクトリを設定できる', () => {
      const bossLocation = new Location('boss_chamber', '/deep/dungeon', LocationType.DIRECTORY);
      
      world.setBossLocation(bossLocation);
      
      expect(world.getBossLocation()).toBe(bossLocation);
    });

    test('ボスディレクトリが最深部にあることを確認', () => {
      // マップに階層構造を追加
      map.addLocation(new Location('level1', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('level2', '/level1', LocationType.DIRECTORY));
      map.addLocation(new Location('level3', '/level1/level2', LocationType.DIRECTORY));
      map.addLocation(new Location('boss_chamber', '/level1/level2/level3', LocationType.DIRECTORY));
      
      const bossLocation = map.findLocation('/level1/level2/level3/boss_chamber');
      world.setBossLocation(bossLocation!);
      
      expect(world.isBossAtMaxDepth()).toBe(true);
    });

    test('ボスディレクトリが最深部にない場合はfalseを返す', () => {
      map.addLocation(new Location('level1', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('level2', '/level1', LocationType.DIRECTORY));
      map.addLocation(new Location('boss_chamber', '/level1', LocationType.DIRECTORY));
      map.addLocation(new Location('deeper', '/level1/level2', LocationType.DIRECTORY));
      
      const bossLocation = map.findLocation('/level1/boss_chamber');
      world.setBossLocation(bossLocation!);
      
      expect(world.isBossAtMaxDepth()).toBe(false);
    });
  });

  describe('鍵アクセス制御', () => {
    test('鍵が必要なディレクトリかどうかを判定できる', () => {
      const bossLocation = new Location('boss_chamber', '/deep', LocationType.DIRECTORY);
      world.setBossLocation(bossLocation);
      
      expect(world.requiresKey('/deep/boss_chamber')).toBe(true);
      expect(world.requiresKey('/deep/other_location')).toBe(false);
    });

    test('鍵を使ってボスディレクトリにアクセスできる', () => {
      const bossLocation = new Location('boss_chamber', '/deep', LocationType.DIRECTORY);
      world.setBossLocation(bossLocation);
      
      const result = world.tryAccessWithKey('/deep/boss_chamber');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('boss_chamber');
    });

    test('鍵なしでボスディレクトリにアクセスしようとするとUnix風エラー', () => {
      const bossLocation = new Location('boss_chamber', '/deep', LocationType.DIRECTORY);
      world.setBossLocation(bossLocation);
      
      const result = world.tryAccessWithoutKey('/deep/boss_chamber');
      
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Permission denied/);
      expect(result.message).toMatch(/boss_chamber/);
    });
  });

  describe('ワールド統計情報', () => {
    test('探索済み場所数を取得できる', () => {
      map.addLocation(new Location('src', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('docs', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('app.js', '/src', LocationType.FILE));
      
      // いくつかの場所を探索済みにする
      const srcLocation = map.findLocation('/src');
      const appLocation = map.findLocation('/src/app.js');
      srcLocation?.markAsExplored();
      appLocation?.markAsExplored();
      
      expect(world.getExploredLocationCount()).toBe(2);
    });

    test('総場所数を取得できる', () => {
      map.addLocation(new Location('src', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('docs', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('app.js', '/src', LocationType.FILE));
      map.addLocation(new Location('readme.md', '/', LocationType.FILE));
      
      expect(world.getTotalLocationCount()).toBe(4);
    });

    test('探索進捗率を計算できる', () => {
      map.addLocation(new Location('src', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('docs', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('app.js', '/src', LocationType.FILE));
      map.addLocation(new Location('readme.md', '/', LocationType.FILE));
      
      // 2つの場所を探索済みにする
      const srcLocation = map.findLocation('/src');
      const appLocation = map.findLocation('/src/app.js');
      srcLocation?.markAsExplored();
      appLocation?.markAsExplored();
      
      expect(world.getExplorationProgress()).toBe(0.5); // 2/4 = 0.5
    });
  });

  describe('ワールド完了情報', () => {
    test('ワールドクリア情報を生成できる', () => {
      const boss = new Boss('TestBoss', 'コンパイルエラーデーモン', 150, 25);
      world.setBoss(boss);
      
      // 探索を進める
      map.addLocation(new Location('src', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('app.js', '/src', LocationType.FILE));
      map.findLocation('/src')?.markAsExplored();
      map.findLocation('/src/app.js')?.markAsExplored();
      
      world.defeatBoss();
      
      const clearInfo = world.generateClearInfo();
      
      expect(clearInfo.name).toBe('テストワールド');
      expect(clearInfo.level).toBe(1);
      expect(clearInfo.bossName).toBe('コンパイルエラーデーモン');
      expect(clearInfo.exploredLocations).toBe(2);
      expect(clearInfo.clearedAt).toBeInstanceOf(Date);
    });

    test('未クリア状態でクリア情報生成を試みるとエラー', () => {
      expect(() => world.generateClearInfo()).toThrow('World is not cleared yet');
    });
  });
});