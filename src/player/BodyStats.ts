import { TemporaryStatus, isTemporaryStatus } from './TemporaryStatus';

/**
 * プレイヤーの本来のステータス（装備による上昇を除く）を管理するクラス
 */
export class BodyStats {
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
  private baseAgility: number;
  private baseFortune: number;
  private temporaryBoosts: {
    attack: number;
    defense: number;
    agility: number;
    fortune: number;
  };
  private temporaryStatuses: TemporaryStatus[];

  /**
   * BodyStatsクラスのコンストラクタ
   * @param level - プレイヤーレベル（デフォルト: 0）
   */
  constructor(level: number = 0) {
    this.level = Math.max(0, level); // 負の値は0にクランプ
    this.baseAttack = BodyStats.BASE_STAT;
    this.baseDefense = BodyStats.BASE_STAT;
    this.baseAgility = BodyStats.BASE_STAT;
    this.baseFortune = BodyStats.BASE_STAT;
    this.temporaryBoosts = {
      attack: 0,
      defense: 0,
      agility: 0,
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
   * 基本攻撃力を取得する
   * @returns 基本攻撃力
   */
  getBaseAttack(): number {
    return this.baseAttack;
  }

  /**
   * 基本防御力を取得する
   * @returns 基本防御力
   */
  getBaseDefense(): number {
    return this.baseDefense;
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
   * 攻撃力を取得する（基本値 + 一時的なブースト + 一時ステータス効果）
   * @returns 攻撃力
   */
  getAttack(): number {
    const temporaryStatusBonus = this.calculateTemporaryStatusEffect('attack');
    return Math.max(0, this.baseAttack + this.temporaryBoosts.attack + temporaryStatusBonus);
  }

  /**
   * 防御力を取得する（基本値 + 一時的なブースト + 一時ステータス効果）
   * @returns 防御力
   */
  getDefense(): number {
    const temporaryStatusBonus = this.calculateTemporaryStatusEffect('defense');
    return Math.max(0, this.baseDefense + this.temporaryBoosts.defense + temporaryStatusBonus);
  }

  /**
   * 敏捷性を取得する（基本値 + 一時的なブースト + 一時ステータス効果）
   * @returns 敏捷性
   */
  getAgility(): number {
    const temporaryStatusBonus = this.calculateTemporaryStatusEffect('agility');
    return Math.max(0, this.baseAgility + this.temporaryBoosts.agility + temporaryStatusBonus);
  }

  /**
   * 幸運を取得する（基本値 + 一時的なブースト + 一時ステータス効果）
   * @returns 幸運
   */
  getFortune(): number {
    const temporaryStatusBonus = this.calculateTemporaryStatusEffect('fortune');
    return Math.max(0, this.baseFortune + this.temporaryBoosts.fortune + temporaryStatusBonus);
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
    statType: 'attack' | 'defense' | 'agility' | 'fortune',
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
      agility: 0,
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
    statType: 'attack' | 'defense' | 'agility' | 'fortune'
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
      baseAttack: this.baseAttack,
      baseDefense: this.baseDefense,
      baseAgility: this.baseAgility,
      baseFortune: this.baseFortune,
      temporaryBoosts: { ...this.temporaryBoosts },
      temporaryStatuses: this.temporaryStatuses.map(status => ({ ...status })),
    };
  }

  /**
   * JSONデータからBodyStatsオブジェクトを作成する
   * @param data - JSONデータ
   * @returns BodyStatsインスタンス
   * @throws {Error} 不正なデータの場合
   */
  static fromJSON(data: any): BodyStats {
    if (!this.validateBodyStatsData(data)) {
      throw new Error('Invalid body stats data format');
    }

    const bodyStats = new BodyStats(data.level);
    bodyStats.currentHP = data.currentHP;
    bodyStats.currentMP = data.currentMP;
    bodyStats.baseAttack = data.baseAttack;
    bodyStats.baseDefense = data.baseDefense;
    bodyStats.baseAgility = data.baseAgility;
    bodyStats.baseFortune = data.baseFortune;
    bodyStats.temporaryBoosts = { ...data.temporaryBoosts };
    bodyStats.temporaryStatuses = data.temporaryStatuses
      ? data.temporaryStatuses.filter((status: any) => isTemporaryStatus(status))
      : [];

    return bodyStats;
  }

  /**
   * BodyStatsDataの形式を検証する
   * @param data - 検証するデータ
   * @returns 有効な場合true
   */
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
      typeof data.baseAgility === 'number' &&
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
      typeof data.temporaryBoosts.agility === 'number' &&
      typeof data.temporaryBoosts.fortune === 'number'
    );
  }
}

/**
 * BodyStatsデータのインターフェース
 */
export interface BodyStatsData {
  level: number;
  currentHP: number;
  currentMP: number;
  baseAttack: number;
  baseDefense: number;
  baseAgility: number;
  baseFortune: number;
  temporaryBoosts: {
    attack: number;
    defense: number;
    agility: number;
    fortune: number;
  };
  temporaryStatuses?: TemporaryStatus[];
}
