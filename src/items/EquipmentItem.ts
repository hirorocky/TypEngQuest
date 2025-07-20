import { Item, ItemType, ItemRarity, ItemData } from './Item';
import { Player } from '../player/Player';

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
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'status_ailment';
  value: number;
  element?: string;
  target?: 'self' | 'enemy';
  duration?: number;
  ailmentType?: string;
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
  skills: Skill[];
}

/**
 * 装備アイテムクラス
 * 武器や防具などの装備可能なアイテムを表現する
 */
export class EquipmentItem extends Item {
  private readonly stats: EquipmentStats;
  private readonly grade: number;
  private readonly skills: Skill[];

  /**
   * 装備アイテムを初期化する
   * @param data - 装備アイテムの初期化データ
   * @throws {Error} グレードが1-5の範囲外の場合
   */
  constructor(data: EquipmentItemData) {
    super({
      id: data.id,
      name: data.name,
      description: data.description,
      type: ItemType.EQUIPMENT,
      rarity: data.rarity,
    });

    if (data.grade < 1 || data.grade > 5) {
      throw new Error('Grade must be between 1 and 5');
    }

    this.grade = data.grade;
    this.stats = data.stats || {
      attack: 0,
      defense: 0,
      speed: 0,
      accuracy: 0,
      fortune: 0,
    };
    this.skills = data.skills || [];
  }

  /**
   * グレードを取得する
   * @returns グレード（1-5）
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
   * 技リストを取得する
   * @returns 技の配列
   */
  getSkills(): Skill[] {
    return [...this.skills];
  }

  /**
   * IDで技を検索する
   * @param skillId - 技のID
   * @returns 見つかった技、見つからない場合はundefined
   */
  getSkillById(skillId: string): Skill | undefined {
    return this.skills.find(skill => skill.id === skillId);
  }

  /**
   * 技を持っているか確認する
   * @param skillId - 技のID
   * @returns 技を持っている場合true
   */
  hasSkill(skillId: string): boolean {
    return this.skills.some(skill => skill.id === skillId);
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
    const statsEquals = JSON.stringify(this.stats) === JSON.stringify(other.stats);
    const skillsEquals = JSON.stringify(this.skills) === JSON.stringify(other.skills);

    return baseEquals && gradeEquals && statsEquals && skillsEquals;
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
      skills: [...this.skills],
    };
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
      skills: data.skills,
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

    if (!Array.isArray(data.skills)) {
      return false;
    }

    return data.skills.every((skill: any) => EquipmentItem.validateSkill(skill));
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

    const requiredStats = ['attack', 'defense', 'speed', 'accuracy', 'fortune'];
    for (const stat of requiredStats) {
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

    const validEffectTypes = ['damage', 'heal', 'buff', 'debuff', 'status_ailment'];
    return validEffectTypes.includes(effect.type) && typeof effect.value === 'number';
  }
}
