import { Boss } from './boss';
import { Map } from './map';
import { Location } from './location';

/**
 * ワールドクリア情報の型定義
 */
export interface WorldClearInfo {
  name: string;
  level: number;
  bossName: string;
  exploredLocations: number;
  clearedAt: Date;
}

/**
 * アクセス結果の型定義
 */
export interface AccessResult {
  success: boolean;
  message: string;
}

/**
 * ワールドクラス - ゲーム内の各ワールドを管理する
 */
export class World {
  private name: string;
  private level: number;
  private map: Map;
  private boss: Boss | null = null;
  private bossLocation: Location | null = null;
  private cleared: boolean = false;

  /**
   * ワールドインスタンスを初期化する
   * @param name - ワールド名
   * @param level - ワールドレベル
   * @param map - 関連付けるマップインスタンス
   */
  constructor(name: string, level: number, map: Map) {
    this.name = name;
    this.level = level;
    this.map = map;
  }

  /**
   * ワールド名を取得する
   * @returns ワールド名
   */
  getName(): string {
    return this.name;
  }

  /**
   * ワールドレベルを取得する
   * @returns ワールドレベル
   */
  getLevel(): number {
    return this.level;
  }

  /**
   * クリア状態を取得
   */
  isCleared(): boolean {
    return this.cleared;
  }

  /**
   * マップを取得
   */
  getMap(): Map {
    return this.map;
  }

  /**
   * ボスを取得
   */
  getBoss(): Boss | null {
    return this.boss;
  }

  /**
   * ボスが設定されているかどうか
   */
  hasBoss(): boolean {
    return this.boss !== null;
  }

  /**
   * ボスを設定
   */
  setBoss(boss: Boss): void {
    this.boss = boss;
  }

  /**
   * ボスを倒す
   */
  defeatBoss(): void {
    if (!this.boss) {
      throw new Error('No boss set for this world');
    }
    this.boss.takeDamage(this.boss.getCurrentHealth());
    this.cleared = true;
  }

  /**
   * ボスの場所を取得
   */
  getBossLocation(): Location | null {
    return this.bossLocation;
  }

  /**
   * ボスの場所を設定
   */
  setBossLocation(location: Location): void {
    this.bossLocation = location;
  }

  /**
   * ボスが最深部にあるかどうかを確認
   */
  isBossAtMaxDepth(): boolean {
    if (!this.bossLocation) {
      return false;
    }

    const bossPath = this.bossLocation.getPath();
    const maxDepth = this.map.getMaxDepth();
    const bossDepth = bossPath.split('/').length - 1;

    return bossDepth === maxDepth;
  }

  /**
   * 指定パスが鍵を必要とするかどうか
   */
  requiresKey(path: string): boolean {
    if (!this.bossLocation) {
      return false;
    }
    return path === this.bossLocation.getPath();
  }

  /**
   * 鍵を使ってアクセスを試行
   */
  tryAccessWithKey(path: string): AccessResult {
    if (!this.requiresKey(path)) {
      return {
        success: false,
        message: 'This location does not require a key',
      };
    }

    const locationName = path.split('/').pop() || 'unknown';
    return {
      success: true,
      message: `Access granted to ${locationName} with key`,
    };
  }

  /**
   * 鍵なしでアクセスを試行
   */
  tryAccessWithoutKey(path: string): AccessResult {
    if (!this.requiresKey(path)) {
      return {
        success: true,
        message: 'Access granted',
      };
    }

    const locationName = path.split('/').pop() || 'unknown';
    return {
      success: false,
      message: `cd: ${locationName}: Permission denied`,
    };
  }

  /**
   * 探索済み場所数を取得
   */
  getExploredLocationCount(): number {
    return this.map.getAllLocations().filter(location => location.isExplored()).length;
  }

  /**
   * 総場所数を取得
   */
  getTotalLocationCount(): number {
    return this.map.getAllLocations().length;
  }

  /**
   * 探索進捗率を計算
   */
  getExplorationProgress(): number {
    const total = this.getTotalLocationCount();
    if (total === 0) return 0;

    const explored = this.getExploredLocationCount();
    return explored / total;
  }

  /**
   * ワールドクリア情報を生成
   */
  generateClearInfo(): WorldClearInfo {
    if (!this.cleared) {
      throw new Error('World is not cleared yet');
    }

    if (!this.boss) {
      throw new Error('No boss information available');
    }

    return {
      name: this.name,
      level: this.level,
      bossName: this.boss.getName(),
      exploredLocations: this.getExploredLocationCount(),
      clearedAt: new Date(),
    };
  }
}
