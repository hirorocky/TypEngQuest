import { Player } from './Player';
import { AccessoryItem, AccessoryItemData } from '../items/AccessoryItem';
import { ItemType, ItemRarity } from '../items/Item';

const createAccessoryItem = (overrides: Partial<AccessoryItemData> = {}): AccessoryItem => {
  const data: AccessoryItemData = {
    id: overrides.id ?? 'acc-1',
    name: overrides.name ?? 'Cronus',
    description: overrides.description ?? 'test accessory',
    type: ItemType.ACCESSORY,
    rarity: overrides.rarity ?? ItemRarity.RARE,
    definitionId: overrides.definitionId ?? 'cronus_glove',
    grade: overrides.grade ?? 25,
    subEffects: overrides.subEffects,
  };

  return new AccessoryItem(data);
};

describe('Player (accessory system)', () => {
  it('initializes without accessories', () => {
    const player = new Player('Hero');

    expect(player.getLevel()).toBe(0);
    expect(player.getEquipmentSlots()).toHaveLength(3);
    expect(player.getEquipmentStats().toJSON()).toEqual({
      strength: 0,
      willpower: 0,
      agility: 0,
      fortune: 0,
    });
  });

  it('equips an accessory and updates stats and level', () => {
    const player = new Player('Hero');
    player.setWorldLevel(50);

    const accessory = createAccessoryItem({ id: 'acc-boost', grade: 25 });
    player.getInventory().addItem(accessory);
    player.equipToSlot(0, accessory);

    expect(player.getLevel()).toBe(25);
    const stats = player.getEquipmentStats().toJSON();
    expect(stats.strength).toBeGreaterThanOrEqual(1);
    expect(stats.willpower).toBeLessThanOrEqual(0);
    expect(player.getInventory().findItemById('acc-boost')).toBeUndefined();
    expect(player.getEquipmentSlots()[0]?.getId()).toBe('acc-boost');
  });

  it('rejects accessories above current world level', () => {
    const player = new Player('Hero');
    player.setWorldLevel(10);

    const accessory = createAccessoryItem({ id: 'acc-high', grade: 30 });
    player.getInventory().addItem(accessory);

    expect(() => player.equipToSlot(0, accessory)).toThrow(
      'Accessory grade exceeds current world level'
    );
  });

  it('serializes and restores accessory state', () => {
    const player = new Player('Hero');
    player.setWorldLevel(60);
    const accessory = createAccessoryItem({ id: 'acc-save', grade: 40 });
    player.getInventory().addItem(accessory);
    player.equipToSlot(0, accessory);

    const json = player.toJSON();
    const restored = Player.fromJSON(json);

    expect(restored.getName()).toBe('Hero');
    expect(restored.getWorldLevel()).toBe(60);
    expect(restored.getEquipmentSlots()[0]?.getId()).toBe('acc-save');
    expect(restored.getLevel()).toBe(40);
  });
});
