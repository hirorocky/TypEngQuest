import { Phase } from '../core/Phase';
import { World } from '../world/World';
import { PhaseType, PhaseTypes, CommandResult } from '../core/types';
import { Player } from '../player/Player';
import { ConsumableItem, ItemEffect } from '../items/ConsumableItem';
import { ItemType } from '../items/Item';
import { TabCompleter } from '../core/completion';

interface BattleItemConsumptionOptions {
  player: Player;
  onItemUsed: (item: ConsumableItem) => void;
  onBack: () => void;
  world?: World;
  tabCompleter?: TabCompleter;
}

/**
 * BattleItemConsumptionPhaseクラス - 戦闘時のアイテム使用フェーズ
 */
export class BattleItemConsumptionPhase extends Phase {
  private player: Player;
  private onItemUsed: (item: ConsumableItem) => void;
  private onBack: () => void;
  private availableItems: ConsumableItem[] = [];

  constructor(options: BattleItemConsumptionOptions) {
    super(options.world, options.tabCompleter);
    this.player = options.player;
    this.onItemUsed = options.onItemUsed;
    this.onBack = options.onBack;
  }

  /**
   * フェーズタイプを取得
   */
  getType(): PhaseType {
    return PhaseTypes.BATTLE_ITEM_CONSUMPTION;
  }

  /**
   * プロンプトを取得
   */
  getPrompt(): string {
    return 'item> ';
  }

  /**
   * 初期化処理
   */
  async initialize(): Promise<void> {
    if (this.player) {
      const allItems = this.player.getInventory().getItems();
      // 消費アイテムのみをフィルタ
      this.availableItems = allItems.filter(
        item => item.getType() === ItemType.CONSUMABLE
      ) as ConsumableItem[];
    }
    this.registerItemCommands();
  }

  /**
   * アイテム使用コマンドを登録
   */
  private registerItemCommands(): void {
    this.registerCommand({
      name: 'help',
      aliases: ['h', '?'],
      description: 'Show item selection commands',
      execute: async () => this.showHelp(),
    });

    this.registerCommand({
      name: 'list',
      aliases: ['ls', 'items'],
      description: 'Show available items',
      execute: async () => this.showAvailableItems(),
    });

    this.registerCommand({
      name: 'status',
      description: 'Show player status',
      execute: async () => this.showPlayerStatus(),
    });

    this.registerCommand({
      name: 'back',
      aliases: ['return'],
      description: 'Go back to battle menu',
      execute: async () => this.goBack(),
    });
  }

  /**
   * 入力処理
   */
  async processInput(input: string): Promise<CommandResult> {
    const trimmed = input.trim();

    // 数字の場合はアイテム番号として処理
    const itemIndex = parseInt(trimmed);
    if (!isNaN(itemIndex) && itemIndex >= 1 && itemIndex <= this.availableItems.length) {
      return this.useItemByIndex(itemIndex - 1);
    }

    // アイテム名として処理を試行
    const item = this.availableItems.find(
      i =>
        i.getName().toLowerCase().replace(/\s+/g, ' ') ===
        trimmed.toLowerCase().replace(/\s+/g, ' ')
    );
    if (item) {
      return this.useItem(item);
    }

    // 通常のコマンド処理
    return super.processInput(input);
  }

  /**
   * ヘルプを表示
   */
  private async showHelp(): Promise<CommandResult> {
    return {
      success: true,
      message: 'Item Selection Commands:',
      output: [
        '  help - Show this help',
        '  list - Show available items',
        '  status - Show player status',
        '  back - Go back to battle menu',
        '  <number> - Use item by number',
        '  <item_name> - Use item by name',
      ],
    };
  }

  /**
   * 利用可能なアイテムを表示
   */
  private async showAvailableItems(): Promise<CommandResult> {
    if (!this.player) {
      return {
        success: false,
        message: 'Player not available',
      };
    }

    if (this.availableItems.length === 0) {
      return {
        success: true,
        message: 'No consumable items available',
      };
    }

    const itemList = this.availableItems.map((item, index) => {
      const effects =
        item
          .getEffects()
          .map((effect: ItemEffect) => `${effect.type}: ${effect.value}`)
          .join(', ') || 'No effects';
      return `  ${index + 1}. ${item.getName()} (${effects})`;
    });

    return {
      success: true,
      message: 'Available items:',
      output: itemList,
    };
  }

  /**
   * プレイヤーステータスを表示
   */
  private async showPlayerStatus(): Promise<CommandResult> {
    if (!this.player) {
      return {
        success: false,
        message: 'Player not available',
      };
    }

    const stats = this.player.getBodyStats();
    return {
      success: true,
      message: 'Player Status:',
      output: [
        `  HP: ${stats.getCurrentHP()}/${stats.getMaxHP()}`,
        `  MP: ${stats.getCurrentMP()}/${stats.getMaxMP()}`,
      ],
    };
  }

  /**
   * 前のフェーズに戻る
   */
  private async goBack(): Promise<CommandResult> {
    if (this.onBack) {
      this.onBack();
    }
    return {
      success: true,
      message: 'Returning to battle menu...',
    };
  }

  /**
   * インデックスでアイテムを使用
   */
  private async useItemByIndex(index: number): Promise<CommandResult> {
    if (index < 0 || index >= this.availableItems.length) {
      return {
        success: false,
        message: 'Invalid item number',
      };
    }

    return this.useItem(this.availableItems[index]);
  }

  /**
   * アイテムを使用
   */
  private async useItem(item: ConsumableItem): Promise<CommandResult> {
    if (!this.player) {
      return {
        success: false,
        message: 'Player not available',
      };
    }

    try {
      // アイテムを使用
      await item.use(this.player);

      // アイテムをインベントリから削除
      this.player.getInventory().removeItem(item);

      // コールバックを呼び出し
      if (this.onItemUsed) {
        this.onItemUsed(item);
      }

      return {
        success: true,
        message: `Used ${item.getName()}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to use item: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
