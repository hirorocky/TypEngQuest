import { AccessoryGradeTable, defaultAccessoryGradeTable } from './gradeTable';
import {
  AccessorySubEffect,
  AccessoryMainEffect,
  AccessorySnapshot,
  AccessoryStat,
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

export class Accessory {
  private readonly id: string;
  private readonly name: string;
  private grade: number;
  private readonly mainEffect: AccessoryMainEffect;
  private subEffects: AccessorySubEffect[];
  private readonly gradeTable: AccessoryGradeTable;

  constructor(snapshot: AccessorySnapshot, gradeTable: AccessoryGradeTable = defaultAccessoryGradeTable) {
    this.id = snapshot.id;
    this.name = snapshot.name;
    this.grade = snapshot.grade;
    this.mainEffect = snapshot.mainEffect;
    this.subEffects = [...snapshot.subEffects];
    this.gradeTable = gradeTable;

    this.assertValidGrade(this.grade);
    this.assertValidSubEffects(this.subEffects);
  }

  getId(): string {
    return this.id;
  }

  getMainEffectId(): string {
    return this.mainEffect.id;
  }

  getGrade(): number {
    return this.grade;
  }

  getName(): string {
    return this.name;
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
      id: this.id,
      name: this.name,
      grade: this.grade,
      mainEffect: { ...this.mainEffect },
      subEffects: this.getSubEffects(),
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
