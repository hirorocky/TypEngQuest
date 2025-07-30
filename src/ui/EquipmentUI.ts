import { Display } from './Display';
import { Player } from '../player/Player';
import { EquipmentItem } from '../items/EquipmentItem';
import { EquipmentGrammarChecker } from '../equipment/EquipmentGrammarChecker';
import { EquipmentEffectCalculator } from '../equipment/EquipmentEffectCalculator';

/**
 * リッチな装備UI
 * 左右でスロット切り替え、上下でアイテム選択、eで装備、uで装備解除、qで終了
 */
export class EquipmentUI {
  private player: Player;
  private grammarChecker: EquipmentGrammarChecker;
  private effectCalculator: EquipmentEffectCalculator;
  private currentSlot: number = 0;
  private selectedItemIndex: number = 0;
  private isActive: boolean = false;
  private originalSigintHandler: ((...args: any[]) => void) | undefined;
  private originalStdinListeners: { event: string; listener: (...args: any[]) => void }[] = [];

  constructor(player: Player) {
    this.player = player;
    this.grammarChecker = new EquipmentGrammarChecker();
    this.effectCalculator = new EquipmentEffectCalculator();
  }

  /**
   * 装備UIを開始する
   */
  async start(): Promise<void> {
    console.log('🔧 EquipmentUI: Starting equipment UI');
    this.isActive = true;
    this.currentSlot = 0;
    this.selectedItemIndex = 0;

    // SIGINTハンドラーを一時的に無効化（qキーでのみ終了するため）
    this.disableSigintHandler();

    // 既存のstdinリスナーを一時的に無効化
    this.disableStdinListeners();

    try {
      while (this.isActive) {
        this.render();
        await this.handleInput();
        console.log('🔧 EquipmentUI: Loop iteration, isActive =', this.isActive);
      }
      console.log('🔧 EquipmentUI: Exiting equipment UI loop');

      // 'q'キーが親のゲームループに渡らないよう、少し待つ
      await new Promise(resolve => global.setTimeout(resolve, 100));

      // stdinの入力バッファをクリア
      this.clearInputBuffer();

      // さらに確実にするため、一時的にキーボード入力を消費
      await this.flushKeyboardInput();
    } finally {
      // 終了時にハンドラーを復元
      this.restoreStdinListeners();
      this.restoreSigintHandler();
      console.log('🔧 EquipmentUI: Equipment UI ended, returning to inventory');
    }
  }

  /**
   * SIGINTハンドラーを一時的に無効化
   */
  private disableSigintHandler(): void {
    // テスト環境では何もしない
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    // 既存のSIGINTハンドラーを保存
    this.originalSigintHandler = process.listeners('SIGINT')[0] as (...args: any[]) => void;

    // 既存のハンドラーを削除
    process.removeAllListeners('SIGINT');

    // 何もしないハンドラーを設定（Ctrl+Cを無効化）
    process.on('SIGINT', () => {
      // 何もしない - qキーでのみ終了可能
    });
  }

  /**
   * SIGINTハンドラーを復元
   */
  private restoreSigintHandler(): void {
    // テスト環境では何もしない
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    // 一時的なハンドラーを削除
    process.removeAllListeners('SIGINT');

    // 元のハンドラーを復元
    if (this.originalSigintHandler) {
      process.on('SIGINT', this.originalSigintHandler);
    }
  }

  /**
   * 既存のstdinリスナーを一時的に無効化
   */
  private disableStdinListeners(): void {
    // テスト環境では何もしない
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const stdin = process.stdin;

    // 既存のリスナーをすべて保存
    const events = ['data', 'line', 'keypress'];
    events.forEach(event => {
      const listeners = stdin.listeners(event);
      listeners.forEach(listener => {
        const typedListener = listener as (...args: any[]) => void;
        this.originalStdinListeners.push({ event, listener: typedListener });
        stdin.removeListener(event, typedListener);
        console.log(`🔧 EquipmentUI: Disabled stdin listener for '${event}'`);
      });
    });
  }

  /**
   * stdinリスナーを復元
   */
  private restoreStdinListeners(): void {
    // テスト環境では何もしない
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const stdin = process.stdin;

    // 保存していたリスナーを復元
    this.originalStdinListeners.forEach(({ event, listener }) => {
      stdin.on(event, listener);
      console.log(`🔧 EquipmentUI: Restored stdin listener for '${event}'`);
    });

    // 配列をクリア
    this.originalStdinListeners = [];
  }

  /**
   * stdinの入力バッファをクリアする
   */
  private clearInputBuffer(): void {
    // テスト環境では何もしない
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const stdin = process.stdin;

    // stdinを一時的にpauseしてバッファをクリア
    stdin.pause();

    // readableが利用可能な場合のみ実行
    if (stdin.readable) {
      // バッファされた入力をクリア
      let chunk;
      while ((chunk = stdin.read()) !== null) {
        console.log('🔧 EquipmentUI: Cleared buffered input:', JSON.stringify(chunk));
      }
    }

    // より確実にバッファをクリアするため、internalBufferもクリア（安全チェック付き）
    try {
      if ((stdin as any)._readableState && (stdin as any)._readableState.buffer) {
        const buffer = (stdin as any)._readableState.buffer;
        if (typeof buffer.clear === 'function') {
          buffer.clear();
          console.log('🔧 EquipmentUI: Cleared internal buffer');
        } else if (buffer.head) {
          // BufferListの場合は手動でクリア
          buffer.head = buffer.tail = null;
          buffer.length = 0;
          console.log('🔧 EquipmentUI: Manually cleared buffer list');
        }
      }
    } catch (error) {
      console.log('🔧 EquipmentUI: Error clearing buffer:', error);
    }
  }

  /**
   * キーボード入力を完全にフラッシュする
   */
  private async flushKeyboardInput(): Promise<void> {
    // テスト環境では何もしない
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    return new Promise(resolve => {
      const stdin = process.stdin;
      let flushed = false;

      // 一時的なリスナーを設定して、任意の入力を消費
      const flushListener = (data: Buffer) => {
        console.log('🔧 EquipmentUI: Flushed input:', JSON.stringify(data.toString()));
        if (!flushed) {
          flushed = true;
          stdin.removeListener('data', flushListener);
          resolve();
        }
      };

      stdin.on('data', flushListener);

      // 100ms後にタイムアウト
      global.setTimeout(() => {
        if (!flushed) {
          flushed = true;
          stdin.removeListener('data', flushListener);
          console.log('🔧 EquipmentUI: Flush timeout - no input to consume');
          resolve();
        }
      }, 100);
    });
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

    // 操作説明
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
    const equipmentItems = this.getEquipmentItems();

    if (equipmentItems.length === 0) {
      Display.println('  No equipment items available');
      return;
    }

    for (let i = 0; i < equipmentItems.length; i++) {
      const isSelected = i === this.selectedItemIndex;
      const item = equipmentItems[i];
      const prefix = isSelected ? '→ ' : '  ';
      const suffix = isSelected ? ' ←' : '';
      const rarity = this.getRaritySymbol(item.getRarity());

      Display.println(`${prefix}${item.getName()} ${rarity} (Grade: ${item.getGrade()})${suffix}`);

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

    // 現在のレベル
    const currentLevel = this.player.getLevel();
    Display.println(`  Current Level: ${currentLevel}`);

    // 現在のステータス
    const currentStats = this.player.getEquippedItemStats();
    Display.println(`  Current Stats: ${this.formatEquipmentStats(currentStats)}`);

    // 装備変更プレビュー
    const selectedItem = this.getSelectedItem();
    if (selectedItem) {
      const previewLevel = this.calculatePreviewLevel(selectedItem);
      const previewStats = this.calculatePreviewStats(selectedItem);
      Display.println(
        `  Preview Level: ${previewLevel} (${previewLevel - currentLevel >= 0 ? '+' : ''}${previewLevel - currentLevel})`
      );
      Display.println(`  Preview Stats: ${this.formatEquipmentStats(previewStats)}`);
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
    Display.println('  ← → : Switch equipment slot');
    Display.println('  ↑ ↓ : Select item');
    Display.println('  e   : Equip selected item');
    Display.println('  u   : Unequip from current slot');
    Display.println('  q   : Return to inventory (Ctrl+C disabled)');
  }

  /**
   * キー入力を処理する
   */
  private async handleInput(): Promise<void> {
    // テスト環境では自動終了（デバッグ用に一時的に無効化）
    if (process.env.NODE_ENV === 'test' && process.env.DEBUG_UI !== 'true') {
      this.isActive = false;
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const stdin = process.stdin;

      // setRawModeが利用可能かチェック
      if (typeof stdin.setRawMode === 'function') {
        stdin.setRawMode(true);
      }

      stdin.resume();
      stdin.setEncoding('utf8');

      const onKeyPress = (key: string) => {
        if (typeof stdin.setRawMode === 'function') {
          stdin.setRawMode(false);
        }
        stdin.pause();
        stdin.removeListener('data', onKeyPress);

        // キー入力を処理し、処理された場合はイベントを消費
        const consumed = this.processKeyInput(key);
        console.log(
          `🔧 EquipmentUI: Key '${key}' processed, consumed: ${consumed}, isActive: ${this.isActive}`
        );

        resolve();
      };

      stdin.on('data', onKeyPress);
    });
  }

  /**
   * キー入力を処理する（複雑度を下げるため分離）
   * @returns キーが処理された場合はtrue、無視された場合はfalse
   */
  private processKeyInput(key: string): boolean {
    if (this.handleNavigationKeys(key)) return true;
    if (this.handleActionKeys(key)) return true;
    if (this.handleExitKeys(key)) return true;
    return false;
  }

  /**
   * ナビゲーションキーを処理する
   */
  private handleNavigationKeys(key: string): boolean {
    switch (key) {
      case '\u001b[D': // 左矢印
        this.currentSlot = Math.max(0, this.currentSlot - 1);
        return true;
      case '\u001b[C': // 右矢印
        this.currentSlot = Math.min(4, this.currentSlot + 1);
        return true;
      case '\u001b[A': // 上矢印
        this.selectedItemIndex = Math.max(0, this.selectedItemIndex - 1);
        return true;
      case '\u001b[B': {
        // 下矢印
        const maxIndex = this.getEquipmentItems().length - 1;
        this.selectedItemIndex = Math.min(maxIndex, this.selectedItemIndex + 1);
        return true;
      }
      default:
        return false;
    }
  }

  /**
   * アクションキーを処理する
   */
  private handleActionKeys(key: string): boolean {
    switch (key) {
      case 'e':
      case 'E':
        this.equipSelectedItem();
        return true;
      case 'u':
      case 'U':
        this.unequipCurrentSlot();
        return true;
      default:
        return false;
    }
  }

  /**
   * 終了キーを処理する
   */
  private handleExitKeys(key: string): boolean {
    switch (key) {
      case 'q':
      case 'Q':
        console.log('🔧 EquipmentUI: Q key pressed, setting isActive = false');
        this.isActive = false;
        return true;
      default:
        return false;
    }
  }

  /**
   * 選択されたアイテムを装備する
   */
  private equipSelectedItem(): void {
    const selectedItem = this.getSelectedItem();
    if (!selectedItem) return;

    try {
      this.player.equipToSlot(this.currentSlot, selectedItem);
      // 選択インデックスをリセット
      this.selectedItemIndex = Math.min(
        this.selectedItemIndex,
        this.getEquipmentItems().length - 1
      );
    } catch (_error) {
      // エラーは無視（UIで処理）
    }
  }

  /**
   * 現在のスロットの装備を解除する
   */
  private unequipCurrentSlot(): void {
    try {
      this.player.equipToSlot(this.currentSlot, null);
    } catch (_error) {
      // エラーは無視（UIで処理）
    }
  }

  /**
   * 装備可能なアイテムを取得する
   */
  private getEquipmentItems(): EquipmentItem[] {
    const allItems = this.player.getInventory().getItems();
    return allItems.filter(item => item instanceof EquipmentItem) as EquipmentItem[];
  }

  /**
   * 現在選択されているアイテムを取得する
   */
  private getSelectedItem(): EquipmentItem | null {
    const items = this.getEquipmentItems();
    return items[this.selectedItemIndex] || null;
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
}
