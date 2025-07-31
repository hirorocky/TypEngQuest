import { Game } from '../../core/Game';
import { World } from '../../world/World';
import { Player } from '../../player/Player';
import { ConsumableItem, EffectType } from '../../items/ConsumableItem';
import { ItemType, ItemRarity } from '../../items/Item';
import { InventoryPhase } from '../../phases/InventoryPhase';

describe('InventoryPhase consume item integration', () => {
  let _game: Game;
  let world: World;
  let player: Player;
  let inventoryPhase: InventoryPhase;

  beforeEach(() => {
    // テスト環境の初期化
    world = new World('random', 1, true);
    player = new Player('TestPlayer', true);
    _game = new Game(true);
    inventoryPhase = new InventoryPhase(world, player);
  });

  describe('consume command', () => {
    it('should handle consume command with no consumable items', async () => {
      // インベントリをクリア
      player.getInventory().clear();
      
      // 消費アイテムなしでconsumeコマンドを実行
      const result = await inventoryPhase.processInput('consume');
      
      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('itemConsumption');
    });

    it('should transition to ItemConsumptionPhase for consuming items', async () => {
      // インベントリをクリア
      player.getInventory().clear();
      
      // ヘルスポーションを追加
      const healthPotion = new ConsumableItem({
        id: 'hp001',
        name: 'Health Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [{ type: EffectType.HEAL_HP, value: 50 }],
      });
      
      player.getInventory().addItem(healthPotion);
      
      const result = await inventoryPhase.processInput('consume');
      
      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('itemConsumption');
    });

    it('should transition to ItemConsumptionPhase with multiple consumable items', async () => {
      // インベントリをクリア
      player.getInventory().clear();
      
      // 複数の消費アイテムを追加
      const healthPotion = new ConsumableItem({
        id: 'hp001',
        name: 'Health Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [{ type: EffectType.HEAL_HP, value: 50 }],
      });
      
      const manaPotion = new ConsumableItem({
        id: 'mp001',
        name: 'Mana Potion',
        description: 'Restores 30 MP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [{ type: EffectType.HEAL_MP, value: 30 }],
      });
      
      player.getInventory().addItem(healthPotion);
      player.getInventory().addItem(manaPotion);
      
      const result = await inventoryPhase.processInput('consume');
      
      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('itemConsumption');
    });

    it('should handle consume command with non-consumable items in inventory', async () => {
      // インベントリをクリア
      player.getInventory().clear();
      
      // 消費できないアイテムのみを追加
      const sword = {
        getId: () => 'sword001',
        getDisplayName: () => 'Iron Sword',
        getDescription: () => 'A sturdy iron sword',
        getType: () => 'weapon',
        getRarity: () => 'common',
      };
      
      player.getInventory().addItem(sword as any);
      
      const result = await inventoryPhase.processInput('consume');
      
      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('itemConsumption');
    });
  });

  describe('Phase transition integration', () => {
    it('should verify items are available for consumption phase', async () => {
      // インベントリをクリア
      player.getInventory().clear();
      
      const healthPotion = new ConsumableItem({
        id: 'hp001',
        name: 'Health Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [{ type: EffectType.HEAL_HP, value: 50 }],
      });
      
      const epicPotion = new ConsumableItem({
        id: 'ep001',
        name: 'Epic Potion',
        description: 'Restores 100 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.EPIC,
        effects: [{ type: EffectType.HEAL_HP, value: 100 }],
      });
      
      player.getInventory().addItem(healthPotion);
      player.getInventory().addItem(epicPotion);
      
      // アイテムが正しくインベントリに追加されていることを確認
      const consumableItems = player.getInventory().getItems().filter(item => item instanceof ConsumableItem);
      expect(consumableItems).toHaveLength(2);
      
      const result = await inventoryPhase.processInput('consume');
      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('itemConsumption');
    });
  });

  describe('Command integration', () => {
    it('should properly handle consume command transitions', async () => {
      // インベントリをクリア
      player.getInventory().clear();
      
      // 使用時にエラーを投げるアイテムを作成
      const faultyItem = new ConsumableItem({
        id: 'faulty001',
        name: 'Faulty Item',
        description: 'This item fails when used',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [{ type: EffectType.HEAL_HP, value: 50 }],
      });
      
      player.getInventory().addItem(faultyItem);
      
      const result = await inventoryPhase.processInput('consume');
      
      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('itemConsumption');
      expect(player.getInventory().getItemCount()).toBe(1); // アイテムはまだ残っている
    });
  });

  describe('UI integration', () => {
    it('should handle inventory display and phase transitions', () => {
      // enterメソッドが正常に動作することを確認
      expect(() => inventoryPhase.enter()).not.toThrow();
      
      // コマンドの基本動作確認
      expect(inventoryPhase.getType()).toBe('inventory');
      expect(inventoryPhase.getName()).toBe('inventory');
    });
  });
});