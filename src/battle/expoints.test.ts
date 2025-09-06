import { calculateExPointGain } from './expoints';

describe('EXポイント計算', () => {
  test('難易度5, Fast + Perfect = 20', () => {
    expect(calculateExPointGain(5, 'Fast', 'Perfect')).toBe(20);
  });

  test('難易度3, Normal + Good = 4', () => {
    expect(calculateExPointGain(3, 'Normal', 'Good')).toBe(4);
  });

  test.each(['Perfect', 'Good', 'Poor'] as const)('Miss は常に0 (accuracy: %s)', acc => {
    expect(calculateExPointGain(5, 'Miss', acc)).toBe(0);
  });

  test('Poor の倍率0.5が切り捨てられる', () => {
    // 5 × 1.0 × 0.5 = 2.5 → 2
    expect(calculateExPointGain(5, 'Slow', 'Poor')).toBe(2);
  });
});
