import { Player } from './Player';
import { Accessory, AccessoryCatalog } from '../items/accessory';
import { AccessorySnapshot } from '../items/accessory/types';

const catalog = AccessoryCatalog.load();

interface AccessoryItemOptions {
  id?: string;
  name?: string;
  description?: string;
  definitionId?: string;
  grade?: number;
  subEffectIds?: string[];
}

const buildSnapshot = (
  definitionId: string,
  grade: number,
  subEffectIds: string[] = []
): AccessorySnapshot => {
  const definition = catalog.getDefinition(definitionId);
  const subEffects = subEffectIds.map(effectId => catalog.getSubEffect(effectId));

  return {
    grade,
    mainEffect: { ...definition.mainEffect },
    subEffects,
  };
};

const createAccessory = (options: AccessoryItemOptions = {}): Accessory => {
  const definitionId = options.definitionId ?? 'glove';
  const grade = options.grade ?? 25;
  const snapshot = buildSnapshot(definitionId, grade, options.subEffectIds);

  return Accessory.fromJSON(snapshot);
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

    const accessory = createAccessory({ grade: 25 });
    player.getAccessoryInventory().addItem(accessory);
    player.equipToSlot(0, accessory);

    expect(player.getLevel()).toBe(25);
    const stats = player.getEquipmentStats().toJSON();
    expect(stats.strength).toBeGreaterThanOrEqual(1);
    expect(stats.willpower).toBeLessThanOrEqual(0);
    expect(player.getAccessoryInventory().hasItem(accessory)).toBe(false);
    expect(player.getEquipmentSlots()[0]).toBe(accessory);
  });

  it('serializes and restores accessory state', () => {
    const player = new Player('Hero');
    player.setWorldLevel(60);
    const accessory = createAccessory({ grade: 40 });
    player.getAccessoryInventory().addItem(accessory);
    player.equipToSlot(0, accessory);

    const json = player.toJSON();
    const restored = Player.fromJSON(json);

    expect(restored.getName()).toBe('Hero');
    expect(restored.getWorldLevel()).toBe(60);
    expect(restored.getEquipmentSlots()[0]?.getMainEffectId()).toBe('glove');
    expect(restored.getLevel()).toBe(40);
  });
});
