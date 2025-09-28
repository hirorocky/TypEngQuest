import { Phase } from '../core/Phase';
import { PhaseType, CommandResult } from '../core/types';
import { Display } from '../ui/Display';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { Accessory, AccessorySubEffect } from '../items/accessory';
import { TabCompleter } from '../core/completion';
import { EquipmentStatsData } from '../player/EquipmentStats';

/**
 * アクセサリ装備管理フェーズ
 */
export class ItemEquipmentPhase extends Phase {
  private player: Player;
  private currentSlot: number = 0;
  private selectedItemIndex: number = 0;
  private accessoryItems: Accessory[] = [];
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
      const prefix = isSelected ? '→ ' : '  ';
      const suffix = isSelected ? ' ←' : '';

      Display.println(
        `${prefix}${i + 1}. ${item.getDisplayName()} (Grade: ${item.getGrade()})${suffix}`
      );

      if (isSelected) {
        Display.println(`    ${item.getDescription()}`);
        Display.println(
          `    Main Effect: boost ${item.getMainEffect().boost} / penalty ${item.getMainEffect().penalty}`
        );
        Display.println(`    Sub Effects: ${this.formatSubEffects(item.getSubEffects())}`);
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
    if (!selectedItem) {
      return;
    }

    try {
      this.player.equipToSlot(this.currentSlot, selectedItem);
      this.updateAccessoryItems();
      this.selectedItemIndex = Math.min(this.selectedItemIndex, this.accessoryItems.length - 1);
      Display.printInfo(
        `Equipped ${selectedItem.getDisplayName()} to slot ${this.currentSlot + 1}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Display.printWarning(`Equip failed: ${message}`);
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

  private getSelectedItem(): Accessory | null {
    return this.accessoryItems[this.selectedItemIndex] || null;
  }

  private updateAccessoryItems(): void {
    this.accessoryItems = this.player.getAccessoryInventory().getItems();

    if (this.selectedItemIndex >= this.accessoryItems.length) {
      this.selectedItemIndex = Math.max(0, this.accessoryItems.length - 1);
    }
  }

  private formatSubEffects(subEffects: AccessorySubEffect[]): string {
    return subEffects.map(effect => effect.name).join(', ');
  }

  private formatEquipmentStats(stats: EquipmentStatsData): string {
    return `STR ${stats.strength} / WIL ${stats.willpower} / AGI ${stats.agility} / LUK ${stats.fortune}`;
  }
}
