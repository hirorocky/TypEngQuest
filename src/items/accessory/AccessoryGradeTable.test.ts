import { AccessoryGradeTable } from './AccessoryGradeTable';

describe('AccessoryGradeTable', () => {
  it('returns exact breakpoint multipliers', () => {
    const table = new AccessoryGradeTable();
    expect(table.getMultipliers(1)).toEqual({ boost: 0.08, penalty: -0.12, signatureBonus: 0 });
    expect(table.getMultipliers(100)).toEqual({ boost: 0.35, penalty: 0, signatureBonus: 0.1 });
  });

  it('interpolates between breakpoints', () => {
    const table = new AccessoryGradeTable();
    const mid = table.getMultipliers(50);
    expect(mid.boost).toBeCloseTo(0.24, 2);
    expect(mid.penalty).toBeCloseTo(-0.03, 2);
    expect(mid.signatureBonus).toBeCloseTo(0, 5);

    const nearUpper = table.getMultipliers(88);
    expect(nearUpper.boost).toBeGreaterThan(0.3);
    expect(nearUpper.boost).toBeLessThan(0.35);
    expect(nearUpper.signatureBonus).toBeGreaterThan(0.05);
  });

  it('throws for out of range grades', () => {
    const table = new AccessoryGradeTable();
    expect(() => table.getMultipliers(0)).toThrow('Grade 0 is out of bounds');
    expect(() => table.getMultipliers(101)).toThrow();
  });
});
