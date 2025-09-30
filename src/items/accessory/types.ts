export type AccessoryStat = 'strength' | 'willpower' | 'agility' | 'fortune';

export interface AccessoryMainEffect {
  id: string;
  name: string;
  boost: AccessoryStat;
  penalty: AccessoryStat;
}

export interface AccessorySubEffect {
  id: string;
  effectType: string;
  name: string;
  magnitude: number;
  description?: string;
}

export interface AccessorySnapshot {
  grade: number;
  mainEffect: AccessoryMainEffect;
  subEffects: AccessorySubEffect[];
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
  subEffects: AccessorySubEffect[];
}
