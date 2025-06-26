/* eslint-disable no-unused-vars */
export enum LocationType {
  DIRECTORY = 'directory',
  FILE = 'file',
}

export enum ElementType {
  MONSTER = 'monster',
  TREASURE = 'treasure',
  RANDOM_EVENT = 'random_event',
  SAVE_POINT = 'save_point',
}
/* eslint-enable no-unused-vars */

export interface Element {
  type: ElementType;
  data: Record<string, unknown>;
}

export interface LocationDisplayInfo {
  name: string;
  path: string;
  type: string;
  explored: boolean;
  fullyInspected: boolean;
  dangerLevel: number;
  fileExtension?: string;
  hidden: boolean;
  element?: Element;
}

export class Location {
  private name: string;
  private parentPath: string;
  private type: LocationType;
  private element: Element | null = null;
  private explored = false;
  private fullyInspected = false;
  private metadata: Map<string, unknown> = new Map();

  constructor(name: string, parentPath: string, type: LocationType) {
    this.name = name;
    this.parentPath = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath;
    this.type = type;
  }

  // Basic Properties
  getName(): string {
    return this.name;
  }

  getPath(): string {
    if (this.parentPath === '' || this.parentPath === '/') {
      return `/${this.name}`;
    }
    return `${this.parentPath}/${this.name}`;
  }

  getType(): LocationType {
    return this.type;
  }

  isDirectory(): boolean {
    return this.type === LocationType.DIRECTORY;
  }

  isFile(): boolean {
    return this.type === LocationType.FILE;
  }

  // File Properties
  getFileExtension(): string {
    if (this.isDirectory()) return '';

    const dotIndex = this.name.lastIndexOf('.');
    if (dotIndex === -1 || dotIndex === 0) return '';

    return this.name.substring(dotIndex);
  }

  isHidden(): boolean {
    return this.name.startsWith('.');
  }

  // Element Management
  hasElement(): boolean {
    return this.element !== null;
  }

  getElement(): Element | null {
    return this.element;
  }

  setElement(type: ElementType, data: Record<string, unknown>): void {
    this.element = { type, data };
  }

  clearElement(): void {
    this.element = null;
  }

  // Exploration State
  isExplored(): boolean {
    return this.explored;
  }

  isFullyInspected(): boolean {
    return this.fullyInspected;
  }

  markExplored(): void {
    this.explored = true;
  }

  markFullyInspected(): void {
    this.explored = true;
    this.fullyInspected = true;
  }

  // Danger Assessment
  getDangerLevel(): number {
    if (this.isDirectory()) return 0.05;

    let dangerLevel = 0.1; // Base level for files

    const extension = this.getFileExtension().toLowerCase();

    // Executable files are more dangerous
    if (['.exe', '.bin', '.app', '.msi'].includes(extension)) {
      dangerLevel += 0.6;
    }

    // Script files have moderate danger
    if (['.js', '.ts', '.py', '.sh', '.bat', '.ps1'].includes(extension)) {
      dangerLevel += 0.3;
    }

    // Hidden files are more dangerous
    if (this.isHidden()) {
      dangerLevel += 0.4;
    }

    // System files
    if (this.name.includes('system') || this.name.includes('config')) {
      dangerLevel += 0.2;
    }

    // Documentation is safer
    if (['.md', '.txt', '.doc', '.pdf'].includes(extension)) {
      dangerLevel = Math.max(0.05, dangerLevel - 0.3);
    }

    return Math.min(1.0, dangerLevel);
  }

  // Metadata Management
  setMetadata(key: string, value: unknown): void {
    this.metadata.set(key, value);
  }

  getMetadata(key: string): unknown {
    return this.metadata.get(key);
  }

  hasMetadata(key: string): boolean {
    return this.metadata.has(key);
  }

  // Display Information
  getDisplayInfo(): LocationDisplayInfo {
    return {
      name: this.name,
      path: this.getPath(),
      type: this.type,
      explored: this.explored,
      fullyInspected: this.fullyInspected,
      dangerLevel: this.getDangerLevel(),
      fileExtension: this.isFile() ? this.getFileExtension() : undefined,
      hidden: this.isHidden(),
      element: this.fullyInspected ? this.element || undefined : undefined,
    };
  }
}
