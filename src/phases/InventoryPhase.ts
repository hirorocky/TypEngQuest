import { Phase } from '../core/Phase';
import { PhaseResult, PhaseTypes, PhaseType, CommandResult } from '../core/types';
import { Display } from '../ui/Display';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { Item } from '../items/Item';
import { AccessoryItem } from '../items/AccessoryItem';
import { EquipmentGrammarChecker } from '../equipment/EquipmentGrammarChecker';
import { EquipmentStatsData } from '../player/EquipmentStats';
import { TabCompleter } from '../core/completion';

/**
 * インベントリフェーズ - アイテムの管理と使用を行う
 */
export class InventoryPhase extends Phase {
  protected world: World;
  private player: Player;
  private grammarChecker: EquipmentGrammarChecker;

  constructor(world: World, player: Player, tabCompleter?: TabCompleter) {
    super(world, tabCompleter);

    if (!world) {
      throw new Error('World is required for InventoryPhase');
    }
    if (!player) {
      throw new Error('Player is required for InventoryPhase');
    }
    this.world = world;
    this.player = player;
    this.grammarChecker = new EquipmentGrammarChecker();
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
      const itemInfo = this.formatItemInfo(item);
      Display.println(`  ${index + 1}. ${itemInfo}`);
    });

    Display.newLine();
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
   * 入力を処理してCommandResultを返す
   */
  async processInput(input: string): Promise<CommandResult> {
    const parts = input.trim().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    // アイテム操作コマンド
    const itemResult = await this.handleItemCommand(command, args);
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
   * アイテム操作コマンドを処理する
   */
  private async handleItemCommand(command: string, _args: string[]): Promise<CommandResult | null> {
    if (command === 'consume') {
      // ItemConsumptionPhaseに遷移
      return {
        success: true,
        nextPhase: PhaseTypes.ITEM_CONSUMPTION,
      };
    }
    if (command === 'equip') {
      // ItemEquipmentPhaseに遷移
      return {
        success: true,
        nextPhase: PhaseTypes.ITEM_EQUIPMENT,
      };
    }
    if (command === 'equipments') {
      return await this.showEquipments();
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
   * ヘルプを表示する
   */
  private showHelp(): void {
    Display.printInfo('commands:');
    Display.printCommand('consume', 'select and consume item');
    Display.printCommand('equip', 'equip item to slots');
    Display.printCommand('equipments', 'show current equipment');
    Display.printCommand('back/b/exit', 'return to exploration');
    Display.printCommand('help/h/?', 'show this help');
    Display.printCommand('clear/cls', 'clear screen');
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

  getPrompt(): string {
    return '[inventory]$ ';
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
    await super.cleanup();
  }

  public exit(): void {
    // 特に処理なし
  }

  protected processCommand(_input: string): PhaseResult {
    // このメソッドは使用されないが、抽象クラスの実装のため必要
    return { type: PhaseTypes.CONTINUE };
  }

  /**
   * 利用可能なコマンドの一覧を取得する
   */
  public getAvailableCommands(): string[] {
    return [
      'consume',
      'equip',
      'equipments',
      'back',
      'b',
      'exit',
      'help',
      'h',
      '?',
      'clear',
      'cls',
    ];
  }

  /**
   * 現在の装備状況を表示する
   */
  private async showEquipments(): Promise<CommandResult> {
    const equipmentSlots = this.player.getEquipmentSlots();
    const equippedItems = equipmentSlots.filter((item): item is AccessoryItem => item !== null);

    Display.printInfo('Current Equipment:');

    if (equippedItems.length === 0) {
      Display.println('  No accessories equipped');
      return {
        success: true,
        message: 'no accessories equipped',
      };
    }

    equipmentSlots.forEach((item, index) => {
      const slotDisplay = item ? `${item.getDisplayName()} [${item.getRarity()}]` : '[empty]';
      Display.println(`  Slot ${index + 1}: ${slotDisplay}`);
    });

    // 英文構成チェック
    const equippedNames = this.getCurrentEquipmentWords().filter(name => name !== '');
    const grammarResult = this.checkGrammarValidity(equippedNames);
    const grammarStatus = grammarResult.isValid ? '✓ Valid English' : '✗ Invalid Grammar';
    Display.println(`  Grammar: ${grammarStatus}`);
    if (!grammarResult.isValid) {
      Display.println(`    ${grammarResult.message}`);
    }

    // レベルとステータス表示
    Display.println(`  World Level: ${this.player.getWorldLevel()}`);
    Display.println(`  Average Grade: ${this.player.getLevel()}`);
    const statsText = this.getStatusPreview(this.player.getEquipmentStats().toJSON());
    if (statsText) {
      Display.println(`  Accessory Contribution: ${statsText}`);
    }

    return {
      success: true,
      message: 'current equipment displayed',
    };
  }

  /**
   * ステータス変化のプレビューを取得する
   */
  private getStatusPreview(contribution: EquipmentStatsData): string {
    const lines: string[] = [];

    if (contribution.strength !== 0)
      lines.push(`Strength: ${this.formatSigned(contribution.strength)}`);
    if (contribution.willpower !== 0)
      lines.push(`Willpower: ${this.formatSigned(contribution.willpower)}`);
    if (contribution.agility !== 0)
      lines.push(`Agility: ${this.formatSigned(contribution.agility)}`);
    if (contribution.fortune !== 0)
      lines.push(`Fortune: ${this.formatSigned(contribution.fortune)}`);

    return lines.join(', ');
  }

  private formatSigned(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  /**
   * 英文法の妥当性をチェックする
   */
  private checkGrammarValidity(words: string[]): { isValid: boolean; message: string } {
    const isValid = this.grammarChecker.isValidSentence(words);
    const message = isValid
      ? 'valid english sentence'
      : this.grammarChecker.getGrammarErrorMessage(words);

    return { isValid, message };
  }

  /**
   * 現在の装備単語を取得する
   */
  private getCurrentEquipmentWords(): string[] {
    return this.player.getEquippedItemNames();
  }
}
