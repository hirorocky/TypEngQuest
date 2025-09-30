import * as fs from 'fs';
import * as path from 'path';
import { Accessory } from './Accessory';
import { AccessoryGradeTable, defaultAccessoryGradeTable } from './gradeTable';
import { AccessoryMainEffect, AccessorySubEffect, AccessorySnapshot } from './types';

const PROJECT_ROOT = path.resolve(process.cwd());

const DEFAULT_MAIN_EFFECTS_PATH = path.join(
  PROJECT_ROOT,
  'data',
  'accessories',
  'main-effects.json'
);

const DEFAULT_SUB_EFFECTS_PATH = path.join(
  PROJECT_ROOT,
  'data',
  'accessories',
  'sub-effects.json'
);

type AccessoryMainEffectEntry = {
  id: string;
  name: string;
  mainEffect: Omit<AccessoryMainEffect, 'id' | 'name'>;
};

type AccessoryMainEffectCatalog = Readonly<{
  mainEffects: AccessoryMainEffectEntry[];
}>;

type AccessorySubEffectCatalog = Readonly<{
  subEffects: AccessorySubEffect[];
}>;

export class AccessoryCatalog {
  private readonly mainEffects: Map<string, AccessoryMainEffect> = new Map();
  private readonly subEffects: Map<string, AccessorySubEffect> = new Map();
  private readonly gradeTable: AccessoryGradeTable;

  constructor(
    mainEffects: AccessoryMainEffect[],
    subEffects: Map<string, AccessorySubEffect>,
    gradeTable: AccessoryGradeTable = defaultAccessoryGradeTable
  ) {
    if (mainEffects.length === 0) {
      throw new Error('AccessoryCatalog requires at least one main effect');
    }
    mainEffects.forEach(effect => {
      this.mainEffects.set(effect.id, { ...effect });
    });
    subEffects.forEach(effect => {
      this.subEffects.set(effect.id, { ...effect });
    });
    this.gradeTable = gradeTable;
  }

  static load(options: { mainEffectPath?: string; subEffectPath?: string } = {}): AccessoryCatalog {
    const catalogData = this.buildCatalog({
      mainEffectPath: options.mainEffectPath ?? DEFAULT_MAIN_EFFECTS_PATH,
      subEffectPath: options.subEffectPath ?? DEFAULT_SUB_EFFECTS_PATH,
    });
    return new AccessoryCatalog(catalogData.mainEffects, catalogData.subEffects);
  }

  listMainEffects(): AccessoryMainEffect[] {
    return Array.from(this.mainEffects.values()).map(effect => ({ ...effect }));
  }

  listSubEffects(): AccessorySubEffect[] {
    return Array.from(this.subEffects.values()).map(effect => ({ ...effect }));
  }

  getMainEffect(id: string): AccessoryMainEffect {
    const effect = this.mainEffects.get(id);
    if (!effect) {
      throw new Error(`Accessory main effect not found: ${id}`);
    }
    return { ...effect };
  }

  getSubEffect(id: string): AccessorySubEffect {
    const effect = this.subEffects.get(id);
    if (!effect) {
      throw new Error(`Accessory sub effect not found: ${id}`);
    }
    return { ...effect };
  }

  createAccessory(
    mainEffectId: string,
    grade: number,
    subEffects: AccessorySubEffect[] = []
  ): Accessory {
    const mainEffect = this.getMainEffect(mainEffectId);
    const effectiveSubEffects = subEffects ?? [];

    const snapshot: AccessorySnapshot = {
      grade,
      mainEffect: { ...mainEffect },
      subEffects: effectiveSubEffects.map(effect => ({ ...effect })),
    };

    return new Accessory(snapshot, this.gradeTable);
  }

  collectSynthesisPool(accessoryA: Accessory, accessoryB: Accessory): AccessorySubEffect[] {
    if (!accessoryA.hasSameMainEffect(accessoryB)) {
      throw new Error('Accessories must share the same main effect for synthesis');
    }

    const merged: Map<string, AccessorySubEffect> = new Map();
    [...accessoryA.getSubEffects(), ...accessoryB.getSubEffects()].forEach(effect => {
      merged.set(`${effect.effectType}:${effect.name}:${effect.magnitude}`, effect);
    });

    return Array.from(merged.values()).map(effect => ({ ...effect }));
  }

  private static buildCatalog(paths: {
    mainEffectPath: string;
    subEffectPath: string;
  }): { mainEffects: AccessoryMainEffect[]; subEffects: Map<string, AccessorySubEffect> } {
    const mainEffectData = this.readJson<AccessoryMainEffectCatalog>(
      paths.mainEffectPath,
      'accessory main-effect catalog'
    );
    if (!mainEffectData || !Array.isArray(mainEffectData.mainEffects)) {
      throw new Error('Invalid accessory main-effect catalog data');
    }

    const subEffectData = this.readJson<AccessorySubEffectCatalog>(
      paths.subEffectPath,
      'accessory sub-effect catalog'
    );
    if (!subEffectData || !Array.isArray(subEffectData.subEffects)) {
      throw new Error('Invalid accessory sub-effect catalog data');
    }

    const subEffectMap = new Map<string, AccessorySubEffect>();
    subEffectData.subEffects.forEach(subEffect => {
      if (subEffectMap.has(subEffect.id)) {
        throw new Error(`Duplicate sub effect id detected: ${subEffect.id}`);
      }
      subEffectMap.set(subEffect.id, { ...subEffect });
    });

    const seenMainEffectIds = new Set<string>();

    const mainEffects = mainEffectData.mainEffects.map(entry => {
      if (seenMainEffectIds.has(entry.id)) {
        throw new Error(`Duplicate main-effect id detected: ${entry.id}`);
      }
      seenMainEffectIds.add(entry.id);

      return {
        id: entry.id,
        name: entry.name,
        boost: entry.mainEffect.boost,
        penalty: entry.mainEffect.penalty,
      };
    });

    return { mainEffects, subEffects: subEffectMap };
  }

  private static readJson<T>(filePath: string, label: string): T {
    try {
      const file = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(file) as T;
    } catch (error) {
      throw new Error(`Failed to read ${label} file at ${filePath}: ${String(error)}`);
    }
  }
}
