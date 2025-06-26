import { NavigationHandler } from '../navigation';
import { Map } from '../../world/map';
import { Location, LocationType } from '../../world/location';

// コンソール出力をモック
const mockConsoleLog = jest.fn();
console.log = mockConsoleLog;

describe('ナビゲーションコマンド', () => {
  let handler: NavigationHandler;
  let gameMap: Map;

  beforeEach(() => {
    gameMap = new Map();
    handler = new NavigationHandler(gameMap);
    
    // テスト用のマップ構造を作成
    const src = new Location('src', '/', LocationType.DIRECTORY);
    const lib = new Location('lib', '/', LocationType.DIRECTORY);
    const components = new Location('components', '/src', LocationType.DIRECTORY);
    const appJs = new Location('app.js', '/src', LocationType.FILE);
    const indexTs = new Location('index.ts', '/src/components', LocationType.FILE);
    
    gameMap.addLocation(src);
    gameMap.addLocation(lib);
    gameMap.addLocation(components);
    gameMap.addLocation(appJs);
    gameMap.addLocation(indexTs);

    // モックをリセット
    mockConsoleLog.mockClear();
  });

  describe('pwd コマンド', () => {
    test('現在のディレクトリパスを表示する', () => {
      handler.pwd();
      
      expect(mockConsoleLog).toHaveBeenCalledWith('/');
    });

    test('移動後の現在パスを正しく表示する', () => {
      gameMap.navigateTo('/src');
      handler.pwd();
      
      expect(mockConsoleLog).toHaveBeenCalledWith('/src');
    });
  });

  describe('ls コマンド', () => {
    test('ルートディレクトリの内容を表示する', () => {
      handler.ls();
      
      // ディレクトリとファイルが表示されることを確認
      const output = mockConsoleLog.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('src/');
      expect(output).toContain('lib/');
    });

    test('指定ディレクトリの内容を表示する', () => {
      handler.ls(['/src']);
      
      const output = mockConsoleLog.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('components/');
      expect(output).toContain('app.js');
    });

    test('存在しないディレクトリでエラーメッセージを表示する', () => {
      handler.ls(['/nonexistent']);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('ls: /nonexistent: Directory \'/nonexistent\' does not exist')
      );
    });

    test('ファイルに対してlsコマンドでエラーメッセージを表示する', () => {
      handler.ls(['/src/app.js']);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('ls: /src/app.jsis not a directory')
      );
    });

    test('-a オプションで隠しファイルも表示する', () => {
      // 隠しファイルを追加
      const hiddenFile = new Location('.env', '/src', LocationType.FILE);
      gameMap.addLocation(hiddenFile);
      
      handler.ls(['-a', '/src']);
      
      const output = mockConsoleLog.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('.env');
    });

    test('-l オプションで詳細表示する', () => {
      handler.ls(['-l', '/src']);
      
      const output = mockConsoleLog.mock.calls.map(call => call[0]).join('\n');
      // 詳細表示には探索状態、危険度、ファイルタイプが含まれる
      expect(output).toContain('drwxr-xr-x'); // ディレクトリ表示
      expect(output).toContain('-rw-r--r--'); // ファイル表示
    });
  });

  describe('cd コマンド', () => {
    test('指定ディレクトリに移動する', () => {
      handler.cd(['/src']);
      
      expect(gameMap.getCurrentPath()).toBe('/src');
      expect(mockConsoleLog).toHaveBeenCalledWith('Moved to /src');
    });

    test('相対パスで移動する', () => {
      gameMap.navigateTo('/src');
      handler.cd(['components']);
      
      expect(gameMap.getCurrentPath()).toBe('/src/components');
      expect(mockConsoleLog).toHaveBeenCalledWith('Moved to /src/components');
    });

    test('.. で親ディレクトリに移動する', () => {
      gameMap.navigateTo('/src/components');
      handler.cd(['..']);
      
      expect(gameMap.getCurrentPath()).toBe('/src');
      expect(mockConsoleLog).toHaveBeenCalledWith('Moved to /src');
    });

    test('ルートディレクトリから .. で移動できない', () => {
      handler.cd(['..']);
      
      expect(gameMap.getCurrentPath()).toBe('/');
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('cd: ..: Already at root directory')
      );
    });

    test('存在しないディレクトリでエラーメッセージを表示する', () => {
      handler.cd(['/nonexistent']);
      
      expect(gameMap.getCurrentPath()).toBe('/'); // 移動していない
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('cd: /nonexistent: does not exist')
      );
    });

    test('ファイルに対してcdコマンドでエラーメッセージを表示する', () => {
      handler.cd(['/src/app.js']);
      
      expect(gameMap.getCurrentPath()).toBe('/');
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('cd: /src/app.jsis not a directory')
      );
    });

    test('引数なしで何も実行しない', () => {
      handler.cd([]);
      
      expect(gameMap.getCurrentPath()).toBe('/');
    });

    test('移動時に探索状態をマークする', () => {
      handler.cd(['/src']);
      
      const srcLocation = gameMap.findLocation('/src');
      expect(srcLocation?.isExplored()).toBe(true);
    });
  });

  describe('tree コマンド', () => {
    test('ディレクトリツリーを表示する', () => {
      handler.tree();
      
      const output = mockConsoleLog.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('/');
      expect(output).toContain('├── src/');
      expect(output).toContain('└── lib/');
    });

    test('指定したディレクトリのツリーを表示する', () => {
      handler.tree(['/src']);
      
      const output = mockConsoleLog.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('/src');
      expect(output).toContain('├── components/');
      expect(output).toContain('└── app.js');
    });

    test('存在しないディレクトリでエラーメッセージを表示する', () => {
      handler.tree(['/nonexistent']);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('tree: /nonexistent: does not exist')
      );
    });
  });
});