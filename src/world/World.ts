/**
 * ワールドの状態を管理するクラス
 */

import { FileSystem } from './FileSystem';
import { FileNode, NodeType } from './FileNode';
import {
  DomainData,
  DomainType,
  getDomainData,
  getRandomDirectoryName,
  getRandomFileName,
} from './domains';

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
   * @param domain ドメインデータ
   * @param level ワールドレベル
   * @param fileSystem ファイルシステム（オプション：指定されない場合は生成）
   * @throws {Error} レベルが1未満の場合
   */
  constructor(domain: DomainData, level: number, fileSystem?: FileSystem) {
    if (level < 1) {
      throw new Error('ワールドレベルは1以上である必要があります');
    }

    this.domain = domain;
    this.level = level;

    // ファイルシステムが提供されていない場合は生成
    if (fileSystem) {
      this.fileSystem = fileSystem;
    } else {
      this.fileSystem = this.generateFileSystem();
    }

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
   * @returns 生成されたファイルシステム
   */
  private generateFileSystem(): FileSystem {
    const maxDepth = this.getMaxDepth();
    const root = new FileNode(this.domain.name, NodeType.DIRECTORY);

    // ルートの下にディレクトリ構造を生成
    this.fileSystem = new FileSystem(root);
    this.generateDirectoryStructure(root, 1, maxDepth);
    this.placeSpecialItems();

    return this.fileSystem;
  }

  /**
   * ディレクトリ構造を再帰的に生成する
   * @param parentNode 親ディレクトリノード
   * @param currentDepth 現在の深度
   * @param maxDepth 最大深度
   */
  private generateDirectoryStructure(
    parentNode: FileNode,
    currentDepth: number,
    maxDepth: number
  ): void {
    if (currentDepth >= maxDepth) {
      return;
    }

    // 各深度でのディレクトリ数を決定（深くなるほど少なく）
    const dirCount = Math.max(1, Math.ceil(Math.random() * (4 - currentDepth)));

    for (let i = 0; i < dirCount; i++) {
      const dirName = getRandomDirectoryName(this.domain, currentDepth);
      const dirNode = new FileNode(dirName, NodeType.DIRECTORY);
      parentNode.addChild(dirNode);

      // 各ディレクトリにファイルを追加
      this.generateFiles(dirNode, currentDepth);

      // 再帰的に子ディレクトリを生成
      if (currentDepth + 1 < maxDepth && Math.random() < 0.7) {
        this.generateDirectoryStructure(dirNode, currentDepth + 1, maxDepth);
      }
    }
  }

  /**
   * 指定されたディレクトリにファイルを生成する
   * @param parentNode 親ディレクトリノード
   * @param depth 現在の深度
   */
  private generateFiles(parentNode: FileNode, depth: number): void {
    // 各ファイルタイプを最低1つずつ、最大3つまで生成
    const fileTypes: ('monster' | 'treasure' | 'event' | 'savepoint')[] = [
      'monster',
      'treasure',
      'event',
      'savepoint',
    ];

    fileTypes.forEach(fileType => {
      const fileCount = Math.max(1, Math.ceil(Math.random() * 3));

      for (let i = 0; i < fileCount; i++) {
        const fileName = getRandomFileName(this.domain, fileType, depth);
        const fileNode = new FileNode(fileName, NodeType.FILE);
        parentNode.addChild(fileNode);
      }
    });
  }

  /**
   * ワールドに鍵とボスを配置する
   */
  private placeSpecialItems(): void {
    // 全ノードを取得
    const allNodes = this.fileSystem.find('');

    // ディレクトリ（ボス配置用）を取得（ルートは除く）
    const directories = allNodes.filter(node => node.isDirectory() && node.getPath() !== '/');

    // ボスを配置
    if (directories.length === 0) {
      throw new Error('no directories available for boss placement');
    }
    const bossDir = directories[Math.floor(Math.random() * directories.length)];
    this.setBossLocation(bossDir.getPath());

    // 宝箱ファイル（鍵配置用）を取得（ボスディレクトリ内は除外）
    let treasureFiles = allNodes.filter(
      node =>
        node.isFile() &&
        node.fileType === 'treasure' &&
        !node.getPath().startsWith(bossDir.getPath())
    );

    // ボスディレクトリ外に宝箱がない場合は、全宝箱ファイルを対象にする
    if (treasureFiles.length === 0) {
      treasureFiles = allNodes.filter(node => node.isFile() && node.fileType === 'treasure');
    }

    // 鍵を配置
    if (treasureFiles.length === 0) {
      throw new Error('no treasure files available for key placement');
    }
    const keyFile = treasureFiles[Math.floor(Math.random() * treasureFiles.length)];
    this.setKeyLocation(keyFile.getPath());
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

    // ファイルシステムを復元
    let fileSystem: FileSystem | undefined;
    if (data.fileSystemRoot) {
      const rootNode = World.deserializeFileNode(data.fileSystemRoot);
      fileSystem = new FileSystem(rootNode);
    }

    const world = new World(domain, data.level, fileSystem);
    world.currentPath = data.currentPath;
    world.exploredPaths = new Set(data.exploredPaths);
    world.keyLocation = data.keyLocation;
    world.bossLocation = data.bossLocation;
    world.hasKey = data.hasKey;

    return world;
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
