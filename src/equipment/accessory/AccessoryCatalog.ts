import * as fs from 'fs';
import * as path from 'path';
import { Accessory } from './Accessory';
import { AccessoryGradeTable, defaultAccessoryGradeTable } from './gradeTable';
import {
  AccessoryCatalogData,
  AccessoryDefinition,
  AccessoryEffectSlot,
  AccessorySnapshot,
} from './types';

const DEFAULT_DATA_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'data',
  'accessories',
  'catalog.json'
);

export class AccessoryCatalog {
  private readonly definitions: Map<string, AccessoryDefinition> = new Map();
  private readonly gradeTable: AccessoryGradeTable;

  constructor(definitions: AccessoryDefinition[], gradeTable: AccessoryGradeTable = defaultAccessoryGradeTable) {
    if (definitions.length === 0) {
      throw new Error('AccessoryCatalog requires at least one definition');
    }
    definitions.forEach(definition => this.definitions.set(definition.id, definition));
    this.gradeTable = gradeTable;
  }

  static load(dataPath: string = DEFAULT_DATA_PATH): AccessoryCatalog {
    const file = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(file) as AccessoryCatalogData;
    if (!data || !Array.isArray(data.archetypes)) {
      throw new Error('Invalid accessory catalog data');
    }
    return new AccessoryCatalog(data.archetypes);
  }

  listDefinitions(): AccessoryDefinition[] {
    return Array.from(this.definitions.values()).map(definition => ({ ...definition }));
  }

  getDefinition(id: string): AccessoryDefinition {
    const definition = this.definitions.get(id);
    if (!definition) {
      throw new Error(`Accessory definition not found: ${id}`);
    }
    return { ...definition, defaultSubEffects: definition.defaultSubEffects.map(effect => ({ ...effect })) };
  }

  createAccessory(definitionId: string, grade: number, subEffects?: AccessoryEffectSlot[]): Accessory {
    const definition = this.getDefinition(definitionId);
    const effectiveSubEffects = subEffects ?? definition.defaultSubEffects;

    const snapshot: AccessorySnapshot = {
      id: definition.id,
      archetypeId: definition.archetypeId,
      displayName: definition.displayName,
      itemType: definition.itemType,
      grade,
      mainEffect: definition.mainEffect,
      subEffects: effectiveSubEffects.map(effect => ({ ...effect })),
      highlightEffectId: definition.highlightEffectId,
    };

    return new Accessory(snapshot, this.gradeTable);
  }

  collectSynthesisPool(accessoryA: Accessory, accessoryB: Accessory): AccessoryEffectSlot[] {
    if (accessoryA.getId() !== accessoryB.getId()) {
      throw new Error('Accessories must share the same definition for synthesis');
    }

    const merged: Map<string, AccessoryEffectSlot> = new Map();
    [...accessoryA.getSubEffects(), ...accessoryB.getSubEffects()].forEach(effect => {
      merged.set(`${effect.effectType}:${effect.label}:${effect.magnitude}`, effect);
    });

    return Array.from(merged.values()).map(effect => ({ ...effect }));
  }
}
