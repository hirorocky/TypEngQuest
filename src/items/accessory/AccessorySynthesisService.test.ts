import { AccessoryCatalog } from './AccessoryCatalog';
import { AccessorySynthesisService } from './AccessorySynthesisService';

const catalog = AccessoryCatalog.load();

describe('AccessorySynthesisService', () => {
  it('merges sub effect pools and preserves highest grade', () => {
    const statusResist = catalog.getSubEffect('aegis');
    const mpEfficiency = catalog.getSubEffect('thrift');
    const sparkChain = catalog.getSubEffect('prism');

    const base = catalog.createAccessory('ring', 22, [statusResist, mpEfficiency]);
    const material = catalog.createAccessory('ring', 48, [sparkChain]);

    const pool = catalog.collectSynthesisPool(base, material);
    expect(pool).toHaveLength(3);

    const selection = [statusResist, sparkChain];

    const service = new AccessorySynthesisService(catalog);
    const result = service.synthesize(base, material, selection);

    expect(result.getGrade()).toBe(48);
    expect(result.getSubEffects()).toHaveLength(2);
    expect(result.getSubEffects().map(effect => effect.id)).toEqual(['aegis', 'prism']);
  });

  it('rejects synthesis of different accessory types', () => {
    const cronus = catalog.createAccessory('glove', 10);
    const iris = catalog.createAccessory('necklace', 10);
    const service = new AccessorySynthesisService(catalog);

    expect(() => service.synthesize(cronus, iris, cronus.getSubEffects())).toThrow('same type');
  });
});
