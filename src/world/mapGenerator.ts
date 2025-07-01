import { Map } from './map';
import { Location, LocationType } from './location';
import { ElementManager } from './elements';

// マップ生成設定
export interface MapGeneratorConfig {
  maxDepth: number; // 最大階層深度
  minDepth?: number; // 最小階層深度（デフォルト: 1）
  maxFilesPerDirectory: number; // ディレクトリあたりの最大ファイル数
  maxDirectoriesPerLevel: number; // レベルあたりの最大ディレクトリ数
  fileTypes: string[]; // 生成するファイルタイプ
  hiddenFileRatio?: number; // 隠しファイルの比率（0-1）
}

export class MapGenerator {
  private randomFunction: () => number;

  constructor(randomFunction: () => number = Math.random) {
    this.randomFunction = randomFunction;
  }

  // プログラミング関連のディレクトリ名
  private readonly directoryNames = [
    'src',
    'lib',
    'test',
    'tests',
    'config',
    'utils',
    'components',
    'services',
    'models',
    'controllers',
    'api',
    'data',
    'assets',
    'docs',
    'scripts',
    'build',
    'dist',
    'node_modules',
    'vendor',
    'public',
    'static',
    'styles',
    'images',
    'fonts',
  ];

  // プログラミング関連のファイル名（拡張子なし）
  private readonly fileNames = [
    'index',
    'main',
    'app',
    'server',
    'client',
    'config',
    'utils',
    'helper',
    'package',
    'README',
    'CHANGELOG',
    'LICENSE',
    'TODO',
    'Makefile',
    'Dockerfile',
    'database',
    'schema',
    'model',
    'controller',
    'service',
    'component',
    'test',
    'spec',
    'setup',
    'build',
    'webpack',
    'babel',
    'eslint',
    'prettier',
    'jest',
    'tsconfig',
    'rollup',
    'vite',
  ];

  // 隠しファイル名
  private readonly hiddenFileNames = [
    '.env',
    '.gitignore',
    '.eslintrc',
    '.prettierrc',
    '.babelrc',
    '.nvmrc',
    '.dockerignore',
    '.editorconfig',
    '.github',
    '.vscode',
    '.idea',
    '.DS_Store',
  ];

  /**
   * ファイルシステム風マップを生成する
   */
  generateFileSystem(map: Map, config?: Partial<MapGeneratorConfig>): void {
    // デフォルト設定
    const defaultConfig: MapGeneratorConfig = {
      maxDepth: 4,
      minDepth: 1,
      maxFilesPerDirectory: 6,
      maxDirectoriesPerLevel: 4,
      fileTypes: ['.js', '.ts', '.json', '.md', '.txt'],
      hiddenFileRatio: 0.15,
    };

    const finalConfig = { ...defaultConfig, ...config };

    // 設定値のバリデーション
    this.validateConfig(finalConfig);

    // ルートディレクトリから再帰的に生成
    this.generateDirectoryContents(map, '/', 1, finalConfig);
  }

  /**
   * ワールドにボスと鍵を必須配置する
   * @param map - マップインスタンス
   * @param worldLevel - ワールドレベル
   * @param elementManager - 要素管理インスタンス
   */
  placeBossAndKey(map: Map, worldLevel: number, elementManager: ElementManager): void {
    const allLocations = map.getAllLocations();
    const fileLocations = allLocations.filter(loc => loc.getType() === LocationType.FILE);

    if (fileLocations.length === 0) {
      throw new Error('No file locations available for boss and key placement');
    }

    // ボス配置: 最深部にあるファイルに配置
    const bossLocation = this.findDeepestLocation(fileLocations);
    const bossElement = elementManager.generateBossForWorld(worldLevel);
    bossLocation.setElement(bossElement);

    // 鍵配置: ボス以外のランダムなファイルに配置
    const keyLocation = this.findRandomLocationExcluding(fileLocations, bossLocation);
    if (keyLocation) {
      const keyElement = elementManager.generateKeyForWorld(worldLevel);
      keyLocation.setElement(keyElement);
    } else {
      throw new Error('No suitable location found for key placement');
    }
  }

  /**
   * 最深部の場所を見つける
   * @param locations - 場所の配列
   * @returns 最深部の場所
   */
  private findDeepestLocation(locations: Location[]): Location {
    return locations.reduce((deepest, current) => {
      const currentDepth = current.getPath().split('/').length - 1;
      const deepestDepth = deepest.getPath().split('/').length - 1;
      return currentDepth > deepestDepth ? current : deepest;
    });
  }

  /**
   * 指定された場所を除外してランダムな場所を見つける
   * @param locations - 場所の配列
   * @param excludeLocation - 除外する場所
   * @returns ランダムな場所（除外場所以外）
   */
  private findRandomLocationExcluding(
    locations: Location[],
    excludeLocation: Location
  ): Location | null {
    const availableLocations = locations.filter(loc => loc !== excludeLocation);

    if (availableLocations.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(this.randomFunction() * availableLocations.length);
    return availableLocations[randomIndex];
  }

  /**
   * 設定値のバリデーション
   */
  private validateConfig(config: MapGeneratorConfig): void {
    if (config.maxDepth <= 0) {
      throw new Error('maxDepth must be greater than 0');
    }
    const minDepth = config.minDepth ?? 1;
    if (minDepth < 1) {
      throw new Error('minDepth must be at least 1');
    }
    if (minDepth > config.maxDepth) {
      throw new Error('minDepth cannot be greater than maxDepth');
    }
    if (config.maxFilesPerDirectory < 0) {
      throw new Error('maxFilesPerDirectory must be non-negative');
    }
    if (config.maxDirectoriesPerLevel < 0) {
      throw new Error('maxDirectoriesPerLevel must be non-negative');
    }
    if (config.fileTypes.length === 0) {
      throw new Error('fileTypes must not be empty');
    }
  }

  /**
   * 指定ディレクトリの内容を生成
   */
  private generateDirectoryContents(
    map: Map,
    parentPath: string,
    currentDepth: number,
    config: MapGeneratorConfig
  ): void {
    // 最大深度に達した場合は終了
    if (currentDepth > config.maxDepth) {
      return;
    }

    const minDepth = config.minDepth ?? 1;

    // ディレクトリを生成
    const numDirectories = Math.floor(this.randomFunction() * (config.maxDirectoriesPerLevel + 1));
    const usedDirNames = new Set<string>();

    // 最小深度に達していない場合は、必ずディレクトリを1つ以上生成
    const minDirectories = currentDepth < minDepth ? Math.max(1, numDirectories) : numDirectories;

    for (let i = 0; i < minDirectories && currentDepth < config.maxDepth; i++) {
      const dirName = this.getUniqueDirectoryName(usedDirNames);
      const dirLocation = new Location(dirName, parentPath, LocationType.DIRECTORY);
      map.addLocation(dirLocation);

      // 再帰的に子ディレクトリの内容を生成
      this.generateDirectoryContents(map, dirLocation.getPath(), currentDepth + 1, config);
    }

    // ファイルを生成
    const numFiles = Math.floor(this.randomFunction() * (config.maxFilesPerDirectory + 1));
    const usedFileNames = new Set<string>();

    // ルートディレクトリまたは最小深度に達した場合は、必ずファイルを1つ以上生成
    const minFiles =
      currentDepth === 1 || currentDepth >= minDepth ? Math.max(1, numFiles) : numFiles;

    for (let i = 0; i < minFiles; i++) {
      const fileName = this.getUniqueFileName(usedFileNames, config);
      const fileLocation = new Location(fileName, parentPath, LocationType.FILE);
      map.addLocation(fileLocation);
    }
  }

  /**
   * 重複しないディレクトリ名を取得
   */
  private getUniqueDirectoryName(usedNames: Set<string>): string {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const name =
        this.directoryNames[Math.floor(this.randomFunction() * this.directoryNames.length)];
      if (!usedNames.has(name)) {
        usedNames.add(name);
        return name;
      }
      attempts++;
    }

    // フォールバック: 番号付きディレクトリ名
    let counter = 1;
    while (usedNames.has(`dir${counter}`)) {
      counter++;
    }
    const fallbackName = `dir${counter}`;
    usedNames.add(fallbackName);
    return fallbackName;
  }

  /**
   * 重複しないファイル名を取得
   */
  private getUniqueFileName(usedNames: Set<string>, config: MapGeneratorConfig): string {
    const isHidden = this.randomFunction() < (config.hiddenFileRatio || 0);
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      let fileName: string;

      if (isHidden) {
        // 隠しファイルを生成
        fileName =
          this.hiddenFileNames[Math.floor(this.randomFunction() * this.hiddenFileNames.length)];
      } else {
        // 通常ファイルを生成
        const baseName = this.fileNames[Math.floor(this.randomFunction() * this.fileNames.length)];
        const extension =
          config.fileTypes[Math.floor(this.randomFunction() * config.fileTypes.length)];
        fileName = `${baseName}${extension}`;
      }

      if (!usedNames.has(fileName)) {
        usedNames.add(fileName);
        return fileName;
      }
      attempts++;
    }

    // フォールバック: 番号付きファイル名
    let counter = 1;
    const extension = config.fileTypes[Math.floor(this.randomFunction() * config.fileTypes.length)];
    while (usedNames.has(`file${counter}${extension}`)) {
      counter++;
    }
    const fallbackName = `file${counter}${extension}`;
    usedNames.add(fallbackName);
    return fallbackName;
  }
}
