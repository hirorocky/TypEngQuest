/**
 * 装備による上昇ステータスを管理するクラス
 * 攻撃力、意志力、敏捷性、幸運の値を保持し、演算を提供する
 */
export class EquipmentStats {
  private strength: number;
  private willpower: number;
  private agility: number;
  private fortune: number;

  /**
   * EquipmentStatsクラスのコンストラクタ
   * @param stats - 初期ステータス値（デフォルト: 全て0）
   */
  constructor(stats: Partial<EquipmentStatsData> = {}) {
    this.strength = stats.strength || 0;
    this.willpower = stats.willpower || 0;
    this.agility = stats.agility || 0;
    this.fortune = stats.fortune || 0;
  }

  /**
   * 攻撃力を取得する
   * @returns 攻撃力
   */
  getStrength(): number {
    return this.strength;
  }

  /**
   * 意志力を取得する
   * @returns 意志力
   */
  getWillpower(): number {
    return this.willpower;
  }

  /**
   * 敏捷性を取得する
   * @returns 敏捷性
   */
  getAgility(): number {
    return this.agility;
  }

  /**
   * 幸運を取得する
   * @returns 幸運
   */
  getFortune(): number {
    return this.fortune;
  }

  /**
   * 攻撃力を設定する
   * @param value - 攻撃力
   */
  setStrength(value: number): void {
    this.strength = value;
  }

  /**
   * 意志力を設定する
   * @param value - 意志力
   */
  setWillpower(value: number): void {
    this.willpower = value;
  }

  /**
   * 敏捷性を設定する
   * @param value - 敏捷性
   */
  setAgility(value: number): void {
    this.agility = value;
  }

  /**
   * 幸運を設定する
   * @param value - 幸運
   */
  setFortune(value: number): void {
    this.fortune = value;
  }

  /**
   * 攻撃力を加算する
   * @param value - 加算値
   */
  addStrength(value: number): void {
    this.strength += value;
  }

  /**
   * 意志力を加算する
   * @param value - 加算値
   */
  addWillpower(value: number): void {
    this.willpower += value;
  }

  /**
   * 敏捷性を加算する
   * @param value - 加算値
   */
  addAgility(value: number): void {
    this.agility += value;
  }

  /**
   * 幸運を加算する
   * @param value - 加算値
   */
  addFortune(value: number): void {
    this.fortune += value;
  }

  /**
   * 別のEquipmentStatsを加算する
   * @param other - 加算するEquipmentStats
   */
  add(other: EquipmentStats): void {
    this.strength += other.strength;
    this.willpower += other.willpower;
    this.agility += other.agility;
    this.fortune += other.fortune;
  }

  /**
   * 全てのステータスをクリアする（0にリセット）
   */
  clear(): void {
    this.strength = 0;
    this.willpower = 0;
    this.agility = 0;
    this.fortune = 0;
  }

  /**
   * 指定されたステータスタイプの値を取得する
   * @param statType - ステータスタイプ
   * @returns ステータス値
   */
  getStat(statType: keyof EquipmentStatsData): number {
    switch (statType) {
      case 'strength':
        return this.strength;
      case 'willpower':
        return this.willpower;
      case 'agility':
        return this.agility;
      case 'fortune':
        return this.fortune;
      default:
        return 0;
    }
  }

  /**
   * 指定されたステータスタイプの値を設定する
   * @param statType - ステータスタイプ
   * @param value - 設定値
   */
  setStat(statType: keyof EquipmentStatsData, value: number): void {
    switch (statType) {
      case 'strength':
        this.strength = value;
        break;
      case 'willpower':
        this.willpower = value;
        break;
      case 'agility':
        this.agility = value;
        break;
      case 'fortune':
        this.fortune = value;
        break;
    }
  }

  /**
   * 全ステータスの合計値を計算する
   * @returns 合計値
   */
  getTotal(): number {
    return this.strength + this.willpower + this.agility + this.fortune;
  }

  /**
   * 全てのステータスが0かどうかを判定する
   * @returns 全て0の場合true
   */
  isEmpty(): boolean {
    return this.strength === 0 && this.willpower === 0 && this.agility === 0 && this.fortune === 0;
  }

  /**
   * EquipmentStatsオブジェクトをJSONに変換する
   * @returns JSON形式のデータ
   */
  toJSON(): EquipmentStatsData {
    return {
      strength: this.strength,
      willpower: this.willpower,
      agility: this.agility,
      fortune: this.fortune,
    };
  }

  /**
   * JSONデータからEquipmentStatsオブジェクトを作成する
   * @param data - JSONデータ
   * @returns EquipmentStatsインスタンス
   * @throws {Error} 不正なデータの場合
   */
  static fromJSON(data: any): EquipmentStats {
    if (!this.validateEquipmentStatsData(data)) {
      throw new Error('Invalid equipment stats data format');
    }

    return new EquipmentStats(data);
  }

  /**
   * 2つのEquipmentStatsを加算して新しいインスタンスを返す
   * @param stats1 - 1つ目のステータス
   * @param stats2 - 2つ目のステータス
   * @returns 加算結果の新しいEquipmentStats
   */
  static add(stats1: EquipmentStats, stats2: EquipmentStats): EquipmentStats {
    return new EquipmentStats({
      strength: stats1.strength + stats2.strength,
      willpower: stats1.willpower + stats2.willpower,
      agility: stats1.agility + stats2.agility,
      fortune: stats1.fortune + stats2.fortune,
    });
  }

  /**
   * EquipmentStatsDataの形式を検証する
   * @param data - 検証するデータ
   * @returns 有効な場合true
   */
  private static validateEquipmentStatsData(data: any): data is EquipmentStatsData {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.strength === 'number' &&
      typeof data.willpower === 'number' &&
      typeof data.agility === 'number' &&
      typeof data.fortune === 'number'
    );
  }
}

/**
 * EquipmentStatsデータのインターフェース
 */
export interface EquipmentStatsData {
  strength: number;
  willpower: number;
  agility: number;
  fortune: number;
}
