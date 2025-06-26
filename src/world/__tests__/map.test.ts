import { Map } from '../map';
import { Location, LocationType } from '../location';

describe('Map', () => {
  let map: Map;

  beforeEach(() => {
    map = new Map();
  });

  describe('Initialization', () => {
    test('should initialize with empty structure', () => {
      expect(map.getCurrentPath()).toBe('/');
      expect(map.getLocations('/')).toEqual([]);
      expect(map.getTotalLocations()).toBe(0);
    });

    test('should have root directory as current location', () => {
      const currentLocation = map.getCurrentLocation();
      expect(currentLocation?.getName()).toBe('');
      expect(currentLocation?.getPath()).toBe('/');
      expect(currentLocation?.isDirectory()).toBe(true);
    });
  });

  describe('Location Management', () => {
    test('should add location to map', () => {
      const location = new Location('src', '/', LocationType.DIRECTORY);
      
      map.addLocation(location);
      
      expect(map.getTotalLocations()).toBe(1);
      expect(map.getLocations('/')[0].getName()).toBe('src');
    });

    test('should add multiple locations to same directory', () => {
      const src = new Location('src', '/', LocationType.DIRECTORY);
      const docs = new Location('docs', '/', LocationType.DIRECTORY);
      const readme = new Location('README.md', '/', LocationType.FILE);
      
      map.addLocation(src);
      map.addLocation(docs);
      map.addLocation(readme);
      
      const rootContents = map.getLocations('/');
      expect(rootContents).toHaveLength(3);
      expect(rootContents.map(l => l.getName())).toContain('src');
      expect(rootContents.map(l => l.getName())).toContain('docs');
      expect(rootContents.map(l => l.getName())).toContain('README.md');
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
    beforeEach(() => {
      map.addLocation(new Location('src', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('docs', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('app.js', '/src', LocationType.FILE));
      map.addLocation(new Location('.env', '/src', LocationType.FILE));
      map.addLocation(new Location('README.md', '/', LocationType.FILE));
    });

    test('should list current directory contents', () => {
      const contents = map.listCurrentDirectory();
      
      expect(contents).toHaveLength(3); // src, docs, README.md
      expect(contents.map(l => l.getName())).toContain('src');
      expect(contents.map(l => l.getName())).toContain('docs');
      expect(contents.map(l => l.getName())).toContain('README.md');
    });

    test('should list specific directory contents', () => {
      const srcContents = map.listDirectory('/src');
      
      expect(srcContents.success).toBe(true);
      expect(srcContents.contents).toHaveLength(2); // app.js, .env
      expect(srcContents.contents?.map(l => l.getName())).toContain('app.js');
      expect(srcContents.contents?.map(l => l.getName())).toContain('.env');
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
    beforeEach(() => {
      map.addLocation(new Location('src', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('docs', '/', LocationType.DIRECTORY));
      map.addLocation(new Location('app.js', '/src', LocationType.FILE));
      map.addLocation(new Location('utils.ts', '/src', LocationType.FILE));
      map.addLocation(new Location('README.md', '/', LocationType.FILE));
    });

    test('should count total locations', () => {
      expect(map.getTotalLocations()).toBe(5);
    });

    test('should count directories and files separately', () => {
      const stats = map.getStatistics();
      
      expect(stats.totalLocations).toBe(5);
      expect(stats.directories).toBe(2);
      expect(stats.files).toBe(3);
      expect(stats.hiddenFiles).toBe(0);
    });

    test('should count hidden files', () => {
      map.addLocation(new Location('.env', '/src', LocationType.FILE));
      map.addLocation(new Location('.gitignore', '/', LocationType.FILE));
      
      const stats = map.getStatistics();
      expect(stats.hiddenFiles).toBe(2);
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