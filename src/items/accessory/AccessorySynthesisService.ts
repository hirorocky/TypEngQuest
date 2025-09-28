import { Accessory } from './Accessory';
import { AccessoryCatalog } from './AccessoryCatalog';
import { AccessorySubEffect } from './types';

const MAX_SYNTHESIS_SLOTS = 3;

export class AccessorySynthesisService {
  private readonly catalog: AccessoryCatalog;

  constructor(catalog: AccessoryCatalog) {
    this.catalog = catalog;
  }

  synthesize(base: Accessory, material: Accessory, selectedEffects: AccessorySubEffect[]): Accessory {
    if (base.getId() !== material.getId()) {
      throw new Error('Accessories must be of the same type to synthesize');
    }

    if (selectedEffects.length > MAX_SYNTHESIS_SLOTS) {
      throw new Error(`Cannot select more than ${MAX_SYNTHESIS_SLOTS} sub effects`);
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

  private isSameEffect(a: AccessorySubEffect, b: AccessorySubEffect): boolean {
    return a.effectType === b.effectType && a.name === b.name && a.magnitude === b.magnitude;
  }
}
