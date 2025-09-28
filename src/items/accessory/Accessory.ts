import { InventoryItem, ItemType, validateItemIdentity } from '../types';
import { AccessoryGradeTable, defaultAccessoryGradeTable } from './gradeTable';
import {
  AccessoryItemData,
  AccessoryMainEffect,
  AccessorySnapshot,
  AccessoryStat,
  AccessorySubEffect,
  AggregatedAccessoryEffects,
} from './types';

const SUB_EFFECT_SLOT_CAP = 3;

type StatMap = Record<AccessoryStat, number>;

const ZERO_STAT_MAP: StatMap = {
  strength: 0,
  willpower: 0,
  agility: 0,
  fortune: 0,
};

interface AccessoryOptions {
  itemId?: string;
  itemName?: string;
  description?: string;
}

export class Accessory implements InventoryItem {
  private readonly itemId: string;
  private readonly itemName: string;
  private readonly description: string;
  private readonly definitionId: string;
  private readonly baseName: string;
  private grade: number;
  private readonly mainEffect: AccessoryMainEffect;
  private subEffects: AccessorySubEffect[];
  private readonly gradeTable: AccessoryGradeTable;

  constructor(
    snapshot: AccessorySnapshot,
    gradeTable: AccessoryGradeTable = defaultAccessoryGradeTable,
    options: AccessoryOptions = {}
  ) {
    Accessory.assertSnapshot(snapshot);

    this.definitionId = snapshot.id;
    this.baseName = snapshot.name;
    this.itemId = options.itemId ?? snapshot.id;
    this.itemName = options.itemName ?? snapshot.name;
    this.description = options.description ?? '';

    validateItemIdentity({ id: this.itemId, name: this.itemName });

    this.grade = snapshot.grade;
    this.mainEffect = { ...snapshot.mainEffect };
    this.subEffects = snapshot.subEffects.map(effect => ({ ...effect }));
    this.gradeTable = gradeTable;

    this.assertValidGrade(this.grade);
    this.assertValidSubEffects(this.subEffects);
  }

  static fromJSON(
    data: AccessoryItemData,
    gradeTable: AccessoryGradeTable = defaultAccessoryGradeTable
  ): Accessory {
    Accessory.validateItemData(data);
    return new Accessory(Accessory.cloneSnapshot(data.accessory), gradeTable, {
      itemId: data.id,
      itemName: data.name,
      description: data.description,
    });
  }

  getId(): string {
    return this.itemId;
  }

  getDefinitionId(): string {
    return this.definitionId;
  }

  getMainEffectId(): string {
    return this.mainEffect.id;
  }

  hasSameMainEffect(other: Accessory): boolean {
    return (
      this.mainEffect.boost === other.mainEffect.boost &&
      this.mainEffect.penalty === other.mainEffect.penalty
    );
  }

  getGrade(): number {
    return this.grade;
  }

  getName(): string {
    return this.getDisplayName();
  }

  getBaseName(): string {
    return this.baseName;
  }

  getDescription(): string {
    return this.description;
  }

  getType(): ItemType {
    return ItemType.ACCESSORY;
  }

  getDisplayName(): string {
    const subEffectNames = this.subEffects
      .slice(0, 3)
      .map(effect => effect.name)
      .filter((name): name is string => Boolean(name && name.trim()));

    const segments: string[] = [];

    if (subEffectNames.length > 0) {
      segments.push(subEffectNames.join(' '));
    }

    segments.push(this.baseName);
    segments.push(`G${this.grade}`);

    return segments.join(' ');
  }

  equals(other: InventoryItem): boolean {
    return this.getId() === other.getId();
  }

  getMainEffect(): AccessoryMainEffect {
    return { ...this.mainEffect };
  }

  getSubEffects(): AccessorySubEffect[] {
    return this.subEffects.map(effect => ({ ...effect }));
  }

  getAggregatedEffect(baseStats: StatMap): AggregatedAccessoryEffects {
    const multipliers = this.gradeTable.getMultipliers(this.grade);
    const boostMap: StatMap = { ...ZERO_STAT_MAP };
    const penaltyMap: StatMap = { ...ZERO_STAT_MAP };

    boostMap[this.mainEffect.boost] = Math.floor(baseStats[this.mainEffect.boost] * multipliers.boost);
    penaltyMap[this.mainEffect.penalty] = Math.floor(
      baseStats[this.mainEffect.penalty] * Math.abs(multipliers.penalty)
    );

    return {
      boost: boostMap,
      penalty: penaltyMap,
      signatureBonus: multipliers.signatureBonus,
      subEffects: this.getSubEffects(),
    };
  }

  updateGrade(newGrade: number): void {
    this.assertValidGrade(newGrade);
    this.grade = newGrade;
  }

  updateSubEffects(newSubEffects: AccessorySubEffect[]): void {
    this.assertValidSubEffects(newSubEffects);
    this.subEffects = newSubEffects.map(effect => ({ ...effect }));
  }

  toSnapshot(): AccessorySnapshot {
    return {
      id: this.definitionId,
      name: this.baseName,
      grade: this.grade,
      mainEffect: { ...this.mainEffect },
      subEffects: this.getSubEffects(),
    };
  }

  toJSON(): AccessoryItemData {
    return {
      id: this.itemId,
      name: this.itemName,
      description: this.description,
      type: ItemType.ACCESSORY,
      accessory: this.toSnapshot(),
    };
  }

  private static validateItemData(data: AccessoryItemData): void {
    if (data.type !== ItemType.ACCESSORY) {
      throw new Error('Accessory item must have type "accessory"');
    }
    validateItemIdentity({ id: data.id, name: data.name });
    Accessory.assertSnapshot(data.accessory);
  }

  private static assertSnapshot(snapshot: AccessorySnapshot): void {
    if (typeof snapshot !== 'object' || snapshot === null) {
      throw new Error('Accessory item requires accessory snapshot data');
    }
    Accessory.assertNonEmptyString(snapshot.id, 'id');
    Accessory.assertNonEmptyString(snapshot.name, 'name');
    Accessory.assertValidGradeValue(snapshot.grade);
    Accessory.assertMainEffect(snapshot.mainEffect);
    Accessory.assertSubEffects(snapshot.subEffects);
  }

  private static assertNonEmptyString(value: unknown, field: string): void {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`Accessory snapshot requires ${field}`);
    }
  }

  private static assertValidGradeValue(value: unknown): void {
    if (typeof value !== 'number') {
      throw new Error('Accessory snapshot requires grade');
    }
  }

  private static assertMainEffect(mainEffect: AccessorySnapshot['mainEffect']): void {
    if (!mainEffect) {
      throw new Error('Accessory snapshot requires mainEffect');
    }
    if (typeof mainEffect.id !== 'string' || mainEffect.id.trim() === '') {
      throw new Error('Accessory mainEffect requires id');
    }
    if (!mainEffect.boost || !mainEffect.penalty) {
      throw new Error('Accessory mainEffect requires boost and penalty stats');
    }
  }

  private static assertSubEffects(subEffects: AccessorySnapshot['subEffects']): void {
    if (!Array.isArray(subEffects)) {
      throw new Error('Accessory snapshot requires subEffects array');
    }
    if (subEffects.length > SUB_EFFECT_SLOT_CAP) {
      throw new Error('Accessory item cannot exceed three sub effects');
    }
  }

  private static cloneSnapshot(snapshot: AccessorySnapshot): AccessorySnapshot {
    return {
      id: snapshot.id,
      name: snapshot.name,
      grade: snapshot.grade,
      mainEffect: { ...snapshot.mainEffect },
      subEffects: snapshot.subEffects.map(effect => ({ ...effect })),
    };
  }

  private assertValidGrade(value: number): void {
    if (!Number.isInteger(value)) {
      throw new Error('Accessory grade must be an integer');
    }

    if (value < this.gradeTable.getMinGrade() || value > this.gradeTable.getMaxGrade()) {
      throw new Error(
        `Accessory grade must be between ${this.gradeTable.getMinGrade()} and ${this.gradeTable.getMaxGrade()}`
      );
    }
  }

  private assertValidSubEffects(effects: AccessorySubEffect[]): void {
    if (effects.length > SUB_EFFECT_SLOT_CAP) {
      throw new Error(`Accessory cannot exceed ${SUB_EFFECT_SLOT_CAP} sub effects`);
    }
  }
}
