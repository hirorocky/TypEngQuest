import { ConsumableItem } from './ConsumableItem';
import { Player } from '../player/Player';

/**
 * アイテム効果システムクラス
 * アイテムの効果適用を管理する統合システム
 */
export class ItemEffectSystem {
  /**
   * アイテムの効果が適用可能かチェックする
   * @param item - チェックする消費アイテム
   * @param player - 対象のプレイヤー
   * @returns 適用可能な場合true
   */
  canApplyItemEffects(item: ConsumableItem, player: Player): boolean {
    return item.canUse(player);
  }

  /**
   * アイテムの効果を適用する
   * @param item - 適用する消費アイテム
   * @param player - 対象のプレイヤー
   * @throws {Error} 効果が適用できない場合
   */
  async applyItemEffects(item: ConsumableItem, player: Player): Promise<void> {
    await item.use(player);
  }
}
