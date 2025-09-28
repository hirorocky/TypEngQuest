import { Accessory } from './Accessory';

export class AccessoryNameGenerator {
  static generate(accessory: Accessory): string {
    const subEffectNames = accessory
      .getSubEffects()
      .slice(0, 3)
      .map(effect => effect.name)
      .filter((name): name is string => Boolean(name && name.trim()));

    const mainEffectName = accessory.getName();
    const gradeSuffix = `G${accessory.getGrade()}`;

    const segments: string[] = [];

    if (subEffectNames.length > 0) {
      segments.push(subEffectNames.join(' '));
    }

    segments.push(mainEffectName);
    segments.push(gradeSuffix);

    return segments.join(' ');
  }
}
