import { AccessoryCatalog } from './AccessoryCatalog';
import { AccessorySlotManager } from './AccessorySlotManager';
import { AccessoryItem, AccessoryItemData } from '../../items/AccessoryItem';
import { ItemRarity, ItemType } from '../../items/Item';

const BASE_STATS = {
  strength: 100,
  willpower: 100,
  agility: 100,
  fortune: 100,
};

const catalog = AccessoryCatalog.load();

const createAccessoryItem = (id: string, definitionId: string, grade: number): AccessoryItem => {
  const data: AccessoryItemData = {
    id,
    name: definitionId,
    description: 'test accessory',
    type: ItemType.ACCESSORY,
    rarity: ItemRarity.RARE,
    definitionId,
    grade,
  };
  return new AccessoryItem(data, catalog);
};

describe('AccessorySlotManager', () => {
  it('allows equipping accessories within unlocked slots and aggregates stats', () => {
    const manager = new AccessorySlotManager();
    manager.setWorldLevel(50);
    const accessory = createAccessoryItem('cronus-25', 'cronus_glove', 25);

    manager.equip(0, accessory);

    const aggregate = manager.aggregate(BASE_STATS);
    expect(aggregate.total.strength).toBeGreaterThan(BASE_STATS.strength);
    expect(aggregate.total.willpower).toBeLessThan(BASE_STATS.willpower);
    expect(aggregate.subEffects).toHaveLength(3);
  });

  it('prevents equipping accessories above world level', () => {
    const manager = new AccessorySlotManager();
    manager.setWorldLevel(10);
    const accessory = createAccessoryItem('cronus-20', 'cronus_glove', 20);
    expect(() => manager.equip(0, accessory)).toThrow('Accessory grade exceeds current world level');
  });

  it('unlocks slots via key items', () => {
    const manager = new AccessorySlotManager();
    expect(manager.getUnlockedSlotCount()).toBe(1);
    expect(manager.unlockByKeyItem('key_accessory_slot_2')).toBe(true);
    expect(manager.getUnlockedSlotCount()).toBe(2);
    expect(manager.unlockByKeyItem('key_accessory_slot_2')).toBe(false);
  });
});
