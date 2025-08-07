import { Item, ItemType, ItemRarity, ItemData } from './Item';
import { Player } from '../player/Player';
import { Skill } from '../battle/Skill';

/**
 * 装備アイテムのステータス
 */
export interface EquipmentStats {
  strength: number;
  willpower: number;
  agility: number;
  fortune: number;
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
    'strength',
    'willpower',
    'agility',
    'fortune',
  ] as const;

  private readonly stats: EquipmentStats;
  private readonly grade: number;
  private readonly skill?: Skill;

  /**
   * 装備アイテムを初期化する
   * @param data - 装備アイテムの初期化データ
   * @throws {Error} グレードが1-100の範囲外の場合
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
      strength: 0,
      willpower: 0,
      agility: 0,
      fortune: 0,
    };

    // 実際に使用するstatsでグレードを検証
    this.validateGradeAndStats(data.grade, stats);
    this.grade = data.grade;
    this.stats = stats;
    this.skill = data.skill;
  }

  /**
   * グレードとステータスの妥当性を検証する
   * @param grade - 装備のグレード
   * @param stats - 装備のステータス
   * @throws {Error} グレードまたはステータスが不正な場合
   */
  private validateGradeAndStats(grade: number, stats: EquipmentStats): void {
    if (grade < 1 || grade > 100) {
      throw new Error('Grade must be between 1 and 100');
    }

    const statsSum = this.calculateStatsSum(stats);
    if (grade !== statsSum) {
      throw new Error('Grade must equal sum of stats (strength + willpower + agility + fortune)');
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

    return stats.strength + stats.willpower + stats.agility + stats.fortune;
  }

  /**
   * グレードを取得する
   * @returns グレード（1-100）
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
      this.stats.strength === otherStats.strength &&
      this.stats.willpower === otherStats.willpower &&
      this.stats.agility === otherStats.agility &&
      this.stats.fortune === otherStats.fortune
    );
  }

  /**
   * スキルを比較する
   * @param otherSkill - 比較対象のスキル
   * @returns 等しい場合true
   */
  // eslint-disable-next-line complexity
  private compareSkill(otherSkill?: Skill): boolean {
    if (this.skill === undefined && otherSkill === undefined) {
      return true;
    }
    if (this.skill === undefined || otherSkill === undefined) {
      return false;
    }

    // 基本プロパティの比較
    const basicPropsEqual =
      this.skill.id === otherSkill.id &&
      this.skill.name === otherSkill.name &&
      this.skill.mpCost === otherSkill.mpCost &&
      this.skill.mpCharge === otherSkill.mpCharge &&
      this.skill.actionCost === otherSkill.actionCost;

    if (!basicPropsEqual) return false;

    // 残りのプロパティの比較
    return (
      this.skill.successRate === otherSkill.successRate &&
      this.skill.target === otherSkill.target &&
      this.skill.typingDifficulty === otherSkill.typingDifficulty &&
      JSON.stringify(this.skill.effects) === JSON.stringify(otherSkill.effects)
    );
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
  // eslint-disable-next-line complexity
  static validateSkill(skill: any): skill is Skill {
    if (typeof skill !== 'object' || skill === null) {
      return false;
    }

    // 文字列プロパティの検証
    const stringPropsValid =
      typeof skill.id === 'string' &&
      typeof skill.name === 'string' &&
      typeof skill.description === 'string' &&
      typeof skill.target === 'string';

    if (!stringPropsValid) return false;

    // 数値プロパティの検証
    const numberPropsValid =
      typeof skill.mpCost === 'number' &&
      typeof skill.mpCharge === 'number' &&
      typeof skill.actionCost === 'number' &&
      typeof skill.successRate === 'number' &&
      typeof skill.typingDifficulty === 'number';

    return numberPropsValid && Array.isArray(skill.effects);
  }
}
