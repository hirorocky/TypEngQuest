import { Phase } from '../core/Phase';
import { PhaseType, CommandResult } from '../core/types';
import { Display } from '../ui/Display';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { Accessory, AccessorySubEffect } from '../items/accessory';
import { TabCompleter } from '../core/completion';
import { EquipmentStatsData } from '../player/EquipmentStats';

type SynthesisMode = 'manage' | 'selectBase' | 'selectMaterial' | 'selectEffects' | 'result';

const MAX_SYNTHESIS_SELECTION = 3;

type StatusMessageVariant = 'info' | 'success' | 'warning' | 'error';

interface StatusMessage {
  variant: StatusMessageVariant;
  text: string;
}

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
  private mode: SynthesisMode = 'manage';
  private synthesisBaseCandidates: Accessory[] = [];
  private synthesisMaterialCandidates: Accessory[] = [];
  private synthesisEffectPool: AccessorySubEffect[] = [];
  private synthesisSelectedEffectIndices: number[] = [];
  private synthesisBaseIndex: number = 0;
  private synthesisMaterialIndex: number = 0;
  private synthesisEffectIndex: number = 0;
  private synthesisBaseAccessory: Accessory | null = null;
  private synthesisMaterialAccessory: Accessory | null = null;
  private synthesisResultAccessory: Accessory | null = null;
  private statusMessage: StatusMessage | null = null;

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
    if (this.mode !== 'manage') {
      return this.processSynthesisInput(key);
    }

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
      case 's':
      case 'S':
        this.startSynthesisFlow();
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

  private startSynthesisFlow(): void {
    this.clearStatusMessage();
    const candidates = this.buildSynthesisBaseCandidates();
    if (candidates.length === 0) {
      this.showStatusMessage(
        'warning',
        'synthesis requires at least two accessories sharing the same main effect'
      );
      return;
    }

    this.mode = 'selectBase';
    this.synthesisBaseCandidates = candidates;
    this.synthesisMaterialCandidates = [];
    this.synthesisEffectPool = [];
    this.synthesisSelectedEffectIndices = [];
    this.synthesisBaseIndex = 0;
    this.synthesisMaterialIndex = 0;
    this.synthesisEffectIndex = 0;
    this.synthesisBaseAccessory = null;
    this.synthesisMaterialAccessory = null;
    this.synthesisResultAccessory = null;
  }

  private processSynthesisInput(key: string): CommandResult | null {
    if (key === 'q' || key === 'Q' || key === '\u0003') {
      this.exitSynthesisFlow();
      return null;
    }

    switch (this.mode) {
      case 'selectBase':
        return this.handleSynthesisBaseInput(key);
      case 'selectMaterial':
        return this.handleSynthesisMaterialInput(key);
      case 'selectEffects':
        return this.handleSynthesisEffectInput(key);
      case 'result':
        return this.handleSynthesisResultInput(key);
      default:
        return null;
    }
  }

  private handleSynthesisBaseInput(key: string): CommandResult | null {
    if (this.synthesisBaseCandidates.length === 0) {
      this.exitSynthesisFlow();
      return null;
    }

    switch (key) {
      case '\u001b[A':
        this.synthesisBaseIndex = Math.max(0, this.synthesisBaseIndex - 1);
        return null;
      case '\u001b[B':
        this.synthesisBaseIndex = Math.min(
          this.synthesisBaseCandidates.length - 1,
          this.synthesisBaseIndex + 1
        );
        return null;
      case ' ':
      case '\r': {
        this.synthesisBaseIndex = Math.min(
          this.synthesisBaseIndex,
          this.synthesisBaseCandidates.length - 1
        );
        const base = this.synthesisBaseCandidates[this.synthesisBaseIndex];
        if (!base) {
          this.showStatusMessage('warning', 'no base accessory selected');
          return null;
        }
        const materials = this.buildMaterialCandidates(base);
        if (materials.length === 0) {
          this.showStatusMessage('warning', 'no matching accessory available for synthesis');
          return null;
        }
        this.clearStatusMessage();
        this.synthesisBaseAccessory = base;
        this.synthesisMaterialCandidates = materials;
        this.synthesisMaterialIndex = 0;
        this.mode = 'selectMaterial';
        return null;
      }
      default:
        return null;
    }
  }

  private handleSynthesisMaterialInput(key: string): CommandResult | null {
    if (!this.synthesisBaseAccessory || this.synthesisMaterialCandidates.length === 0) {
      this.mode = 'selectBase';
      return null;
    }

    if (key === '\u001b[A') {
      this.adjustMaterialIndex(-1);
      return null;
    }

    if (key === '\u001b[B') {
      this.adjustMaterialIndex(1);
      return null;
    }

    if (key === 'w' || key === 'W') {
      this.mode = 'selectBase';
      this.synthesisMaterialCandidates = [];
      this.synthesisMaterialAccessory = null;
      return null;
    }

    if (key === ' ' || key === '\r') {
      this.confirmMaterialSelection();
      return null;
    }

    return null;
  }

  private handleSynthesisEffectInput(key: string): CommandResult | null {
    if (!this.synthesisBaseAccessory || !this.synthesisMaterialAccessory) {
      this.mode = 'selectBase';
      return null;
    }

    const handlers: Record<string, () => void> = {
      '\u001b[A': () => this.adjustEffectIndex(-1),
      '\u001b[B': () => this.adjustEffectIndex(1),
      w: () => this.returnToMaterialSelection(),
      W: () => this.returnToMaterialSelection(),
      ' ': () => this.toggleCurrentEffectSelection(),
      s: () => this.completeSynthesis(),
      S: () => this.completeSynthesis(),
      '\r': () => this.completeSynthesis(),
    };

    const handler = handlers[key];
    if (handler) {
      handler();
    }

    return null;
  }

  private handleSynthesisResultInput(key: string): CommandResult | null {
    switch (key) {
      case ' ':
      case '\r':
      case 's':
      case 'S':
        this.exitSynthesisFlow();
        return null;
      default:
        return null;
    }
  }

  private exitSynthesisFlow(): void {
    this.mode = 'manage';
    this.synthesisBaseCandidates = [];
    this.synthesisMaterialCandidates = [];
    this.synthesisEffectPool = [];
    this.synthesisSelectedEffectIndices = [];
    this.synthesisBaseIndex = 0;
    this.synthesisMaterialIndex = 0;
    this.synthesisEffectIndex = 0;
    this.synthesisBaseAccessory = null;
    this.synthesisMaterialAccessory = null;
    this.synthesisResultAccessory = null;
  }

  private buildSynthesisBaseCandidates(): Accessory[] {
    const counts = new Map<string, number>();
    this.accessoryItems.forEach(item => {
      const key = this.getMainEffectKey(item);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return this.accessoryItems.filter(item => (counts.get(this.getMainEffectKey(item)) ?? 0) > 1);
  }

  private buildMaterialCandidates(base: Accessory): Accessory[] {
    return this.accessoryItems.filter(item => item !== base && base.hasSameMainEffect(item));
  }

  private adjustMaterialIndex(delta: number): void {
    if (this.synthesisMaterialCandidates.length === 0) {
      return;
    }

    const maxIndex = this.synthesisMaterialCandidates.length - 1;
    const nextIndex = this.synthesisMaterialIndex + delta;
    this.synthesisMaterialIndex = Math.min(maxIndex, Math.max(0, nextIndex));
  }

  private confirmMaterialSelection(): void {
    if (!this.synthesisBaseAccessory) {
      this.mode = 'selectBase';
      return;
    }

    if (this.synthesisMaterialCandidates.length === 0) {
      this.showStatusMessage('warning', 'no material accessory selected');
      return;
    }

    const maxIndex = this.synthesisMaterialCandidates.length - 1;
    this.synthesisMaterialIndex = Math.min(this.synthesisMaterialIndex, maxIndex);
    const material = this.synthesisMaterialCandidates[this.synthesisMaterialIndex];
    if (!material) {
      this.showStatusMessage('warning', 'no material accessory selected');
      return;
    }

    try {
      this.synthesisMaterialAccessory = material;
      this.synthesisEffectPool = this.player.getAccessorySynthesisPool(
        this.synthesisBaseAccessory,
        material
      );
      this.synthesisEffectIndex = 0;
      this.synthesisSelectedEffectIndices = [];
      this.mode = 'selectEffects';
      this.clearStatusMessage();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.showStatusMessage('error', `Synthesis setup failed: ${message}`);
    }
  }

  private adjustEffectIndex(delta: number): void {
    if (this.synthesisEffectPool.length === 0) {
      return;
    }

    const maxIndex = this.synthesisEffectPool.length - 1;
    const nextIndex = this.synthesisEffectIndex + delta;
    this.synthesisEffectIndex = Math.min(maxIndex, Math.max(0, nextIndex));
  }

  private toggleCurrentEffectSelection(): void {
    if (this.synthesisEffectPool.length === 0) {
      return;
    }

    this.toggleEffectSelection(this.synthesisEffectIndex);
  }

  private returnToMaterialSelection(): void {
    this.mode = 'selectMaterial';
    this.synthesisSelectedEffectIndices = [];
  }

  private toggleEffectSelection(index: number): void {
    if (this.synthesisSelectedEffectIndices.includes(index)) {
      this.synthesisSelectedEffectIndices = this.synthesisSelectedEffectIndices.filter(
        candidate => candidate !== index
      );
      return;
    }

    if (this.synthesisSelectedEffectIndices.length >= MAX_SYNTHESIS_SELECTION) {
      this.showStatusMessage(
        'warning',
        `cannot select more than ${MAX_SYNTHESIS_SELECTION} sub effects`
      );
      return;
    }

    this.synthesisSelectedEffectIndices = [...this.synthesisSelectedEffectIndices, index];
  }

  private completeSynthesis(): void {
    if (!this.synthesisBaseAccessory || !this.synthesisMaterialAccessory) {
      this.showStatusMessage('warning', 'synthesis requires both base and material accessories');
      return;
    }

    try {
      const selectedEffects = this.synthesisSelectedEffectIndices
        .sort((a, b) => a - b)
        .map(idx => this.synthesisEffectPool[idx])
        .filter((effect): effect is AccessorySubEffect => Boolean(effect))
        .map(effect => ({ ...effect }));

      const result = this.player.synthesizeAccessories(
        this.synthesisBaseAccessory,
        this.synthesisMaterialAccessory,
        selectedEffects
      );

      this.synthesisResultAccessory = result;
      this.updateAccessoryItems();

      const resultIndex = this.accessoryItems.indexOf(result);
      this.selectedItemIndex = resultIndex >= 0 ? resultIndex : 0;

      this.mode = 'result';
      this.clearStatusMessage();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.showStatusMessage('error', `Synthesis failed: ${message}`);
    }
  }

  private render(): void {
    Display.clear();
    Display.printHeader('Accessory Management');
    Display.newLine();
    this.renderStatusMessage();

    switch (this.mode) {
      case 'manage':
        this.renderEquipmentSlots();
        Display.newLine();
        this.renderInventoryAccessories();
        Display.newLine();
        this.renderStatusSummary();
        Display.newLine();
        this.renderControls();
        Display.newLine();
        break;
      case 'selectBase':
        this.renderSynthesisBaseSelection();
        break;
      case 'selectMaterial':
        this.renderSynthesisMaterialSelection();
        break;
      case 'selectEffects':
        this.renderSynthesisEffectSelection();
        break;
      case 'result':
        this.renderSynthesisResult();
        break;
      default:
        this.mode = 'manage';
        break;
    }
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
        Display.println(
          `    Main Effect: boost ${item.getMainEffect().boost} / penalty ${item.getMainEffect().penalty}`
        );
        Display.println(`    Sub Effects: ${this.formatSubEffects(item.getSubEffects())}`);
      }
    }
  }

  private renderSynthesisBaseSelection(): void {
    Display.printInfo('Accessory synthesis: select base accessory');
    Display.newLine();

    if (this.synthesisBaseCandidates.length === 0) {
      Display.println('  No valid accessories. Press q to cancel.');
      Display.newLine();
      Display.printInfo('Controls:');
      Display.println('  q      : Cancel synthesis');
      return;
    }

    this.synthesisBaseCandidates.forEach((item, index) => {
      const isSelected = index === this.synthesisBaseIndex;
      const prefix = isSelected ? '→ ' : '  ';
      const suffix = isSelected ? ' ←' : '';
      Display.println(`${prefix}${item.getDisplayName()} (Grade: ${item.getGrade()})${suffix}`);
      Display.println(`    Sub Effects: ${this.formatSubEffects(item.getSubEffects())}`);
    });

    Display.newLine();
    Display.printInfo('Controls:');
    Display.println('  ↑ ↓   : Select accessory');
    Display.println('  space/enter : Confirm base');
    Display.println('  q      : Cancel synthesis');
  }

  private renderSynthesisMaterialSelection(): void {
    if (!this.synthesisBaseAccessory) {
      this.renderSynthesisBaseSelection();
      return;
    }

    Display.printInfo('Accessory synthesis: select material accessory');
    Display.println(
      `Base: ${this.synthesisBaseAccessory.getDisplayName()} (Grade: ${this.synthesisBaseAccessory.getGrade()})`
    );
    Display.println(
      `  Sub Effects: ${this.formatSubEffects(this.synthesisBaseAccessory.getSubEffects())}`
    );
    Display.newLine();

    if (this.synthesisMaterialCandidates.length === 0) {
      Display.println('  No matching accessories. Press w to go back.');
      Display.newLine();
      Display.printInfo('Controls:');
      Display.println('  w      : Back to base selection');
      Display.println('  q      : Cancel synthesis');
      return;
    }

    this.synthesisMaterialCandidates.forEach((item, index) => {
      const isSelected = index === this.synthesisMaterialIndex;
      const prefix = isSelected ? '→ ' : '  ';
      const suffix = isSelected ? ' ←' : '';
      Display.println(`${prefix}${item.getDisplayName()} (Grade: ${item.getGrade()})${suffix}`);
      Display.println(`    Sub Effects: ${this.formatSubEffects(item.getSubEffects())}`);
    });

    Display.newLine();
    Display.printInfo('Controls:');
    Display.println('  ↑ ↓   : Select accessory');
    Display.println('  space/enter : Confirm material');
    Display.println('  w      : Back to base selection');
    Display.println('  q      : Cancel synthesis');
  }

  private renderSynthesisEffectSelection(): void {
    if (!this.synthesisBaseAccessory || !this.synthesisMaterialAccessory) {
      this.renderSynthesisBaseSelection();
      return;
    }

    Display.printInfo('Accessory synthesis: choose sub effects (0-3)');
    Display.println(
      `Base    : ${this.synthesisBaseAccessory.getDisplayName()} (Grade: ${this.synthesisBaseAccessory.getGrade()})`
    );
    Display.println(
      `Material: ${this.synthesisMaterialAccessory.getDisplayName()} (Grade: ${this.synthesisMaterialAccessory.getGrade()})`
    );
    Display.newLine();

    if (this.synthesisEffectPool.length === 0) {
      Display.println('  No additional sub effects available. Confirm to keep current effects.');
    } else {
      this.synthesisEffectPool.forEach((effect, index) => {
        const isSelected = this.synthesisSelectedEffectIndices.includes(index);
        const isCursor = index === this.synthesisEffectIndex;
        const cursor = isCursor ? '→' : ' ';
        const checkbox = isSelected ? '[x]' : '[ ]';
        Display.println(` ${cursor} ${checkbox} ${this.describeSubEffect(effect)}`);
      });
    }

    Display.newLine();
    Display.printInfo('Controls:');
    Display.println('  ↑ ↓   : Move cursor');
    Display.println('  space : Toggle selection');
    Display.println('  s/enter : Synthesize accessory');
    Display.println('  w      : Back to material selection');
    Display.println('  q      : Cancel synthesis');
  }

  private describeSubEffect(effect: AccessorySubEffect): string {
    return `${effect.name} (${effect.effectType}: ${effect.magnitude})`;
  }

  private renderSynthesisResult(): void {
    Display.printSuccess('Accessory synthesis complete');
    Display.newLine();

    if (this.synthesisResultAccessory) {
      Display.println(
        `Result : ${this.synthesisResultAccessory.getDisplayName()} (Grade: ${this.synthesisResultAccessory.getGrade()})`
      );
      Display.println(
        `  Sub Effects: ${this.formatSubEffects(this.synthesisResultAccessory.getSubEffects())}`
      );
    } else {
      Display.printWarning('Synthesis result unavailable');
    }

    if (this.synthesisBaseAccessory && this.synthesisMaterialAccessory) {
      Display.newLine();
      Display.println(
        `Consumed base    : ${this.synthesisBaseAccessory.getDisplayName()} (Grade: ${this.synthesisBaseAccessory.getGrade()})`
      );
      Display.println(
        `Consumed material: ${this.synthesisMaterialAccessory.getDisplayName()} (Grade: ${this.synthesisMaterialAccessory.getGrade()})`
      );
    }

    Display.newLine();
    Display.printInfo('Controls:');
    Display.println('  space/enter : Return to accessory management');
    Display.println('  q      : Return to accessory management');
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
    Display.println('  s      : Start accessory synthesis');
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
      this.showStatusMessage(
        'info',
        `Equipped ${selectedItem.getDisplayName()} to slot ${this.currentSlot + 1}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.showStatusMessage('warning', `Equip failed: ${message}`);
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
    if (subEffects.length === 0) {
      return 'none';
    }

    return subEffects.map(effect => effect.name).join(', ');
  }

  private formatEquipmentStats(stats: EquipmentStatsData): string {
    return `STR ${stats.strength} / WIL ${stats.willpower} / AGI ${stats.agility} / LUK ${stats.fortune}`;
  }

  private getMainEffectKey(accessory: Accessory): string {
    const mainEffect = accessory.getMainEffect();
    return `${mainEffect.boost}:${mainEffect.penalty}`;
  }

  private showStatusMessage(variant: StatusMessageVariant, text: string): void {
    this.statusMessage = { variant, text };
  }

  private clearStatusMessage(): void {
    this.statusMessage = null;
  }

  private renderStatusMessage(): void {
    if (!this.statusMessage) {
      return;
    }

    const { variant, text } = this.statusMessage;

    switch (variant) {
      case 'success':
        Display.printSuccess(text);
        break;
      case 'warning':
        Display.printWarning(text);
        break;
      case 'error':
        Display.printError(text);
        break;
      default:
        Display.printInfo(text);
        break;
    }

    Display.newLine();
    this.clearStatusMessage();
  }
}
