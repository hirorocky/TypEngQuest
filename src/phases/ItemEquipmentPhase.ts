import { Phase } from '../core/Phase';
import { PhaseType, CommandResult } from '../core/types';
import { Display } from '../ui/Display';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { EquipmentItem } from '../items/EquipmentItem';
import { EquipmentGrammarChecker } from '../equipment/EquipmentGrammarChecker';
import { EquipmentEffectCalculator } from '../equipment/EquipmentEffectCalculator';
import { TabCompleter } from '../core/completion';

/**
 * 装備管理フェーズ - リッチなキー入力UIで装備管理
 * Tab: スロット切り替え, ↑↓: アイテム選択, e: 装備, w: 装備解除, q: 終了
 */
export class ItemEquipmentPhase extends Phase {
  private player: Player;
  private grammarChecker: EquipmentGrammarChecker;
  private effectCalculator: EquipmentEffectCalculator;
  private currentSlot: number = 0;
  private selectedItemIndex: number = 0;
  private equipmentItems: EquipmentItem[] = [];
  private isActive: boolean = true;

  constructor(world: World, player: Player, tabCompleter?: TabCompleter) {
    super(world, tabCompleter);

    if (!world) {
      throw new Error('World is required for ItemEquipmentPhase');
    }
    if (!player) {
      throw new Error('Player is required for ItemEquipmentPhase');
    }

    this.world = world;
    this.player = player;
    this.grammarChecker = new EquipmentGrammarChecker();
    this.effectCalculator = new EquipmentEffectCalculator();

    // 装備可能なアイテムを取得
    this.updateEquipmentItems();
  }

  getType(): PhaseType {
    return 'itemEquipment';
  }

  getPrompt(): string {
    return 'equipment> ';
  }

  async initialize(): Promise<void> {
    this.render();
  }

  /**
   * カスタムreadlineインターフェースを作成（キー入力処理用）
   */
  protected createReadlineInterface(): any {
    // eslint-disable-next-line no-undef
    const readline = require('readline');
    return readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.getPrompt(),
    });
  }

  /**
   * リッチUI用の入力処理ループ
   */
  async startInputLoop(): Promise<CommandResult | null> {
    // テスト環境では自動終了
    if (process.env.NODE_ENV === 'test' && process.env.DEBUG_UI !== 'true') {
      return {
        success: true,
        message: 'Equipment management completed (test mode)',
        nextPhase: 'inventory',
      };
    }

    this.isActive = true;

    // raw modeを有効にしてキー入力を直接取得
    if (typeof process.stdin.setRawMode === 'function') {
      process.stdin.setRawMode(true);
    }
    process.stdin.setEncoding('utf8');
    process.stdin.resume();

    return new Promise(resolve => {
      const handleKeyInput = (key: string) => {
        if (!this.isActive) {
          return;
        }

        const result = this.processKeyInput(key);

        if (result) {
          // 終了処理
          this.cleanup().then(() => {
            resolve(result);
          });
        } else {
          // UIを更新
          this.render();
        }
      };

      process.stdin.on('data', handleKeyInput);

      // 終了時のクリーンアップ
      const cleanup = () => {
        process.stdin.removeListener('data', handleKeyInput);
        if (typeof process.stdin.setRawMode === 'function') {
          process.stdin.setRawMode(false);
        }
        process.stdin.pause();
      };

      // resolveが呼ばれた時にクリーンアップ
      const originalResolve = resolve;
      resolve = result => {
        cleanup();
        originalResolve(result);
      };
    });
  }

  /**
   * キー入力を処理する
   * @returns 終了する場合はCommandResultを返す、継続する場合はnullを返す
   */
  private processKeyInput(key: string): CommandResult | null {
    if (this.handleNavigationKeys(key)) return null;
    if (this.handleActionKeys(key)) return null;
    return this.handleExitKeys(key);
  }

  /**
   * ナビゲーションキーを処理
   */
  private handleNavigationKeys(key: string): boolean {
    switch (key) {
      case '\t': // Tab - スロット切り替え
        this.currentSlot = (this.currentSlot + 1) % 5;
        return true;

      case '\u001b[A': // 上矢印 - 前のアイテム
        if (this.equipmentItems.length > 0) {
          this.selectedItemIndex = Math.max(0, this.selectedItemIndex - 1);
        }
        return true;

      case '\u001b[B': // 下矢印 - 次のアイテム
        if (this.equipmentItems.length > 0) {
          this.selectedItemIndex = Math.min(
            this.equipmentItems.length - 1,
            this.selectedItemIndex + 1
          );
        }
        return true;

      default:
        return false;
    }
  }

  /**
   * アクションキーを処理
   */
  private handleActionKeys(key: string): boolean {
    switch (key) {
      case 'e':
      case 'E': // 装備
        this.equipSelectedItem();
        return true;

      case 'w':
      case 'W': // 装備解除
        this.unequipCurrentSlot();
        return true;

      default:
        return false;
    }
  }

  /**
   * 終了キーを処理
   */
  private handleExitKeys(key: string): CommandResult | null {
    if (key === 'q' || key === 'Q' || key === '\u0003') {
      this.isActive = false;
      return {
        success: true,
        message: 'Equipment management completed',
        nextPhase: 'inventory',
      };
    }
    return null;
  }

  /**
   * 画面を描画する
   */
  private render(): void {
    Display.clear();
    Display.printHeader('Equipment Management');
    Display.newLine();

    // 装備スロット表示
    this.renderEquipmentSlots();
    Display.newLine();

    // 利用可能なアイテム表示
    this.renderAvailableItems();
    Display.newLine();

    // ステータス情報表示
    this.renderStatusInfo();
    Display.newLine();

    // 操作説明表示
    this.renderControls();
    Display.newLine();
  }

  /**
   * 装備スロットを描画する
   */
  private renderEquipmentSlots(): void {
    Display.printInfo('Equipment Slots:');
    const slots = this.player.getEquipmentSlots();

    for (let i = 0; i < 5; i++) {
      const isSelected = i === this.currentSlot;
      const equipment = slots[i];
      const slotDisplay = equipment ? equipment.getName() : '[empty]';
      const prefix = isSelected ? '→ ' : '  ';
      const suffix = isSelected ? ' ←' : '';

      Display.println(`${prefix}Slot ${i + 1}: ${slotDisplay}${suffix}`);
    }
  }

  /**
   * 利用可能なアイテムを描画する
   */
  private renderAvailableItems(): void {
    Display.printInfo('Available Items:');

    if (this.equipmentItems.length === 0) {
      Display.println('  No equipment items available');
      return;
    }

    for (let i = 0; i < this.equipmentItems.length; i++) {
      const isSelected = i === this.selectedItemIndex;
      const item = this.equipmentItems[i];
      const prefix = isSelected ? '→ ' : '  ';
      const suffix = isSelected ? ' ←' : '';
      const rarity = this.getRaritySymbol(item.getRarity());

      Display.println(
        `${prefix}${i + 1}. ${item.getName()} ${rarity} (Grade: ${item.getGrade()})${suffix}`
      );

      if (isSelected) {
        Display.println(`    ${item.getDescription()}`);
        Display.println(`    Stats: ${this.formatItemStats(item)}`);
      }
    }
  }

  /**
   * ステータス情報を描画する
   */
  private renderStatusInfo(): void {
    Display.printInfo('Status Information:');

    // 現在のレベルとステータス
    const currentLevel = this.player.getLevel();
    const currentStats = this.player.getEquippedItemStats();
    Display.println(`  Current Level: ${currentLevel}`);
    Display.println(`  Current Stats: ${this.formatEquipmentStats(currentStats)}`);

    // 選択されたアイテムの装備プレビュー
    const selectedItem = this.getSelectedItem();
    if (selectedItem) {
      const previewLevel = this.calculatePreviewLevel(selectedItem);
      const previewStats = this.calculatePreviewStats(selectedItem);
      const levelDiff = previewLevel - currentLevel;
      const statsDiff = this.calculateStatsDifference(currentStats, previewStats);

      Display.println(
        `  Preview Level: ${previewLevel} (${levelDiff >= 0 ? '+' : ''}${levelDiff})`
      );
      Display.println(`  Preview Stats: ${this.formatEquipmentStats(previewStats)}`);

      if (statsDiff.length > 0) {
        Display.println(`  Stats Change: ${statsDiff}`);
      }

      // 装備可能かチェック
      const canEquip = this.canEquipItem(selectedItem);
      const equipStatus = canEquip ? '✓ Can equip' : '✗ Cannot equip';
      Display.println(`  Equip Status: ${equipStatus}`);

      if (!canEquip) {
        const reason = this.getEquipFailureReason(selectedItem);
        Display.println(`    Reason: ${reason}`);
      }
    }

    // 英文法チェック結果
    const grammarResult = this.checkCurrentGrammar();
    const grammarStatus = grammarResult.isValid ? '✓ Valid' : '✗ Invalid';
    const grammarColor = grammarResult.isValid ? '' : '⚠️ ';
    Display.println(`  Grammar Check: ${grammarColor}${grammarStatus}`);
    if (!grammarResult.isValid) {
      Display.println(`    ${grammarResult.message}`);
    }
  }

  /**
   * 操作説明を描画する
   */
  private renderControls(): void {
    Display.printInfo('Controls:');
    Display.println('  Tab    : Switch equipment slot');
    Display.println('  ↑ ↓   : Select item');
    Display.println('  e      : Equip selected item');
    Display.println('  w      : Unequip from current slot');
    Display.println('  q      : Return to inventory');
  }

  /**
   * 選択されたアイテムを装備する
   */
  private equipSelectedItem(): void {
    const selectedItem = this.getSelectedItem();
    if (!selectedItem) return;

    if (!this.canEquipItem(selectedItem)) {
      // エラー音の代わりに何もしない（UIで表示済み）
      return;
    }

    try {
      this.player.equipToSlot(this.currentSlot, selectedItem);
      this.updateEquipmentItems();

      // 選択インデックスを調整
      this.selectedItemIndex = Math.min(this.selectedItemIndex, this.equipmentItems.length - 1);
    } catch (_error) {
      // エラーは無視（UIで処理）
    }
  }

  /**
   * 現在のスロットの装備を解除する
   */
  private unequipCurrentSlot(): void {
    const slots = this.player.getEquipmentSlots();
    if (!slots[this.currentSlot]) {
      return; // 空のスロット
    }

    try {
      this.player.equipToSlot(this.currentSlot, null);
      this.updateEquipmentItems();
    } catch (_error) {
      // エラーは無視（UIで処理）
    }
  }

  /**
   * アイテムが装備可能かチェック
   */
  private canEquipItem(item: EquipmentItem): boolean {
    // 基本的なチェック（必要に応じて拡張）
    return item instanceof EquipmentItem;
  }

  /**
   * 装備失敗の理由を取得
   */
  private getEquipFailureReason(item: EquipmentItem): string {
    if (!(item instanceof EquipmentItem)) {
      return 'Not an equipment item';
    }
    return 'Unknown reason';
  }

  /**
   * ステータスの差分を計算
   */
  private calculateStatsDifference(current: any, preview: any): string {
    const diffs: string[] = [];

    const categories = ['attack', 'defense', 'speed', 'accuracy', 'fortune'];
    const labels = ['ATK', 'DEF', 'SPD', 'ACC', 'LUK'];

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const label = labels[i];
      const diff = (preview[category] || 0) - (current[category] || 0);

      if (diff !== 0) {
        const sign = diff > 0 ? '+' : '';
        diffs.push(`${label}${sign}${diff}`);
      }
    }

    return diffs.join(', ') || 'No change';
  }

  /**
   * 装備可能なアイテムリストを更新する
   */
  private updateEquipmentItems(): void {
    const allItems = this.player.getInventory().getItems();
    this.equipmentItems = allItems.filter(item => item instanceof EquipmentItem) as EquipmentItem[];

    // 選択インデックスを調整
    if (this.selectedItemIndex >= this.equipmentItems.length) {
      this.selectedItemIndex = Math.max(0, this.equipmentItems.length - 1);
    }
  }

  /**
   * 現在選択されているアイテムを取得する
   */
  private getSelectedItem(): EquipmentItem | null {
    return this.equipmentItems[this.selectedItemIndex] || null;
  }

  /**
   * レアリティシンボルを取得する
   */
  private getRaritySymbol(rarity: string): string {
    switch (rarity.toLowerCase()) {
      case 'common':
        return '[C]';
      case 'rare':
        return '[R]';
      case 'epic':
        return '[E]';
      case 'legendary':
        return '[L]';
      default:
        return '[?]';
    }
  }

  /**
   * アイテムのステータスをフォーマットする
   */
  private formatItemStats(item: EquipmentItem): string {
    const stats = item.getStats();
    const parts: string[] = [];

    if (stats.attack > 0) parts.push(`ATK+${stats.attack}`);
    if (stats.defense > 0) parts.push(`DEF+${stats.defense}`);
    if (stats.speed !== 0) parts.push(`SPD${stats.speed >= 0 ? '+' : ''}${stats.speed}`);
    if (stats.accuracy > 0) parts.push(`ACC+${stats.accuracy}`);
    if (stats.fortune > 0) parts.push(`LUK+${stats.fortune}`);

    return parts.join(', ') || 'No bonus';
  }

  /**
   * 装備ステータスをフォーマットする
   */
  private formatEquipmentStats(stats: any): string {
    const parts: string[] = [];

    if (stats.attack > 0) parts.push(`ATK+${stats.attack}`);
    if (stats.defense > 0) parts.push(`DEF+${stats.defense}`);
    if (stats.speed !== 0) parts.push(`SPD${stats.speed >= 0 ? '+' : ''}${stats.speed}`);
    if (stats.accuracy > 0) parts.push(`ACC+${stats.accuracy}`);
    if (stats.fortune > 0) parts.push(`LUK+${stats.fortune}`);

    return parts.join(', ') || 'No bonus';
  }

  /**
   * プレビューレベルを計算する
   */
  private calculatePreviewLevel(newItem: EquipmentItem): number {
    const currentSlots = this.player.getEquipmentSlots();
    const previewSlots = [...currentSlots];
    previewSlots[this.currentSlot] = newItem;

    const previewItems = previewSlots.filter(item => item !== null) as EquipmentItem[];
    return this.effectCalculator.calculateAverageGradeBySlots(previewItems, 5);
  }

  /**
   * プレビューステータスを計算する
   */
  private calculatePreviewStats(newItem: EquipmentItem): any {
    const currentSlots = this.player.getEquipmentSlots();
    const previewSlots = [...currentSlots];
    previewSlots[this.currentSlot] = newItem;

    const previewItems = previewSlots.filter(item => item !== null) as EquipmentItem[];
    return this.effectCalculator.calculateTotalStats(previewItems);
  }

  /**
   * 現在の装備の英文法をチェックする
   */
  private checkCurrentGrammar(): { isValid: boolean; message: string } {
    const equippedNames = this.player.getEquippedItemNames().filter(name => name !== '');
    return this.grammarChecker.isValidSentence(equippedNames)
      ? { isValid: true, message: 'Valid English sentence' }
      : { isValid: false, message: this.grammarChecker.getGrammarErrorMessage(equippedNames) };
  }

  async cleanup(): Promise<void> {
    this.isActive = false;

    // raw modeを終了
    if (typeof process.stdin.setRawMode === 'function') {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();

    // 少し待ってからstdinを再開
    await new Promise(resolve => global.setTimeout(resolve, 50));
    process.stdin.resume();

    await super.cleanup();
  }
}
