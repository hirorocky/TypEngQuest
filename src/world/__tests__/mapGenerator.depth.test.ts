import { MapGenerator, MapGeneratorConfig } from '../mapGenerator';
import { Map } from '../map';
import { LocationType } from '../location';

describe('MapGenerator - Depth Control', () => {
  let generator: MapGenerator;
  let fixedRandomValues: number[];
  let randomIndex: number;

  beforeEach(() => {
    // 固定ランダム値で結果を予測可能にする
    fixedRandomValues = [0.5, 0.3, 0.7, 0.2, 0.8, 0.1, 0.9, 0.4, 0.6, 0.0];
    randomIndex = 0;
    
    const mockRandom = jest.fn(() => {
      const value = fixedRandomValues[randomIndex % fixedRandomValues.length];
      randomIndex++;
      return value;
    });
    
    generator = new MapGenerator(mockRandom);
  });

  describe('minDepth Configuration', () => {
    test('should enforce minimum depth by generating required directories', () => {
      const map = new Map();
      const config: MapGeneratorConfig = {
        maxDepth: 3,
        minDepth: 2,
        maxFilesPerDirectory: 2,
        maxDirectoriesPerLevel: 2,
        fileTypes: ['.ts'],
        hiddenFileRatio: 0,
      };

      generator.generateFileSystem(map, config);

      // 深度2まで必ずディレクトリが生成されているかを確認
      const maxDepth = map.getMaxDepth();
      expect(maxDepth).toBeGreaterThanOrEqual(2);
    });

    test('should create at least one file at minimum depth', () => {
      const map = new Map();
      const config: MapGeneratorConfig = {
        maxDepth: 2,
        minDepth: 2,
        maxFilesPerDirectory: 1,
        maxDirectoriesPerLevel: 1,
        fileTypes: ['.ts'],
        hiddenFileRatio: 0,
      };

      generator.generateFileSystem(map, config);

      // 深度2にファイルが存在することを確認
      const allLocations = map.getAllLocations();
      const depth2Files = allLocations.filter(loc => {
        const depth = loc.getPath().split('/').length - 1;
        return depth === 2 && !loc.isDirectory();
      });

      expect(depth2Files.length).toBeGreaterThan(0);
    });

    test('should always generate root files when minDepth is 1', () => {
      const map = new Map();
      const config: MapGeneratorConfig = {
        maxDepth: 1,
        minDepth: 1,
        maxFilesPerDirectory: 2,
        maxDirectoriesPerLevel: 0, // ディレクトリなし
        fileTypes: ['.ts', '.js'],
        hiddenFileRatio: 0,
      };

      generator.generateFileSystem(map, config);

      // ルートにファイルが必ず生成されることを確認
      const rootFiles = map.getLocations('/').filter(loc => !loc.isDirectory());
      expect(rootFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Level 1 World Depth Restriction', () => {
    test('should generate only root files for level 1 world', () => {
      const map = new Map(undefined, 1); // Level 1 world

      // レベル1ワールドでは深度1のみ
      const maxDepth = map.getMaxDepth();
      expect(maxDepth).toBe(1);

      // ルートのみにファイルが存在
      const allLocations = map.getAllLocations();
      const nonRootLocations = allLocations.filter(loc => {
        const depth = loc.getPath().split('/').length - 1;
        return depth > 1;
      });

      expect(nonRootLocations.length).toBe(0);
    });

    test('should not create subdirectories in level 1 world', () => {
      const map = new Map(undefined, 1);

      const allLocations = map.getAllLocations();
      const directories = allLocations.filter(loc => loc.isDirectory() && loc.getPath() !== '/');

      expect(directories.length).toBe(0);
    });

    test('should generate files at root in level 1 world', () => {
      const map = new Map(undefined, 1);

      const rootFiles = map.getLocations('/').filter(loc => !loc.isDirectory());
      expect(rootFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Dynamic Depth Scaling', () => {
    test('should allow deeper maps with higher world levels', () => {
      // Level 2以上では子ディレクトリ生成が可能
      const level2Map = new Map(undefined, 2);
      const level4Map = new Map(undefined, 4);
      const level6Map = new Map(undefined, 6);

      const depth2 = level2Map.getMaxDepth();
      const depth4 = level4Map.getMaxDepth();
      const depth6 = level6Map.getMaxDepth();

      // レベル2以上では深度1より大きくなることが可能
      expect(depth2).toBeGreaterThan(1);
      
      // 高レベルでは少なくとも同等以上の深度を持つ
      expect(depth4).toBeGreaterThanOrEqual(1);
      expect(depth6).toBeGreaterThanOrEqual(1);
    });

    test('should cap maximum depth at reasonable level', () => {
      const highLevelMap = new Map(undefined, 20);
      const maxDepth = highLevelMap.getMaxDepth();

      // 深度の上限は6
      expect(maxDepth).toBeLessThanOrEqual(6);
    });

    test('should respect calculated max depth limits', () => {
      // Level 2: maxDepth = Math.min(3 + Math.floor(2/2), 6) = Math.min(4, 6) = 4
      // 実際の深度は設定maxDepth以下
      const level2Map = new Map(undefined, 2);
      expect(level2Map.getMaxDepth()).toBeLessThanOrEqual(4);

      // Level 4: maxDepth = Math.min(3 + Math.floor(4/2), 6) = Math.min(5, 6) = 5
      const level4Map = new Map(undefined, 4);
      expect(level4Map.getMaxDepth()).toBeLessThanOrEqual(5);

      // Level 10: maxDepth = Math.min(3 + Math.floor(10/2), 6) = Math.min(8, 6) = 6
      const level10Map = new Map(undefined, 10);
      expect(level10Map.getMaxDepth()).toBeLessThanOrEqual(6);
    });
  });

  describe('Configuration Validation', () => {
    test('should reject invalid minDepth values', () => {
      const map = new Map();
      
      expect(() => {
        generator.generateFileSystem(map, {
          maxDepth: 3,
          minDepth: 0, // Invalid: less than 1
          maxFilesPerDirectory: 2,
          maxDirectoriesPerLevel: 2,
          fileTypes: ['.ts'],
        });
      }).toThrow('minDepth must be at least 1');
    });

    test('should reject minDepth greater than maxDepth', () => {
      const map = new Map();
      
      expect(() => {
        generator.generateFileSystem(map, {
          maxDepth: 2,
          minDepth: 3, // Invalid: greater than maxDepth
          maxFilesPerDirectory: 2,
          maxDirectoriesPerLevel: 2,
          fileTypes: ['.ts'],
        });
      }).toThrow('minDepth cannot be greater than maxDepth');
    });

    test('should accept valid minDepth configurations', () => {
      const map = new Map();
      
      expect(() => {
        generator.generateFileSystem(map, {
          maxDepth: 3,
          minDepth: 2,
          maxFilesPerDirectory: 2,
          maxDirectoriesPerLevel: 2,
          fileTypes: ['.ts'],
        });
      }).not.toThrow();
    });
  });

  describe('File Generation at Minimum Depth', () => {
    test('should ensure files exist at minDepth level', () => {
      const map = new Map();
      const config: MapGeneratorConfig = {
        maxDepth: 4,
        minDepth: 3,
        maxFilesPerDirectory: 1,
        maxDirectoriesPerLevel: 1,
        fileTypes: ['.ts'],
        hiddenFileRatio: 0,
      };

      generator.generateFileSystem(map, config);

      // 深度3にファイルが存在することを確認
      const allLocations = map.getAllLocations();
      const depth3Files = allLocations.filter(loc => {
        const depth = loc.getPath().split('/').length - 1;
        return depth === 3 && !loc.isDirectory();
      });

      expect(depth3Files.length).toBeGreaterThan(0);
    });

    test('should create directory path to minimum depth', () => {
      const map = new Map();
      const config: MapGeneratorConfig = {
        maxDepth: 3,
        minDepth: 3,
        maxFilesPerDirectory: 1,
        maxDirectoriesPerLevel: 1,
        fileTypes: ['.ts'],
        hiddenFileRatio: 0,
      };

      generator.generateFileSystem(map, config);

      // 深度2までディレクトリが存在することを確認
      const allLocations = map.getAllLocations();
      const depth1Dirs = allLocations.filter(loc => {
        const depth = loc.getPath().split('/').length - 1;
        return depth === 1 && loc.isDirectory();
      });
      const depth2Dirs = allLocations.filter(loc => {
        const depth = loc.getPath().split('/').length - 1;
        return depth === 2 && loc.isDirectory();
      });

      expect(depth1Dirs.length).toBeGreaterThan(0);
      expect(depth2Dirs.length).toBeGreaterThan(0);
    });
  });
});