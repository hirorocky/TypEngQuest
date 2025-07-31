/**
 * 装備による上昇ステータスを管理するクラス
 * 攻撃力、防御力、速度、精度、幸運の値を保持し、演算を提供する
 */
export class EquipmentStats {
  private attack: number;
  private defense: number;
  private speed: number;
  private accuracy: number;
  private fortune: number;

  /**
   * EquipmentStatsクラスのコンストラクタ
   * @param stats - 初期ステータス値（デフォルト: 全て0）
   */
  constructor(stats: Partial<EquipmentStatsData> = {}) {
    this.attack = stats.attack || 0;
    this.defense = stats.defense || 0;
    this.speed = stats.speed || 0;
    this.accuracy = stats.accuracy || 0;
    this.fortune = stats.fortune || 0;
  }

  /**
   * 攻撃力を取得する
   * @returns 攻撃力
   */
  getAttack(): number {
    return this.attack;
  }

  /**
   * 防御力を取得する
   * @returns 防御力
   */
  getDefense(): number {
    return this.defense;
  }

  /**
   * 速度を取得する
   * @returns 速度
   */
  getSpeed(): number {
    return this.speed;
  }

  /**
   * 精度を取得する
   * @returns 精度
   */
  getAccuracy(): number {
    return this.accuracy;
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
  setAttack(value: number): void {
    this.attack = value;
  }

  /**
   * 防御力を設定する
   * @param value - 防御力
   */
  setDefense(value: number): void {
    this.defense = value;
  }

  /**
   * 速度を設定する
   * @param value - 速度
   */
  setSpeed(value: number): void {
    this.speed = value;
  }

  /**
   * 精度を設定する
   * @param value - 精度
   */
  setAccuracy(value: number): void {
    this.accuracy = value;
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
  addAttack(value: number): void {
    this.attack += value;
  }

  /**
   * 防御力を加算する
   * @param value - 加算値
   */
  addDefense(value: number): void {
    this.defense += value;
  }

  /**
   * 速度を加算する
   * @param value - 加算値
   */
  addSpeed(value: number): void {
    this.speed += value;
  }

  /**
   * 精度を加算する
   * @param value - 加算値
   */
  addAccuracy(value: number): void {
    this.accuracy += value;
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
    this.attack += other.attack;
    this.defense += other.defense;
    this.speed += other.speed;
    this.accuracy += other.accuracy;
    this.fortune += other.fortune;
  }

  /**
   * 全てのステータスをクリアする（0にリセット）
   */
  clear(): void {
    this.attack = 0;
    this.defense = 0;
    this.speed = 0;
    this.accuracy = 0;
    this.fortune = 0;
  }

  /**
   * 指定されたステータスタイプの値を取得する
   * @param statType - ステータスタイプ
   * @returns ステータス値
   */
  getStat(statType: keyof EquipmentStatsData): number {
    switch (statType) {
      case 'attack':
        return this.attack;
      case 'defense':
        return this.defense;
      case 'speed':
        return this.speed;
      case 'accuracy':
        return this.accuracy;
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
      case 'attack':
        this.attack = value;
        break;
      case 'defense':
        this.defense = value;
        break;
      case 'speed':
        this.speed = value;
        break;
      case 'accuracy':
        this.accuracy = value;
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
    return this.attack + this.defense + this.speed + this.accuracy + this.fortune;
  }

  /**
   * 全てのステータスが0かどうかを判定する
   * @returns 全て0の場合true
   */
  isEmpty(): boolean {
    return (
      this.attack === 0 &&
      this.defense === 0 &&
      this.speed === 0 &&
      this.accuracy === 0 &&
      this.fortune === 0
    );
  }

  /**
   * EquipmentStatsオブジェクトをJSONに変換する
   * @returns JSON形式のデータ
   */
  toJSON(): EquipmentStatsData {
    return {
      attack: this.attack,
      defense: this.defense,
      speed: this.speed,
      accuracy: this.accuracy,
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
      attack: stats1.attack + stats2.attack,
      defense: stats1.defense + stats2.defense,
      speed: stats1.speed + stats2.speed,
      accuracy: stats1.accuracy + stats2.accuracy,
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
      typeof data.attack === 'number' &&
      typeof data.defense === 'number' &&
      typeof data.speed === 'number' &&
      typeof data.accuracy === 'number' &&
      typeof data.fortune === 'number'
    );
  }
}

/**
 * EquipmentStatsデータのインターフェース
 */
export interface EquipmentStatsData {
  attack: number;
  defense: number;
  speed: number;
  accuracy: number;
  fortune: number;
}
