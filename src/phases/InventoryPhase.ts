import { Phase } from '../core/Phase';
import { PhaseResult, PhaseTypes, PhaseType, CommandResult } from '../core/types';
import { Display } from '../ui/Display';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { Item } from '../items/Item';
import { ConsumableItem } from '../items/ConsumableItem';

/**
 * インベントリフェーズ - アイテムの管理と使用を行う
 */
export class InventoryPhase extends Phase {
  protected world: World;
  private player: Player;
  private selectedIndex: number = 0;

  constructor(world: World, player: Player) {
    super(world);

    if (!world) {
      throw new Error('World is required for InventoryPhase');
    }
    if (!player) {
      throw new Error('Player is required for InventoryPhase');
    }
    this.world = world;
    this.player = player;
  }

  public getName(): string {
    return 'inventory';
  }

  public enter(): void {
    Display.clear();
    Display.printHeader('inventory');
    Display.newLine();

    this.displayInventory();
    this.showHelp();
    this.showPrompt();
  }

  /**
   * インベントリの内容を表示する
   */
  private displayInventory(): void {
    const inventory = this.player.getInventory();
    const items = inventory.getItems();

    Display.printInfo(`items: ${items.length}/100`);
    Display.newLine();

    if (items.length === 0) {
      Display.printInfo('no items in inventory');
      Display.newLine();
      return;
    }

    // アイテムのリストを表示
    items.forEach((item, index) => {
      const marker = index === this.selectedIndex ? '>' : ' ';
      const itemInfo = this.formatItemInfo(item);
      Display.printLine(`${marker} ${index + 1}. ${itemInfo}`);
    });

    Display.newLine();

    // 選択されたアイテムの詳細を表示
    if (items.length > 0) {
      const selectedItem = items[this.selectedIndex];
      this.displayItemDetails(selectedItem);
    }
  }

  /**
   * アイテム情報をフォーマットする
   */
  private formatItemInfo(item: Item): string {
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
   * アイテムの詳細情報を表示する
   */
  private displayItemDetails(item: Item): void {
    Display.printInfo('selected item:');
    Display.printLine(`  name: ${item.getDisplayName()}`);
    Display.printLine(`  description: ${item.getDescription()}`);
    Display.printLine(`  type: ${item.getType()}`);
    Display.printLine(`  rarity: ${item.getRarity()}`);

    // 消費アイテムの場合は効果を表示
    if (item instanceof ConsumableItem) {
      const effects = item.getEffects();
      if (effects.length > 0) {
        Display.printLine('  effects:');
        effects.forEach(effect => {
          Display.printLine(`    ${effect.type}: ${effect.value}`);
        });
      }
    }

    Display.newLine();
  }

  /**
   * 入力を処理してCommandResultを返す
   */
  async processInput(input: string): Promise<CommandResult> {
    const [command] = input.trim().split(/\s+/);

    // 移動コマンド
    const moveResult = this.handleMoveCommand(command);
    if (moveResult) return moveResult;

    // アイテム操作コマンド
    const itemResult = await this.handleItemCommand(command);
    if (itemResult) return itemResult;

    // フェーズ遷移コマンド
    const phaseResult = this.handlePhaseCommand(command);
    if (phaseResult) return phaseResult;

    // システムコマンド
    const systemResult = this.handleSystemCommand(command);
    if (systemResult) return systemResult;

    // 無効なコマンド
    return {
      success: false,
      message: `command not found: ${command}`,
    };
  }

  /**
   * 移動コマンドを処理する
   */
  private handleMoveCommand(command: string): CommandResult | null {
    if (command === 'up' || command === 'u') {
      return this.moveSelection(-1);
    }
    if (command === 'down' || command === 'd') {
      return this.moveSelection(1);
    }
    return null;
  }

  /**
   * アイテム操作コマンドを処理する
   */
  private async handleItemCommand(command: string): Promise<CommandResult | null> {
    if (command === 'use') {
      return await this.useSelectedItem();
    }
    if (command === 'drop') {
      return this.dropSelectedItem();
    }
    return null;
  }

  /**
   * フェーズ遷移コマンドを処理する
   */
  private handlePhaseCommand(command: string): CommandResult | null {
    if (command === 'back' || command === 'b' || command === 'exit') {
      return {
        success: true,
        nextPhase: PhaseTypes.EXPLORATION,
      };
    }
    return null;
  }

  /**
   * システムコマンドを処理する
   */
  private handleSystemCommand(command: string): CommandResult | null {
    if (command === 'help' || command === 'h' || command === '?') {
      this.showHelp();
      return { success: true };
    }

    if (command === 'clear' || command === 'cls') {
      Display.clear();
      this.displayInventory();
      this.showHelp();
      this.showPrompt();
      return { success: true };
    }

    return null;
  }

  /**
   * 選択を移動する
   */
  private moveSelection(direction: number): CommandResult {
    const items = this.player.getInventory().getItems();

    if (items.length === 0) {
      return {
        success: false,
        message: 'no items to select',
      };
    }

    const newIndex = this.selectedIndex + direction;
    if (newIndex < 0 || newIndex >= items.length) {
      return {
        success: false,
        message: 'cannot move selection further',
      };
    }

    this.selectedIndex = newIndex;
    this.refreshDisplay();
    return { success: true };
  }

  /**
   * 選択されたアイテムを使用する
   */
  private async useSelectedItem(): Promise<CommandResult> {
    const items = this.player.getInventory().getItems();

    if (items.length === 0) {
      return {
        success: false,
        message: 'no items to use',
      };
    }

    const selectedItem = items[this.selectedIndex];

    if (!(selectedItem instanceof ConsumableItem)) {
      return {
        success: false,
        message: 'this item cannot be used',
      };
    }

    // アイテムを使用
    try {
      await selectedItem.use(this.player);

      // アイテムをインベントリから削除
      this.player.getInventory().removeItem(selectedItem);

      // 選択インデックスを調整
      const newItemCount = this.player.getInventory().getItemCount();
      if (this.selectedIndex >= newItemCount && newItemCount > 0) {
        this.selectedIndex = newItemCount - 1;
      } else if (newItemCount === 0) {
        this.selectedIndex = 0;
      }

      this.refreshDisplay();
      return {
        success: true,
        message: `used ${selectedItem.getDisplayName()}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `failed to use item: ${error instanceof Error ? error.message : 'unknown error'}`,
      };
    }
  }

  /**
   * 選択されたアイテムを捨てる
   */
  private dropSelectedItem(): CommandResult {
    const items = this.player.getInventory().getItems();

    if (items.length === 0) {
      return {
        success: false,
        message: 'no items to drop',
      };
    }

    const selectedItem = items[this.selectedIndex];

    // アイテムをインベントリから削除
    this.player.getInventory().removeItem(selectedItem);

    // 選択インデックスを調整
    const newItemCount = this.player.getInventory().getItemCount();
    if (this.selectedIndex >= newItemCount && newItemCount > 0) {
      this.selectedIndex = newItemCount - 1;
    } else if (newItemCount === 0) {
      this.selectedIndex = 0;
    }

    this.refreshDisplay();
    return {
      success: true,
      message: `dropped ${selectedItem.getDisplayName()}`,
    };
  }

  /**
   * 画面を更新する
   */
  private refreshDisplay(): void {
    Display.clear();
    Display.printHeader('inventory');
    Display.newLine();
    this.displayInventory();
    this.showHelp();
    this.showPrompt();
  }

  /**
   * ヘルプを表示する
   */
  private showHelp(): void {
    Display.printInfo('commands:');
    Display.printCommand('up/u', 'move selection up');
    Display.printCommand('down/d', 'move selection down');
    Display.printCommand('use', 'use selected item');
    Display.printCommand('drop', 'drop selected item');
    Display.printCommand('back/b', 'return to exploration');
    Display.printCommand('help/h', 'show this help');
    Display.printCommand('clear', 'clear screen');
    Display.newLine();
  }

  /**
   * プロンプトを表示する
   */
  private showPrompt(): void {
    Display.print('[inventory]$ ');
  }

  /**
   * フェーズタイプを取得する
   */
  getType(): PhaseType {
    return 'inventory';
  }

  /**
   * フェーズの初期化処理
   */
  async initialize(): Promise<void> {
    this.enter();
  }

  /**
   * フェーズのクリーンアップ処理
   */
  async cleanup(): Promise<void> {
    // 特に処理なし
  }

  public exit(): void {
    // 特に処理なし
  }

  protected processCommand(_input: string): PhaseResult {
    // このメソッドは使用されないが、抽象クラスの実装のため必要
    return { type: PhaseTypes.CONTINUE };
  }
}
