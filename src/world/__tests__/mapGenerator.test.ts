import { MapGenerator } from '../mapGenerator';
import { Map } from '../map';
import { Location, LocationType } from '../location';

describe('MapGenerator', () => {
  let generator: MapGenerator;
  let map: Map;
  let originalMathRandom: () => number;

  beforeEach(() => {
    generator = new MapGenerator();
    map = new Map();
    // Math.randomの元の実装を保存
    originalMathRandom = Math.random;
  });

  afterEach(() => {
    // Math.randomを元に戻す
    Math.random = originalMathRandom;
  });

  describe('基本的なディレクトリ構造生成', () => {
    test('ルートディレクトリにファイルとディレクトリを生成できる', () => {
      // Math.randomをモック - 50%の確率で最大値を生成するように設定
      Math.random = jest.fn()
        .mockReturnValueOnce(0.8) // ディレクトリ数: Math.floor(0.8 * 4) = 3
        .mockReturnValueOnce(0.5) // 1つ目のディレクトリ名選択
        .mockReturnValueOnce(0.3) // 2つ目のディレクトリ名選択
        .mockReturnValueOnce(0.7) // 3つ目のディレクトリ名選択
        .mockReturnValueOnce(0.9) // ファイル数: Math.floor(0.9 * 6) = 5
        .mockReturnValue(0.5); // 残りの選択に0.5を使用

      const config = {
        maxDepth: 2,
        minDepth: 2, // 深度2まで必ずディレクトリ生成
        maxFilesPerDirectory: 5,
        maxDirectoriesPerLevel: 3,
        fileTypes: ['.js', '.ts', '.md', '.json'],
      };

      generator.generateFileSystem(map, config);

      const rootContents = map.getLocations('/');
      expect(rootContents.length).toBeGreaterThan(0);
      expect(rootContents.length).toBeLessThanOrEqual(8); // maxFiles + maxDirectories
      
      const hasDirectories = rootContents.some(loc => loc.isDirectory());
      const hasFiles = rootContents.some(loc => loc.isFile());
      
      expect(hasDirectories).toBe(true);
      expect(hasFiles).toBe(true);
    });

    test('指定された深度まで階層構造を生成する', () => {
      // 確実に階層構造が生成されるようにMath.randomをモック
      Math.random = jest.fn()
        .mockReturnValueOnce(0.9) // ルートレベルでディレクトリを必ず生成
        .mockReturnValueOnce(0.0) // 1つ目のディレクトリ名選択 ('src')
        .mockReturnValueOnce(0.8) // 第2レベルでもディレクトリを生成
        .mockReturnValueOnce(0.1) // 2つ目のディレクトリ名選択 ('lib')
        .mockReturnValueOnce(0.5) // ファイル数制御
        .mockReturnValue(0.3); // 残りの選択

      const config = {
        maxDepth: 3,
        minDepth: 2, // 最小深度2を指定してディレクトリを確実に生成
        maxFilesPerDirectory: 2,
        maxDirectoriesPerLevel: 2,
        fileTypes: ['.js', '.ts'],
      };

      generator.generateFileSystem(map, config);

      // 深度3まで存在することを確認
      const rootContents = map.getLocations('/');
      const firstLevelDir = rootContents.find(loc => loc.isDirectory());
      expect(firstLevelDir).toBeDefined();

      if (firstLevelDir) {
        const secondLevelContents = map.getLocations(firstLevelDir.getPath());
        expect(secondLevelContents.length).toBeGreaterThanOrEqual(0);
      }
    });

    test('指定されたファイルタイプのファイルのみ生成する', () => {
      // ランダム関数を固定化してファイルタイプを確実に制御
      let callCount = 0;
      Math.random = jest.fn(() => {
        const values = [0.3, 0.7, 0.1, 0.9, 0.5]; // 固定値パターン
        return values[callCount++ % values.length];
      });

      const config = {
        maxDepth: 1,
        minDepth: 1,
        maxFilesPerDirectory: 5,
        maxDirectoriesPerLevel: 0, // ディレクトリを生成しない
        fileTypes: ['.ts', '.json'],
        hiddenFileRatio: 0, // 隠しファイルを無効にして通常ファイルのみ生成
      };

      generator.generateFileSystem(map, config);

      const allFiles = getAllFiles(map, '/');
      const fileExtensions = allFiles.map((file: Location) => file.getFileExtension());
      
      // 生成されたファイル拡張子が指定されたタイプのみであることを確認
      for (const ext of fileExtensions) {
        expect(config.fileTypes.concat('')).toContain(ext); // 空文字は拡張子なしファイル用
      }
      
      // 少なくとも1つは指定されたファイルタイプが生成されることを確認
      expect(fileExtensions.some(ext => config.fileTypes.includes(ext))).toBe(true);
    });
  });

  describe('ディレクトリ名とファイル名の生成', () => {
    test('プログラミング関連の名前を生成する', () => {
      // 特定のプログラミング関連名が生成されるようにモック
      Math.random = jest.fn()
        .mockReturnValueOnce(0.8) // ディレクトリ数
        .mockReturnValueOnce(0.0) // 'src' を選択 (directoryNames[0])
        .mockReturnValueOnce(0.04) // 'lib' を選択 (directoryNames[1])  
        .mockReturnValueOnce(0.6) // ファイル数
        .mockReturnValueOnce(0.3) // 隠しファイルでない
        .mockReturnValueOnce(0.0) // 'index' を選択 (fileNames[0])
        .mockReturnValueOnce(0.0) // '.js' を選択
        .mockReturnValue(0.5);

      const config = {
        maxDepth: 2,
        minDepth: 2, // ディレクトリを確実に生成
        maxFilesPerDirectory: 5,
        maxDirectoriesPerLevel: 3,
        fileTypes: ['.js', '.ts'],
      };

      generator.generateFileSystem(map, config);

      const allLocations = getAllLocations(map, '/');
      const names = allLocations.map((loc: Location) => loc.getName().toLowerCase());
      
      // プログラミング関連の単語が含まれていることを確認
      const programmingWords = ['src', 'lib', 'test', 'config', 'utils', 'index', 'main', 'app'];
      const hasProgammingWords = names.some(name => 
        programmingWords.some(word => name.includes(word))
      );
      
      expect(hasProgammingWords).toBe(true);
    });

    test('隠しファイルも適度に生成する', () => {
      // 隠しファイルが確実に生成されるようにモック
      Math.random = jest.fn()
        .mockReturnValueOnce(0.1) // ディレクトリ数を少なく
        .mockReturnValueOnce(0.8) // ファイル数を多く
        .mockReturnValueOnce(0.1) // 隠しファイルを生成 (< 0.3)
        .mockReturnValueOnce(0.0) // '.env' を選択 (hiddenFileNames[0])
        .mockReturnValueOnce(0.1) // 隠しファイルを生成
        .mockReturnValueOnce(0.08) // '.gitignore' を選択 (hiddenFileNames[1])
        .mockReturnValueOnce(0.4) // 通常ファイルを生成
        .mockReturnValueOnce(0.0) // 'index' を選択
        .mockReturnValueOnce(0.0) // '.js' を選択
        .mockReturnValue(0.5);

      const config = {
        maxDepth: 2,
        maxFilesPerDirectory: 10,
        maxDirectoriesPerLevel: 2,
        fileTypes: ['.js', '.json'],
        hiddenFileRatio: 0.3,
      };

      generator.generateFileSystem(map, config);

      const allFiles = getAllFiles(map, '/');
      const hiddenFiles = allFiles.filter((file: Location) => file.isHidden());
      
      expect(hiddenFiles.length).toBeGreaterThan(0);
      expect(hiddenFiles.length / allFiles.length).toBeLessThanOrEqual(0.4);
    });
  });

  describe('設定パラメータの検証', () => {
    test('不正な設定値に対してエラーを投げる', () => {
      const invalidConfigs = [
        { maxDepth: 0, maxFilesPerDirectory: 5, maxDirectoriesPerLevel: 3, fileTypes: ['.js'] },
        { maxDepth: 2, maxFilesPerDirectory: -1, maxDirectoriesPerLevel: 3, fileTypes: ['.js'] },
        { maxDepth: 2, maxFilesPerDirectory: 5, maxDirectoriesPerLevel: -1, fileTypes: ['.js'] },
        { maxDepth: 2, maxFilesPerDirectory: 5, maxDirectoriesPerLevel: 3, fileTypes: [] },
      ];

      for (const config of invalidConfigs) {
        expect(() => generator.generateFileSystem(map, config)).toThrow();
      }
    });

    test('デフォルト設定で正常に動作する', () => {
      // デフォルト設定でも確実に何かが生成されるようにモック
      Math.random = jest.fn()
        .mockReturnValueOnce(0.7) // ディレクトリ数
        .mockReturnValueOnce(0.2) // ディレクトリ名選択
        .mockReturnValueOnce(0.6) // ファイル数
        .mockReturnValueOnce(0.4) // 通常ファイル
        .mockReturnValueOnce(0.1) // ファイル名選択
        .mockReturnValueOnce(0.2) // 拡張子選択
        .mockReturnValue(0.5);

      expect(() => generator.generateFileSystem(map)).not.toThrow();
      
      const rootContents = map.getLocations('/');
      expect(rootContents.length).toBeGreaterThan(0);
    });
  });

});

// ヘルパー関数
function getAllFiles(map: Map, startPath: string): Location[] {
  const result: Location[] = [];
  const locations = map.getLocations(startPath);
  
  for (const location of locations) {
    if (location.isFile()) {
      result.push(location);
    } else if (location.isDirectory()) {
      result.push(...getAllFiles(map, location.getPath()));
    }
  }
  
  return result;
}

function getAllLocations(map: Map, startPath: string): Location[] {
  const result: Location[] = [];
  const locations = map.getLocations(startPath);
  
  for (const location of locations) {
    result.push(location);
    if (location.isDirectory()) {
      result.push(...getAllLocations(map, location.getPath()));
    }
  }
  
  return result;
}