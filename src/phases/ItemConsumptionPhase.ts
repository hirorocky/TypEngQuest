import { Phase } from '../core/Phase';
import { PhaseType, CommandResult } from '../core/types';
import { Display } from '../ui/Display';
import { ScrollableList, ListItem } from '../ui/ScrollableList';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { ConsumableItem } from '../items/ConsumableItem';
import { TabCompleter } from '../core/completion';

/**
 * アイテム消費フェーズ - 消費アイテムの選択と使用を行う
 */
export class ItemConsumptionPhase extends Phase {
  private player: Player;
  private consumableItems: ConsumableItem[] = [];

  constructor(world: World, player: Player, tabCompleter?: TabCompleter) {
    super(world, tabCompleter);

    if (!world) {
      throw new Error('World is required for ItemConsumptionPhase');
    }
    if (!player) {
      throw new Error('Player is required for ItemConsumptionPhase');
    }

    this.world = world;
    this.player = player;

    // 消費可能なアイテムのリストを取得
    const allItems = this.player.getInventory().getItems();
    this.consumableItems = allItems.filter(
      item => item instanceof ConsumableItem
    ) as ConsumableItem[];
  }

  getType(): PhaseType {
    return 'itemConsumption';
  }

  getPrompt(): string {
    return 'consume> ';
  }

  async initialize(): Promise<void> {
    Display.clear();
    Display.printHeader('Select Item to Consume');
    Display.newLine();

    if (this.consumableItems.length === 0) {
      Display.printError('No consumable items available');
      Display.newLine();
      Display.printInfo('Press Enter to return to inventory...');
    }
  }

  /**
   * 消費アイテム選択UIを開始
   */
  async startInputLoop(): Promise<CommandResult | null> {
    // 消費可能なアイテムがない場合は即座にインベントリに戻る
    if (this.consumableItems.length === 0) {
      // Enterキー待ち
      if (!this.rl) {
        this.rl = this.createReadlineInterface();
      }

      return new Promise(resolve => {
        const handleInput = () => {
          this.rl?.close();
          resolve({
            success: false,
            message: 'No items to consume',
            nextPhase: 'inventory',
          });
        };

        this.rl?.once('line', handleInput);
      });
    }

    // ScrollableListでアイテム選択
    const choices: ListItem[] = this.consumableItems.map((item, index) => ({
      name: this.formatItemInfo(item),
      value: index,
    }));

    const list = new ScrollableList(choices, {
      message: 'Select an item to consume:',
      pageSize: 8,
      loop: false,
      onSelectionChange: item => {
        const selectedItem = this.consumableItems[item.value];
        this.displaySelectedItemDetails(selectedItem);
      },
    });

    const selectedIndex = await list.waitForSelection();

    // リスト選択後、少し待ってから画面をリフレッシュ
    await new Promise(resolve => {
      global.setTimeout(resolve, 100);
    });

    if (selectedIndex === null) {
      return {
        success: false,
        message: 'Consumption cancelled',
        nextPhase: 'inventory',
      };
    }

    const selectedItem = this.consumableItems[selectedIndex];

    // アイテムを使用
    try {
      await selectedItem.use(this.player);

      // アイテムをインベントリから削除
      this.player.getInventory().removeItem(selectedItem);

      return {
        success: true,
        message: `Consumed ${selectedItem.getDisplayName()}`,
        nextPhase: 'inventory',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to consume item: ${error instanceof Error ? error.message : 'unknown error'}`,
        nextPhase: 'inventory',
      };
    }
  }

  /**
   * アイテム情報をフォーマットする
   */
  private formatItemInfo(item: ConsumableItem): string {
    const name = item.getDisplayName();
    const rarity = item.getRarity();
    const rarityColor = this.getRarityColor(rarity);
    return `${name} [${rarityColor}${rarity}]`;
  }

  /**
   * レアリティに応じた色を取得する
   */
  private getRarityColor(rarity: string): string {
    switch (rarity.toLowerCase()) {
      case 'common':
        return '';
      case 'rare':
        return '🟦';
      case 'epic':
        return '🟪';
      case 'legendary':
        return '🟨';
      default:
        return '';
    }
  }

  /**
   * 選択されたアイテムの詳細情報を表示する
   */
  private displaySelectedItemDetails(item: ConsumableItem): void {
    Display.newLine();
    Display.printHeader('Selected Item Details');
    Display.println(`Name: ${item.getDisplayName()}`);
    Display.println(`Description: ${item.getDescription()}`);
    Display.println(`Type: ${item.getType()}`);
    Display.println(`Rarity: ${this.getRarityColor(item.getRarity())}${item.getRarity()}`);

    const effects = item.getEffects();
    if (effects.length > 0) {
      Display.println('Effects:');
      effects.forEach(effect => {
        Display.println(`  ${effect.type}: ${effect.value}`);
      });
    }
    Display.newLine();
  }
}
