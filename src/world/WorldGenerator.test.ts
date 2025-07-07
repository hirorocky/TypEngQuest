/**
 * WorldGeneratorクラスのテスト
 */

import { WorldGenerator } from './WorldGenerator';
import { FileSystem } from './FileSystem';
import { World } from './World';
import { DomainType, getDomainData } from './domains';

describe('WorldGenerator', () => {
  describe('constructor', () => {
    test('WorldGeneratorインスタンスが正しく作成される', () => {
      const generator = new WorldGenerator();
      expect(generator).toBeDefined();
    });
  });

  describe('generateWorld', () => {
    let generator: WorldGenerator;

    beforeEach(() => {
      generator = new WorldGenerator();
    });

    test('指定されたドメインとレベルでワールドを生成できる', () => {
      // Math.randomをモックして決定的な生成を行う
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0.5);

      const world = generator.generateWorld('tech-startup', 1);

      expect(world).toBeInstanceOf(World);
      expect(world.getDomainType()).toBe('tech-startup');
      expect(world.level).toBe(1);
      expect(world.currentPath).toBe('/');
      expect(world.getMaxDepth()).toBe(4); // 3 + 1

      mockRandom.mockRestore();
    });

    test('異なるドメインタイプでワールドを生成できる', () => {
      // Math.randomをモックして決定的な生成を行う
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0.5);

      const world1 = generator.generateWorld('game-studio', 2);
      const world2 = generator.generateWorld('web-agency', 3);

      expect(world1.getDomainType()).toBe('game-studio');
      expect(world1.level).toBe(2);
      expect(world2.getDomainType()).toBe('web-agency');
      expect(world2.level).toBe(3);

      mockRandom.mockRestore();
    });

    test('生成されたワールドにファイルシステムが含まれる', () => {
      // Math.randomをモックして決定的な生成を行う
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0.5);

      const world = generator.generateWorld('tech-startup', 1);

      expect(world.fileSystem).toBeDefined();
      expect(world.fileSystem).toBeInstanceOf(FileSystem);

      // ルートディレクトリが存在する
      const rootNode = world.fileSystem.getNodeByPath('/');
      expect(rootNode).toBeDefined();
      expect(rootNode?.name).toBe('Tech Startup');

      mockRandom.mockRestore();
    });

    test('生成されたファイルシステムに適切な構造が含まれる', () => {
      // Math.randomをモックして決定的な生成を行う
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0.5);

      const world = generator.generateWorld('game-studio', 3);
      const fileSystem = world.fileSystem;

      // ルートディレクトリが存在する
      const rootNode = fileSystem.getNodeByPath('/');
      expect(rootNode).toBeDefined();
      expect(rootNode?.isDirectory()).toBe(true);

      // 最低でも1つのディレクトリが存在する
      expect(rootNode?.children.length).toBeGreaterThan(0);

      mockRandom.mockRestore();
    });

    test('異なるレベルで異なる深度のワールドが生成される', () => {
      // Math.randomをモックして決定的な生成を行う
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0.5);

      const world1 = generator.generateWorld('tech-startup', 1);
      const world5 = generator.generateWorld('tech-startup', 5);
      const world10 = generator.generateWorld('tech-startup', 10);

      expect(world1.getMaxDepth()).toBe(4);
      expect(world5.getMaxDepth()).toBe(8);
      expect(world10.getMaxDepth()).toBe(10); // 最大10

      mockRandom.mockRestore();
    });

    test('無効なドメインタイプでエラーが発生する', () => {
      expect(() => {
        generator.generateWorld('invalid-domain' as DomainType, 1);
      }).toThrow('無効なドメインタイプです: invalid-domain');
    });

    test('無効なレベルでエラーが発生する', () => {
      expect(() => {
        generator.generateWorld('tech-startup', 0);
      }).toThrow('ワールドレベルは1以上である必要があります');

      expect(() => {
        generator.generateWorld('tech-startup', -1);
      }).toThrow('ワールドレベルは1以上である必要があります');
    });
  });

  describe('generateRandomWorld', () => {
    let generator: WorldGenerator;

    beforeEach(() => {
      generator = new WorldGenerator();
    });

    test('ランダムなドメインでワールドを生成できる', () => {
      // Math.randomをモック
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0); // 最初のドメインを選択

      const world = generator.generateRandomWorld(2);

      expect(world).toBeInstanceOf(World);
      expect(world.level).toBe(2);
      expect(['tech-startup', 'game-studio', 'web-agency']).toContain(world.getDomainType());

      mockRandom.mockRestore();
    });

    test('無効なレベルでエラーが発生する', () => {
      expect(() => {
        generator.generateRandomWorld(0);
      }).toThrow('ワールドレベルは1以上である必要があります');
    });
  });

  describe('generateFileSystem', () => {
    let generator: WorldGenerator;

    beforeEach(() => {
      generator = new WorldGenerator();
    });

    test('指定されたドメインとレベルでファイルシステムを生成できる', () => {
      const domain = getDomainData('tech-startup')!;
      const fileSystem = generator.generateFileSystem(domain, 2);

      expect(fileSystem).toBeInstanceOf(FileSystem);

      // ルートノードが存在する
      const rootNode = fileSystem.getNodeByPath('/');
      expect(rootNode).toBeDefined();
      expect(rootNode?.name).toBe('Tech Startup');
    });

    test('生成されたファイルシステムに適切なファイルタイプが含まれる', () => {
      const domain = getDomainData('game-studio')!;
      const fileSystem = generator.generateFileSystem(domain, 3);

      // ファイルシステム内にモンスター、宝箱、イベント、セーブポイントファイルが存在するかチェック
      const allNodes = fileSystem.find('');
      const files = allNodes.filter(node => node.isFile());

      const monsterFiles = files.filter(file => file.fileType === 'monster');
      const treasureFiles = files.filter(file => file.fileType === 'treasure');
      const eventFiles = files.filter(file => file.fileType === 'event');
      const savePointFiles = files.filter(file => file.fileType === 'savepoint');

      expect(monsterFiles.length).toBeGreaterThan(0);
      expect(treasureFiles.length).toBeGreaterThan(0);
      expect(eventFiles.length).toBeGreaterThan(0);
      expect(savePointFiles.length).toBeGreaterThan(0);
    });

    test('深度制限が正しく適用される', () => {
      const domain = getDomainData('tech-startup')!;
      const fileSystem = generator.generateFileSystem(domain, 1);

      // 最大深度4（レベル1 = 3+1）のチェック
      const checkDepth = (node: any, currentDepth: number): number => {
        if (!node.isDirectory() || node.children.length === 0) {
          return currentDepth;
        }

        let maxChildDepth = currentDepth;
        for (const child of node.children) {
          const childDepth = checkDepth(child, currentDepth + 1);
          maxChildDepth = Math.max(maxChildDepth, childDepth);
        }
        return maxChildDepth;
      };

      const rootNode = fileSystem.getNodeByPath('/');
      const maxDepth = checkDepth(rootNode, 0);
      expect(maxDepth).toBeLessThanOrEqual(4);
    });
  });

  describe('placeSpecialItems', () => {
    let generator: WorldGenerator;

    beforeEach(() => {
      generator = new WorldGenerator();
    });

    test('鍵とボスの配置が正しく行われる', () => {
      // Math.randomをモックして決定的な生成を行う
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0.5);

      const world = generator.generateWorld('tech-startup', 2);

      // 鍵とボスが配置されているかチェック
      expect(world.keyLocation).toBeDefined();
      expect(world.bossLocation).toBeDefined();
      expect(world.keyLocation).not.toBeNull();
      expect(world.bossLocation).not.toBeNull();

      mockRandom.mockRestore();
    });

    test('鍵は宝箱ファイルに配置される', () => {
      // Math.randomをモックして決定的な生成を行う
      const mockRandom = jest.spyOn(Math, 'random');
      // 決定的な値をセットして一貫した構造を生成
      mockRandom.mockReturnValue(0.5);

      const world = generator.generateWorld('game-studio', 3);

      if (world.keyLocation) {
        const keyNode = world.fileSystem.getNodeByPath(world.keyLocation);
        expect(keyNode).toBeDefined();
        expect(keyNode?.isFile()).toBe(true);
        expect(keyNode?.fileType).toBe('treasure');
      }

      mockRandom.mockRestore();
    });

    test('ボスはディレクトリに配置される', () => {
      // Math.randomをモックして決定的な生成を行う
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0.5);

      const world = generator.generateWorld('web-agency', 2);

      if (world.bossLocation) {
        const bossNode = world.fileSystem.getNodeByPath(world.bossLocation);
        expect(bossNode).toBeDefined();
        expect(bossNode?.isDirectory()).toBe(true);
      }

      mockRandom.mockRestore();
    });

    test('鍵とボスは異なる場所に配置される', () => {
      // Math.randomをモックして決定的な生成を行う
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0.5);

      const world = generator.generateWorld('tech-startup', 3);

      expect(world.keyLocation).not.toBe(world.bossLocation);

      mockRandom.mockRestore();
    });
  });

  describe('エラーケース', () => {
    test('null/undefinedドメインでgenerateFileSystemを呼ぶとエラー', () => {
      const generator = new WorldGenerator();

      expect(() => {
        generator.generateFileSystem(null as any, 1);
      }).toThrow();

      expect(() => {
        generator.generateFileSystem(undefined as any, 1);
      }).toThrow();
    });
  });
});
