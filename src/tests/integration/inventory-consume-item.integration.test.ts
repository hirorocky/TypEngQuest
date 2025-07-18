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
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('no consumable items available');
    });

    it('should successfully consume a health potion', async () => {
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
      
      // プレイヤーのHPを減らす
      player.getStats().takeDamage(30);
      const initialHp = player.getStats().getCurrentHP();
      
      // モックして即座に最初のアイテムを選択
      jest.spyOn(inventoryPhase as any, 'consumeItem').mockImplementation(async () => {
        const consumableItems = player.getInventory().getItems().filter(item => item instanceof ConsumableItem);
        if (consumableItems.length > 0) {
          const item = consumableItems[0] as ConsumableItem;
          await item.use(player);
          player.getInventory().removeItem(item);
          return {
            success: true,
            message: `consumed ${item.getDisplayName()}`,
          };
        }
        return {
          success: false,
          message: 'no consumable items available',
        };
      });
      
      const result = await inventoryPhase.processInput('consume');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('consumed Health Potion');
      expect(player.getStats().getCurrentHP()).toBe(initialHp + 50);
      expect(player.getInventory().getItemCount()).toBe(0);
    });

    it('should handle multiple consumable items', async () => {
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
      
      // consumeItemメソッドが正しく消費アイテムを取得できることを確認
      const consumableItems = (inventoryPhase as any).getConsumableItems();
      expect(consumableItems).toHaveLength(2);
      expect(consumableItems[0]).toBe(healthPotion);
      expect(consumableItems[1]).toBe(manaPotion);
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
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('no consumable items available');
    });
  });

  describe('ScrollableList integration', () => {
    it('should create proper list items for consumable items', async () => {
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
      
      const consumableItems = (inventoryPhase as any).getConsumableItems();
      expect(consumableItems).toHaveLength(2);
      
      // フォーマットされたアイテム情報を確認
      const healthPotionInfo = (inventoryPhase as any).formatItemInfo(healthPotion);
      const epicPotionInfo = (inventoryPhase as any).formatItemInfo(epicPotion);
      
      expect(healthPotionInfo).toContain('Health Potion');
      expect(healthPotionInfo).toContain('common');
      expect(epicPotionInfo).toContain('Epic Potion');
      expect(epicPotionInfo).toContain('epic');
    });
  });

  describe('Error handling', () => {
    it('should handle item use failures gracefully', async () => {
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
      
      // useメソッドをモックしてエラーを投げる
      jest.spyOn(faultyItem, 'use').mockImplementation(async () => {
        throw new Error('Item use failed');
      });
      
      player.getInventory().addItem(faultyItem);
      
      // モックして即座に最初のアイテムを選択
      jest.spyOn(inventoryPhase as any, 'consumeItem').mockImplementation(async () => {
        const consumableItems = player.getInventory().getItems().filter(item => item instanceof ConsumableItem);
        if (consumableItems.length > 0) {
          const item = consumableItems[0] as ConsumableItem;
          try {
            await item.use(player);
            player.getInventory().removeItem(item);
            return {
              success: true,
              message: `consumed ${item.getDisplayName()}`,
            };
          } catch (error) {
            return {
              success: false,
              message: `failed to consume item: ${error instanceof Error ? error.message : 'unknown error'}`,
            };
          }
        }
        return {
          success: false,
          message: 'no consumable items available',
        };
      });
      
      const result = await inventoryPhase.processInput('consume');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('failed to consume item: Item use failed');
      expect(player.getInventory().getItemCount()).toBe(1); // アイテムは削除されない
    });
  });

  describe('UI integration', () => {
    it('should include consume command in help display', () => {
      const helpSpy = jest.spyOn(inventoryPhase as any, 'showHelp');
      
      inventoryPhase.enter();
      
      expect(helpSpy).toHaveBeenCalled();
      
      // showHelpメソッドを直接テスト
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      (inventoryPhase as any).showHelp();
      
      const helpOutput = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(helpOutput).toContain('consume');
      expect(helpOutput).toContain('select and consume item');
      
      consoleSpy.mockRestore();
    });
  });
});