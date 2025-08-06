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
    return equipments.reduce(
      (totalStats, equipment) => {
        const stats = equipment.getStats();
        return {
          attack: totalStats.attack + stats.attack,
          defense: totalStats.defense + stats.defense,
          agility: totalStats.agility + stats.agility,
          fortune: totalStats.fortune + stats.fortune,
        };
      },
      {
        attack: 0,
        defense: 0,
        agility: 0,
        fortune: 0,
      }
    );
  }

  /**
   * 装備中のアイテムのグレード平均値を最大スロット数5で計算する（小数点切り捨て）
   * @param equipments - 装備中のアイテムリスト
   * @returns グレードの平均値（小数点切り捨て）
   */
  calculateAverageGrade(equipments: EquipmentItem[]): number {
    if (equipments.length === 0) {
      return 0; // 装備がない場合は0
    }

    const totalGrade = equipments.reduce((sum, equipment) => {
      return sum + equipment.getGrade();
    }, 0);

    const averageGrade = totalGrade / 5;

    // 小数点切り捨て
    return Math.floor(averageGrade);
  }

  /**
   * 装備中のアイテムのグレード平均値を最大スロット数で計算する（小数点切り捨て）
   * @param equipments - 装備中のアイテムリスト
   * @param maxSlots - 最大スロット数（デフォルト5）
   * @returns グレードの平均値（小数点切り捨て）
   */
  calculateAverageGradeBySlots(equipments: EquipmentItem[], maxSlots: number = 5): number {
    if (equipments.length === 0) {
      return 0; // 装備がない場合は0
    }

    const totalGrade = equipments.reduce((sum, equipment) => {
      return sum + equipment.getGrade();
    }, 0);

    const averageGrade = totalGrade / maxSlots;

    // 小数点切り捨て
    return Math.floor(averageGrade);
  }

  /**
   * 装備中のアイテムから使用可能な技を取得する
   * @param equipments - 装備中のアイテムリスト
   * @returns 使用可能な技のリスト
   */
  getAvailableSkills(equipments: EquipmentItem[]): Skill[] {
    return equipments
      .map(equipment => equipment.getSkill())
      .filter((skill): skill is Skill => skill !== undefined);
  }
}
