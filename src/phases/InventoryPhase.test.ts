import { InventoryPhase } from './InventoryPhase';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { Potion, EffectType } from '../items/Potion';
import { AccessoryItem } from '../items/AccessoryItem';
import { ItemType } from '../items/types';
import { AccessoryCatalog } from '../items/accessory';
import { Display } from '../ui/Display';
// ScrollableList import removed - no longer used in InventoryPhase tests
import { PhaseTypes } from '../core/types';

// Displayをモック
jest.mock('../ui/Display');

describe('InventoryPhase', () => {
  let phase: InventoryPhase;
  let world: World;
  let player: Player;

  beforeEach(() => {
    // Displayのモックをリセット
    jest.clearAllMocks();

    // テスト用のWorldとPlayerを作成
    world = new World('random', 1);
    player = new Player('TestPlayer');
    phase = new InventoryPhase(world, player);
  });

  describe('コンストラクタ', () => {
    test('正常なパラメータで初期化される', () => {
      expect(phase).toBeDefined();
      expect(phase.getName()).toBe('inventory');
      expect(phase.getType()).toBe('inventory');
    });

    test('Worldが未定義の場合はエラーになる', () => {
      expect(() => new InventoryPhase(null as any, player)).toThrow(
        'World is required for InventoryPhase'
      );
    });

    test('Playerが未定義の場合はエラーになる', () => {
      expect(() => new InventoryPhase(world, null as any)).toThrow(
        'Player is required for InventoryPhase'
      );
    });
  });

  describe('フェーズ操作', () => {
    test('enter()でインベントリが表示される', () => {
      phase.enter();

      expect(Display.clear).toHaveBeenCalled();
      expect(Display.printHeader).toHaveBeenCalledWith('inventory');
      expect(Display.printInfo).toHaveBeenCalledWith('items: 0/100');
      expect(Display.printInfo).toHaveBeenCalledWith('no items in inventory');
    });

    test('アイテムがある場合は一覧が表示される', () => {
      // テスト用アイテムを追加
      const item = new Potion({
        id: 'test-item',
        name: 'Test Potion',
        description: 'Test description',
        type: ItemType.POTION,
        effects: [{ type: EffectType.HEAL_HP, value: 50 }],
      });
      player.getInventory().addItem(item);

      phase.enter();

      expect(Display.printInfo).toHaveBeenCalledWith('items: 1/100');
      expect(Display.println).toHaveBeenCalledWith('  1. Test Potion');
    });
  });

  describe('コマンド処理', () => {
    let testItem: Potion;

    beforeEach(() => {
      testItem = new Potion({
        id: 'test-item',
        name: 'Test Potion',
        description: 'Test description',
        type: ItemType.POTION,
        effects: [{ type: EffectType.HEAL_HP, value: 50 }],
      });
    });

    describe('consumeコマンド', () => {
      test('consumeコマンドでItemConsumptionフェーズに遷移する', async () => {
        player.getInventory().addItem(testItem);

        const result = await phase.processInput('consume');
        expect(result.success).toBe(true);
        expect(result.nextPhase).toBe('itemConsumption');
      });

      test('消費アイテムがない場合はItemConsumptionフェーズに遷移する', async () => {
        const result = await phase.processInput('consume');
        expect(result.success).toBe(true);
        expect(result.nextPhase).toBe('itemConsumption');
      });

      test('useコマンドは存在しない', async () => {
        const result = await phase.processInput('use');
        expect(result.success).toBe(false);
        expect(result.message).toBe('command not found: use');
      });
    });

    describe('アイテム廃棄', () => {
      test('dropコマンドは存在しない', async () => {
        const result = await phase.processInput('drop');
        expect(result.success).toBe(false);
        expect(result.message).toBe('command not found: drop');
      });
    });

    describe('フェーズ遷移', () => {
      test('backコマンドで探索フェーズに戻る', async () => {
        const result = await phase.processInput('back');
        expect(result.success).toBe(true);
        expect(result.nextPhase).toBe(PhaseTypes.EXPLORATION);
      });

      test('exitコマンドで探索フェーズに戻る', async () => {
        const result = await phase.processInput('exit');
        expect(result.success).toBe(true);
        expect(result.nextPhase).toBe(PhaseTypes.EXPLORATION);
      });
    });

    describe('システムコマンド', () => {
      test('helpコマンドでヘルプが表示される', async () => {
        const result = await phase.processInput('help');
        expect(result.success).toBe(true);
        expect(Display.printInfo).toHaveBeenCalledWith('commands:');
      });

      test('clearコマンドで画面がクリアされる', async () => {
        const result = await phase.processInput('clear');
        expect(result.success).toBe(true);
        expect(Display.clear).toHaveBeenCalled();
      });

      test('無効なコマンドはエラーになる', async () => {
        const result = await phase.processInput('invalid');
        expect(result.success).toBe(false);
        expect(result.message).toBe('command not found: invalid');
      });
    });
  });

  describe('装備UI機能', () => {
    describe('アクセサリスロット管理システム', () => {
      test('equipコマンドでItemEquipmentフェーズに遷移する', async () => {
        player.setWorldLevel(30);
        const catalog = AccessoryCatalog.load();
        const definition = catalog.getDefinition('glove');
        const accessory = new AccessoryItem({
          id: 'test-accessory',
          name: 'glove',
          description: 'Accessory for testing',
          type: ItemType.ACCESSORY,
          accessory: {
            id: definition.id,
            name: definition.name,
            grade: 20,
            mainEffect: { ...definition.mainEffect },
            subEffects: [],
          },
        });
        player.getAccessoryInventory().addItem(accessory);

        const result = await phase.processInput('equip');

        expect(result.success).toBe(true);
        expect(result.nextPhase).toBe('itemEquipment');
      });

      test('アクセサリが存在しない場合もItemEquipmentフェーズに遷移', async () => {
        const result = await phase.processInput('equip');

        expect(result.success).toBe(true);
        expect(result.nextPhase).toBe('itemEquipment');
      });

      // 装備関連のテストは削除 - これらの機能はItemEquipmentPhaseに移動
    });
  });

  describe('初期化とクリーンアップ', () => {
    test('initialize()でenterが呼ばれる', async () => {
      const enterSpy = jest.spyOn(phase, 'enter');
      await phase.initialize();
      expect(enterSpy).toHaveBeenCalled();
    });

    test('cleanup()は正常に完了する', async () => {
      await expect(phase.cleanup()).resolves.toBeUndefined();
    });

    test('exit()は正常に完了する', () => {
      expect(() => phase.exit()).not.toThrow();
    });
  });
});
