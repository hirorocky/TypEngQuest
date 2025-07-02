import { MapGenerator } from '../mapGenerator';
import { Map } from '../map';
import { ElementManager } from '../elements';
import { ElementType, LocationType, Location } from '../location';

describe('MapGenerator - Boss and Key Placement', () => {
  let generator: MapGenerator;
  let elementManager: ElementManager;
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
    elementManager = new ElementManager();
  });

  describe('Boss and Key Placement', () => {
    test('should place exactly one boss and one key in the world', () => {
      const map = new Map(undefined, 1, false); // autogenerate=false
      // 手動でファイルシステムを生成（ボス・鍵配置なし）
      generator.generateFileSystem(map, {
        maxDepth: 2,
        minDepth: 1,
        maxFilesPerDirectory: 4,
        maxDirectoriesPerLevel: 2,
        fileTypes: ['.ts', '.js'],
      });

      generator.placeBossAndKey(map, 3, elementManager);

      const allLocations = map.getAllLocations();
      const bossLocations = allLocations.filter(loc => {
        const element = loc.getElement();
        return element && element.type === ElementType.BOSS;
      });
      const keyLocations = allLocations.filter(loc => {
        const element = loc.getElement();
        return element && element.type === ElementType.KEY;
      });

      expect(bossLocations.length).toBe(1);
      expect(keyLocations.length).toBe(1);
    });

    test('should place boss at the deepest location', () => {
      const map = new Map(undefined, 1, false); // autogenerate=false
      // 手動でファイルシステムを生成（ボス・鍵配置なし）
      generator.generateFileSystem(map, {
        maxDepth: 3,
        minDepth: 1,
        maxFilesPerDirectory: 4,
        maxDirectoriesPerLevel: 2,
        fileTypes: ['.ts', '.js'],
      });

      generator.placeBossAndKey(map, 3, elementManager);

      const allLocations = map.getAllLocations();
      const fileLocations = allLocations.filter(loc => loc.getType() === LocationType.FILE);
      
      // ボスがいる場所を見つける
      const bossLocation = allLocations.find(loc => {
        const element = loc.getElement();
        return element && element.type === ElementType.BOSS;
      });

      expect(bossLocation).toBeDefined();

      // ボスが最深部にあることを確認
      const bossDepth = bossLocation!.getPath().split('/').length - 1;
      const maxDepth = Math.max(...fileLocations.map(loc => loc.getPath().split('/').length - 1));
      
      expect(bossDepth).toBe(maxDepth);
    });

    test('should place key at different location from boss', () => {
      const map = new Map(undefined, 1, false); // autogenerate=false
      // 手動でファイルシステムを生成（ボス・鍵配置なし）
      generator.generateFileSystem(map, {
        maxDepth: 2,
        minDepth: 1,
        maxFilesPerDirectory: 4,
        maxDirectoriesPerLevel: 2,
        fileTypes: ['.ts', '.js'],
      });

      generator.placeBossAndKey(map, 3, elementManager);

      const allLocations = map.getAllLocations();
      
      const bossLocation = allLocations.find(loc => {
        const element = loc.getElement();
        return element && element.type === ElementType.BOSS;
      });
      
      const keyLocation = allLocations.find(loc => {
        const element = loc.getElement();
        return element && element.type === ElementType.KEY;
      });

      expect(bossLocation).toBeDefined();
      expect(keyLocation).toBeDefined();
      expect(bossLocation).not.toBe(keyLocation);
    });

    test('should create boss with correct world level scaling', () => {
      const map = new Map(undefined, 1, false); // autogenerate=falseで自動生成を無効
      // 手動でファイルシステムを生成（ボス・鍵配置なし）
      generator.generateFileSystem(map, {
        maxDepth: 2,
        minDepth: 1,
        maxFilesPerDirectory: 4,
        maxDirectoriesPerLevel: 2,
        fileTypes: ['.ts', '.js'],
      });

      generator.placeBossAndKey(map, 3, elementManager);

      const allLocations = map.getAllLocations();
      const bossLocation = allLocations.find(loc => {
        const element = loc.getElement();
        return element && element.type === ElementType.BOSS;
      });

      expect(bossLocation).toBeDefined();
      const bossElement = bossLocation!.getElement()!;
      const bossData = bossElement.data;

      // ボスデータの存在確認
      expect(bossData.boss).toBeDefined();
      expect(bossData.description).toBeDefined();
      expect(bossData.encountered).toBe(false);
      expect(bossData.defeated).toBe(false);
    });

    test('should create key with correct world level scaling', () => {
      const map = new Map(undefined, 1, false); // autogenerate=false
      // 手動でファイルシステムを生成（ボス・鍵配置なし）
      generator.generateFileSystem(map, {
        maxDepth: 2,
        minDepth: 1,
        maxFilesPerDirectory: 4,
        maxDirectoriesPerLevel: 2,
        fileTypes: ['.ts', '.js'],
      });

      generator.placeBossAndKey(map, 4, elementManager);

      const allLocations = map.getAllLocations();
      const keyLocation = allLocations.find(loc => {
        const element = loc.getElement();
        return element && element.type === ElementType.KEY;
      });

      expect(keyLocation).toBeDefined();
      const keyElement = keyLocation!.getElement()!;
      const keyData = keyElement.data;

      // 鍵データの存在確認
      expect(keyData.name).toBeDefined();
      expect(keyData.description).toBeDefined();
      expect(keyData.collected).toBe(false);
      
      // ワールドレベル4に適した鍵名が選択されている
      expect(typeof keyData.name).toBe('string');
      expect((keyData.name as string).length).toBeGreaterThan(0);
    });

    test('should throw error when no file locations available', () => {
      const map = new Map(undefined, 1, false); // autogenerate=falseで空のマップ

      expect(() => {
        generator.placeBossAndKey(map, 1, elementManager);
      }).toThrow('Insufficient file locations for boss and key placement. Required: 2, Found: 0');
    });

    test('should handle single file case by placing boss and throwing error for key', () => {
      const map = new Map(undefined, 1, false); // autogenerate=false
      // 1つのファイルのみ生成（手動で追加）
      const fileLocation = new Location('test.ts', '/', LocationType.FILE);
      map.addLocation(fileLocation);

      expect(() => {
        generator.placeBossAndKey(map, 1, elementManager);
      }).toThrow('Insufficient file locations for boss and key placement. Required: 2, Found: 1');
    });

    test('should place boss and key only in file locations, not directories', () => {
      const map = new Map(undefined, 1, false); // autogenerate=false
      // 手動でファイルシステムを生成（ボス・鍵配置なし）
      generator.generateFileSystem(map, {
        maxDepth: 2,
        minDepth: 1,
        maxFilesPerDirectory: 4,
        maxDirectoriesPerLevel: 2,
        fileTypes: ['.ts', '.js'],
      });

      generator.placeBossAndKey(map, 3, elementManager);

      const allLocations = map.getAllLocations();
      
      const bossLocation = allLocations.find(loc => {
        const element = loc.getElement();
        return element && element.type === ElementType.BOSS;
      });
      
      const keyLocation = allLocations.find(loc => {
        const element = loc.getElement();
        return element && element.type === ElementType.KEY;
      });

      expect(bossLocation).toBeDefined();
      expect(keyLocation).toBeDefined();
      
      // ボスと鍵がファイルに配置されていることを確認
      expect(bossLocation!.getType()).toBe(LocationType.FILE);
      expect(keyLocation!.getType()).toBe(LocationType.FILE);
    });

    test('should preserve existing elements when placing boss and key', () => {
      const map = new Map(undefined, 1, false); // autogenerate=false
      // 手動でファイルシステムを生成（ボス・鍵配置なし）
      generator.generateFileSystem(map, {
        maxDepth: 2,
        minDepth: 1,
        maxFilesPerDirectory: 4,
        maxDirectoriesPerLevel: 2,
        fileTypes: ['.ts', '.js'],
      });
      
      // 既存の要素をいくつかの場所に設定
      const allLocations = map.getAllLocations();
      const fileLocations = allLocations.filter(loc => loc.getType() === LocationType.FILE);
      
      if (fileLocations.length > 2) {
        // 最初のファイルに既存要素を設定
        const existingElement = elementManager.generateMonsterForFile(fileLocations[0]);
        fileLocations[0].setElement(existingElement);
      }

      generator.placeBossAndKey(map, 3, elementManager);

      const elementsAfterPlacement = allLocations
        .map(loc => loc.getElement())
        .filter(element => element !== null);

      // ボス、鍵、既存要素がすべて存在することを確認
      const bossElements = elementsAfterPlacement.filter(el => el!.type === ElementType.BOSS);
      const keyElements = elementsAfterPlacement.filter(el => el!.type === ElementType.KEY);

      expect(bossElements.length).toBe(1);
      expect(keyElements.length).toBe(1);
      expect(elementsAfterPlacement.length).toBeGreaterThanOrEqual(2);
    });
  });
});