import { EquipmentItem, EquipmentStats, Skill } from '../items/EquipmentItem';

/**
 * 装備効果計算クラス
 * 装備中のアイテムのステータス合計やグレード平均値を計算する
 */
export class EquipmentEffectCalculator {
  /**
   * 装備中のアイテムのステータス合計を計算する
   * @param equipments - 装備中のアイテムリスト
   * @returns ステータスの合計
   */
  calculateTotalStats(equipments: EquipmentItem[]): EquipmentStats {
    const totalStats: EquipmentStats = {
      attack: 0,
      defense: 0,
      speed: 0,
      accuracy: 0,
      fortune: 0,
    };

    for (const equipment of equipments) {
      const stats = equipment.getStats();
      totalStats.attack += stats.attack;
      totalStats.defense += stats.defense;
      totalStats.speed += stats.speed;
      totalStats.accuracy += stats.accuracy;
      totalStats.fortune += stats.fortune;
    }

    return totalStats;
  }

  /**
   * 装備中のアイテムのグレード平均値を計算する（小数点切り捨て）
   * @param equipments - 装備中のアイテムリスト
   * @returns グレードの平均値（小数点切り捨て）
   */
  calculateAverageGrade(equipments: EquipmentItem[]): number {
    if (equipments.length === 0) {
      return 1; // 装備がない場合は最低レベル1
    }

    const totalGrade = equipments.reduce((sum, equipment) => {
      return sum + equipment.getGrade();
    }, 0);

    const averageGrade = totalGrade / equipments.length;

    // 小数点切り捨て
    return Math.floor(averageGrade);
  }

  /**
   * 装備中のアイテムから使用可能な技を取得する
   * @param equipments - 装備中のアイテムリスト
   * @returns 使用可能な技のリスト
   */
  getAvailableSkills(equipments: EquipmentItem[]): Skill[] {
    const skills: Skill[] = [];

    for (const equipment of equipments) {
      const skill = equipment.getSkill();
      if (skill) {
        skills.push(skill);
      }
    }

    return skills;
  }
}
