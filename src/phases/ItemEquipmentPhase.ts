import { Phase } from '../core/Phase';
import { PhaseType, CommandResult } from '../core/types';
import { Display } from '../ui/Display';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { AccessoryItem } from '../items/AccessoryItem';
import { AccessoryEffectSlot } from '../equipment/accessory';
import { EquipmentGrammarChecker } from '../equipment/EquipmentGrammarChecker';
import { TabCompleter } from '../core/completion';
import { EquipmentStatsData } from '../player/EquipmentStats';

/**
 * アクセサリ装備管理フェーズ
 */
export class ItemEquipmentPhase extends Phase {
  private player: Player;
  private grammarChecker: EquipmentGrammarChecker;
  private currentSlot: number = 0;
  private selectedItemIndex: number = 0;
  private accessoryItems: AccessoryItem[] = [];
  private readonly slotCount: number;
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
    this.slotCount = this.player.getAccessorySlotCount();
    this.updateAccessoryItems();
  }

  getType(): PhaseType {
    return 'itemEquipment';
  }

  getPrompt(): string {
    return 'accessory> ';
  }

  async initialize(): Promise<void> {
    this.render();
  }

  async startInputLoop(): Promise<CommandResult | null> {
    if (process.env.NODE_ENV === 'test' && process.env.DEBUG_UI !== 'true') {
      return {
        success: true,
        message: 'Accessory management completed (test mode)',
        nextPhase: 'inventory',
      };
    }

    this.isActive = true;

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
          this.cleanup().then(() => resolve(result));
        } else {
          this.render();
        }
      };

      process.stdin.on('data', handleKeyInput);

      const cleanup = () => {
        process.stdin.removeListener('data', handleKeyInput);
        if (typeof process.stdin.setRawMode === 'function') {
          process.stdin.setRawMode(false);
        }
        process.stdin.pause();
      };

      const originalResolve = resolve;
      resolve = result => {
        cleanup();
        originalResolve(result);
      };
    });
  }

  private processKeyInput(key: string): CommandResult | null {
    if (this.handleNavigationKeys(key)) return null;
    if (this.handleActionKeys(key)) return null;
    return this.handleExitKeys(key);
  }

  private handleNavigationKeys(key: string): boolean {
    switch (key) {
      case '\t':
        this.currentSlot = (this.currentSlot + 1) % this.slotCount;
        return true;
      case '\u001b[A':
        if (this.accessoryItems.length > 0) {
          this.selectedItemIndex = Math.max(0, this.selectedItemIndex - 1);
        }
        return true;
      case '\u001b[B':
        if (this.accessoryItems.length > 0) {
          this.selectedItemIndex = Math.min(
            this.accessoryItems.length - 1,
            this.selectedItemIndex + 1
          );
        }
        return true;
      default:
        return false;
    }
  }

  private handleActionKeys(key: string): boolean {
    switch (key) {
      case 'e':
      case 'E':
        this.equipSelectedItem();
        return true;
      case 'w':
      case 'W':
        this.unequipCurrentSlot();
        return true;
      default:
        return false;
    }
  }

  private handleExitKeys(key: string): CommandResult | null {
    if (key === 'q' || key === 'Q' || key === '\u0003') {
      this.isActive = false;
      return {
        success: true,
        message: 'Accessory management completed',
        nextPhase: 'inventory',
      };
    }
    return null;
  }

  private render(): void {
    Display.clear();
    Display.printHeader('Accessory Management');
    Display.newLine();

    this.renderEquipmentSlots();
    Display.newLine();
    this.renderInventoryAccessories();
    Display.newLine();
    this.renderStatusSummary();
    Display.newLine();
    this.renderControls();
    Display.newLine();
  }

  private renderEquipmentSlots(): void {
    Display.printInfo('Accessory Slots:');
    const slots = this.player.getEquipmentSlots();

    for (let i = 0; i < slots.length; i++) {
      const isSelected = i === this.currentSlot;
      const accessory = slots[i];
      const prefix = isSelected ? '→ ' : '  ';
      const suffix = isSelected ? ' ←' : '';
      const status = this.player.isAccessorySlotUnlocked(i) ? '' : ' (locked)';
      const displayName = accessory ? accessory.getDisplayName() : '[empty]';
      Display.println(`${prefix}Slot ${i + 1}: ${displayName}${status}${suffix}`);
    }
  }

  private renderInventoryAccessories(): void {
    Display.printInfo('Inventory Accessories:');

    if (this.accessoryItems.length === 0) {
      Display.println('  No accessories available');
      return;
    }

    for (let i = 0; i < this.accessoryItems.length; i++) {
      const isSelected = i === this.selectedItemIndex;
      const item = this.accessoryItems[i];
      const accessory = item.getAccessory();
      const prefix = isSelected ? '→ ' : '  ';
      const suffix = isSelected ? ' ←' : '';
      const rarity = this.getRaritySymbol(item.getRarity());

      Display.println(
        `${prefix}${i + 1}. ${item.getDisplayName()} ${rarity} (Grade: ${accessory.getGrade()})${suffix}`
      );

      if (isSelected) {
        Display.println(`    ${item.getDescription()}`);
        Display.println(
          `    Main Effect: boost ${accessory.getMainEffect().boost} / penalty ${accessory.getMainEffect().penalty}`
        );
        Display.println(`    Sub Effects: ${this.formatSubEffects(accessory.getSubEffects())}`);
        const restriction = this.getEquipRestrictionMessage(item);
        const status = restriction ? `✗ Cannot equip (${restriction})` : '✓ Can equip';
        Display.println(`    Equip Status: ${status}`);
      }
    }
  }

  private renderStatusSummary(): void {
    Display.printInfo('Status Summary:');
    const worldLevel = this.player.getWorldLevel();
    const averageGrade = this.player.getLevel();
    const contribution = this.player.getEquipmentStats().toJSON();
    const totalStats = this.player.getTotalStats();

    Display.println(`  World Level: ${worldLevel}`);
    Display.println(`  Average Grade: ${averageGrade}`);
    Display.println(`  Accessory Contribution: ${this.formatEquipmentStats(contribution)}`);
    Display.println(
      `  Total Stats: STR ${totalStats.strength} / WIL ${totalStats.willpower} / AGI ${totalStats.agility} / LUK ${totalStats.fortune}`
    );

    const grammarResult = this.checkNamingGrammar();
    const grammarLabel = grammarResult.isValid ? '✓ Valid' : '✗ Invalid';
    const prefix = grammarResult.isValid ? '' : '⚠️ ';
    Display.println(`  Naming Grammar: ${prefix}${grammarLabel}`);
    if (!grammarResult.isValid) {
      Display.println(`    ${grammarResult.message}`);
    }
  }

  private renderControls(): void {
    Display.printInfo('Controls:');
    Display.println('  Tab    : Switch accessory slot');
    Display.println('  ↑ ↓   : Select accessory');
    Display.println('  e      : Equip selected accessory');
    Display.println('  w      : Unequip current slot');
    Display.println('  q      : Return to inventory');
  }

  private equipSelectedItem(): void {
    const selectedItem = this.getSelectedItem();
    if (!selectedItem) return;

    if (!this.canEquipItem(selectedItem)) {
      return;
    }

    try {
      this.player.equipToSlot(this.currentSlot, selectedItem);
      this.updateAccessoryItems();
      this.selectedItemIndex = Math.min(this.selectedItemIndex, this.accessoryItems.length - 1);
    } catch (_error) {
      // UI側でメッセージ済みなので握りつぶす
    }
  }

  private unequipCurrentSlot(): void {
    if (!this.player.isAccessorySlotUnlocked(this.currentSlot)) {
      return;
    }

    const slots = this.player.getEquipmentSlots();
    if (!slots[this.currentSlot]) {
      return;
    }

    try {
      this.player.equipToSlot(this.currentSlot, null);
      this.updateAccessoryItems();
    } catch (_error) {
      // noop
    }
  }

  private canEquipItem(item: AccessoryItem): boolean {
    if (!this.player.isAccessorySlotUnlocked(this.currentSlot)) {
      return false;
    }
    return item.getAccessory().getGrade() <= this.player.getWorldLevel();
  }

  private getEquipRestrictionMessage(item: AccessoryItem): string | null {
    if (!this.player.isAccessorySlotUnlocked(this.currentSlot)) {
      return 'slot locked';
    }
    if (item.getAccessory().getGrade() > this.player.getWorldLevel()) {
      return `requires world level ≥ ${item.getAccessory().getGrade()}`;
    }
    return null;
  }

  private checkNamingGrammar(): { isValid: boolean; message: string } {
    const equippedNames = this.player.getEquippedItemNames().filter(name => name !== '');
    if (equippedNames.length === 0) {
      return { isValid: true, message: 'No accessories equipped' };
    }
    return this.grammarChecker.isValidSentence(equippedNames)
      ? { isValid: true, message: 'valid sentence' }
      : { isValid: false, message: this.grammarChecker.getGrammarErrorMessage(equippedNames) };
  }

  private getSelectedItem(): AccessoryItem | null {
    return this.accessoryItems[this.selectedItemIndex] || null;
  }

  private updateAccessoryItems(): void {
    const allItems = this.player.getInventory().getItems();
    this.accessoryItems = allItems.filter(
      (item): item is AccessoryItem => item instanceof AccessoryItem
    );

    if (this.selectedItemIndex >= this.accessoryItems.length) {
      this.selectedItemIndex = Math.max(0, this.accessoryItems.length - 1);
    }
  }

  private getRaritySymbol(rarity: string): string {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return '★';
      case 'epic':
        return '◆';
      case 'rare':
        return '◇';
      default:
        return '';
    }
  }

  private formatSubEffects(subEffects: AccessoryEffectSlot[]): string {
    return subEffects.map(effect => effect.label).join(', ');
  }

  private formatEquipmentStats(stats: EquipmentStatsData): string {
    return `STR ${stats.strength} / WIL ${stats.willpower} / AGI ${stats.agility} / LUK ${stats.fortune}`;
  }
}
