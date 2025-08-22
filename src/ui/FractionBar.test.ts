import { describe, it, expect } from 'vitest';
import { createFractionBar, createDetailedFractionBar } from './FractionBar';

describe('FractionBar', () => {
  describe('createFractionBar', () => {
    it('1/2を5個の■と5個の□で表現する', () => {
      const result = createFractionBar(1, 2);
      expect(result).toBe('■■■■■□□□□□');
    });

    it('3/4を8個の■と2個の□で表現する', () => {
      const result = createFractionBar(3, 4);
      expect(result).toBe('■■■■■■■■□□');
    });

    it('1/10を1個の■と9個の□で表現する', () => {
      const result = createFractionBar(1, 10);
      expect(result).toBe('■□□□□□□□□□');
    });

    it('0/10をすべて□で表現する', () => {
      const result = createFractionBar(0, 10);
      expect(result).toBe('□□□□□□□□□□');
    });

    it('10/10をすべて■で表現する', () => {
      const result = createFractionBar(10, 10);
      expect(result).toBe('■■■■■■■■■■');
    });

    it('5/10を5個の■と5個の□で表現する', () => {
      const result = createFractionBar(5, 10);
      expect(result).toBe('■■■■■□□□□□');
    });

    it('分母が0の場合はエラーを投げる', () => {
      expect(() => createFractionBar(1, 0)).toThrow('分母は0にできません');
    });

    it('負の分子の場合はエラーを投げる', () => {
      expect(() => createFractionBar(-1, 10)).toThrow('負の値は使用できません');
    });

    it('負の分母の場合はエラーを投げる', () => {
      expect(() => createFractionBar(1, -10)).toThrow('負の値は使用できません');
    });

    it('分子が分母より大きい場合は10個すべて■で表現する', () => {
      const result = createFractionBar(15, 10);
      expect(result).toBe('■■■■■■■■■■');
    });
  });

  describe('createDetailedFractionBar', () => {
    it('詳細情報付きで分数バーを表示する', () => {
      const result = createDetailedFractionBar(1, 2);
      expect(result).toBe('■■■■■□□□□□ (1/2 = 50%)');
    });

    it('3/4の詳細表示', () => {
      const result = createDetailedFractionBar(3, 4);
      expect(result).toBe('■■■■■■■■□□ (3/4 = 75%)');
    });

    it('0/10の詳細表示', () => {
      const result = createDetailedFractionBar(0, 10);
      expect(result).toBe('□□□□□□□□□□ (0/10 = 0%)');
    });

    it('10/10の詳細表示', () => {
      const result = createDetailedFractionBar(10, 10);
      expect(result).toBe('■■■■■■■■■■ (10/10 = 100%)');
    });
  });
});
