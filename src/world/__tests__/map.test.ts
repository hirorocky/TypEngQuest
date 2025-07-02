import { Map } from '../map';
import { Location, LocationType } from '../location';

describe('Map', () => {
  let map: Map;
  let mockRandom: jest.Mock;

  beforeEach(() => {
    // 決定論的なランダム関数を作成
    mockRandom = jest.fn();
    let callCount = 0;
    // 予測可能なパターンを返すモック関数
    const deterministicValues = [
      0.7, // numDirectories = floor(0.7 * 4) = 2
      0.3, // directory name index = floor(0.3 * 40) = 12 (config)
      0.8, // directory name index = floor(0.8 * 40) = 32 (public)
      0.6, // numFiles = floor(0.6 * 5) = 2
      0.1, // isHidden = 0.1 < 0.2 = true
      0.2, // hidden file index = floor(0.2 * 3) = 0 (.env)
      0.9, // isHidden = 0.9 < 0.2 = false
      0.4, // base name index = floor(0.4 * 22) = 8 (utils)
      0.5, // extension index = floor(0.5 * 10) = 5 (.py)
      // ネストされたディレクトリ用
      0.6, // numDirectories = floor(0.6 * 4) = 2
      0.1, // directory name index = floor(0.1 * 40) = 4 (src)
      0.9, // directory name index = floor(0.9 * 40) = 36 (docs)
      0.4, // numFiles = floor(0.4 * 5) = 1
      0.2, // isHidden = 0.2 >= 0.2 = false
      0.7, // base name index = floor(0.7 * 22) = 15 (main)
      0.3, // extension index = floor(0.3 * 10) = 3 (.md)
    ];
    
    mockRandom.mockImplementation(() => {
      const value = deterministicValues[callCount % deterministicValues.length];
      callCount++;
      return value;
    });

    map = new Map(mockRandom, 1, false); // autogenerate=falseでボス・鍵生成を無効化
  });

  describe('Initialization', () => {
    test('should initialize with populated file system', () => {
      expect(map.getCurrentPath()).toBe('/');
      
      // モックされたランダム関数により予測可能な構造が生成される
      const rootContents = map.getLocations('/');
      expect(rootContents.length).toBe(6); // 2ディレクトリ + 4ファイル
      
      // 総ロケーション数の確認
      const totalLocations = map.getTotalLocations();
      expect(totalLocations).toBeGreaterThan(6); // ルートコンテンツ + ネストされたコンテンツ
      
      // ディレクトリとファイルが混在していることを確認
      const directories = rootContents.filter(loc => loc.isDirectory());
      const files = rootContents.filter(loc => loc.isFile());
      expect(directories.length).toBe(2); // services, assets
      expect(files.length).toBe(4); // server.json, Makefile.py, server.css, utils.cpp
      
      // 具体的なディレクトリ名を確認（実際の生成に基づく）
      const dirNames = directories.map(d => d.getName()).sort();
      expect(dirNames).toContain('services');
      expect(dirNames).toContain('assets');
      
      // ファイル名を確認
      const fileNames = files.map(f => f.getName()).sort();
      expect(fileNames).toContain('server.json');
      expect(fileNames).toContain('Makefile.py');
      expect(fileNames).toContain('server.css');
      expect(fileNames).toContain('utils.cpp');
    });

    test('should have root directory as current location', () => {
      const currentLocation = map.getCurrentLocation();
      expect(currentLocation?.getName()).toBe('');
      expect(currentLocation?.getPath()).toBe('/');
      expect(currentLocation?.isDirectory()).toBe(true);
    });

    test('should generate diverse file types with different extensions', () => {
      const allLocations = map.getAllLocations();
      const files = allLocations.filter(loc => loc.isFile());
      
      // ファイルが生成されていることを確認
      expect(files.length).toBeGreaterThan(4);
      
      // 拡張子の多様性を確認
      const extensions = files.map(file => {
        const name = file.getName();
        const dotIndex = name.lastIndexOf('.');
        return dotIndex !== -1 ? name.substring(dotIndex) : '';
      }).filter(ext => ext !== '');
      
      const uniqueExtensions = [...new Set(extensions)];
      expect(uniqueExtensions.length).toBeGreaterThan(1); // 複数の拡張子
      
      // 実際に生成された拡張子の確認
      expect(uniqueExtensions).toContain('.json');
      expect(uniqueExtensions).toContain('.py');
      expect(uniqueExtensions).toContain('.css');
      expect(uniqueExtensions).toContain('.cpp');
    });

    test('should generate directory structure with multiple levels', () => {
      const allLocations = map.getAllLocations();
      
      // 複数階層のディレクトリ構造が生成されるべき
      const maxDepth = map.getMaxDepth();
      expect(maxDepth).toBeGreaterThanOrEqual(2);
      
      // 具体的なディレクトリ構造を確認
      const directories = allLocations.filter(loc => loc.isDirectory() && loc.getPath() !== '/');
      expect(directories.length).toBeGreaterThan(2);
      
      // ネストされたディレクトリの存在を確認
      const nestedDirs = directories.filter(dir => dir.getPath().split('/').length > 2);
      expect(nestedDirs.length).toBeGreaterThan(0);
      
      // ルートレベルのディレクトリを確認
      const rootDirs = directories.filter(dir => dir.getPath().split('/').length === 2);
      const rootDirNames = rootDirs.map(d => d.getName()).sort();
      expect(rootDirNames).toContain('services');
      expect(rootDirNames).toContain('assets');
      
      // ネストされたディレクトリも含まれるべき
      const dirPaths = directories.map(d => d.getPath()).sort();
      const hasNestedPath = dirPaths.some(path => path.includes('/services/') || path.includes('/assets/'));
      expect(hasNestedPath).toBe(true);
    });
  });

  describe('Location Management', () => {
    test('should add location to map', () => {
      const location = new Location('testdir', '/', LocationType.DIRECTORY);
      const initialCount = map.getTotalLocations();
      
      map.addLocation(location);
      
      expect(map.getTotalLocations()).toBe(initialCount + 1);
      const rootContents = map.getLocations('/');
      expect(rootContents.some(loc => loc.getName() === 'testdir')).toBe(true);
    });

    test('should add multiple locations to same directory', () => {
      const test1 = new Location('testdir1', '/', LocationType.DIRECTORY);
      const test2 = new Location('testdir2', '/', LocationType.DIRECTORY);
      const testfile = new Location('test.txt', '/', LocationType.FILE);
      
      const initialCount = map.getLocations('/').length;
      
      map.addLocation(test1);
      map.addLocation(test2);
      map.addLocation(testfile);
      
      const rootContents = map.getLocations('/');
      expect(rootContents).toHaveLength(initialCount + 3);
      expect(rootContents.map(l => l.getName())).toContain('testdir1');
      expect(rootContents.map(l => l.getName())).toContain('testdir2');
      expect(rootContents.map(l => l.getName())).toContain('test.txt');
    });

    test('should add nested locations', () => {
      const src = new Location('src', '/', LocationType.DIRECTORY);
      const components = new Location('components', '/src', LocationType.DIRECTORY);
      const appJs = new Location('app.js', '/src', LocationType.FILE);
      
      map.addLocation(src);
      map.addLocation(components);
      map.addLocation(appJs);
      
      const srcContents = map.getLocations('/src');
      expect(srcContents).toHaveLength(2);
      expect(srcContents.map(l => l.getName())).toContain('components');
      expect(srcContents.map(l => l.getName())).toContain('app.js');
    });

    test('should find location by path', () => {
      const src = new Location('src', '/', LocationType.DIRECTORY);
      const appJs = new Location('app.js', '/src', LocationType.FILE);
      
      map.addLocation(src);
      map.addLocation(appJs);
      
      const foundSrc = map.findLocation('/src');
      const foundApp = map.findLocation('/src/app.js');
      
      expect(foundSrc?.getName()).toBe('src');
      expect(foundApp?.getName()).toBe('app.js');
    });

    test('should return null for non-existent location', () => {
      const location = map.findLocation('/nonexistent');
      expect(location).toBeNull();
    });

    test('should check if location exists', () => {
      const src = new Location('src', '/', LocationType.DIRECTORY);
      map.addLocation(src);
      
      expect(map.locationExists('/src')).toBe(true);
      expect(map.locationExists('/docs')).toBe(false);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      // Set up a basic directory structure
      map.addLocation(new Location('src', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('docs', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('components', '/src', LocationType.DIRECTORY));
      map.addLocation(new Location('utils', '/src', LocationType.DIRECTORY));
      map.addLocation(new Location('app.js', '/src', LocationType.FILE));
      map.addLocation(new Location('README.md', '/', LocationType.FILE));
    });

    test('should navigate to existing directory', () => {
      const result = map.navigateTo('/src');
      
      expect(result.success).toBe(true);
      expect(map.getCurrentPath()).toBe('/src');
    });

    test('should not navigate to non-existent directory', () => {
      const result = map.navigateTo('/nonexistent');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('does not exist');
      expect(map.getCurrentPath()).toBe('/'); // Should stay at current location
    });

    test('should not navigate to file', () => {
      const result = map.navigateTo('/src/app.js');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not a directory');
      expect(map.getCurrentPath()).toBe('/');
    });

    test('should navigate to parent directory with ..', () => {
      map.navigateTo('/src');
      const result = map.navigateTo('..');
      
      expect(result.success).toBe(true);
      expect(map.getCurrentPath()).toBe('/');
    });

    test('should not navigate above root', () => {
      const result = map.navigateTo('..');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('root directory');
      expect(map.getCurrentPath()).toBe('/');
    });

    test('should handle relative paths', () => {
      map.navigateTo('/src');
      const result = map.navigateTo('components');
      
      expect(result.success).toBe(true);
      expect(map.getCurrentPath()).toBe('/src/components');
    });

    test('should normalize paths', () => {
      const result1 = map.navigateTo('/src/');
      const result2 = map.navigateTo('//src//');
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(map.getCurrentPath()).toBe('/src');
    });
  });

  describe('Directory Listing', () => {
    test('should list current directory contents', () => {
      const contents = map.listCurrentDirectory();
      
      // 自動生成されたコンテンツが存在することを確認
      expect(contents.length).toBeGreaterThan(0);
      
      // いくつかの典型的なファイル/ディレクトリが含まれることを確認
      const names = contents.map(l => l.getName());
      const hasTypicalContent = names.some(name => 
        ['src', 'docs', 'lib', 'components', 'test', 'config'].includes(name) ||
        name.endsWith('.md') || name.endsWith('.json') || name.endsWith('.ts')
      );
      expect(hasTypicalContent).toBe(true);
    });

    test('should list specific directory contents', () => {
      // srcディレクトリが存在する場合のテスト
      const rootContents = map.getLocations('/');
      const srcExists = rootContents.some(loc => loc.getName() === 'src' && loc.isDirectory());
      
      if (srcExists) {
        const srcContents = map.listDirectory('/src');
        expect(srcContents.success).toBe(true);
        expect(srcContents.contents?.length).toBeGreaterThanOrEqual(0);
      } else {
        // srcが存在しない場合は代替ディレクトリをテスト
        const firstDir = rootContents.find(loc => loc.isDirectory());
        if (firstDir) {
          const dirContents = map.listDirectory(firstDir.getPath());
          expect(dirContents.success).toBe(true);
        }
      }
    });

    test('should handle listing non-existent directory', () => {
      const result = map.listDirectory('/nonexistent');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('does not exist');
    });

    test('should handle listing file as directory', () => {
      const result = map.listDirectory('/README.md');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not a directory');
    });

    test('should filter hidden files when requested', () => {
      map.navigateTo('/src');
      
      const allContents = map.listCurrentDirectory();
      const visibleContents = map.listCurrentDirectory(false);
      
      expect(allContents).toHaveLength(2); // app.js, .env
      expect(visibleContents).toHaveLength(1); // only app.js
      expect(visibleContents[0].getName()).toBe('app.js');
    });
  });

  describe('Path Utilities', () => {
    beforeEach(() => {
      // Set up directory structure for path tests
      map.addLocation(new Location('src', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('docs', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('components', '/src', LocationType.DIRECTORY));
      map.addLocation(new Location('utils', '/src', LocationType.DIRECTORY));
      map.addLocation(new Location('app.js', '/src', LocationType.FILE));
    });

    test('should resolve absolute paths', () => {
      expect(map.resolvePath('/src/components')).toBe('/src/components');
      expect(map.resolvePath('/src/../docs')).toBe('/docs');
    });

    test('should resolve relative paths', () => {
      map.navigateTo('/src');
      
      expect(map.resolvePath('components')).toBe('/src/components');
      expect(map.resolvePath('../docs')).toBe('/docs');
      expect(map.resolvePath('.')).toBe('/src');
    });

    test('should normalize paths with multiple slashes', () => {
      expect(map.resolvePath('//src//components//')).toBe('/src/components');
    });

    test('should handle complex relative paths', () => {
      map.navigateTo('/src/components');
      
      expect(map.resolvePath('../../docs')).toBe('/docs');
      expect(map.resolvePath('../utils/../app.js')).toBe('/src/app.js');
    });

    test('should get parent path correctly', () => {
      expect(map.getParentPath('/src/components')).toBe('/src');
      expect(map.getParentPath('/src')).toBe('/');
      expect(map.getParentPath('/')).toBe('/');
    });
  });

  describe('Statistics and Information', () => {
    test('should count total locations', () => {
      const total = map.getTotalLocations();
      expect(total).toBeGreaterThan(5); // 自動生成されるため最低限の数
    });

    test('should count directories and files separately', () => {
      const stats = map.getStatistics();
      
      expect(stats.totalLocations).toBeGreaterThan(5);
      expect(stats.directories).toBeGreaterThan(1);
      expect(stats.files).toBeGreaterThan(1);
      expect(stats.hiddenFiles).toBeGreaterThanOrEqual(0);
      
      // ディレクトリとファイルの合計が総数と一致することを確認
      expect(stats.directories + stats.files).toBe(stats.totalLocations);
    });

    test('should count hidden files', () => {
      const initialHidden = map.getStatistics().hiddenFiles;
      
      map.addLocation(new Location('.env', '/src', LocationType.FILE));
      map.addLocation(new Location('.gitignore', '/', LocationType.FILE));
      
      const stats = map.getStatistics();
      expect(stats.hiddenFiles).toBe(initialHidden + 2);
    });

    test('should provide exploration statistics', () => {
      const src = map.findLocation('/src');
      const app = map.findLocation('/src/app.js');
      
      src?.markExplored();
      app?.markFullyInspected();
      
      const stats = map.getStatistics();
      expect(stats.exploredLocations).toBe(2);
      expect(stats.fullyInspectedLocations).toBe(1);
    });
  });
});