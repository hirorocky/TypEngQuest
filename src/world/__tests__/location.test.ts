import { Location, LocationType, ElementType } from '../location';

describe('Location', () => {
  describe('Constructor and Basic Properties', () => {
    test('should create a directory location with correct properties', () => {
      const location = new Location('src', '/projects/app', LocationType.DIRECTORY);
      
      expect(location.getName()).toBe('src');
      expect(location.getPath()).toBe('/projects/app/src');
      expect(location.getType()).toBe(LocationType.DIRECTORY);
      expect(location.isDirectory()).toBe(true);
      expect(location.isFile()).toBe(false);
    });

    test('should create a file location with correct properties', () => {
      const location = new Location('app.js', '/projects/app/src', LocationType.FILE);
      
      expect(location.getName()).toBe('app.js');
      expect(location.getPath()).toBe('/projects/app/src/app.js');
      expect(location.getType()).toBe(LocationType.FILE);
      expect(location.isDirectory()).toBe(false);
      expect(location.isFile()).toBe(true);
    });

    test('should handle root directory path correctly', () => {
      const location = new Location('projects', '/', LocationType.DIRECTORY);
      
      expect(location.getPath()).toBe('/projects');
    });

    test('should handle empty parent path correctly', () => {
      const location = new Location('root', '', LocationType.DIRECTORY);
      
      expect(location.getPath()).toBe('/root');
    });
  });

  describe('File Extension Detection', () => {
    test('should detect JavaScript files', () => {
      const location = new Location('app.js', '/src', LocationType.FILE);
      expect(location.getFileExtension()).toBe('.js');
    });

    test('should detect TypeScript files', () => {
      const location = new Location('main.ts', '/src', LocationType.FILE);
      expect(location.getFileExtension()).toBe('.ts');
    });

    test('should detect hidden files', () => {
      const location = new Location('.env', '/src', LocationType.FILE);
      expect(location.getFileExtension()).toBe('');
      expect(location.isHidden()).toBe(true);
    });

    test('should detect files without extension', () => {
      const location = new Location('README', '/src', LocationType.FILE);
      expect(location.getFileExtension()).toBe('');
      expect(location.isHidden()).toBe(false);
    });

    test('should return empty extension for directories', () => {
      const location = new Location('src', '/projects', LocationType.DIRECTORY);
      expect(location.getFileExtension()).toBe('');
    });
  });

  describe('Element System', () => {
    test('should start with no elements', () => {
      const location = new Location('app.js', '/src', LocationType.FILE);
      
      expect(location.hasElement()).toBe(false);
      expect(location.getElement()).toBeNull();
    });

    test('should add and retrieve monster element', () => {
      const location = new Location('app.js', '/src', LocationType.FILE);
      
      location.setElement(ElementType.MONSTER, { name: 'JavaScript Bug', level: 1 });
      
      expect(location.hasElement()).toBe(true);
      expect(location.getElement()?.type).toBe(ElementType.MONSTER);
      expect(location.getElement()?.data.name).toBe('JavaScript Bug');
    });

    test('should add and retrieve treasure element', () => {
      const location = new Location('package.json', '/src', LocationType.FILE);
      
      location.setElement(ElementType.TREASURE, { rarity: 'rare', equipment: 'dependency' });
      
      expect(location.hasElement()).toBe(true);
      expect(location.getElement()?.type).toBe(ElementType.TREASURE);
      expect(location.getElement()?.data.rarity).toBe('rare');
    });

    test('should replace existing element', () => {
      const location = new Location('config.json', '/src', LocationType.FILE);
      
      location.setElement(ElementType.MONSTER, { name: 'Bug' });
      location.setElement(ElementType.TREASURE, { rarity: 'common' });
      
      expect(location.getElement()?.type).toBe(ElementType.TREASURE);
      expect(location.getElement()?.data.rarity).toBe('common');
    });

    test('should clear element', () => {
      const location = new Location('app.js', '/src', LocationType.FILE);
      
      location.setElement(ElementType.MONSTER, { name: 'Bug' });
      location.clearElement();
      
      expect(location.hasElement()).toBe(false);
      expect(location.getElement()).toBeNull();
    });
  });

  describe('Exploration State', () => {
    test('should start as unexplored', () => {
      const location = new Location('app.js', '/src', LocationType.FILE);
      
      expect(location.isExplored()).toBe(false);
      expect(location.isFullyInspected()).toBe(false);
    });

    test('should mark as explored', () => {
      const location = new Location('app.js', '/src', LocationType.FILE);
      
      location.markExplored();
      
      expect(location.isExplored()).toBe(true);
      expect(location.isFullyInspected()).toBe(false);
    });

    test('should mark as fully inspected', () => {
      const location = new Location('app.js', '/src', LocationType.FILE);
      
      location.markFullyInspected();
      
      expect(location.isExplored()).toBe(true);
      expect(location.isFullyInspected()).toBe(true);
    });
  });

  describe('Danger Level Assessment', () => {
    test('should calculate danger level for executable files', () => {
      const exeLocation = new Location('app.exe', '/bin', LocationType.FILE);
      expect(exeLocation.getDangerLevel()).toBeGreaterThan(0.5);
    });

    test('should calculate danger level for hidden files', () => {
      const hiddenLocation = new Location('.env', '/src', LocationType.FILE);
      expect(hiddenLocation.getDangerLevel()).toBeGreaterThan(0.3);
    });

    test('should calculate low danger level for documentation', () => {
      const docLocation = new Location('README.md', '/src', LocationType.FILE);
      expect(docLocation.getDangerLevel()).toBeLessThan(0.3);
    });

    test('should calculate very low danger level for directories', () => {
      const dirLocation = new Location('src', '/projects', LocationType.DIRECTORY);
      expect(dirLocation.getDangerLevel()).toBeLessThan(0.1);
    });
  });

  describe('Metadata Management', () => {
    test('should set and get metadata', () => {
      const location = new Location('app.js', '/src', LocationType.FILE);
      
      location.setMetadata('lastVisited', Date.now());
      location.setMetadata('difficulty', 5);
      
      expect(location.getMetadata('lastVisited')).toBeDefined();
      expect(location.getMetadata('difficulty')).toBe(5);
      expect(location.getMetadata('nonexistent')).toBeUndefined();
    });

    test('should check if metadata exists', () => {
      const location = new Location('app.js', '/src', LocationType.FILE);
      
      location.setMetadata('test', 'value');
      
      expect(location.hasMetadata('test')).toBe(true);
      expect(location.hasMetadata('missing')).toBe(false);
    });
  });

  describe('Display Information', () => {
    test('should generate display info for unexplored file', () => {
      const location = new Location('app.js', '/src', LocationType.FILE);
      const displayInfo = location.getDisplayInfo();
      
      expect(displayInfo.name).toBe('app.js');
      expect(displayInfo.type).toBe('file');
      expect(displayInfo.explored).toBe(false);
      expect(displayInfo.dangerLevel).toBeDefined();
    });

    test('should generate display info for explored directory', () => {
      const location = new Location('src', '/projects', LocationType.DIRECTORY);
      location.markExplored();
      
      const displayInfo = location.getDisplayInfo();
      
      expect(displayInfo.name).toBe('src');
      expect(displayInfo.type).toBe('directory');
      expect(displayInfo.explored).toBe(true);
    });

    test('should include element info when present', () => {
      const location = new Location('app.js', '/src', LocationType.FILE);
      location.setElement(ElementType.MONSTER, { name: 'Bug' });
      location.markFullyInspected();
      
      const displayInfo = location.getDisplayInfo();
      
      expect(displayInfo.element).toBeDefined();
      expect(displayInfo.element?.type).toBe(ElementType.MONSTER);
    });
  });
});