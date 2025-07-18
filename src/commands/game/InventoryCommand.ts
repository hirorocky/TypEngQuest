import { BaseCommand, CommandContext, ValidationResult } from '../BaseCommand';
import { CommandResult, PhaseTypes } from '../../core/types';

/**
 * inventoryコマンド - インベントリフェーズに遷移する
 */
export class InventoryCommand extends BaseCommand {
  public name = 'inventory';
  public description = 'open inventory to manage items';

  /**
   * 引数の検証を行う
   * @param args コマンド引数
   * @returns 検証結果
   */
  public validateArgs(args: string[]): ValidationResult {
    if (args && args.length > 0) {
      return { valid: false, error: 'inventory command takes no arguments' };
    }
    return { valid: true };
  }

  /**
   * inventoryコマンドを実行する
   * @param args コマンド引数
   * @param context 実行コンテキスト
   * @returns 実行結果
   */
  protected executeInternal(_args: string[], context: CommandContext): CommandResult {
    const player = this.getPlayer(context);
    if (!player) {
      return this.error('player not available');
    }

    // インベントリフェーズに遷移
    return {
      success: true,
      message: 'opening inventory...',
      nextPhase: PhaseTypes.INVENTORY,
    };
  }

  /**
   * ヘルプテキストを取得する
   * @returns ヘルプテキストの配列
   */
  public getHelp(): string[] {
    return [
      'Usage: inventory',
      '',
      'Open the inventory to view and manage your items.',
      '',
      'The inventory allows you to:',
      '  - View all items in your possession',
      '  - Use consumable items (potions, etc.)',
      '  - Drop unwanted items',
      '  - View detailed item information',
      '',
      'Navigation in inventory:',
      '  up/down - Navigate through items',
      '  use     - Use the selected item',
      '  drop    - Drop the selected item',
      '  back    - Return to exploration',
      '',
      'Examples:',
      '  inventory   # Open inventory interface',
    ];
  }
}