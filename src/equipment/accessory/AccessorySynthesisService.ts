import { Accessory } from './Accessory';
import { AccessoryCatalog } from './AccessoryCatalog';
import { AccessoryEffectSlot } from './types';

const REQUIRED_SLOT_COUNT = 3;

export class AccessorySynthesisService {
  private readonly catalog: AccessoryCatalog;

  constructor(catalog: AccessoryCatalog) {
    this.catalog = catalog;
  }

  synthesize(base: Accessory, material: Accessory, selectedEffects: AccessoryEffectSlot[]): Accessory {
    if (base.getId() !== material.getId()) {
      throw new Error('Accessories must be of the same type to synthesize');
    }

    if (selectedEffects.length !== REQUIRED_SLOT_COUNT) {
      throw new Error(`Exactly ${REQUIRED_SLOT_COUNT} sub effects must be selected`);
    }

    const pool = this.catalog.collectSynthesisPool(base, material);
    selectedEffects.forEach(effect => {
      const exists = pool.some(candidate => this.isSameEffect(candidate, effect));
      if (!exists) {
        throw new Error(`Selected effect ${effect.effectType} is not part of the synthesis pool`);
      }
    });

    const resultingGrade = Math.max(base.getGrade(), material.getGrade());
    return this.catalog.createAccessory(base.getId(), resultingGrade, selectedEffects);
  }

  private isSameEffect(a: AccessoryEffectSlot, b: AccessoryEffectSlot): boolean {
    return a.effectType === b.effectType && a.label === b.label && a.magnitude === b.magnitude;
  }
}
