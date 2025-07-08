/**
 * ワールドの状態を管理するクラス
 */

import { FileSystem } from './FileSystem';
import { FileNode, NodeType, FileType } from './FileNode';
import { DomainData, DomainType, getDomainData, getRandomDomain } from './domains';

/**
 * ワールドのシリアライズ用データインターフェース
 */
export interface WorldData {
  domainType: DomainType;
  level: number;
  currentPath: string;
  exploredPaths: string[];
  keyLocation: string | null;
  bossLocation: string | null;
  hasKey: boolean;
  fileSystemRoot?: FileNodeData; // ファイルシステムのシリアライズデータ
}

/**
 * FileNodeのシリアライズ用データインターフェース
 */
export interface FileNodeData {
  name: string;
  nodeType: NodeType;
  children?: FileNodeData[];
}

/**
 * ワールドクラス - 現在のワールド状態を管理する
 */
export class World {
  public domain: DomainData;
  public level: number;
  public fileSystem: FileSystem;
  public currentPath: string;
  public keyLocation: string | null = null;
  public bossLocation: string | null = null;
  public hasKey: boolean = false;

  private exploredPaths: Set<string>;

  /**
   * Worldインスタンスを作成する
   * @param domainOrDomainType ドメインデータまたはドメインタイプ
   * @param level ワールドレベル
   * @param isTest テスト用かどうか（固定構造を使用）
   * @throws {Error} レベルが1未満または無効なドメインタイプの場合
   */
  constructor(
    domainOrDomainType: DomainData | DomainType | 'random',
    level: number,
    isTest: boolean = false
  ) {
    if (level < 1) {
      throw new Error('ワールドレベルは1以上である必要があります');
    }

    // ドメインの解決
    let domain: DomainData;
    if (typeof domainOrDomainType === 'string') {
      if (domainOrDomainType === 'random') {
        domain = getRandomDomain();
      } else {
        const resolvedDomain = getDomainData(domainOrDomainType);
        if (!resolvedDomain) {
          throw new Error(`無効なドメインタイプです: ${domainOrDomainType}`);
        }
        domain = resolvedDomain;
      }
    } else {
      domain = domainOrDomainType;
    }

    this.domain = domain;
    this.level = level;

    // ファイルシステムを生成
    this.fileSystem = this.generateFileSystem(isTest);

    this.currentPath = '/';
    this.exploredPaths = new Set(['/']);

    // ルートは常に '/' のみ
    const rootNode = this.fileSystem.getNodeByPath('/');
    if (rootNode) {
      this.exploredPaths.add('/');
    }
  }

  /**
   * 現在位置を設定する
   * @param path 設定するパス
   * @throws {Error} パスが存在しない場合
   */
  public setCurrentPath(path: string): void {
    const node = this.fileSystem.getNodeByPath(path);
    if (!node) {
      throw new Error(`指定されたパスは存在しません: ${path}`);
    }
    this.currentPath = path;
  }

  /**
   * 現在位置のノードを取得する
   * @returns 現在位置のノード、存在しない場合はnull
   */
  public getCurrentNode(): FileNode | null {
    return this.fileSystem.getNodeByPath(this.currentPath);
  }

  /**
   * パスを探索済みとしてマークする
   * @param path 探索済みにするパス
   */
  public markAsExplored(path: string): void {
    this.exploredPaths.add(path);
  }

  /**
   * パスが探索済みかどうかを確認する
   * @param path 確認するパス
   * @returns 探索済みの場合true
   */
  public isExplored(path: string): boolean {
    return this.exploredPaths.has(path);
  }

  /**
   * 探索済みパスの一覧を取得する
   * @returns 探索済みパスの配列
   */
  public getExploredPaths(): string[] {
    return Array.from(this.exploredPaths).sort();
  }

  /**
   * 鍵の場所を設定する
   * @param path 鍵があるファイルのパス
   * @throws {Error} パスが存在しない場合
   */
  public setKeyLocation(path: string): void {
    const node = this.fileSystem.getNodeByPath(path);
    if (!node) {
      throw new Error(`指定されたパスは存在しません: ${path}`);
    }
    this.keyLocation = path;
  }

  /**
   * ボスの場所を設定する
   * @param path ボスがいるディレクトリのパス
   * @throws {Error} パスが存在しない場合
   */
  public setBossLocation(path: string): void {
    const node = this.fileSystem.getNodeByPath(path);
    if (!node) {
      throw new Error(`指定されたパスは存在しません: ${path}`);
    }
    this.bossLocation = path;
  }

  /**
   * 鍵を取得する
   */
  public obtainKey(): void {
    this.hasKey = true;
  }

  /**
   * 鍵を使用する
   */
  public useKey(): void {
    this.hasKey = false;
  }

  /**
   * ワールドの最大深度を取得する
   * @returns 最大深度（最小4、最大10）
   */
  public getMaxDepth(): number {
    const depth = 3 + this.level;
    return Math.min(depth, 10);
  }

  /**
   * ファイルシステムを生成する
   * @param isTest テスト用かどうか
   * @returns 生成されたファイルシステム
   */
  protected generateFileSystem(isTest: boolean = false): FileSystem {
    let fileSystem: FileSystem;

    if (isTest) {
      // テスト用の固定ファイルシステム
      fileSystem = FileSystem.createTestStructure();
      this.fileSystem = fileSystem;

      // 固定の配置でボスと鍵を設定
      this.setBossLocation('/game-studio');
      this.setKeyLocation('/tech-startup/package.json');
    } else {
      // 通常のランダム生成
      fileSystem = FileSystem.generateFileSystem(this.domain, this.level);
      this.fileSystem = fileSystem;
      this.placeSpecialItems();
    }

    return fileSystem;
  }

  /**
   * ワールドに鍵とボスを配置する
   */
  protected placeSpecialItems(): void {
    // 全ノードを取得
    const allNodes = this.fileSystem.find('');

    // 最深層のディレクトリを取得
    const maxDepth = this.getMaxDepth() - 1;
    const deepestDirs = allNodes.filter(node => {
      if (!node.isDirectory() || node.getPath() === '/') return false;
      const depth = node.getPath().split('/').length - 2; // ルートからの深さ
      return depth === maxDepth;
    });

    // 最深層ディレクトリがなければ、最も深いディレクトリを探す
    let targetDirs = deepestDirs;
    if (targetDirs.length === 0) {
      const depths = allNodes
        .filter(node => node.isDirectory() && node.getPath() !== '/')
        .map(node => ({
          node,
          depth: node.getPath().split('/').length - 2,
        }))
        .sort((a, b) => b.depth - a.depth);

      if (depths.length > 0) {
        const maxFoundDepth = depths[0].depth;
        targetDirs = depths.filter(d => d.depth === maxFoundDepth).map(d => d.node);
      }
    }

    if (targetDirs.length === 0) {
      throw new Error('no directories available for boss placement');
    }

    // ランダムな最深層ディレクトリを選択
    const selectedDir = targetDirs[Math.floor(Math.random() * targetDirs.length)];

    // ボスディレクトリを新規作成
    const bossDir = new FileNode('boss', NodeType.DIRECTORY);
    selectedDir.addChild(bossDir);
    // パスを直接設定（FileSystemでのノード検索をスキップ）
    const bossPath = bossDir.getPath();
    this.bossLocation = bossPath;

    // ボスディレクトリ内にボスファイルを作成
    const bossFile = new FileNode('final_boss.py', NodeType.FILE);
    bossFile.fileType = FileType.MONSTER;
    bossDir.addChild(bossFile);

    // 鍵を含む宝箱ファイルを新規作成
    // ボスディレクトリ以外のランダムなディレクトリに配置
    const keyDirs = allNodes.filter(
      node =>
        node.isDirectory() &&
        node.getPath() !== '/' &&
        node.getPath() !== bossDir.getPath() &&
        !node.getPath().startsWith(bossDir.getPath())
    );

    if (keyDirs.length === 0) {
      throw new Error('no directories available for key placement');
    }

    const keyDir = keyDirs[Math.floor(Math.random() * keyDirs.length)];
    const keyFile = new FileNode('golden_key.yaml', NodeType.FILE);
    keyFile.fileType = FileType.TREASURE;
    keyDir.addChild(keyFile);
    // パスを直接設定（FileSystemでのノード検索をスキップ）
    const keyPath = keyFile.getPath();
    this.keyLocation = keyPath;
  }

  /**
   * ドメイン名を取得する
   * @returns ドメイン名
   */
  public getDomainName(): string {
    return this.domain.name;
  }

  /**
   * ドメインタイプを取得する
   * @returns ドメインタイプ
   */
  public getDomainType(): DomainType {
    return this.domain.type;
  }

  /**
   * ワールド状態をJSONシリアライズ用オブジェクトに変換する
   * @returns シリアライズ用データ
   */
  public toJSON(): WorldData {
    return {
      domainType: this.domain.type,
      level: this.level,
      currentPath: this.currentPath,
      exploredPaths: this.getExploredPaths(),
      keyLocation: this.keyLocation,
      bossLocation: this.bossLocation,
      hasKey: this.hasKey,
      fileSystemRoot: this.serializeFileNode(this.fileSystem.root),
    };
  }

  /**
   * FileNodeをシリアライズ用データに変換する
   * @param node ファイルノード
   * @returns シリアライズ用データ
   */
  private serializeFileNode(node: FileNode): FileNodeData {
    const data: FileNodeData = {
      name: node.name,
      nodeType: node.nodeType,
    };

    if (node.isDirectory() && node.children.length > 0) {
      data.children = node.children.map(child => this.serializeFileNode(child));
    }

    return data;
  }

  /**
   * JSONデータからWorldインスタンスを復元する
   * @param data ワールドデータ
   * @returns 復元されたWorldインスタンス
   * @throws {Error} 無効なドメインタイプの場合
   */
  public static fromJSON(data: WorldData): World {
    const domain = getDomainData(data.domainType);
    if (!domain) {
      throw new Error(`無効なドメインタイプです: ${data.domainType}`);
    }

    const world = new World(domain, data.level);

    // ファイルシステムを復元して上書き
    if (data.fileSystemRoot) {
      const rootNode = World.deserializeFileNode(data.fileSystemRoot);
      world.fileSystem = new FileSystem(rootNode);
    }

    world.currentPath = data.currentPath;
    world.exploredPaths = new Set(data.exploredPaths);
    world.keyLocation = data.keyLocation;
    world.bossLocation = data.bossLocation;
    world.hasKey = data.hasKey;

    return world;
  }

  /**
   * 指定されたドメインとレベルでワールドを生成する
   * @param domainType ドメインタイプ
   * @param level ワールドレベル
   * @param isTest テスト用かどうか
   * @returns 生成されたワールド
   * @throws {Error} 無効なドメインタイプまたはレベルの場合
   */
  public static generateWorld(
    domainType: DomainType,
    level: number,
    isTest: boolean = false
  ): World {
    return new World(domainType, level, isTest);
  }

  /**
   * ランダムなドメインでワールドを生成する
   * @param level ワールドレベル
   * @param isTest テスト用かどうか
   * @returns 生成されたワールド
   * @throws {Error} 無効なレベルの場合
   */
  public static generateRandomWorld(level: number, isTest: boolean = false): World {
    return new World('random', level, isTest);
  }

  /**
   * テスト用の固定ファイル構造でワールドを生成する
   * @returns 生成されたワールド
   */
  public static generateTestWorld(): World {
    return new World('tech-startup', 1, true);
  }

  /**
   * シリアライズデータからFileNodeを復元する
   * @param data シリアライズ用データ
   * @returns 復元されたファイルノード
   */
  private static deserializeFileNode(data: FileNodeData): FileNode {
    const node = new FileNode(data.name, data.nodeType);

    if (data.children) {
      data.children.forEach(childData => {
        const childNode = World.deserializeFileNode(childData);
        node.addChild(childNode);
      });
    }

    return node;
  }
}
