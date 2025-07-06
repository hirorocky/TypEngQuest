/**
 * ワールドの状態を管理するクラス
 */

import { FileSystem } from './FileSystem';
import { FileNode } from './FileNode';
import { DomainData, DomainType, getDomainData } from './domains';

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
   * @param fileSystem ファイルシステム
   * @throws {Error} レベルが1未満の場合
   */
  constructor(domain: DomainData, level: number, fileSystem: FileSystem) {
    if (level < 1) {
      throw new Error('ワールドレベルは1以上である必要があります');
    }

    this.domain = domain;
    this.level = level;
    this.fileSystem = fileSystem;
    this.currentPath = '/';
    this.exploredPaths = new Set(['/']);

    // ルートノードも探索済みにマーク
    const rootNode = this.fileSystem.getNodeByPath('/');
    if (rootNode && rootNode.name === 'projects') {
      this.exploredPaths.add('/projects');
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
    };
  }

  /**
   * JSONデータからWorldインスタンスを復元する
   * @param data ワールドデータ
   * @param fileSystem ファイルシステム
   * @returns 復元されたWorldインスタンス
   * @throws {Error} 無効なドメインタイプの場合
   */
  public static fromJSON(data: WorldData, fileSystem: FileSystem): World {
    const domain = getDomainData(data.domainType);
    if (!domain) {
      throw new Error(`無効なドメインタイプです: ${data.domainType}`);
    }

    const world = new World(domain, data.level, fileSystem);
    world.currentPath = data.currentPath;
    world.exploredPaths = new Set(data.exploredPaths);
    world.keyLocation = data.keyLocation;
    world.bossLocation = data.bossLocation;
    world.hasKey = data.hasKey;

    return world;
  }
}
