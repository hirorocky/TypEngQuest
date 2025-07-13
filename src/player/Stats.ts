import { TemporaryStatus } from './TemporaryStatus';

/**
 * プレイヤーのステータス管理クラス
 * HP、MP、攻撃力、防御力、速度、精度、幸運を管理し、
 * ダメージ・回復処理、一時ステータス処理、JSONシリアライゼーションを提供する
 */
export class Stats {
  // ゲームバランスパラメータ定数
  private static readonly BASE_HP = 100;
  private static readonly HP_PER_LEVEL = 20;
  private static readonly BASE_MP = 50;
  private static readonly MP_PER_LEVEL = 10;
  private static readonly BASE_STAT = 10;

  private level: number;
  private currentHP: number;
  private currentMP: number;
  private baseAttack: number;
  private baseDefense: number;
  private baseSpeed: number;
  private baseAccuracy: number;
  private baseFortune: number;
  private temporaryBoosts: {
    attack: number;
    defense: number;
    speed: number;
    accuracy: number;
    fortune: number;
  };
  private temporaryStatuses: TemporaryStatus[];

  /**
   * Statsクラスのコンストラクタ
   * @param level - プレイヤーレベル（デフォルト: 0）
   */
  constructor(level: number = 0) {
    this.level = Math.max(0, level); // 負の値は0にクランプ
    this.baseAttack = Stats.BASE_STAT;
    this.baseDefense = Stats.BASE_STAT;
    this.baseSpeed = Stats.BASE_STAT;
    this.baseAccuracy = Stats.BASE_STAT;
    this.baseFortune = Stats.BASE_STAT;
    this.temporaryBoosts = {
      attack: 0,
      defense: 0,
      speed: 0,
      accuracy: 0,
      fortune: 0,
    };
    this.temporaryStatuses = [];

    // HP/MPを最大値で初期化
    this.currentHP = this.calculateMaxHP();
    this.currentMP = this.calculateMaxMP();
  }

  /**
   * 最大HPを計算する
   * 計算式: BASE_HP + (レベル × HP_PER_LEVEL)
   * @returns 最大HP
   */
  private calculateMaxHP(): number {
    return Stats.BASE_HP + this.level * Stats.HP_PER_LEVEL;
  }

  /**
   * 最大MPを計算する
   * 計算式: BASE_MP + (レベル × MP_PER_LEVEL)
   * @returns 最大MP
   */
  private calculateMaxMP(): number {
    return Stats.BASE_MP + this.level * Stats.MP_PER_LEVEL;
  }

  /**
   * 現在HPを取得する
   * @returns 現在HP
   */
  getCurrentHP(): number {
    return this.currentHP;
  }

  /**
   * 現在MPを取得する
   * @returns 現在MP
   */
  getCurrentMP(): number {
    return this.currentMP;
  }

  /**
   * 最大HPを取得する
   * @returns 最大HP
   */
  getMaxHP(): number {
    return this.calculateMaxHP();
  }

  /**
   * 最大MPを取得する
   * @returns 最大MP
   */
  getMaxMP(): number {
    return this.calculateMaxMP();
  }

  /**
   * 攻撃力を取得する（基本値 + 一時的なブースト）
   * @returns 攻撃力
   */
  getAttack(): number {
    return Math.max(0, this.baseAttack + this.temporaryBoosts.attack);
  }

  /**
   * 防御力を取得する（基本値 + 一時的なブースト）
   * @returns 防御力
   */
  getDefense(): number {
    return Math.max(0, this.baseDefense + this.temporaryBoosts.defense);
  }

  /**
   * 速度を取得する（基本値 + 一時的なブースト）
   * @returns 速度
   */
  getSpeed(): number {
    return Math.max(0, this.baseSpeed + this.temporaryBoosts.speed);
  }

  /**
   * 精度を取得する（基本値 + 一時的なブースト）
   * @returns 精度
   */
  getAccuracy(): number {
    return Math.max(0, this.baseAccuracy + this.temporaryBoosts.accuracy);
  }

  /**
   * 幸運を取得する（基本値 + 一時的なブースト）
   * @returns 幸運
   */
  getFortune(): number {
    return Math.max(0, this.baseFortune + this.temporaryBoosts.fortune);
  }

  /**
   * ダメージを受ける
   * @param damage - 受けるダメージ量
   */
  takeDamage(damage: number): void {
    this.currentHP = Math.max(0, this.currentHP - damage);
  }

  /**
   * HPを回復する
   * @param amount - 回復量
   */
  healHP(amount: number): void {
    const maxHP = this.getMaxHP();
    this.currentHP = Math.min(maxHP, this.currentHP + amount);
  }

  /**
   * HPを全回復する
   */
  fullHealHP(): void {
    this.currentHP = this.getMaxHP();
  }

  /**
   * 死亡状態かどうかを判定する
   * @returns HPが0の場合true
   */
  isDead(): boolean {
    return this.currentHP <= 0;
  }

  /**
   * MPを消費する
   * @param amount - 消費量
   */
  consumeMP(amount: number): void {
    this.currentMP = Math.max(0, this.currentMP - amount);
  }

  /**
   * MPを回復する
   * @param amount - 回復量
   */
  healMP(amount: number): void {
    const maxMP = this.getMaxMP();
    this.currentMP = Math.min(maxMP, this.currentMP + amount);
  }

  /**
   * MPを全回復する
   */
  fullHealMP(): void {
    this.currentMP = this.getMaxMP();
  }

  /**
   * 指定されたMP量が足りているかを確認する
   * @param requiredMP - 必要なMP量
   * @returns MP量が足りている場合true
   */
  hasEnoughMP(requiredMP: number): boolean {
    return this.currentMP >= requiredMP;
  }

  /**
   * 一時的なステータスブーストを適用する
   * @param statType - ステータスタイプ
   * @param amount - ブースト量（負の値でデバフ）
   */
  applyTemporaryBoost(
    statType: 'attack' | 'defense' | 'speed' | 'accuracy' | 'fortune',
    amount: number
  ): void {
    this.temporaryBoosts[statType] += amount;
  }

  /**
   * 全ての一時的なステータスブーストをクリアする
   */
  clearTemporaryBoosts(): void {
    this.temporaryBoosts = {
      attack: 0,
      defense: 0,
      speed: 0,
      accuracy: 0,
      fortune: 0,
    };
  }

  /**
   * 一時ステータスを追加する
   * 同じIDまたは非スタック可能な同名ステータスは上書きされる
   * @param status - 追加する一時ステータス
   */
  addTemporaryStatus(status: TemporaryStatus): void {
    // 同じIDが存在する場合は上書き
    const existingIndex = this.temporaryStatuses.findIndex(s => s.id === status.id);
    if (existingIndex !== -1) {
      this.temporaryStatuses[existingIndex] = { ...status };
      return;
    }

    // stackable=falseの場合、同じ名前の効果は上書き
    if (!status.stackable) {
      const sameNameIndex = this.temporaryStatuses.findIndex(s => s.name === status.name);
      if (sameNameIndex !== -1) {
        this.temporaryStatuses[sameNameIndex] = { ...status };
        return;
      }
    }

    // 新しいステータスを追加
    this.temporaryStatuses.push({ ...status });
  }

  /**
   * 指定されたIDの一時ステータスを削除する
   * @param id - 削除する一時ステータスのID
   */
  removeTemporaryStatus(id: string): void {
    this.temporaryStatuses = this.temporaryStatuses.filter(status => status.id !== id);
  }

  /**
   * 全ての一時ステータスを取得する
   * @returns 一時ステータスの配列
   */
  getTemporaryStatuses(): TemporaryStatus[] {
    return [...this.temporaryStatuses];
  }

  /**
   * 状態異常のみを取得する
   * @returns 状態異常の配列
   */
  getActiveStatusAilments(): TemporaryStatus[] {
    return this.temporaryStatuses.filter(status => status.type === 'status_ailment');
  }

  /**
   * StatsオブジェクトをJSONに変換する
   * @returns JSON形式のデータ
   */
  toJSON(): StatsData {
    return {
      level: this.level,
      currentHP: this.currentHP,
      currentMP: this.currentMP,
      baseAttack: this.baseAttack,
      baseDefense: this.baseDefense,
      baseSpeed: this.baseSpeed,
      baseAccuracy: this.baseAccuracy,
      baseFortune: this.baseFortune,
      temporaryBoosts: { ...this.temporaryBoosts },
      temporaryStatuses: this.temporaryStatuses.map(status => ({ ...status })),
    };
  }

  /**
   * JSONデータからStatsオブジェクトを作成する
   * @param data - JSONデータ
   * @returns Statsインスタンス
   * @throws {Error} 不正なデータの場合
   */
  static fromJSON(data: any): Stats {
    if (!this.validateStatsData(data)) {
      throw new Error('Invalid stats data format');
    }

    const stats = new Stats(data.level);
    stats.currentHP = data.currentHP;
    stats.currentMP = data.currentMP;
    stats.baseAttack = data.baseAttack;
    stats.baseDefense = data.baseDefense;
    stats.baseSpeed = data.baseSpeed;
    stats.baseAccuracy = data.baseAccuracy;
    stats.baseFortune = data.baseFortune;
    stats.temporaryBoosts = { ...data.temporaryBoosts };
    stats.temporaryStatuses = data.temporaryStatuses
      ? data.temporaryStatuses.map((status: any) => ({ ...status }))
      : [];

    return stats;
  }

  /**
   * StatsDataの形式を検証する
   * @param data - 検証するデータ
   * @returns 有効な場合true
   */
  private static validateStatsData(data: any): data is StatsData {
    return (
      this.validateBasicStructure(data) &&
      this.validateStatsFields(data) &&
      this.validateTemporaryBoosts(data)
    );
  }

  /**
   * 基本構造を検証する
   * @param data - 検証するデータ
   * @returns 有効な場合true
   */
  private static validateBasicStructure(data: any): boolean {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.level === 'number' &&
      data.level >= 0 &&
      typeof data.currentHP === 'number' &&
      data.currentHP >= 0 &&
      typeof data.currentMP === 'number' &&
      data.currentMP >= 0
    );
  }

  /**
   * ステータスフィールドを検証する
   * @param data - 検証するデータ
   * @returns 有効な場合true
   */
  private static validateStatsFields(data: any): boolean {
    return (
      typeof data.baseAttack === 'number' &&
      typeof data.baseDefense === 'number' &&
      typeof data.baseSpeed === 'number' &&
      typeof data.baseAccuracy === 'number' &&
      typeof data.baseFortune === 'number'
    );
  }

  /**
   * 一時的なブーストフィールドを検証する
   * @param data - 検証するデータ
   * @returns 有効な場合true
   */
  private static validateTemporaryBoosts(data: any): boolean {
    return (
      typeof data.temporaryBoosts === 'object' &&
      data.temporaryBoosts !== null &&
      typeof data.temporaryBoosts.attack === 'number' &&
      typeof data.temporaryBoosts.defense === 'number' &&
      typeof data.temporaryBoosts.speed === 'number' &&
      typeof data.temporaryBoosts.accuracy === 'number' &&
      typeof data.temporaryBoosts.fortune === 'number'
    );
  }
}

/**
 * ステータスデータのインターフェース
 */
export interface StatsData {
  level: number;
  currentHP: number;
  currentMP: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  baseAccuracy: number;
  baseFortune: number;
  temporaryBoosts: {
    attack: number;
    defense: number;
    speed: number;
    accuracy: number;
    fortune: number;
  };
  temporaryStatuses?: TemporaryStatus[];
}
