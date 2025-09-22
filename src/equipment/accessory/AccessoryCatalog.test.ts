import { AccessoryCatalog } from './AccessoryCatalog';
import { AccessoryNameGenerator } from './AccessoryNameGenerator';

describe('AccessoryCatalog', () => {
  const catalog = AccessoryCatalog.load();

  it('loads accessory definitions from JSON', () => {
    const definitions = catalog.listDefinitions();
    expect(definitions).toHaveLength(3);
    const cronus = definitions.find(def => def.id === 'cronus_glove');
    expect(cronus).toBeDefined();
    expect(cronus?.mainEffect.boost).toBe('strength');
  });

  it('creates accessory instances with default sub effects', () => {
    const accessory = catalog.createAccessory('cronus_glove', 25);
    expect(accessory.getId()).toBe('cronus_glove');
    expect(accessory.getSubEffects()).toHaveLength(3);
    expect(AccessoryNameGenerator.generate(accessory)).toContain('Cronus');
    expect(AccessoryNameGenerator.generate(accessory)).toContain('G25');
  });

  it('creates accessory instances with overridden sub effects', () => {
    const definition = catalog.getDefinition('cronus_glove');
    const subEffects = [definition.defaultSubEffects[0]];
    // Duplicate first effect to fill slots for testing override path
    subEffects.push({ ...definition.defaultSubEffects[0], id: 'temp_1' });
    subEffects.push({ ...definition.defaultSubEffects[1], id: 'temp_2' });

    const accessory = catalog.createAccessory('cronus_glove', 40, subEffects);
    const effects = accessory.getSubEffects();
    expect(effects[0].label).toBe(definition.defaultSubEffects[0].label);
    expect(effects[1].label).toBe(definition.defaultSubEffects[0].label);
    expect(effects[2].label).toBe(definition.defaultSubEffects[1].label);
  });
});
