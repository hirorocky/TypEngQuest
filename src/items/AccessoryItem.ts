import { ItemType, InventoryItem } from './types';
import { Accessory, AccessoryNameGenerator } from './accessory';
import { AccessorySnapshot } from './accessory/types';

export interface AccessoryItemData {
  id: string;
  name: string;
  description: string;
  type: ItemType.ACCESSORY;
  accessory: AccessorySnapshot;
}

export class AccessoryItem {
  private readonly id: string;
  private readonly name: string;
  private readonly description: string;
  private accessory: Accessory;

  constructor(data: AccessoryItemData) {
    if (data.type !== ItemType.ACCESSORY) {
      throw new Error('Accessory item must have type "accessory"');
    }
    this.assertIdentity(data.id, data.name);

    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.accessory = new Accessory(AccessoryItem.cloneSnapshot(data.accessory));
  }

  static fromJSON(data: AccessoryItemData): AccessoryItem {
    AccessoryItem.validateData(data);
    return new AccessoryItem(data);
  }

  private static validateData(data: AccessoryItemData): void {
    if (data.type !== ItemType.ACCESSORY) {
      throw new Error('Accessory item must have type "accessory"');
    }
    AccessoryItem.validateSnapshot(data.accessory);
  }

  private static validateSnapshot(snapshot: AccessorySnapshot): void {
    AccessoryItem.assertSnapshotObject(snapshot);
    AccessoryItem.assertNonEmptyString(snapshot.id, 'id');
    AccessoryItem.assertNonEmptyString(snapshot.name, 'name');
    AccessoryItem.assertValidGrade(snapshot.grade);
    AccessoryItem.assertMainEffect(snapshot.mainEffect);
    AccessoryItem.assertSubEffects(snapshot.subEffects);
  }

  private static assertSnapshotObject(snapshot: AccessorySnapshot): void {
    if (typeof snapshot !== 'object' || snapshot === null) {
      throw new Error('Accessory item requires accessory snapshot data');
    }
  }

  private static assertNonEmptyString(value: unknown, field: string): void {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`Accessory snapshot requires ${field}`);
    }
  }

  private static assertValidGrade(value: unknown): void {
    if (typeof value !== 'number') {
      throw new Error('Accessory snapshot requires grade');
    }
  }

  private static assertMainEffect(mainEffect: AccessorySnapshot['mainEffect']): void {
    if (!mainEffect) {
      throw new Error('Accessory snapshot requires mainEffect');
    }
    if (typeof mainEffect.id !== 'string' || mainEffect.id.trim() === '') {
      throw new Error('Accessory mainEffect requires id');
    }
    if (!mainEffect.boost || !mainEffect.penalty) {
      throw new Error('Accessory mainEffect requires boost and penalty stats');
    }
  }

  private static assertSubEffects(subEffects: AccessorySnapshot['subEffects']): void {
    if (!Array.isArray(subEffects)) {
      throw new Error('Accessory snapshot requires subEffects array');
    }
    if (subEffects.length > 3) {
      throw new Error('Accessory item cannot exceed three sub effects');
    }
  }

  private static cloneSnapshot(snapshot: AccessorySnapshot): AccessorySnapshot {
    return {
      id: snapshot.id,
      name: snapshot.name,
      grade: snapshot.grade,
      mainEffect: { ...snapshot.mainEffect },
      subEffects: snapshot.subEffects.map(effect => ({ ...effect })),
    };
  }

  getAccessory(): Accessory {
    return this.accessory;
  }

  updateAccessory(accessory: Accessory): void {
    if (accessory.getId() !== this.accessory.getId()) {
      throw new Error('Accessory definition mismatch');
    }
    this.accessory = accessory;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return AccessoryNameGenerator.generate(this.accessory);
  }

  getDescription(): string {
    return this.description;
  }

  getType(): ItemType {
    return ItemType.ACCESSORY;
  }

  getDisplayName(): string {
    return AccessoryNameGenerator.generate(this.accessory);
  }

  /**
   * 他のアイテムと等しいかチェックする
   * @param other - 比較するアイテム
   * @returns 等しい場合true
   */
  equals(other: InventoryItem): boolean {
    return this.getId() === other.getId();
  }

  toJSON(): AccessoryItemData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: ItemType.ACCESSORY,
      accessory: this.accessory.toSnapshot(),
    };
  }

  private assertIdentity(id: string, name: string): void {
    if (!id || id.trim() === '') {
      throw new Error('Item ID cannot be empty');
    }
    if (!name || name.trim() === '') {
      throw new Error('Item name cannot be empty');
    }
  }
}
