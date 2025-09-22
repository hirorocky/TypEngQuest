import { AccessoryGradeTable, defaultAccessoryGradeTable } from './gradeTable';
import {
  AccessoryEffectSlot,
  AccessoryMainEffect,
  AccessorySnapshot,
  AccessoryStat,
  AggregatedAccessoryEffects,
} from './types';

const SUB_EFFECT_SLOT_COUNT = 3;

type StatMap = Record<AccessoryStat, number>;

const ZERO_STAT_MAP: StatMap = {
  strength: 0,
  willpower: 0,
  agility: 0,
  fortune: 0,
};

export class Accessory {
  private readonly id: string;
  private readonly archetypeId: string;
  private readonly displayName: string;
  private readonly itemType: string;
  private grade: number;
  private readonly mainEffect: AccessoryMainEffect;
  private subEffects: AccessoryEffectSlot[];
  private readonly gradeTable: AccessoryGradeTable;
  private readonly highlightEffectId?: string;

  constructor(snapshot: AccessorySnapshot, gradeTable: AccessoryGradeTable = defaultAccessoryGradeTable) {
    this.id = snapshot.id;
    this.archetypeId = snapshot.archetypeId;
    this.displayName = snapshot.displayName;
    this.itemType = snapshot.itemType;
    this.grade = snapshot.grade;
    this.mainEffect = snapshot.mainEffect;
    this.subEffects = [...snapshot.subEffects];
    this.highlightEffectId = snapshot.highlightEffectId;
    this.gradeTable = gradeTable;

    this.assertValidGrade(this.grade);
    this.assertValidSubEffects(this.subEffects);
  }

  getId(): string {
    return this.id;
  }

  getArchetypeId(): string {
    return this.archetypeId;
  }

  getGrade(): number {
    return this.grade;
  }

  getDisplayName(): string {
    return this.displayName;
  }

  getItemType(): string {
    return this.itemType;
  }

  getMainEffect(): AccessoryMainEffect {
    return { ...this.mainEffect };
  }

  getSubEffects(): AccessoryEffectSlot[] {
    return this.subEffects.map(effect => ({ ...effect }));
  }

  getHighlightEffectId(): string | undefined {
    return this.highlightEffectId;
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

  updateSubEffects(newSubEffects: AccessoryEffectSlot[]): void {
    this.assertValidSubEffects(newSubEffects);
    this.subEffects = newSubEffects.map(effect => ({ ...effect }));
  }

  toSnapshot(): AccessorySnapshot {
    return {
      id: this.id,
      archetypeId: this.archetypeId,
      displayName: this.displayName,
      itemType: this.itemType,
      grade: this.grade,
      mainEffect: { ...this.mainEffect },
      subEffects: this.getSubEffects(),
      highlightEffectId: this.highlightEffectId,
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

  private assertValidSubEffects(effects: AccessoryEffectSlot[]): void {
    if (effects.length !== SUB_EFFECT_SLOT_COUNT) {
      throw new Error(`Accessory must have exactly ${SUB_EFFECT_SLOT_COUNT} sub effects`);
    }
  }
}
