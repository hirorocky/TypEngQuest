import { Item, ItemType, ItemRarity, ItemData } from './Item';
import { Player } from '../player/Player';
import { TemporaryStatusEffects } from '../player/TemporaryStatus';

/**
 * 装備アイテムのステータス
 */
export interface EquipmentStats {
  attack: number;
  defense: number;
  speed: number;
  accuracy: number;
  fortune: number;
}

/**
 * スキル効果のインターフェース
 */
export interface SkillEffect {
  type: 'damage' | 'heal' | 'temporary_status';
  power: number;
  target: 'self' | 'enemy' | 'all';
  duration?: number;
  temporaryStatus?: TemporaryStatusEffects;
}

/**
 * スキルのインターフェース
 */
export interface Skill {
  id: string;
  name: string;
  mpCost: number;
  successRate: number;
  typingDifficulty: number;
  effect: SkillEffect;
}

/**
 * 装備アイテムデータのインターフェース
 */
export interface EquipmentItemData extends ItemData {
  stats: EquipmentStats;
  grade: number;
  skill?: Skill;
}

/**
 * 装備アイテムクラス
 * 武器や防具などの装備可能なアイテムを表現する
 */
export class EquipmentItem extends Item {
  private static readonly REQUIRED_STATS: readonly string[] = [
    'attack',
    'defense',
    'speed',
    'accuracy',
    'fortune',
  ] as const;
  private static readonly VALID_EFFECT_TYPES: readonly string[] = [
    'damage',
    'heal',
    'temporary_status',
  ] as const;

  private readonly stats: EquipmentStats;
  private readonly grade: number;
  private readonly skill?: Skill;

  /**
   * 装備アイテムを初期化する
   * @param data - 装備アイテムの初期化データ
   * @throws {Error} グレードが1-20の範囲外の場合
   */
  constructor(data: EquipmentItemData) {
    super({
      id: data.id,
      name: data.name,
      description: data.description,
      type: ItemType.EQUIPMENT,
      rarity: data.rarity,
    });

    // statsがundefinedの場合、デフォルト値を設定
    const stats = data.stats || {
      attack: 0,
      defense: 0,
      speed: 0,
      accuracy: 0,
      fortune: 0,
    };

    // 実際に使用するstatsでグレードを検証
    this.validateGradeAndStats({ ...data, stats });
    this.grade = data.grade;
    this.stats = stats;
    this.skill = data.skill;
  }

  /**
   * グレードとステータスの妥当性を検証する
   * @param data - 装備アイテムのデータ
   * @throws {Error} グレードまたはステータスが不正な場合
   */
  private validateGradeAndStats(data: EquipmentItemData): void {
    if (data.grade < 1 || data.grade > 20) {
      throw new Error('Grade must be between 1 and 20');
    }

    const statsSum = this.calculateStatsSum(data.stats);
    if (data.grade !== statsSum) {
      throw new Error(
        'Grade must equal sum of stats (attack + defense + speed + accuracy + fortune)'
      );
    }
  }

  /**
   * ステータスの合計値を計算する
   * @param stats - ステータス
   * @returns ステータスの合計値
   */
  private calculateStatsSum(stats?: EquipmentStats): number {
    if (!stats) {
      return 0;
    }

    return stats.attack + stats.defense + stats.speed + stats.accuracy + stats.fortune;
  }

  /**
   * グレードを取得する
   * @returns グレード（1-20）
   */
  getGrade(): number {
    return this.grade;
  }

  /**
   * ステータスを取得する
   * @returns 装備のステータス
   */
  getStats(): EquipmentStats {
    return { ...this.stats };
  }

  /**
   * 技を取得する
   * @returns 技、または未定義
   */
  getSkill(): Skill | undefined {
    return this.skill ? { ...this.skill } : undefined;
  }

  /**
   * 技を持っているか確認する
   * @returns 技を持っている場合true
   */
  hasSkill(): boolean {
    return this.skill !== undefined;
  }

  /**
   * 装備アイテムは直接使用できない
   * @param _player - プレイヤー（未使用）
   * @returns 常にfalse
   */
  canUse(_player: Player): boolean {
    return false;
  }

  /**
   * 装備アイテムは直接使用できない
   * @param _player - プレイヤー（未使用）
   * @throws {Error} 装備アイテムは直接使用できない
   */
  async use(_player: Player): Promise<void> {
    throw new Error('Equipment items cannot be used directly');
  }

  /**
   * 他の装備アイテムと同じかチェックする
   * @param other - 比較対象のアイテム
   * @returns 同じ場合true
   */
  equals(other: Item): boolean {
    if (!(other instanceof EquipmentItem)) {
      return false;
    }

    const baseEquals = super.equals(other);
    const gradeEquals = this.grade === other.grade;
    const statsEquals = this.compareStats(other.stats);
    const skillEquals = this.compareSkill(other.skill);

    return baseEquals && gradeEquals && statsEquals && skillEquals;
  }

  /**
   * 装備アイテムをJSONデータに変換する
   * @returns JSONデータ
   */
  toJSON(): EquipmentItemData {
    return {
      ...super.toJSON(),
      stats: { ...this.stats },
      grade: this.grade,
      skill: this.skill ? { ...this.skill } : undefined,
    };
  }

  /**
   * ステータスを比較する
   * @param otherStats - 比較対象のステータス
   * @returns 等しい場合true
   */
  private compareStats(otherStats: EquipmentStats): boolean {
    return (
      this.stats.attack === otherStats.attack &&
      this.stats.defense === otherStats.defense &&
      this.stats.speed === otherStats.speed &&
      this.stats.accuracy === otherStats.accuracy &&
      this.stats.fortune === otherStats.fortune
    );
  }

  /**
   * スキルを比較する
   * @param otherSkill - 比較対象のスキル
   * @returns 等しい場合true
   */
  private compareSkill(otherSkill?: Skill): boolean {
    if (this.skill === undefined && otherSkill === undefined) {
      return true;
    }
    if (this.skill === undefined || otherSkill === undefined) {
      return false;
    }
    return (
      this.skill.id === otherSkill.id &&
      this.skill.name === otherSkill.name &&
      this.skill.mpCost === otherSkill.mpCost &&
      this.skill.successRate === otherSkill.successRate &&
      this.skill.typingDifficulty === otherSkill.typingDifficulty &&
      this.compareSkillEffect(this.skill.effect, otherSkill.effect)
    );
  }

  /**
   * スキル効果を比較する
   * @param effect1 - 比較対象1
   * @param effect2 - 比較対象2
   * @returns 等しい場合true
   */
  private compareSkillEffect(effect1: SkillEffect, effect2: SkillEffect): boolean {
    // 基本プロパティの比較
    if (!this.compareSkillEffectBasic(effect1, effect2)) {
      return false;
    }

    // temporaryStatusの比較
    return this.compareTemporaryStatus(effect1.temporaryStatus, effect2.temporaryStatus);
  }

  /**
   * スキル効果の基本プロパティを比較する
   * @param effect1 - 比較対象1
   * @param effect2 - 比較対象2
   * @returns 等しい場合true
   */
  private compareSkillEffectBasic(effect1: SkillEffect, effect2: SkillEffect): boolean {
    return (
      effect1.type === effect2.type &&
      effect1.power === effect2.power &&
      effect1.target === effect2.target &&
      effect1.duration === effect2.duration
    );
  }

  /**
   * 一時ステータスを比較する
   * @param ts1 - 比較対象1
   * @param ts2 - 比較対象2
   * @returns 等しい場合true
   */
  private compareTemporaryStatus(
    ts1?: TemporaryStatusEffects,
    ts2?: TemporaryStatusEffects
  ): boolean {
    // 両方undefinedの場合
    if (ts1 === undefined && ts2 === undefined) {
      return true;
    }
    // 片方だけundefinedの場合
    if (ts1 === undefined || ts2 === undefined) {
      return false;
    }

    // 数値プロパティの比較
    const numberProps: (keyof TemporaryStatusEffects)[] = [
      'attack',
      'defense',
      'speed',
      'accuracy',
      'fortune',
      'hpPerTurn',
      'mpPerTurn',
    ];

    for (const prop of numberProps) {
      if (ts1[prop] !== ts2[prop]) {
        return false;
      }
    }

    // 真偽値プロパティの比較
    return ts1.cannotAct === ts2.cannotAct && ts1.cannotRun === ts2.cannotRun;
  }

  /**
   * JSONデータから装備アイテムを復元する
   * @param data - JSONデータ
   * @returns 装備アイテムインスタンス
   * @throws {Error} 不正なデータの場合
   */
  static fromJSON(data: any): EquipmentItem {
    if (!EquipmentItem.validateEquipmentData(data)) {
      throw new Error('Invalid equipment item data');
    }

    if (data.type !== ItemType.EQUIPMENT) {
      throw new Error('Invalid equipment item data: type must be equipment');
    }

    return new EquipmentItem({
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      rarity: data.rarity,
      stats: data.stats,
      grade: data.grade,
      skill: data.skill,
    });
  }

  /**
   * 装備データの形式を検証する
   * @param data - 検証するデータ
   * @returns 有効な場合true
   */
  private static validateEquipmentData(data: any): data is EquipmentItemData {
    if (!EquipmentItem.validateBasicData(data)) {
      return false;
    }

    if (!EquipmentItem.validateEquipmentSpecificData(data)) {
      return false;
    }

    return true;
  }

  /**
   * 基本的なアイテムデータを検証する
   * @param data - 検証するデータ
   * @returns 有効な場合true
   */
  private static validateBasicData(data: any): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    return (
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      typeof data.description === 'string' &&
      Object.values(ItemType).includes(data.type) &&
      Object.values(ItemRarity).includes(data.rarity)
    );
  }

  /**
   * 装備特有のデータを検証する
   * @param data - 検証するデータ
   * @returns 有効な場合true
   */
  private static validateEquipmentSpecificData(data: any): boolean {
    if (typeof data.grade !== 'number') {
      return false;
    }

    if (!EquipmentItem.validateStats(data.stats)) {
      return false;
    }

    if (data.skill !== undefined && !EquipmentItem.validateSkill(data.skill)) {
      return false;
    }

    return true;
  }

  /**
   * ステータスオブジェクトを検証する
   * @param stats - 検証するステータス
   * @returns 有効な場合true
   */
  static validateStats(stats: any): stats is EquipmentStats {
    if (typeof stats !== 'object' || stats === null) {
      return false;
    }

    for (const stat of EquipmentItem.REQUIRED_STATS) {
      if (typeof stats[stat] !== 'number') {
        return false;
      }
    }

    return true;
  }

  /**
   * スキルオブジェクトを検証する
   * @param skill - 検証するスキル
   * @returns 有効な場合true
   */
  static validateSkill(skill: any): skill is Skill {
    if (!EquipmentItem.validateSkillBasic(skill)) {
      return false;
    }

    if (!EquipmentItem.validateSkillEffect(skill.effect)) {
      return false;
    }

    return true;
  }

  /**
   * スキルの基本プロパティを検証する
   * @param skill - 検証するスキル
   * @returns 有効な場合true
   */
  private static validateSkillBasic(skill: any): boolean {
    if (typeof skill !== 'object' || skill === null) {
      return false;
    }

    return (
      typeof skill.id === 'string' &&
      typeof skill.name === 'string' &&
      typeof skill.mpCost === 'number' &&
      typeof skill.successRate === 'number' &&
      typeof skill.typingDifficulty === 'number'
    );
  }

  /**
   * スキル効果を検証する
   * @param effect - 検証する効果
   * @returns 有効な場合true
   */
  private static validateSkillEffect(effect: any): boolean {
    if (typeof effect !== 'object' || effect === null) {
      return false;
    }

    if (!EquipmentItem.VALID_EFFECT_TYPES.includes(effect.type)) return false;
    if (typeof effect.power !== 'number') return false;
    if (!['self', 'enemy', 'all'].includes(effect.target)) return false;

    // temporary_status型の場合、temporaryStatusプロパティが必須
    if (effect.type === 'temporary_status') {
      if (!effect.temporaryStatus || typeof effect.temporaryStatus !== 'object') {
        return false;
      }
    }

    return true;
  }
}
