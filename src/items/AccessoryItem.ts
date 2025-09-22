import { Item, ItemData, ItemType } from './Item';
import {
  Accessory,
  AccessoryCatalog,
  AccessoryEffectSlot,
  AccessoryNameGenerator,
} from '../equipment/accessory';

export interface AccessoryItemData extends ItemData {
  definitionId: string;
  grade: number;
  subEffects?: AccessoryEffectSlot[];
}

export class AccessoryItem extends Item {
  private static defaultCatalog: AccessoryCatalog | null = null;

  private readonly definitionId: string;
  private accessory: Accessory;

  constructor(data: AccessoryItemData, catalog?: AccessoryCatalog) {
    const resolvedCatalog = catalog ?? AccessoryItem.getCatalog();
    const accessory = resolvedCatalog.createAccessory(
      data.definitionId,
      data.grade,
      data.subEffects
    );

    super({
      id: data.id,
      name: AccessoryNameGenerator.generate(accessory),
      description: data.description,
      type: ItemType.ACCESSORY,
      rarity: data.rarity,
    });

    this.definitionId = data.definitionId;
    this.accessory = accessory;
  }

  getAccessory(): Accessory {
    return this.accessory;
  }

  updateAccessory(accessory: Accessory): void {
    if (accessory.getId() !== this.definitionId) {
      throw new Error('Accessory definition mismatch');
    }
    this.accessory = accessory;
  }

  getDefinitionId(): string {
    return this.definitionId;
  }

  override getDisplayName(): string {
    return AccessoryNameGenerator.generate(this.accessory);
  }

  override toJSON(): AccessoryItemData {
    return {
      id: this.getId(),
      name: this.getName(),
      description: this.getDescription(),
      type: ItemType.ACCESSORY,
      rarity: this.getRarity(),
      definitionId: this.definitionId,
      grade: this.accessory.getGrade(),
      subEffects: this.accessory.getSubEffects().map(effect => ({ ...effect })),
    };
  }

  static fromJSON(data: AccessoryItemData, catalog?: AccessoryCatalog): AccessoryItem {
    AccessoryItem.validateData(data);
    return new AccessoryItem(data, catalog);
  }

  private static getCatalog(): AccessoryCatalog {
    if (!this.defaultCatalog) {
      this.defaultCatalog = AccessoryCatalog.load();
    }
    return this.defaultCatalog;
  }

  private static validateData(data: AccessoryItemData): void {
    if (data.type !== ItemType.ACCESSORY) {
      throw new Error('Accessory item must have type "accessory"');
    }
    if (typeof data.definitionId !== 'string') {
      throw new Error('Accessory item requires definitionId');
    }
    if (typeof data.grade !== 'number') {
      throw new Error('Accessory item requires grade');
    }
    if (data.subEffects && data.subEffects.length !== 3) {
      throw new Error('Accessory item must provide exactly three sub effects');
    }
  }
}
