/**
 * FileNodeクラスのテスト
 */

import { FileNode, FileType, NodeType } from './FileNode';

describe('FileNode', () => {
  describe('コンストラクタ', () => {
    test('ファイルノードが正しく作成される', () => {
      const node = new FileNode('test.js', NodeType.FILE);

      expect(node.name).toBe('test.js');
      expect(node.nodeType).toBe(NodeType.FILE);
      expect(node.isHidden).toBe(false);
      expect(node.parent).toBeNull();
      expect(node.children).toEqual([]);
      expect(node.fileType).toBe(FileType.MONSTER);
    });

    test('ディレクトリノードが正しく作成される', () => {
      const node = new FileNode('src', NodeType.DIRECTORY);

      expect(node.name).toBe('src');
      expect(node.nodeType).toBe(NodeType.DIRECTORY);
      expect(node.isHidden).toBe(false);
      expect(node.parent).toBeNull();
      expect(node.children).toEqual([]);
      expect(node.fileType).toBe(FileType.NONE);
    });

    test('隠しファイルが正しく作成される', () => {
      const node = new FileNode('.hidden.json', NodeType.FILE);

      expect(node.name).toBe('.hidden.json');
      expect(node.isHidden).toBe(true);
      expect(node.fileType).toBe(FileType.TREASURE);
    });
  });

  describe('ファイルタイプ判定', () => {
    test('モンスターファイルが正しく判定される', () => {
      const jsFile = new FileNode('main.js', NodeType.FILE);
      const tsFile = new FileNode('utils.ts', NodeType.FILE);
      const pyFile = new FileNode('script.py', NodeType.FILE);

      expect(jsFile.fileType).toBe(FileType.MONSTER);
      expect(tsFile.fileType).toBe(FileType.MONSTER);
      expect(pyFile.fileType).toBe(FileType.MONSTER);
    });

    test('宝箱ファイルが正しく判定される', () => {
      const jsonFile = new FileNode('config.json', NodeType.FILE);
      const yamlFile = new FileNode('settings.yaml', NodeType.FILE);
      const ymlFile = new FileNode('data.yml', NodeType.FILE);

      expect(jsonFile.fileType).toBe(FileType.TREASURE);
      expect(yamlFile.fileType).toBe(FileType.TREASURE);
      expect(ymlFile.fileType).toBe(FileType.TREASURE);
    });

    test('セーブポイントファイルが正しく判定される', () => {
      const mdFile = new FileNode('README.md', NodeType.FILE);

      expect(mdFile.fileType).toBe(FileType.SAVE_POINT);
    });

    test('イベントファイルが正しく判定される', () => {
      const exeFile = new FileNode('game.exe', NodeType.FILE);
      const binFile = new FileNode('data.bin', NodeType.FILE);
      const shFile = new FileNode('script.sh', NodeType.FILE);

      expect(exeFile.fileType).toBe(FileType.EVENT);
      expect(binFile.fileType).toBe(FileType.EVENT);
      expect(shFile.fileType).toBe(FileType.EVENT);
    });

    test('その他のファイルは空ファイルになる', () => {
      const txtFile = new FileNode('readme.txt', NodeType.FILE);
      const logFile = new FileNode('error.log', NodeType.FILE);

      expect(txtFile.fileType).toBe(FileType.EMPTY);
      expect(logFile.fileType).toBe(FileType.EMPTY);
    });

    test('ディレクトリはファイルタイプなし', () => {
      const dirNode = new FileNode('src', NodeType.DIRECTORY);

      expect(dirNode.fileType).toBe(FileType.NONE);
    });
  });

  describe('ノード操作', () => {
    test('isFileメソッドが正しく動作する', () => {
      const fileNode = new FileNode('test.js', NodeType.FILE);
      const dirNode = new FileNode('src', NodeType.DIRECTORY);

      expect(fileNode.isFile()).toBe(true);
      expect(dirNode.isFile()).toBe(false);
    });

    test('isDirectoryメソッドが正しく動作する', () => {
      const fileNode = new FileNode('test.js', NodeType.FILE);
      const dirNode = new FileNode('src', NodeType.DIRECTORY);

      expect(fileNode.isDirectory()).toBe(false);
      expect(dirNode.isDirectory()).toBe(true);
    });

    test('子ノードの追加が正しく動作する', () => {
      const parent = new FileNode('src', NodeType.DIRECTORY);
      const child = new FileNode('main.js', NodeType.FILE);

      parent.addChild(child);

      expect(parent.children).toContain(child);
      expect(child.parent).toBe(parent);
    });

    test('子ノードの削除が正しく動作する', () => {
      const parent = new FileNode('src', NodeType.DIRECTORY);
      const child = new FileNode('main.js', NodeType.FILE);

      parent.addChild(child);
      parent.removeChild(child);

      expect(parent.children).not.toContain(child);
      expect(child.parent).toBeNull();
    });

    test('存在しない子ノードの削除は何もしない', () => {
      const parent = new FileNode('src', NodeType.DIRECTORY);
      const child = new FileNode('main.js', NodeType.FILE);

      expect(() => parent.removeChild(child)).not.toThrow();
      expect(parent.children).toEqual([]);
    });
  });

  describe('パス取得', () => {
    test('ルートノードのパスが正しく取得される', () => {
      const root = new FileNode('projects', NodeType.DIRECTORY);

      expect(root.getPath()).toBe('/projects');
    });

    test('階層構造のパスが正しく取得される', () => {
      const root = new FileNode('projects', NodeType.DIRECTORY);
      const gameDir = new FileNode('game-studio', NodeType.DIRECTORY);
      const srcDir = new FileNode('src', NodeType.DIRECTORY);
      const mainFile = new FileNode('main.js', NodeType.FILE);

      root.addChild(gameDir);
      gameDir.addChild(srcDir);
      srcDir.addChild(mainFile);

      expect(mainFile.getPath()).toBe('/projects/game-studio/src/main.js');
    });
  });

  describe('子ノード検索', () => {
    test('名前による子ノード検索が正しく動作する', () => {
      const parent = new FileNode('src', NodeType.DIRECTORY);
      const child1 = new FileNode('main.js', NodeType.FILE);
      const child2 = new FileNode('utils.ts', NodeType.FILE);

      parent.addChild(child1);
      parent.addChild(child2);

      expect(parent.findChild('main.js')).toBe(child1);
      expect(parent.findChild('utils.ts')).toBe(child2);
      expect(parent.findChild('nonexistent.js')).toBeUndefined();
    });

    test('隠しファイルも検索できる', () => {
      const parent = new FileNode('src', NodeType.DIRECTORY);
      const hiddenFile = new FileNode('.hidden.json', NodeType.FILE);

      parent.addChild(hiddenFile);

      expect(parent.findChild('.hidden.json')).toBe(hiddenFile);
    });
  });

  describe('エラーケース', () => {
    test('ファイルに子ノードを追加するとエラー', () => {
      const fileNode = new FileNode('main.js', NodeType.FILE);
      const child = new FileNode('child.ts', NodeType.FILE);

      expect(() => fileNode.addChild(child)).toThrow('ファイルに子ノードは追加できません');
    });

    test('空の名前はエラー', () => {
      expect(() => new FileNode('', NodeType.FILE)).toThrow('ファイル名は空にできません');
    });

    test('無効な文字を含む名前はエラー', () => {
      expect(() => new FileNode('invalid/name', NodeType.FILE)).toThrow(
        'ファイル名に無効な文字が含まれています'
      );
      expect(() => new FileNode('invalid\\name', NodeType.FILE)).toThrow(
        'ファイル名に無効な文字が含まれています'
      );
    });
  });

  describe('追加テスト（カバレッジ向上）', () => {
    test('拡張子なしファイル', () => {
      const noExtFile = new FileNode('README', NodeType.FILE);
      expect(noExtFile.fileType).toBe(FileType.EMPTY);
    });

    test('ドットで終わるファイル名', () => {
      const dotEndFile = new FileNode('file.', NodeType.FILE);
      expect(dotEndFile.fileType).toBe(FileType.EMPTY);
    });

    test('大文字拡張子も正しく判定される', () => {
      const upperExtFile = new FileNode('script.JS', NodeType.FILE);
      expect(upperExtFile.fileType).toBe(FileType.MONSTER);
    });

    test('既に親を持つ子ノードの再配置', () => {
      const parent1 = new FileNode('dir1', NodeType.DIRECTORY);
      const parent2 = new FileNode('dir2', NodeType.DIRECTORY);
      const child = new FileNode('file.js', NodeType.FILE);

      // 最初の親に追加
      parent1.addChild(child);
      expect(child.parent).toBe(parent1);
      expect(parent1.children).toContain(child);

      // 別の親に移動
      parent2.addChild(child);
      expect(child.parent).toBe(parent2);
      expect(parent2.children).toContain(child);
      expect(parent1.children).not.toContain(child);
    });
  });
});
