import { AccessoryCatalog } from './AccessoryCatalog';
import { AccessorySlotManager } from './AccessorySlotManager';
import { Accessory } from './Accessory';
import { ItemType } from '../../items/types';
import { AccessoryItemData, AccessorySnapshot } from './types';

const BASE_STATS = {
  strength: 100,
  willpower: 100,
  agility: 100,
  fortune: 100,
};

const catalog = AccessoryCatalog.load();

const createAccessory = (
  id: string,
  definitionId: string,
  grade: number,
  subEffectIds: string[] = []
): Accessory => {
  const definition = catalog.getDefinition(definitionId);
  const subEffects = subEffectIds.map(effectId => catalog.getSubEffect(effectId));
  const accessorySnapshot: AccessorySnapshot = {
    id: definition.id,
    name: definition.name,
    grade,
    mainEffect: { ...definition.mainEffect },
    subEffects,
  };

  const data: AccessoryItemData = {
    id,
    name: definitionId,
    description: 'test accessory',
    type: ItemType.ACCESSORY,
    accessory: accessorySnapshot,
  };

  return Accessory.fromJSON(data);
};

describe('AccessorySlotManager', () => {
  it('allows equipping accessories within unlocked slots and aggregates stats', () => {
    const manager = new AccessorySlotManager();
    manager.setWorldLevel(50);
    const accessory = createAccessory('glove-25', 'glove', 25, ['tempo', 'flare']);

    manager.equip(0, accessory);

    const aggregate = manager.aggregate(BASE_STATS);
    expect(aggregate.total.strength).toBeGreaterThan(BASE_STATS.strength);
    expect(aggregate.total.willpower).toBeLessThan(BASE_STATS.willpower);
    expect(aggregate.subEffects).toHaveLength(2);
  });

  it('unlocks slots via key items', () => {
    const manager = new AccessorySlotManager();
    expect(manager.getUnlockedSlotCount()).toBe(1);
    expect(manager.unlockByKeyItem('key_accessory_slot_2')).toBe(true);
    expect(manager.getUnlockedSlotCount()).toBe(2);
    expect(manager.unlockByKeyItem('key_accessory_slot_2')).toBe(false);
  });
});
