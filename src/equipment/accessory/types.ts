export type AccessoryStat = 'strength' | 'willpower' | 'agility' | 'fortune';

export interface AccessoryMainEffect {
  boost: AccessoryStat;
  penalty: AccessoryStat;
}

export interface AccessoryEffectSlot {
  id: string;
  effectType: string;
  label: string;
  magnitude: number;
  description?: string;
}

export interface AccessorySnapshot {
  id: string;
  archetypeId: string;
  displayName: string;
  itemType: string;
  grade: number;
  mainEffect: AccessoryMainEffect;
  subEffects: AccessoryEffectSlot[];
  highlightEffectId?: string;
}

export interface AccessoryDefinition {
  id: string;
  archetypeId: string;
  displayName: string;
  itemType: string;
  mainEffect: AccessoryMainEffect;
  highlightEffectId?: string;
  defaultSubEffects: AccessoryEffectSlot[];
}

export interface AccessoryCatalogData {
  archetypes: AccessoryDefinition[];
}

export interface AccessoryGradeBreakpoint {
  grade: number;
  boostMultiplier: number;
  penaltyMultiplier: number;
  signatureBonus?: number;
}

export interface AccessoryGradeProfile {
  breakpoints: AccessoryGradeBreakpoint[];
}

export interface AggregatedAccessoryEffects {
  boost: Record<AccessoryStat, number>;
  penalty: Record<AccessoryStat, number>;
  signatureBonus: number;
  subEffects: AccessoryEffectSlot[];
}
