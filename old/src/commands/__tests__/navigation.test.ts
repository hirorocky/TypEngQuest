import { NavigationCommands } from '../navigation';
import { Map } from '../../world/map';
import { Location, LocationType } from '../../world/location';

describe('ナビゲーションコマンド', () => {
  let navigation: NavigationCommands;
  let map: Map;

  beforeEach(() => {
    map = new Map();
    navigation = new NavigationCommands(map);

    // テスト用のディレクトリ構造を作成
    map.addLocation(new Location('src', '/', LocationType.DIRECTORY));
    map.addLocation(new Location('docs', '/', LocationType.DIRECTORY));
    map.addLocation(new Location('components', '/src', LocationType.DIRECTORY));
    map.addLocation(new Location('utils', '/src', LocationType.DIRECTORY));
    map.addLocation(new Location('app.js', '/src', LocationType.FILE));
    map.addLocation(new Location('index.ts', '/src', LocationType.FILE));
    map.addLocation(new Location('README.md', '/', LocationType.FILE));
    map.addLocation(new Location('package.json', '/', LocationType.FILE));
    map.addLocation(new Location('.env', '/', LocationType.FILE));
    map.addLocation(new Location('Button.tsx', '/src/components', LocationType.FILE));
    map.addLocation(new Location('Modal.tsx', '/src/components', LocationType.FILE));
  });

  describe('pwd コマンド', () => {
    test('現在のディレクトリパスを返す', () => {
      const result = navigation.pwd();
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('/');
    });

    test('ディレクトリ移動後の現在位置を正しく表示', () => {
      navigation.cd('src');
      const result = navigation.pwd();
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('/src');
    });

    test('深い階層でも正しくパスを表示', () => {
      navigation.cd('src');
      navigation.cd('components');
      const result = navigation.pwd();
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('/src/components');
    });
  });

  describe('ls コマンド', () => {
    test('ルートディレクトリの内容を一覧表示', () => {
      const result = navigation.ls();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('src');
      expect(result.message).toContain('docs');
      expect(result.message).toContain('README.md');
      expect(result.message).toContain('package.json');
      // 隠しファイルは通常のlsでは非表示
      expect(result.message).not.toContain('.env');
    });

    test('サブディレクトリの内容を表示', () => {
      navigation.cd('src');
      const result = navigation.ls();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('components');
      expect(result.message).toContain('utils');
      expect(result.message).toContain('app.js');
      expect(result.message).toContain('index.ts');
    });

    test('ls -a で隠しファイルも表示', () => {
      const result = navigation.ls('-a');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('.env');
      expect(result.message).toContain('src');
      expect(result.message).toContain('docs');
    });

    test('ls -l で詳細情報を表示', () => {
      const result = navigation.ls('-l');
      
      expect(result.success).toBe(true);
      // ファイルタイプ、サイズなどの詳細情報が含まれることを確認
      expect(result.message).toContain('drw'); // ディレクトリを示すプレフィックス
      expect(result.message).toContain('-rw'); // ファイルを示すプレフィックス
    });

    test('ls -la で隠しファイルと詳細情報を表示', () => {
      const result = navigation.ls('-la');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('.env');
      expect(result.message).toContain('drw');
      expect(result.message).toContain('-rw');
    });

    test('空のディレクトリでは適切なメッセージを表示', () => {
      // 空のディレクトリを作成
      map.addLocation(new Location('empty', '/', LocationType.DIRECTORY));
      navigation.cd('empty');
      
      const result = navigation.ls();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('(empty)');
    });
  });

  describe('cd コマンド', () => {
    test('既存のディレクトリに移動できる', () => {
      const result = navigation.cd('src');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('src');
      
      // 移動が成功したことをpwdで確認
      const pwdResult = navigation.pwd();
      expect(pwdResult.message).toBe('/src');
    });

    test('絶対パスで移動できる', () => {
      navigation.cd('src');
      const result = navigation.cd('/docs');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('docs');
      
      const pwdResult = navigation.pwd();
      expect(pwdResult.message).toBe('/docs');
    });

    test('相対パスで移動できる', () => {
      navigation.cd('src');
      const result = navigation.cd('components');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('components');
      
      const pwdResult = navigation.pwd();
      expect(pwdResult.message).toBe('/src/components');
    });

    test('親ディレクトリに移動できる', () => {
      navigation.cd('src');
      navigation.cd('components');
      const result = navigation.cd('..');
      
      expect(result.success).toBe(true);
      
      const pwdResult = navigation.pwd();
      expect(pwdResult.message).toBe('/src');
    });

    test('ルートから上位には移動できない', () => {
      const result = navigation.cd('..');
      
      expect(result.success).toBe(true);
      
      const pwdResult = navigation.pwd();
      expect(pwdResult.message).toBe('/');
    });

    test('存在しないディレクトリへの移動でエラー', () => {
      const result = navigation.cd('nonexistent');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('No such file or directory');
    });

    test('ファイルに対してcdを実行するとエラー', () => {
      const result = navigation.cd('README.md');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Not a directory');
    });

    test('引数なしのcdはルートディレクトリに移動', () => {
      navigation.cd('src');
      navigation.cd('components');
      const result = navigation.cd();
      
      expect(result.success).toBe(true);
      
      const pwdResult = navigation.pwd();
      expect(pwdResult.message).toBe('/');
    });

    test('ホームディレクトリ記号(~)でルートに移動', () => {
      navigation.cd('src');
      const result = navigation.cd('~');
      
      expect(result.success).toBe(true);
      
      const pwdResult = navigation.pwd();
      expect(pwdResult.message).toBe('/');
    });
  });

  describe('Unix風のエラーメッセージ', () => {
    test('cd: No such file or directory形式のエラー', () => {
      const result = navigation.cd('invalid');
      
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/cd: .*: No such file or directory/);
    });

    test('cd: Not a directory形式のエラー', () => {
      const result = navigation.cd('README.md');
      
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/cd: .*: Not a directory/);
    });
  });

  describe('パス解決機能', () => {
    test('複雑な相対パスを正しく解決', () => {
      navigation.cd('src');
      navigation.cd('components');
      const result = navigation.cd('../utils');
      
      expect(result.success).toBe(true);
      
      const pwdResult = navigation.pwd();
      expect(pwdResult.message).toBe('/src/utils');
    });

    test('多重の親ディレクトリ参照を解決', () => {
      navigation.cd('src');
      navigation.cd('components');
      const result = navigation.cd('../../docs');
      
      expect(result.success).toBe(true);
      
      const pwdResult = navigation.pwd();
      expect(pwdResult.message).toBe('/docs');
    });

    test('カレントディレクトリ参照(.)を正しく処理', () => {
      navigation.cd('src');
      const result = navigation.cd('./components');
      
      expect(result.success).toBe(true);
      
      const pwdResult = navigation.pwd();
      expect(pwdResult.message).toBe('/src/components');
    });
  });
});