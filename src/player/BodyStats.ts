import { TemporaryStatus, isTemporaryStatus } from './TemporaryStatus';
import { WorldStatus, isWorldStatus } from './WorldStatus';

/**
 * プレイヤーの本来のステータス（装備による上昇を除く）を管理するクラス
 */
export class BodyStats {
  // ゲームバランスパラメータ定数
  private static readonly BASE_HP = 100;
  private static readonly HP_PER_LEVEL = 10;
  private static readonly BASE_MP = 100;
  private static readonly MP_PER_LEVEL = 2;
  private static readonly BASE_STAT = 10;
  public static readonly MAX_EX = 100;

  private level: number;
  private currentHP: number;
  private currentMP: number;
  private currentEX: number = 0;
  private baseStrength: number;
  private baseWillpower: number;
  private baseAgility: number;
  private baseFortune: number;
  private temporaryBoosts: {
    strength: number;
    willpower: number;
    agility: number;
    fortune: number;
  };
  private worldBoosts: {
    strength: number;
    willpower: number;
    agility: number;
    fortune: number;
  };
  private temporaryStatuses: TemporaryStatus[];
  private worldStatuses: WorldStatus[];

  /**
   * BodyStatsクラスのコンストラクタ
   * @param level - プレイヤーレベル（デフォルト: 0）
   */
  constructor(level: number = 0) {
    this.level = Math.max(0, level); // 負の値は0にクランプ
    this.baseStrength = BodyStats.BASE_STAT;
    this.baseWillpower = BodyStats.BASE_STAT;
    this.baseAgility = BodyStats.BASE_STAT;
    this.baseFortune = BodyStats.BASE_STAT;
    this.temporaryBoosts = {
      strength: 0,
      willpower: 0,
      agility: 0,
      fortune: 0,
    };
    this.worldBoosts = {
      strength: 0,
      willpower: 0,
      agility: 0,
      fortune: 0,
    };
    this.temporaryStatuses = [];
    this.worldStatuses = [];

    // HP/MP/EXを初期化（EXは0開始）
    this.currentHP = this.calculateMaxHP();
    this.currentMP = this.calculateMaxMP();
    this.currentEX = 0;
  }

  /**
   * 最大HPを計算する
   * 計算式: BASE_HP + (レベル × HP_PER_LEVEL)
   * @returns 最大HP
   */
  private calculateMaxHP(): number {
    return BodyStats.BASE_HP + this.level * BodyStats.HP_PER_LEVEL;
  }

  /**
   * 最大MPを計算する
   * 計算式: BASE_MP + (レベル × MP_PER_LEVEL)
   * @returns 最大MP
   */
  private calculateMaxMP(): number {
    return BodyStats.BASE_MP + this.level * BodyStats.MP_PER_LEVEL;
  }

  /**
   * レベルを取得する
   * @returns レベル
   */
  getLevel(): number {
    return this.level;
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
   * 現在EXを取得する
   */
  getCurrentEX(): number {
    return this.currentEX;
  }

  /**
   * 最大EXを取得する
   */
  getMaxEX(): number {
    return BodyStats.MAX_EX;
  }

  /**
   * 基本strength（攻撃力）を取得する
   * @returns 基本strength
   */
  getBaseStrength(): number {
    return this.baseStrength;
  }

  /**
   * 基本willpower（意志力）を取得する
   * @returns 基本willpower
   */
  getBaseWillpower(): number {
    return this.baseWillpower;
  }

  /**
   * 基本敏捷性を取得する
   * @returns 基本敏捷性
   */
  getBaseAgility(): number {
    return this.baseAgility;
  }

  /**
   * 基本幸運を取得する
   * @returns 基本幸運
   */
  getBaseFortune(): number {
    return this.baseFortune;
  }

  /**
   * strength（攻撃力）を取得する（基本値 + ワールドブースト + 一時的なブースト + 一時ステータス効果）
   * @returns strength
   */
  getStrength(): number {
    const temporaryStatusBonus = this.calculateTemporaryStatusEffect('strength');
    return Math.max(
      0,
      this.baseStrength +
        this.worldBoosts.strength +
        this.temporaryBoosts.strength +
        temporaryStatusBonus
    );
  }

  /**
   * willpower（意志力）を取得する（基本値 + ワールドブースト + 一時的なブースト + 一時ステータス効果）
   * @returns willpower
   */
  getWillpower(): number {
    const temporaryStatusBonus = this.calculateTemporaryStatusEffect('willpower');
    return Math.max(
      0,
      this.baseWillpower +
        this.worldBoosts.willpower +
        this.temporaryBoosts.willpower +
        temporaryStatusBonus
    );
  }

  /**
   * agility（敏捷性）を取得する（基本値 + ワールドブースト + 一時的なブースト + 一時ステータス効果）
   * @returns agility
   */
  getAgility(): number {
    const temporaryStatusBonus = this.calculateTemporaryStatusEffect('agility');
    return Math.max(
      0,
      this.baseAgility +
        this.worldBoosts.agility +
        this.temporaryBoosts.agility +
        temporaryStatusBonus
    );
  }

  /**
   * fortune（幸運）を取得する（基本値 + ワールドブースト + 一時的なブースト + 一時ステータス効果）
   * @returns fortune
   */
  getFortune(): number {
    const temporaryStatusBonus = this.calculateTemporaryStatusEffect('fortune');
    return Math.max(
      0,
      this.baseFortune +
        this.worldBoosts.fortune +
        this.temporaryBoosts.fortune +
        temporaryStatusBonus
    );
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
   * EXを加算（0〜MAX_EXにクランプ）
   */
  addEX(amount: number): void {
    const next = Math.max(0, this.currentEX + Math.floor(amount));
    this.currentEX = Math.min(this.getMaxEX(), next);
  }

  /**
   * EXを消費（不足時はfalse）
   */
  consumeEX(amount: number): boolean {
    if (this.currentEX < amount) return false;
    this.currentEX -= amount;
    return true;
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
   * レベルを更新する（HP/MPの割合は保持）
   * @param newLevel - 新しいレベル
   */
  updateLevel(newLevel: number): void {
    const oldLevel = this.level;
    this.level = Math.max(0, newLevel);

    // レベルが変わらない場合は何もしない
    if (oldLevel === this.level) {
      return;
    }

    // HPの割合を保持
    const oldMaxHP = BodyStats.BASE_HP + oldLevel * BodyStats.HP_PER_LEVEL;
    const hpRatio = oldMaxHP > 0 ? this.currentHP / oldMaxHP : 1;

    // MPの割合を保持
    const oldMaxMP = BodyStats.BASE_MP + oldLevel * BodyStats.MP_PER_LEVEL;
    const mpRatio = oldMaxMP > 0 ? this.currentMP / oldMaxMP : 1;

    // 新しい最大値に合わせてHP/MPを調整
    const newMaxHP = this.calculateMaxHP();
    const newMaxMP = this.calculateMaxMP();

    this.currentHP = Math.min(Math.floor(newMaxHP * hpRatio), newMaxHP);
    this.currentMP = Math.min(Math.floor(newMaxMP * mpRatio), newMaxMP);
  }

  /**
   * 一時的なステータスブーストを適用する
   * @param statType - ステータスタイプ
   * @param amount - ブースト量（負の値でデバフ）
   */
  applyTemporaryBoost(
    statType: 'strength' | 'willpower' | 'agility' | 'fortune',
    amount: number
  ): void {
    this.temporaryBoosts[statType] += amount;
  }

  /**
   * ワールドステータスブーストを適用する
   * @param statType - ステータスタイプ
   * @param amount - ブースト量（負の値でデバフ）
   */
  applyWorldBoost(
    statType: 'strength' | 'willpower' | 'agility' | 'fortune',
    amount: number
  ): void {
    this.worldBoosts[statType] += amount;
  }

  /**
   * 全ての一時的なステータスブーストをクリアする
   */
  clearTemporaryBoosts(): void {
    this.temporaryBoosts = {
      strength: 0,
      willpower: 0,
      agility: 0,
      fortune: 0,
    };
  }

  /**
   * 全てのワールドステータスブーストをクリアする（ワールド移動時）
   */
  clearWorldBoosts(): void {
    this.worldBoosts = {
      strength: 0,
      willpower: 0,
      agility: 0,
      fortune: 0,
    };
  }

  /**
   * バトル終了時の処理
   * - HPを最大まで回復
   * - MPを0にリセット
   * - 一時ステータスをクリア
   */
  onBattleEnd(): void {
    this.fullHealHP();
    this.currentMP = 0;
    this.clearTemporaryBoosts();
    this.temporaryStatuses = [];
  }

  /**
   * ワールドステータスを追加する
   * 同じIDまたは非スタック可能な同名ステータスは上書きされる
   * @param status - 追加するワールドステータス
   */
  addWorldStatus(status: WorldStatus): void {
    let targetIndex = this.worldStatuses.findIndex(s => s.id === status.id);

    if (targetIndex === -1 && !status.stackable) {
      targetIndex = this.worldStatuses.findIndex(s => s.name === status.name);
    }

    if (targetIndex !== -1) {
      // 上書き
      this.worldStatuses[targetIndex] = { ...status };
    } else {
      // 新規追加
      this.worldStatuses.push({ ...status });
    }

    this.updateWorldBoostsFromStatuses();
  }

  /**
   * 指定されたIDのワールドステータスを削除する
   * @param id - 削除するワールドステータスのID
   */
  removeWorldStatus(id: string): void {
    this.worldStatuses = this.worldStatuses.filter(status => status.id !== id);
    this.updateWorldBoostsFromStatuses();
  }

  /**
   * 全てのワールドステータスを取得する
   * @returns ワールドステータスの配列
   */
  getWorldStatuses(): WorldStatus[] {
    return [...this.worldStatuses];
  }

  /**
   * ワールドステータスからworldBoostsを更新する
   */
  private updateWorldBoostsFromStatuses(): void {
    // リセット
    this.worldBoosts = {
      strength: 0,
      willpower: 0,
      agility: 0,
      fortune: 0,
    };

    // 全てのワールドステータスの効果を集計
    for (const status of this.worldStatuses) {
      this.worldBoosts.strength += status.effects.strength ?? 0;
      this.worldBoosts.willpower += status.effects.willpower ?? 0;
      this.worldBoosts.agility += status.effects.agility ?? 0;
      this.worldBoosts.fortune += status.effects.fortune ?? 0;
    }
  }

  /**
   * ワールド移動時の処理
   * - ワールドステータスをクリア
   * - ワールドブーストをリセット
   */
  onWorldChange(): void {
    this.worldStatuses = [];
    this.clearWorldBoosts();
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
   * ターン経過処理を実行する
   * 継続期間を減らし、期限切れステータスを削除し、毎ターン効果を適用する
   */
  updateTemporaryStatuses(): void {
    // 毎ターン効果を先に適用
    this.applyPerTurnEffects();

    // 継続期間を減らし、期限切れステータスを削除
    this.temporaryStatuses = this.temporaryStatuses
      .map(status => {
        // 永続効果（duration: -1）は変更しない
        if (status.duration === -1) {
          return status;
        }
        // 継続期間を1減らす
        return { ...status, duration: status.duration - 1 };
      })
      .filter(status => status.duration !== 0); // duration が 0 になったものを削除
  }

  /**
   * 毎ターン効果（HP/MP変化）を適用する
   */
  private applyPerTurnEffects(): void {
    let totalHPChange = 0;
    let totalMPChange = 0;

    // 全ての一時ステータスから毎ターン効果を集計
    this.temporaryStatuses.forEach(status => {
      if (status.effects.hpPerTurn) {
        totalHPChange += status.effects.hpPerTurn;
      }
      if (status.effects.mpPerTurn) {
        totalMPChange += status.effects.mpPerTurn;
      }
    });

    // HP変化を適用
    if (totalHPChange > 0) {
      this.healHP(totalHPChange);
    } else if (totalHPChange < 0) {
      this.takeDamage(-totalHPChange);
    }

    // MP変化を適用
    if (totalMPChange > 0) {
      this.healMP(totalMPChange);
    } else if (totalMPChange < 0) {
      this.consumeMP(-totalMPChange);
    }
  }

  /**
   * 指定されたステータスの一時ステータス効果の総和を計算する
   * @param statType - ステータスタイプ
   * @returns 効果の総和
   */
  private calculateTemporaryStatusEffect(
    statType: 'strength' | 'willpower' | 'agility' | 'fortune'
  ): number {
    return this.temporaryStatuses.reduce((total, status) => {
      const effect = status.effects[statType];
      return total + (effect || 0);
    }, 0);
  }

  /**
   * BodyStatsオブジェクトをJSONに変換する
   * @returns JSON形式のデータ
   */
  toJSON(): BodyStatsData {
    return {
      level: this.level,
      currentHP: this.currentHP,
      currentMP: this.currentMP,
      currentEX: this.currentEX,
      baseStrength: this.baseStrength,
      baseWillpower: this.baseWillpower,
      baseAgility: this.baseAgility,
      baseFortune: this.baseFortune,
      temporaryBoosts: { ...this.temporaryBoosts },
      worldBoosts: { ...this.worldBoosts },
      temporaryStatuses: this.temporaryStatuses.map(status => ({ ...status })),
      worldStatuses: this.worldStatuses.map(status => ({ ...status })),
    };
  }

  /**
   * JSONデータからBodyStatsオブジェクトを作成する
   * @param data - JSONデータ
   * @returns BodyStatsインスタンス
   * @throws {Error} 不正なデータの場合
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromJSON(data: any): BodyStats {
    if (!this.validateBodyStatsData(data)) {
      throw new Error('Invalid body stats data format');
    }

    const bodyStats = new BodyStats(data.level);
    this.restoreHPMP(bodyStats, data);
    this.restoreBaseStats(bodyStats, data);
    this.restoreBoosts(bodyStats, data);
    this.restoreStatuses(bodyStats, data);

    return bodyStats;
  }

  /**
   * HP/MPを復元する
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static restoreHPMP(bodyStats: BodyStats, data: any): void {
    bodyStats.currentHP = data.currentHP;
    bodyStats.currentMP = data.currentMP;
    if (typeof data.currentEX === 'number') {
      bodyStats.currentEX = Math.max(0, Math.min(BodyStats.MAX_EX, Math.floor(data.currentEX)));
    }
  }

  /**
   * 基本ステータスを復元する（旧形式との互換性を保つ）
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static restoreBaseStats(bodyStats: BodyStats, data: any): void {
    bodyStats.baseStrength = data.baseStrength ?? data.baseAttack ?? BodyStats.BASE_STAT;
    bodyStats.baseWillpower = data.baseWillpower ?? data.baseDefense ?? BodyStats.BASE_STAT;
    bodyStats.baseAgility = data.baseAgility ?? BodyStats.BASE_STAT;
    bodyStats.baseFortune = data.baseFortune ?? BodyStats.BASE_STAT;
  }

  /**
   * ブーストを復元する
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static restoreBoosts(bodyStats: BodyStats, data: any): void {
    // temporaryBoostsの互換性処理
    if (data.temporaryBoosts) {
      bodyStats.temporaryBoosts = {
        strength: data.temporaryBoosts.strength ?? data.temporaryBoosts.attack ?? 0,
        willpower: data.temporaryBoosts.willpower ?? data.temporaryBoosts.defense ?? 0,
        agility: data.temporaryBoosts.agility ?? 0,
        fortune: data.temporaryBoosts.fortune ?? 0,
      };
    }

    // worldBoostsの処理
    if (data.worldBoosts) {
      bodyStats.worldBoosts = { ...data.worldBoosts };
    }
  }

  /**
   * ステータスを復元する
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static restoreStatuses(bodyStats: BodyStats, data: any): void {
    bodyStats.temporaryStatuses = data.temporaryStatuses
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.temporaryStatuses.filter((status: any) => isTemporaryStatus(status))
      : [];

    bodyStats.worldStatuses = data.worldStatuses
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.worldStatuses.filter((status: any) => isWorldStatus(status))
      : [];
  }

  /**
   * BodyStatsDataの形式を検証する
   * @param data - 検証するデータ
   * @returns 有効な場合true
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static validateBodyStatsData(data: any): data is BodyStatsData {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static validateStatsFields(data: any): boolean {
    // 新形式のチェック
    const hasNewFormat =
      typeof data.baseStrength === 'number' &&
      typeof data.baseWillpower === 'number' &&
      typeof data.baseAgility === 'number' &&
      typeof data.baseFortune === 'number';

    // 旧形式のチェック（互換性のため）
    const hasOldFormat =
      typeof data.baseAttack === 'number' &&
      typeof data.baseDefense === 'number' &&
      typeof data.baseAgility === 'number' &&
      typeof data.baseFortune === 'number';

    return hasNewFormat || hasOldFormat;
  }

  /**
   * 一時的なブーストフィールドを検証する
   * @param data - 検証するデータ
   * @returns 有効な場合true
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static validateTemporaryBoosts(data: any): boolean {
    if (typeof data.temporaryBoosts !== 'object' || data.temporaryBoosts === null) {
      return false;
    }

    // 新形式のチェック
    const hasNewFormat =
      typeof data.temporaryBoosts.strength === 'number' &&
      typeof data.temporaryBoosts.willpower === 'number' &&
      typeof data.temporaryBoosts.agility === 'number' &&
      typeof data.temporaryBoosts.fortune === 'number';

    // 旧形式のチェック（互換性のため）
    const hasOldFormat =
      typeof data.temporaryBoosts.attack === 'number' &&
      typeof data.temporaryBoosts.defense === 'number' &&
      typeof data.temporaryBoosts.agility === 'number' &&
      typeof data.temporaryBoosts.fortune === 'number';

    return hasNewFormat || hasOldFormat;
  }
}

/**
 * BodyStatsデータのインターフェース
 */
export interface BodyStatsData {
  level: number;
  currentHP: number;
  currentMP: number;
  currentEX?: number;
  baseStrength: number;
  baseWillpower: number;
  baseAgility: number;
  baseFortune: number;
  temporaryBoosts: {
    strength: number;
    willpower: number;
    agility: number;
    fortune: number;
  };
  worldBoosts?: {
    strength: number;
    willpower: number;
    agility: number;
    fortune: number;
  };
  temporaryStatuses?: TemporaryStatus[];
  worldStatuses?: WorldStatus[];
  // 旧形式との互換性のため（読み込み時のみ使用）
  baseAttack?: number;
  baseDefense?: number;
}
