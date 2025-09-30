import { AccessoryCatalog } from './AccessoryCatalog';

describe('AccessoryCatalog', () => {
  const catalog = AccessoryCatalog.load();

  it('loads accessory main effects from JSON', () => {
    const mainEffects = catalog.listMainEffects();
    expect(mainEffects).toHaveLength(3);
    const glove = mainEffects.find(effect => effect.id === 'glove');
    expect(glove).toBeDefined();
    expect(glove?.boost).toBe('strength');
  });

  it('creates accessory instances without sub effects by default', () => {
    const accessory = catalog.createAccessory('glove', 25);
    expect(accessory.getMainEffectId()).toBe('glove');
    expect(accessory.getSubEffects()).toHaveLength(0);

    const name = accessory.getDisplayName();
    expect(name).toBe('glove G25');
  });

  it('allows overriding sub effects up to the slot cap', () => {
    const typingBonus = catalog.getSubEffect('tempo');
    const sparkChain = catalog.getSubEffect('prism');
    const focusCharge = catalog.getSubEffect('drift');

    const accessory = catalog.createAccessory('glove', 40, [typingBonus, sparkChain, focusCharge]);
    const effects = accessory.getSubEffects();
    expect(effects).toHaveLength(3);
    expect(effects.map(effect => effect.id)).toEqual(['tempo', 'prism', 'drift']);

    const name = accessory.getDisplayName();
    expect(name.startsWith('Tempo Prism Drift')).toBe(true);
    expect(name.endsWith('glove G40')).toBe(true);
  });

  it('throws when requesting an unknown sub effect id', () => {
    expect(() => catalog.getSubEffect('unknown_effect')).toThrow('Accessory sub effect not found: unknown_effect');
  });
});
