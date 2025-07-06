/**
 * Worldクラスのテスト
 */

import { World } from './World';
import { FileSystem } from './FileSystem';
import { DomainType, getDomainData } from './domains';

describe('World', () => {
  describe('コンストラクタ', () => {
    test('Worldインスタンスが正しく作成される', () => {
      const domain = getDomainData('tech-startup')!;
      const fileSystem = FileSystem.createTestStructure();
      const world = new World(domain, 1, fileSystem);

      expect(world.domain).toBe(domain);
      expect(world.level).toBe(1);
      expect(world.fileSystem).toBe(fileSystem);
      expect(world.currentPath).toBe('/');
      expect(world.keyLocation).toBeNull();
      expect(world.bossLocation).toBeNull();
      expect(world.isExplored('/'));
    });

    test('レベル1未満はエラー', () => {
      const domain = getDomainData('tech-startup')!;
      const fileSystem = FileSystem.createTestStructure();

      expect(() => new World(domain, 0, fileSystem)).toThrow(
        'ワールドレベルは1以上である必要があります'
      );
      expect(() => new World(domain, -1, fileSystem)).toThrow(
        'ワールドレベルは1以上である必要があります'
      );
    });
  });

  describe('プレイヤー位置管理', () => {
    let world: World;

    beforeEach(() => {
      const domain = getDomainData('tech-startup')!;
      const fileSystem = FileSystem.createTestStructure();
      world = new World(domain, 1, fileSystem);
    });

    test('setCurrentPathで現在位置を変更できる', () => {
      world.setCurrentPath('/projects/game-studio');
      expect(world.currentPath).toBe('/projects/game-studio');
    });

    test('存在しないパスは設定できない', () => {
      expect(() => world.setCurrentPath('/nonexistent')).toThrow(
        '指定されたパスは存在しません: /nonexistent'
      );
    });

    test('getCurrentNodeで現在のノードを取得できる', () => {
      const rootNode = world.getCurrentNode();
      expect(rootNode?.name).toBe('projects');

      world.setCurrentPath('/projects/game-studio');
      const gameStudioNode = world.getCurrentNode();
      expect(gameStudioNode?.name).toBe('game-studio');
    });
  });

  describe('探索履歴管理', () => {
    let world: World;

    beforeEach(() => {
      const domain = getDomainData('game-studio')!;
      const fileSystem = FileSystem.createTestStructure();
      world = new World(domain, 1, fileSystem);
    });

    test('markAsExploredで探索済みにできる', () => {
      world.markAsExplored('/projects/game-studio');
      expect(world.isExplored('/projects/game-studio')).toBe(true);
    });

    test('初期状態ではルートのみ探索済み', () => {
      expect(world.isExplored('/')).toBe(true);
      expect(world.isExplored('/projects')).toBe(true);
      expect(world.isExplored('/projects/game-studio')).toBe(false);
    });

    test('getExploredPathsで探索済みパス一覧を取得できる', () => {
      world.markAsExplored('/projects/game-studio');
      world.markAsExplored('/projects/game-studio/assets');

      const exploredPaths = world.getExploredPaths();
      expect(exploredPaths).toContain('/');
      expect(exploredPaths).toContain('/projects');
      expect(exploredPaths).toContain('/projects/game-studio');
      expect(exploredPaths).toContain('/projects/game-studio/assets');
    });
  });

  describe('特殊アイテム管理', () => {
    let world: World;

    beforeEach(() => {
      const domain = getDomainData('web-agency')!;
      const fileSystem = FileSystem.createTestStructure();
      world = new World(domain, 1, fileSystem);
    });

    test('setKeyLocationで鍵の場所を設定できる', () => {
      world.setKeyLocation('/projects/game-studio/config/config.json');
      expect(world.keyLocation).toBe('/projects/game-studio/config/config.json');
    });

    test('setBossLocationでボスの場所を設定できる', () => {
      world.setBossLocation('/projects/game-studio');
      expect(world.bossLocation).toBe('/projects/game-studio');
    });

    test('hasKeyで鍵の所持状態を管理できる', () => {
      expect(world.hasKey).toBe(false);

      world.obtainKey();
      expect(world.hasKey).toBe(true);

      world.useKey();
      expect(world.hasKey).toBe(false);
    });
  });

  describe('ワールド情報', () => {
    test('getMaxDepthでワールドの最大深度を取得できる', () => {
      const domain = getDomainData('tech-startup')!;
      const fileSystem = FileSystem.createTestStructure();

      const world1 = new World(domain, 1, fileSystem);
      expect(world1.getMaxDepth()).toBe(4); // 3 + 1

      const world5 = new World(domain, 5, fileSystem);
      expect(world5.getMaxDepth()).toBe(8); // 3 + 5

      const world10 = new World(domain, 10, fileSystem);
      expect(world10.getMaxDepth()).toBe(10); // 最大10
    });

    test('getDomainNameでドメイン名を取得できる', () => {
      const techDomain = getDomainData('tech-startup')!;
      const gameStudioDomain = getDomainData('game-studio')!;

      const fileSystem = FileSystem.createTestStructure();
      const techWorld = new World(techDomain, 1, fileSystem);
      const gameWorld = new World(gameStudioDomain, 2, fileSystem);

      expect(techWorld.getDomainName()).toBe('Tech Startup');
      expect(gameWorld.getDomainName()).toBe('Game Studio');
    });

    test('getDomainTypeでドメインタイプを取得できる', () => {
      const domain = getDomainData('web-agency')!;
      const fileSystem = FileSystem.createTestStructure();
      const world = new World(domain, 3, fileSystem);

      expect(world.getDomainType()).toBe('web-agency');
    });
  });

  describe('ステート管理', () => {
    test('toJSONでワールド状態をシリアライズできる', () => {
      const domain = getDomainData('tech-startup')!;
      const fileSystem = FileSystem.createTestStructure();
      const world = new World(domain, 2, fileSystem);

      world.setCurrentPath('/projects/game-studio');
      world.markAsExplored('/projects/game-studio');
      world.setKeyLocation('/projects/game-studio/config/config.json');
      world.setBossLocation('/projects/game-studio');
      world.obtainKey();

      const json = world.toJSON();

      expect(json.domainType).toBe('tech-startup');
      expect(json.level).toBe(2);
      expect(json.currentPath).toBe('/projects/game-studio');
      expect(json.exploredPaths).toContain('/projects/game-studio');
      expect(json.keyLocation).toBe('/projects/game-studio/config/config.json');
      expect(json.bossLocation).toBe('/projects/game-studio');
      expect(json.hasKey).toBe(true);
    });

    test('fromJSONでワールド状態を復元できる', () => {
      const domain = getDomainData('game-studio')!;
      const fileSystem = FileSystem.createTestStructure();

      const worldData = {
        domainType: 'game-studio' as DomainType,
        level: 3,
        currentPath: '/projects/game-studio/src',
        exploredPaths: ['/projects', '/projects/game-studio', '/projects/game-studio/src'],
        keyLocation: '/projects/game-studio/config/settings.yaml',
        bossLocation: '/projects/game-studio',
        hasKey: false,
      };

      const world = World.fromJSON(worldData, fileSystem);

      expect(world.domain).toBe(domain);
      expect(world.level).toBe(3);
      expect(world.currentPath).toBe('/projects/game-studio/src');
      expect(world.isExplored('/projects/game-studio/src')).toBe(true);
      expect(world.keyLocation).toBe('/projects/game-studio/config/settings.yaml');
      expect(world.bossLocation).toBe('/projects/game-studio');
      expect(world.hasKey).toBe(false);
    });

    test('無効なドメインタイプでfromJSONするとエラー', () => {
      const fileSystem = FileSystem.createTestStructure();

      const invalidData = {
        domainType: 'invalid-domain' as DomainType,
        level: 1,
        currentPath: '/',
        exploredPaths: ['/'],
        keyLocation: null,
        bossLocation: null,
        hasKey: false,
      };

      expect(() => World.fromJSON(invalidData, fileSystem)).toThrow(
        '無効なドメインタイプです: invalid-domain'
      );
    });
  });

  describe('エラーケース', () => {
    test('存在しないファイルシステムパスでの初期化', () => {
      const domain = getDomainData('tech-startup')!;
      const fileSystem = FileSystem.createTestStructure();
      const world = new World(domain, 1, fileSystem);

      expect(() => world.setKeyLocation('/nonexistent/key.json')).toThrow(
        '指定されたパスは存在しません: /nonexistent/key.json'
      );
      expect(() => world.setBossLocation('/nonexistent/boss')).toThrow(
        '指定されたパスは存在しません: /nonexistent/boss'
      );
    });
  });
});
