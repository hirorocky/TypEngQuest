/**
 * FileSystemクラスのテスト
 */

import { FileSystem } from './FileSystem';
import { FileNode, NodeType } from './FileNode';

describe('FileSystem', () => {
  let fileSystem: FileSystem;
  let root: FileNode;

  beforeEach(() => {
    // テスト用のファイルシステム構造を作成
    root = new FileNode('projects', NodeType.DIRECTORY);
    fileSystem = new FileSystem(root);
  });

  describe('コンストラクタ', () => {
    test('ファイルシステムが正しく初期化される', () => {
      expect(fileSystem.root).toBe(root);
      expect(fileSystem.currentNode).toBe(root);
    });
  });

  describe('pwd - 現在位置取得', () => {
    test('ルートディレクトリのパスが返される', () => {
      expect(fileSystem.pwd()).toBe('/projects');
    });

    test('サブディレクトリに移動後のパスが返される', () => {
      const gameDir = new FileNode('game-studio', NodeType.DIRECTORY);
      root.addChild(gameDir);

      fileSystem.cd('game-studio');
      expect(fileSystem.pwd()).toBe('/projects/game-studio');
    });
  });

  describe('cd - ディレクトリ移動', () => {
    beforeEach(() => {
      // テスト用の階層構造を作成
      const gameDir = new FileNode('game-studio', NodeType.DIRECTORY);
      const srcDir = new FileNode('src', NodeType.DIRECTORY);
      const configDir = new FileNode('config', NodeType.DIRECTORY);
      const mainFile = new FileNode('main.js', NodeType.FILE);

      root.addChild(gameDir);
      gameDir.addChild(srcDir);
      gameDir.addChild(configDir);
      srcDir.addChild(mainFile);
    });

    test('相対パスでのディレクトリ移動', () => {
      const result = fileSystem.cd('game-studio');
      expect(result.success).toBe(true);
      expect(fileSystem.pwd()).toBe('/projects/game-studio');
    });

    test('親ディレクトリへの移動 (..)', () => {
      fileSystem.cd('game-studio');
      fileSystem.cd('src');

      const result = fileSystem.cd('..');
      expect(result.success).toBe(true);
      expect(fileSystem.pwd()).toBe('/projects/game-studio');
    });

    test('ルートディレクトリへの移動 (~)', () => {
      fileSystem.cd('game-studio');
      fileSystem.cd('src');

      const result = fileSystem.cd('~');
      expect(result.success).toBe(true);
      expect(fileSystem.pwd()).toBe('/projects');
    });

    test('引数なしでのルートディレクトリへの移動', () => {
      fileSystem.cd('game-studio');

      const result = fileSystem.cd();
      expect(result.success).toBe(true);
      expect(fileSystem.pwd()).toBe('/projects');
    });

    test('絶対パスでの移動', () => {
      const result = fileSystem.cd('/projects/game-studio/src');
      expect(result.success).toBe(true);
      expect(fileSystem.pwd()).toBe('/projects/game-studio/src');
    });

    test('存在しないディレクトリへの移動はエラー', () => {
      const result = fileSystem.cd('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('ディレクトリが見つかりません');
      expect(fileSystem.pwd()).toBe('/projects'); // 移動していない
    });

    test('ファイルへの移動はエラー', () => {
      fileSystem.cd('game-studio/src');
      const result = fileSystem.cd('main.js');
      expect(result.success).toBe(false);
      expect(result.error).toContain('ディレクトリではありません');
    });

    test('ルートより上への移動はエラー', () => {
      const result = fileSystem.cd('..');
      expect(result.success).toBe(false);
      expect(result.error).toContain('ルートディレクトリより上には移動できません');
    });
  });

  describe('ls - ファイル一覧表示', () => {
    beforeEach(() => {
      // テスト用のファイル構造を作成
      const gameDir = new FileNode('game-studio', NodeType.DIRECTORY);
      const configFile = new FileNode('config.json', NodeType.FILE);
      const mainFile = new FileNode('main.js', NodeType.FILE);
      const hiddenFile = new FileNode('.hidden.yaml', NodeType.FILE);

      root.addChild(gameDir);
      root.addChild(configFile);
      root.addChild(mainFile);
      root.addChild(hiddenFile);
    });

    test('基本的なファイル一覧取得', () => {
      const result = fileSystem.ls();
      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(3); // 隠しファイル除く
      expect(result.files?.map(f => f.name)).toEqual(['game-studio', 'config.json', 'main.js']);
    });

    test('隠しファイルも含む一覧取得 (-a)', () => {
      const result = fileSystem.ls({ showHidden: true });
      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(4);
      expect(result.files?.map(f => f.name)).toEqual([
        'game-studio',
        '.hidden.yaml',
        'config.json',
        'main.js',
      ]);
    });

    test('詳細表示オプション (-l)', () => {
      const result = fileSystem.ls({ detailed: true });
      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(3);
      // 詳細表示では各ファイルの詳細情報が含まれる
      result.files?.forEach(file => {
        expect(file).toHaveProperty('nodeType');
        expect(file).toHaveProperty('fileType');
      });
    });

    test('指定パスの一覧取得', () => {
      fileSystem.cd('game-studio');
      const srcDir = new FileNode('src', NodeType.DIRECTORY);
      const utilsFile = new FileNode('utils.ts', NodeType.FILE);
      fileSystem.currentNode.addChild(srcDir);
      srcDir.addChild(utilsFile);

      const result = fileSystem.ls({ path: 'src' });
      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files?.[0].name).toBe('utils.ts');
    });

    test('存在しないパスの一覧取得はエラー', () => {
      const result = fileSystem.ls({ path: 'nonexistent' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('パスが見つかりません');
    });
  });

  describe('find - ファイル検索', () => {
    beforeEach(() => {
      // より複雑な階層構造を作成
      const gameDir = new FileNode('game-studio', NodeType.DIRECTORY);
      const srcDir = new FileNode('src', NodeType.DIRECTORY);
      const configDir = new FileNode('config', NodeType.DIRECTORY);

      const mainFile = new FileNode('main.js', NodeType.FILE);
      const utilsFile = new FileNode('utils.js', NodeType.FILE);
      const configFile = new FileNode('config.json', NodeType.FILE);
      const settingsFile = new FileNode('settings.yaml', NodeType.FILE);

      root.addChild(gameDir);
      gameDir.addChild(srcDir);
      gameDir.addChild(configDir);
      srcDir.addChild(mainFile);
      srcDir.addChild(utilsFile);
      configDir.addChild(configFile);
      configDir.addChild(settingsFile);
    });

    test('名前完全一致での検索', () => {
      const results = fileSystem.find('main.js');
      expect(results).toHaveLength(1);
      expect(results[0].getPath()).toBe('/projects/game-studio/src/main.js');
    });

    test('部分一致での検索', () => {
      const results = fileSystem.find('config');
      expect(results).toHaveLength(2); // configディレクトリ と config.jsonファイル
      expect(results.map(r => r.name)).toEqual(['config', 'config.json']);
    });

    test('存在しないファイルの検索', () => {
      const results = fileSystem.find('nonexistent');
      expect(results).toHaveLength(0);
    });

    test('大文字小文字を区別しない検索', () => {
      const results = fileSystem.find('MAIN.JS');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('main.js');
    });
  });

  describe('getNodeByPath - パスによるノード取得', () => {
    beforeEach(() => {
      const gameDir = new FileNode('game-studio', NodeType.DIRECTORY);
      const srcDir = new FileNode('src', NodeType.DIRECTORY);
      const mainFile = new FileNode('main.js', NodeType.FILE);

      root.addChild(gameDir);
      gameDir.addChild(srcDir);
      srcDir.addChild(mainFile);
    });

    test('絶対パスでのノード取得', () => {
      const node = fileSystem.getNodeByPath('/projects/game-studio/src/main.js');
      expect(node).toBeDefined();
      expect(node?.name).toBe('main.js');
    });

    test('相対パスでのノード取得', () => {
      fileSystem.cd('game-studio');
      const node = fileSystem.getNodeByPath('src/main.js');
      expect(node).toBeDefined();
      expect(node?.name).toBe('main.js');
    });

    test('特殊パス (~) でのノード取得', () => {
      fileSystem.cd('game-studio');
      fileSystem.cd('src');
      const node = fileSystem.getNodeByPath('~/game-studio');
      expect(node).toBeDefined();
      expect(node?.name).toBe('game-studio');
    });

    test('存在しないパスはnullを返す', () => {
      const node = fileSystem.getNodeByPath('/nonexistent/path');
      expect(node).toBeNull();
    });
  });

  describe('createTestStructure - テスト用構造作成', () => {
    test('テスト用ファイルシステム構造が作成される', () => {
      const testFileSystem = FileSystem.createTestStructure();

      expect(testFileSystem.root.name).toBe('projects');
      expect(testFileSystem.root.children.length).toBeGreaterThan(0);

      // ゲームスタジオディレクトリが存在することを確認
      const gameStudio = testFileSystem.root.findChild('game-studio');
      expect(gameStudio).toBeDefined();
      expect(gameStudio?.isDirectory()).toBe(true);

      // 各ディレクトリにファイルが含まれることを確認
      const srcDir = gameStudio?.findChild('src');
      expect(srcDir).toBeDefined();
      expect(srcDir?.children.length).toBeGreaterThan(0);
    });

    test('異なるファイルタイプが含まれる', () => {
      const testFileSystem = FileSystem.createTestStructure();

      // DFSですべてのファイルを収集
      const allFiles: FileNode[] = [];
      const collectFiles = (node: FileNode) => {
        if (node.isFile()) {
          allFiles.push(node);
        }
        node.children.forEach(collectFiles);
      };
      collectFiles(testFileSystem.root);

      // 異なるファイルタイプが存在することを確認
      const fileTypes = new Set(allFiles.map(f => f.fileType));
      expect(fileTypes.size).toBeGreaterThan(1);
    });
  });

  describe('tree - ツリー表示用データ生成', () => {
    beforeEach(() => {
      const gameDir = new FileNode('game-studio', NodeType.DIRECTORY);
      const srcDir = new FileNode('src', NodeType.DIRECTORY);
      const mainFile = new FileNode('main.js', NodeType.FILE);
      const configFile = new FileNode('config.json', NodeType.FILE);

      root.addChild(gameDir);
      root.addChild(configFile);
      gameDir.addChild(srcDir);
      srcDir.addChild(mainFile);
    });

    test('ツリー構造データが正しく生成される', () => {
      const treeData = fileSystem.tree();

      expect(treeData.name).toBe('projects');
      expect(treeData.children).toHaveLength(2);

      const gameStudio = treeData.children?.find(c => c.name === 'game-studio');
      expect(gameStudio).toBeDefined();
      expect(gameStudio?.children).toHaveLength(1);

      const src = gameStudio?.children?.[0];
      expect(src?.name).toBe('src');
      expect(src?.children).toHaveLength(1);
      expect(src?.children?.[0].name).toBe('main.js');
    });

    test('深度制限付きツリー生成', () => {
      const treeData = fileSystem.tree({ maxDepth: 2 });

      const gameStudio = treeData.children?.find(c => c.name === 'game-studio');
      const src = gameStudio?.children?.[0];

      // 深度2なので、srcディレクトリは表示されるが、その中身は表示されない
      expect(src?.name).toBe('src');
      expect(src?.children).toHaveLength(0); // 深度制限により子は含まれない
    });

    test('隠しファイルを含むツリー生成', () => {
      const hiddenFile = new FileNode('.hidden.json', NodeType.FILE);
      root.addChild(hiddenFile);

      const treeData = fileSystem.tree({ showHidden: true });
      expect(treeData.children?.map(c => c.name)).toContain('.hidden.json');
    });
  });
});
