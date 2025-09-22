import { AccessoryCatalog } from './AccessoryCatalog';
import { AccessorySynthesisService } from './AccessorySynthesisService';

const catalog = AccessoryCatalog.load();

describe('AccessorySynthesisService', () => {
  it('merges sub effect pools and preserves highest grade', () => {
    const base = catalog.createAccessory('hermes_ring', 22);
    const material = catalog.createAccessory('hermes_ring', 48);

    const pool = catalog.collectSynthesisPool(base, material);
    expect(pool.length).toBeGreaterThanOrEqual(3);

    // Pick three unique effects from pool
    const selection = pool.slice(0, 3);

    const service = new AccessorySynthesisService(catalog);
    const result = service.synthesize(base, material, selection);

    expect(result.getGrade()).toBe(48);
    expect(result.getSubEffects()).toHaveLength(3);
    expect(result.getSubEffects()[0].label).toBe(selection[0].label);
  });

  it('rejects synthesis of different accessory types', () => {
    const cronus = catalog.createAccessory('cronus_glove', 10);
    const iris = catalog.createAccessory('iris_necklace', 10);
    const service = new AccessorySynthesisService(catalog);

    expect(() => service.synthesize(cronus, iris, cronus.getSubEffects())).toThrow('same type');
  });
});
