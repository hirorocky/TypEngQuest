import { FileInvestigationCommands } from '../fileInvestigation';
import { Map } from '../../world/map';
import { ElementManager } from '../../world/elements';
import { Location, LocationType } from '../../world/location';

describe('FileInvestigationCommandsクラス', () => {
  let investigationCommands: FileInvestigationCommands;
  let map: Map;
  let elementManager: ElementManager;

  beforeEach(() => {
    map = new Map();
    elementManager = new ElementManager();
    investigationCommands = new FileInvestigationCommands(map, elementManager);

    // テスト用マップセットアップ
    const srcDir = new Location('src', '/', LocationType.DIRECTORY);
    const appJs = new Location('app.js', '/src', LocationType.FILE);
    const configJson = new Location('config.json', '/src', LocationType.FILE);
    const readmeMd = new Location('README.md', '/src', LocationType.FILE);
    const envFile = new Location('.env', '/src', LocationType.FILE);
    
    map.addLocation(srcDir);
    map.addLocation(appJs);
    map.addLocation(configJson);
    map.addLocation(readmeMd);
    map.addLocation(envFile);
    
    // /srcディレクトリに移動
    map.navigateTo('/src');
  });

  describe('fileコマンド', () => {
    test('存在するファイルのタイプと危険度を表示できる', () => {
      const result = investigationCommands.file('app.js');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('app.js');
      expect(result.output).toContain('JavaScript');
      expect(result.output).toContain('Danger');
      expect(result.output).toContain('Potential');
    });

    test('実行ファイルは高い危険度を示す', () => {
      const appExe = new Location('app.exe', '/src', LocationType.FILE);
      map.addLocation(appExe);
      const result = investigationCommands.file('app.exe');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Medium');
      expect(result.output).toContain('Monster');
    });

    test('設定ファイルは宝箱の可能性を示す', () => {
      const result = investigationCommands.file('config.json');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Low');
      expect(result.output).toContain('Treasure');
    });

    test('ドキュメントファイルはセーブポイントの可能性を示す', () => {
      const result = investigationCommands.file('README.md');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Low');
      expect(result.output).toContain('Save Point');
    });

    test('隠しファイルはイベントの可能性を示す', () => {
      const result = investigationCommands.file('.env');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Event');
    });

    test('存在しないファイルに対してエラーを返す', () => {
      const result = investigationCommands.file('nonexistent.txt');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('No such file');
    });

    test('ディレクトリに対してエラーを返す', () => {
      const subdir = new Location('subdir', '/src', LocationType.DIRECTORY);
      map.addLocation(subdir);
      const result = investigationCommands.file('subdir');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('Is a directory');
    });
  });

  describe('catコマンド', () => {
    test('ファイル内容を表示し要素を生成・配置する', () => {
      const result = investigationCommands.cat('app.js');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('File contents');
      
      // 場所が探索済みになっている
      const location = map.findLocation('/src/app.js');
      expect(location?.isExplored()).toBe(true);
    });

    test('要素が生成された場合は詳細情報を表示する', () => {
      const result = investigationCommands.cat('app.js');
      
      expect(result.success).toBe(true);
      
      const location = map.findLocation('/src/app.js');
      if (location?.hasElement()) {
        expect(result.output).toMatch(/reveal|trigger|contain/);
      }
    });

    test('要素が生成されなかった場合は通常のファイル内容を表示する', () => {
      // 複数回実行して要素なしの場合をテスト
      let foundNoElement = false;
      for (let i = 0; i < 20; i++) {
        const testFile = new Location(`test${i}.txt`, '/src', LocationType.FILE);
        map.addLocation(testFile);
        const result = investigationCommands.cat(`test${i}.txt`);
        
        const location = map.findLocation(`/src/test${i}.txt`);
        if (!location?.hasElement()) {
          expect(result.output).toContain('nothing unusual');
          foundNoElement = true;
          break;
        }
      }
      expect(foundNoElement).toBe(true);
    });

    test('既に探索済みのファイルは既存の要素情報を表示する', () => {
      // 最初のcat実行
      investigationCommands.cat('app.js');
      
      // 2回目のcat実行
      const result = investigationCommands.cat('app.js');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('already');
    });

    test('存在しないファイルに対してエラーを返す', () => {
      const result = investigationCommands.cat('nonexistent.txt');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('No such file');
    });

    test('ディレクトリに対してエラーを返す', () => {
      // ルートディレクトリに戻ってsrcディレクトリをテスト
      map.navigateTo('/');
      const result = investigationCommands.cat('src');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('Is a directory');
    });
  });

  describe('headコマンド', () => {
    test('ファイルの先頭部分情報を表示する', () => {
      const result = investigationCommands.head('app.js');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('First few lines');
    });

    test('要素の存在をほのめかす情報を表示する', () => {
      const result = investigationCommands.head('app.js');
      
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/suggest|hint|potential|might/i);
    });

    test('場所を探索済みにしない（軽量調査）', () => {
      investigationCommands.head('app.js');
      
      const location = map.findLocation('/src/app.js');
      expect(location?.isExplored()).toBe(false);
    });

    test('存在しないファイルに対してエラーを返す', () => {
      const result = investigationCommands.head('nonexistent.txt');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('No such file');
    });

    test('ディレクトリに対してエラーを返す', () => {
      // ルートディレクトリに戻ってsrcディレクトリをテスト
      map.navigateTo('/');
      const result = investigationCommands.head('src');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('Is a directory');
    });
  });

  describe('エラーハンドリング', () => {
    test('引数なしのfileコマンドはエラーを返す', () => {
      const result = investigationCommands.file('');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('Usage');
    });

    test('引数なしのcatコマンドはエラーを返す', () => {
      const result = investigationCommands.cat('');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('Usage');
    });

    test('引数なしのheadコマンドはエラーを返す', () => {
      const result = investigationCommands.head('');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('Usage');
    });
  });

  describe('ElementManager統合', () => {
    test('catコマンド実行時にElementManagerから要素が生成される', () => {
      const result = investigationCommands.cat('app.js');
      
      expect(result.success).toBe(true);
      
      const location = map.findLocation('/src/app.js');
      // 要素が生成される可能性があることを確認（確率的なので複数回テスト）
      let elementGenerated = false;
      for (let i = 0; i < 10; i++) {
        const testFile = new Location(`test${i}.js`, '/src', LocationType.FILE);
        map.addLocation(testFile);
        investigationCommands.cat(`test${i}.js`);
        const testLocation = map.findLocation(`/src/test${i}.js`);
        if (testLocation?.hasElement()) {
          elementGenerated = true;
          break;
        }
      }
      expect(elementGenerated).toBe(true);
    });
  });
});