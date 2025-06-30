import { Location, LocationType } from './location';
import { MapGenerator } from './mapGenerator';

/**
 * ナビゲーション結果の型定義
 */
export interface NavigationResult {
  success: boolean;
  error?: string;
  previousPath?: string;
}

/**
 * ディレクトリ一覧結果の型定義
 */
export interface DirectoryListResult {
  success: boolean;
  contents?: Location[];
  error?: string;
}

/**
 * マップ統計情報の型定義
 */
export interface MapStatistics {
  totalLocations: number;
  directories: number;
  files: number;
  hiddenFiles: number;
  exploredLocations: number;
  fullyInspectedLocations: number;
}

/**
 * マップクラス - ファイルシステム風のナビゲーションと場所管理を行う
 */
export class Map {
  private locations: globalThis.Map<string, Location[]> = new globalThis.Map();
  private currentPath = '/';
  private randomFunction: () => number;

  constructor(randomFunction: () => number = Math.random) {
    this.randomFunction = randomFunction;
    // Initialize with root directory
    const root = new Location('', '', LocationType.DIRECTORY);
    this.addLocation(root);
    this.locations.set('/', []);

    // Generate file system content automatically
    this.generateFileSystem();
  }

  /**
   * ファイルシステム構造を自動生成する
   */
  private generateFileSystem(): void {
    const generator = new MapGenerator(this.randomFunction);
    // より多様性のある設定でファイルシステムを生成
    generator.generateFileSystem(this, {
      maxDepth: 3,
      maxFilesPerDirectory: 4,
      maxDirectoriesPerLevel: 3,
      fileTypes: ['.ts', '.js', '.json', '.md', '.txt', '.py', '.java', '.cpp', '.html', '.css'],
      hiddenFileRatio: 0.2,
    });
  }

  // Location Management
  addLocation(location: Location): void {
    const parentPath = this.getParentPath(location.getPath());

    if (!this.locations.has(parentPath)) {
      this.locations.set(parentPath, []);
    }

    const siblings = this.locations.get(parentPath)!;

    // Remove existing location with same name
    const existingIndex = siblings.findIndex((l: Location) => l.getName() === location.getName());
    if (existingIndex !== -1) {
      siblings.splice(existingIndex, 1);
    }

    siblings.push(location);

    // Ensure directory entry exists for directories
    if (location.isDirectory()) {
      if (!this.locations.has(location.getPath())) {
        this.locations.set(location.getPath(), []);
      }
    }
  }

  findLocation(path: string): Location | null {
    const normalizedPath = this.normalizePath(path);

    if (normalizedPath === '/') {
      return new Location('', '', LocationType.DIRECTORY);
    }

    const parentPath = this.getParentPath(normalizedPath);
    const name = this.getBaseName(normalizedPath);

    const siblings = this.locations.get(parentPath);
    if (!siblings) return null;

    return siblings.find((l: Location) => l.getName() === name) || null;
  }

  locationExists(path: string): boolean {
    return this.findLocation(path) !== null;
  }

  getLocations(path: string): Location[] {
    const normalizedPath = this.normalizePath(path);
    return this.locations.get(normalizedPath) || [];
  }

  getTotalLocations(): number {
    let count = 0;
    for (const locationList of this.locations.values()) {
      count += locationList.length;
    }
    return count;
  }

  getAllLocations(): Location[] {
    const allLocations: Location[] = [];
    for (const locationList of this.locations.values()) {
      allLocations.push(...locationList);
    }
    return allLocations;
  }

  getMaxDepth(): number {
    let maxDepth = 0;
    for (const locationList of this.locations.values()) {
      for (const location of locationList) {
        const depth = location.getPath().split('/').length - 1;
        maxDepth = Math.max(maxDepth, depth);
      }
    }
    return maxDepth;
  }

  // Navigation
  getCurrentPath(): string {
    return this.currentPath;
  }

  getCurrentLocation(): Location | null {
    return this.findLocation(this.currentPath);
  }

  navigateTo(path: string): NavigationResult {
    const resolvedPath = this.resolvePath(path);
    const previousPath = this.currentPath;

    // Handle parent directory navigation
    if (path === '..') {
      if (this.currentPath === '/') {
        return {
          success: false,
          error: 'Already at root directory',
        };
      }
      const parentPath = this.getParentPath(this.currentPath);
      this.currentPath = parentPath;
      return {
        success: true,
        previousPath,
      };
    }

    // Check if location exists
    const targetLocation = this.findLocation(resolvedPath);
    if (!targetLocation) {
      return {
        success: false,
        error: `Location '${resolvedPath}' does not exist`,
      };
    }

    // Check if it's a directory
    if (!targetLocation.isDirectory()) {
      return {
        success: false,
        error: `'${resolvedPath}' is not a directory`,
      };
    }

    this.currentPath = resolvedPath;
    targetLocation.markExplored();

    return {
      success: true,
      previousPath,
    };
  }

  // Directory Listing
  listCurrentDirectory(includeHidden = true): Location[] {
    return this.filterLocations(this.getLocations(this.currentPath), includeHidden);
  }

  listDirectory(path: string): DirectoryListResult {
    const normalizedPath = this.normalizePath(path);
    const location = this.findLocation(normalizedPath);

    if (!location) {
      return {
        success: false,
        error: `Directory '${normalizedPath}' does not exist`,
      };
    }

    if (!location.isDirectory()) {
      return {
        success: false,
        error: `'${normalizedPath}' is not a directory`,
      };
    }

    return {
      success: true,
      contents: this.getLocations(normalizedPath),
    };
  }

  private filterLocations(locations: Location[], includeHidden: boolean): Location[] {
    if (includeHidden) {
      return [...locations];
    }
    return locations.filter((l: Location) => !l.isHidden());
  }

  // Path Utilities
  resolvePath(path: string): string {
    if (path.startsWith('/')) {
      return this.normalizePath(path);
    }

    // Handle relative paths
    if (path === '.') {
      return this.currentPath;
    }

    if (path === '..') {
      return this.getParentPath(this.currentPath);
    }

    // Resolve relative path from current directory
    const fullPath = this.currentPath === '/' ? `/${path}` : `${this.currentPath}/${path}`;
    return this.normalizePath(fullPath);
  }

  normalizePath(path: string): string {
    // Replace multiple slashes with single slash
    let normalized = path.replace(/\/+/g, '/');

    // Ensure it starts with /
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized;
    }

    // Remove trailing slash unless it's root
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    // Handle .. and . components
    const parts = normalized.split('/').filter(part => part !== '');
    const resolved: string[] = [];

    for (const part of parts) {
      if (part === '..') {
        if (resolved.length > 0) {
          resolved.pop();
        }
      } else if (part !== '.') {
        resolved.push(part);
      }
    }

    return resolved.length === 0 ? '/' : '/' + resolved.join('/');
  }

  getParentPath(path: string): string {
    const normalized = this.normalizePath(path);
    if (normalized === '/') return '/';

    const lastSlash = normalized.lastIndexOf('/');
    return lastSlash === 0 ? '/' : normalized.substring(0, lastSlash);
  }

  private getBaseName(path: string): string {
    const normalized = this.normalizePath(path);
    if (normalized === '/') return '';

    const lastSlash = normalized.lastIndexOf('/');
    return normalized.substring(lastSlash + 1);
  }

  // Statistics
  getStatistics(): MapStatistics {
    let totalLocations = 0;
    let directories = 0;
    let files = 0;
    let hiddenFiles = 0;
    let exploredLocations = 0;
    let fullyInspectedLocations = 0;

    for (const locationList of this.locations.values()) {
      for (const location of locationList) {
        totalLocations++;

        if (location.isDirectory()) {
          directories++;
        } else {
          files++;
          if (location.isHidden()) {
            hiddenFiles++;
          }
        }

        if (location.isExplored()) {
          exploredLocations++;
        }

        if (location.isFullyInspected()) {
          fullyInspectedLocations++;
        }
      }
    }

    return {
      totalLocations,
      directories,
      files,
      hiddenFiles,
      exploredLocations,
      fullyInspectedLocations,
    };
  }
}
