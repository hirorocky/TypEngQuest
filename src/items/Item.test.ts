import { ItemData, ItemType, isItemData, validateItemIdentity } from './types';

describe('Item utilities', () => {
  describe('validateItemIdentity', () => {
    it('accepts valid id and name', () => {
      expect(() => validateItemIdentity({ id: 'hp_potion', name: 'HP Potion' })).not.toThrow();
    });

    it('throws when id is empty', () => {
      expect(() => validateItemIdentity({ id: '', name: 'HP Potion' })).toThrow(
        'Item ID cannot be empty'
      );
    });

    it('throws when name is empty', () => {
      expect(() => validateItemIdentity({ id: 'hp_potion', name: '' })).toThrow(
        'Item name cannot be empty'
      );
    });
  });

  describe('isItemData', () => {
    it('returns true for valid item data', () => {
      const data: ItemData = {
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.POTION,
      };

      expect(isItemData(data)).toBe(true);
    });

    it('returns false when required fields are missing', () => {
      const invalid = {
        id: 'hp_potion',
        type: ItemType.POTION,
      };

      expect(isItemData(invalid)).toBe(false);
    });
  });
});
