import { Accessory } from './Accessory';

export class AccessoryNameGenerator {
  static generate(accessory: Accessory): string {
    const baseName = `${accessory.getDisplayName()} ${accessory.getItemType()}`.trim();
    const highlight = this.resolveHighlight(accessory);
    const gradeSuffix = `G${accessory.getGrade()}`;

    if (highlight) {
      return `${baseName} · ${highlight} ${gradeSuffix}`;
    }

    return `${baseName} ${gradeSuffix}`;
  }

  private static resolveHighlight(accessory: Accessory): string | undefined {
    const subEffects = accessory.getSubEffects();
    if (subEffects.length === 0) {
      return undefined;
    }

    const highlightId = accessory.getHighlightEffectId();
    if (!highlightId) {
      return subEffects[0]?.label;
    }

    return subEffects.find(effect => effect.id === highlightId)?.label ?? subEffects[0]?.label;
  }
}
