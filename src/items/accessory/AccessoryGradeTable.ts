import { AccessoryGradeBreakpoint, AccessoryGradeProfile } from './types';

const DEFAULT_BREAKPOINTS: AccessoryGradeBreakpoint[] = [
  { grade: 1, boostMultiplier: 0.08, penaltyMultiplier: -0.12, signatureBonus: 0 },
  { grade: 25, boostMultiplier: 0.18, penaltyMultiplier: -0.06, signatureBonus: 0 },
  { grade: 50, boostMultiplier: 0.24, penaltyMultiplier: -0.03, signatureBonus: 0 },
  { grade: 75, boostMultiplier: 0.3, penaltyMultiplier: -0.01, signatureBonus: 0.05 },
  { grade: 100, boostMultiplier: 0.35, penaltyMultiplier: 0, signatureBonus: 0.1 },
];

export class AccessoryGradeTable {
  private readonly profile: AccessoryGradeProfile;

  constructor(profile: AccessoryGradeProfile = { breakpoints: DEFAULT_BREAKPOINTS }) {
    if (profile.breakpoints.length === 0) {
      throw new Error('Grade profile must include at least one breakpoint');
    }
    this.profile = {
      breakpoints: [...profile.breakpoints].sort((a, b) => a.grade - b.grade),
    };
  }

  getMinGrade(): number {
    return this.profile.breakpoints[0].grade;
  }

  getMaxGrade(): number {
    return this.profile.breakpoints[this.profile.breakpoints.length - 1].grade;
  }

  getMultipliers(grade: number): { boost: number; penalty: number; signatureBonus: number } {
    if (grade < this.getMinGrade() || grade > this.getMaxGrade()) {
      throw new Error(`Grade ${grade} is out of bounds (${this.getMinGrade()}-${this.getMaxGrade()})`);
    }

    const exactMatch = this.profile.breakpoints.find(bp => bp.grade === grade);
    if (exactMatch) {
      return {
        boost: exactMatch.boostMultiplier,
        penalty: exactMatch.penaltyMultiplier,
        signatureBonus: exactMatch.signatureBonus ?? 0,
      };
    }

    const lower = this.getLowerBreakpoint(grade);
    const upper = this.getUpperBreakpoint(grade);

    if (!lower || !upper) {
      throw new Error(`Unable to resolve breakpoints for grade ${grade}`);
    }

    const ratio = (grade - lower.grade) / (upper.grade - lower.grade);

    const boost = this.interpolate(lower.boostMultiplier, upper.boostMultiplier, ratio);
    const penalty = this.interpolate(lower.penaltyMultiplier, upper.penaltyMultiplier, ratio);
    const signatureBonus = this.interpolate(
      lower.signatureBonus ?? 0,
      upper.signatureBonus ?? 0,
      ratio
    );

    return { boost, penalty, signatureBonus };
  }

  private getLowerBreakpoint(grade: number): AccessoryGradeBreakpoint | undefined {
    return [...this.profile.breakpoints]
      .reverse()
      .find(bp => bp.grade < grade);
  }

  private getUpperBreakpoint(grade: number): AccessoryGradeBreakpoint | undefined {
    return this.profile.breakpoints.find(bp => bp.grade > grade);
  }

  private interpolate(start: number, end: number, ratio: number): number {
    return start + (end - start) * ratio;
  }
}

export const defaultAccessoryGradeTable = new AccessoryGradeTable();
