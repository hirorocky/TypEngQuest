import { Phase } from '../core/Phase';
import { PhaseResult, PhaseTypes, PhaseType, CommandResult } from '../core/types';
import { Display } from '../ui/Display';
import { ScrollableList, ListItem } from '../ui/ScrollableList';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { Item } from '../items/Item';
import { ConsumableItem } from '../items/ConsumableItem';
import { EquipmentItem } from '../items/EquipmentItem';
import { EquipmentGrammarChecker } from '../equipment/EquipmentGrammarChecker';
import { EquipmentEffectCalculator } from '../equipment/EquipmentEffectCalculator';

/**
 * インベントリフェーズ - アイテムの管理と使用を行う
 */
export class InventoryPhase extends Phase {
  protected world: World;
  private player: Player;
  private grammarChecker: EquipmentGrammarChecker;
  private effectCalculator: EquipmentEffectCalculator;

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
    this.grammarChecker = new EquipmentGrammarChecker();
    this.effectCalculator = new EquipmentEffectCalculator();
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
  private async handleItemCommand(command: string, args: string[]): Promise<CommandResult | null> {
    if (command === 'consume') {
      return await this.consumeItem();
    }
    if (command === 'equip') {
      return await this.equipItem();
    }
    if (command === 'unequip') {
      if (args.length < 1) {
        return {
          success: false,
          message: 'usage: unequip <slot_number>',
        };
      }
      const slotNumber = parseInt(args[0], 10);
      return await this.unequipItem(slotNumber);
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
   * 消費アイテムを選択して使用する
   */
  private async consumeItem(): Promise<CommandResult> {
    const consumableItems = this.getConsumableItems();

    if (consumableItems.length === 0) {
      return {
        success: false,
        message: 'no consumable items available',
      };
    }

    const choices: ListItem[] = consumableItems.map((item, index) => ({
      name: this.formatItemInfo(item),
      value: index,
    }));

    const list = new ScrollableList(choices, {
      message: 'Select an item to consume:',
      pageSize: 8,
      loop: false,
      onSelectionChange: item => {
        const selectedItem = consumableItems[item.value];
        this.displaySelectedItemDetails(selectedItem);
      },
    });

    const selectedIndex = await list.waitForSelection();

    // リスト選択後、少し待ってから画面をリフレッシュ
    await new Promise(resolve => {
      global.setTimeout(resolve, 100);
    });

    if (selectedIndex === null) {
      this.refreshDisplay();
      return {
        success: false,
        message: 'consumption cancelled',
      };
    }

    const selectedItem = consumableItems[selectedIndex];

    // アイテムを使用
    try {
      await selectedItem.use(this.player);

      // アイテムをインベントリから削除
      this.player.getInventory().removeItem(selectedItem);

      this.refreshDisplay();
      return {
        success: true,
        message: `consumed ${selectedItem.getDisplayName()}`,
      };
    } catch (error) {
      this.refreshDisplay();
      return {
        success: false,
        message: `failed to consume item: ${error instanceof Error ? error.message : 'unknown error'}`,
      };
    }
  }

  /**
   * 消費可能なアイテムのリストを取得する
   */
  private getConsumableItems(): ConsumableItem[] {
    const allItems = this.player.getInventory().getItems();
    return allItems.filter(item => item instanceof ConsumableItem) as ConsumableItem[];
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
    Display.printCommand('consume', 'select and consume item');
    Display.printCommand('equip', 'equip item to slots');
    Display.printCommand('unequip <slot>', 'unequip item from slot');
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

  /**
   * 利用可能なコマンドの一覧を取得する
   */
  public getAvailableCommands(): string[] {
    return [
      'consume',
      'equip',
      'unequip',
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
   * 装備アイテムを選択して装備する
   */
  private async equipItem(): Promise<CommandResult> {
    const equipmentItems = this.getEquipmentItems();

    if (equipmentItems.length === 0) {
      return {
        success: false,
        message: 'no equipment items available',
      };
    }

    // 装備選択UIに移行
    Display.clear();
    Display.printHeader('Equipment Selection');
    Display.newLine();

    this.displayEquipmentSlots();
    this.displayAvailableEquipment(equipmentItems);

    return {
      success: true,
      message: 'equipment selection mode started',
    };
  }

  /**
   * 指定スロットの装備を解除する
   */
  private async unequipItem(slotNumber: number): Promise<CommandResult> {
    if (slotNumber < 1 || slotNumber > 5) {
      return {
        success: false,
        message: `invalid slot number: ${slotNumber}`,
      };
    }

    // 現在の装備を取得（仮実装：Playerから実際の装備を取得する）
    const currentEquipments = this.getCurrentEquipmentWords();

    if (!currentEquipments[slotNumber - 1]) {
      return {
        success: false,
        message: `slot ${slotNumber} is already empty`,
      };
    }

    // TODO: 実際の装備解除処理を実装
    return {
      success: true,
      message: `unequipped from slot ${slotNumber}`,
    };
  }

  /**
   * 現在の装備状況を表示する
   */
  private async showEquipments(): Promise<CommandResult> {
    const currentEquipments = this.getCurrentEquipmentWords();

    if (currentEquipments.length === 0 || currentEquipments.every(item => !item)) {
      return {
        success: true,
        message: 'no equipment',
      };
    }

    return {
      success: true,
      message: 'current equipment displayed',
    };
  }

  /**
   * 装備可能なアイテムのリストを取得する
   */
  private getEquipmentItems(): EquipmentItem[] {
    const allItems = this.player.getInventory().getItems();
    return allItems.filter(item => item instanceof EquipmentItem) as EquipmentItem[];
  }

  /**
   * 装備スロット情報をフォーマットする
   */
  private formatEquipmentSlots(currentEquipment: string[]): string[] {
    const slots: string[] = [];
    for (let i = 0; i < 5; i++) {
      const item = currentEquipment[i];
      const slotInfo = item ? `Slot ${i + 1}: ${item}` : `Slot ${i + 1}: [empty]`;
      slots.push(slotInfo);
    }
    return slots;
  }

  /**
   * 装備変更時のレベル計算をプレビューする
   */
  private calculateLevelPreview(equipments: EquipmentItem[]): string {
    const level = this.effectCalculator.calculateAverageGradeBySlots(equipments, 5);
    return `Level: ${level}`;
  }

  /**
   * ステータス変化のプレビューを取得する
   */
  private getStatusPreview(equipments: EquipmentItem[]): string {
    const stats = this.effectCalculator.calculateTotalStats(equipments);
    const lines: string[] = [];

    if (stats.attack > 0) lines.push(`Attack: +${stats.attack}`);
    if (stats.defense > 0) lines.push(`Defense: +${stats.defense}`);
    if (stats.speed > 0) lines.push(`Speed: +${stats.speed}`);
    if (stats.accuracy > 0) lines.push(`Accuracy: +${stats.accuracy}`);
    if (stats.fortune > 0) lines.push(`Fortune: +${stats.fortune}`);

    return lines.join(', ');
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
   * 現在の装備スロット状況を表示する
   */
  private displayEquipmentSlots(): void {
    Display.printInfo('Current Equipment Slots:');
    const currentEquipment: string[] = []; // TODO: 実際の装備を取得
    const slotInfo = this.formatEquipmentSlots(currentEquipment);
    slotInfo.forEach(slot => Display.println(`  ${slot}`));
    Display.newLine();
  }

  /**
   * 利用可能な装備アイテムを表示する
   */
  private displayAvailableEquipment(equipmentItems: EquipmentItem[]): void {
    Display.printInfo('Available Equipment:');
    equipmentItems.forEach((item, index) => {
      const itemInfo = this.formatItemInfo(item);
      Display.println(`  ${index + 1}. ${itemInfo}`);
    });
    Display.newLine();
  }

  /**
   * 現在の装備単語を取得する（仮実装）
   */
  private getCurrentEquipmentWords(): string[] {
    // TODO: Playerクラスから実際の装備を取得する
    // 現在は仮実装として空配列を返す
    return [];
  }
}
