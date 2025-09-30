import { validateItemIdentity } from '../types';
import { AccessoryGradeTable, defaultAccessoryGradeTable } from './gradeTable';
import {
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
}

export class Accessory {
  private readonly itemId: string;
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

    this.baseName = snapshot.name;
    this.itemId = options.itemId ?? snapshot.id;

    validateItemIdentity({ id: this.itemId, name: this.baseName });

    this.grade = snapshot.grade;
    this.mainEffect = { ...snapshot.mainEffect };
    this.subEffects = snapshot.subEffects.map(effect => ({ ...effect }));
    this.gradeTable = gradeTable;

    this.assertValidGrade(this.grade);
    this.assertValidSubEffects(this.subEffects);
  }

  static fromJSON(
    data: AccessorySnapshot & { itemId?: string },
    gradeTable: AccessoryGradeTable = defaultAccessoryGradeTable
  ): Accessory {
    Accessory.assertSnapshot(data);
    return new Accessory(Accessory.cloneSnapshot(data), gradeTable, {
      itemId: data.itemId,
    });
  }

  getId(): string {
    return this.itemId;
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

  getBaseName(): string {
    return this.baseName;
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

  equals(other: Accessory): boolean {
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

  toJSON(): AccessorySnapshot & { itemId: string } {
    return {
      itemId: this.itemId,
      id: this.mainEffect.id,
      name: this.baseName,
      grade: this.grade,
      mainEffect: { ...this.mainEffect },
      subEffects: this.getSubEffects(),
    };
  }

  private static assertSnapshot(snapshot: unknown): asserts snapshot is AccessorySnapshot {
    if (typeof snapshot !== 'object' || snapshot === null) {
      throw new Error('Accessory item requires accessory snapshot data');
    }
    const partial = snapshot as Partial<AccessorySnapshot>;
    Accessory.assertNonEmptyString(partial.id, 'id');
    Accessory.assertNonEmptyString(partial.name, 'name');
    Accessory.assertValidGradeValue(partial.grade);
    Accessory.assertMainEffect(partial.mainEffect);
    Accessory.assertSubEffects(partial.subEffects);
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

  private static assertMainEffect(mainEffect: AccessoryMainEffect | undefined): void {
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

  private static assertSubEffects(subEffects: AccessorySubEffect[] | undefined): void {
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
