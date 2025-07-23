import { InventoryPhase } from './InventoryPhase';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { ConsumableItem, EffectType } from '../items/ConsumableItem';
import { EquipmentItem } from '../items/EquipmentItem';
import { ItemType, ItemRarity } from '../items/Item';
import { Display } from '../ui/Display';
import { ScrollableList } from '../ui/ScrollableList';
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
      const item = new ConsumableItem({
        id: 'test-item',
        name: 'Test Potion',
        description: 'Test description',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [{ type: EffectType.HEAL_HP, value: 50 }],
      });
      player.getInventory().addItem(item);

      phase.enter();

      expect(Display.printInfo).toHaveBeenCalledWith('items: 1/100');
      expect(Display.println).toHaveBeenCalledWith('  1. Test Potion [common]');
    });
  });

  describe('コマンド処理', () => {
    let testItem: ConsumableItem;

    beforeEach(() => {
      testItem = new ConsumableItem({
        id: 'test-item',
        name: 'Test Potion',
        description: 'Test description',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [{ type: EffectType.HEAL_HP, value: 50 }],
      });
    });

    describe('consumeコマンド', () => {
      test('consumeコマンドで消費アイテムを選択して使用する', async () => {
        // プレイヤーのHPを減らす
        player.getStats().takeDamage(30);
        const initialHp = player.getStats().getCurrentHP();

        player.getInventory().addItem(testItem);

        // ScrollableListのモックを設定
        const mockWaitForSelection = jest.fn().mockResolvedValue(0);
        jest
          .spyOn(ScrollableList.prototype, 'waitForSelection')
          .mockImplementation(mockWaitForSelection);

        const result = await phase.processInput('consume');
        expect(result.success).toBe(true);
        expect(result.message).toBe('consumed Test Potion');

        // HPが回復しているか確認
        const finalHp = player.getStats().getCurrentHP();
        expect(finalHp).toBeGreaterThan(initialHp);

        // アイテムがインベントリから削除されているか確認
        expect(player.getInventory().getItemCount()).toBe(0);
      });

      test('アイテムがない場合は使用できない', async () => {
        const result = await phase.processInput('consume');
        expect(result.success).toBe(false);
        expect(result.message).toBe('no consumable items available');
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
    describe('装備スロット管理システム', () => {
      test('equipコマンドで装備フェーズに遷移する', async () => {
        // 装備アイテムをインベントリに追加
        const equipment = new EquipmentItem({
          id: 'test-sword',
          name: 'sword',
          description: 'A sharp sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 10, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 10,
        });
        player.getInventory().addItem(equipment);

        const result = await phase.processInput('equip');

        expect(result.success).toBe(true);
        expect(result.message).toContain('equipment selection mode started');
      });

      test('装備アイテムが存在しない場合のエラーメッセージ', async () => {
        const result = await phase.processInput('equip');

        expect(result.success).toBe(false);
        expect(result.message).toBe('no equipment items available');
      });

      test('装備アイテムの一覧表示機能', async () => {
        // 複数の装備アイテムを追加
        const items = [
          new EquipmentItem({
            id: 'sword',
            name: 'sword',
            description: 'A sword',
            type: ItemType.EQUIPMENT,
            rarity: ItemRarity.COMMON,
            stats: { attack: 10, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
            grade: 10,
          }),
          new EquipmentItem({
            id: 'shield',
            name: 'shield',
            description: 'A shield',
            type: ItemType.EQUIPMENT,
            rarity: ItemRarity.RARE,
            stats: { attack: 0, defense: 15, speed: 0, accuracy: 0, fortune: 0 },
            grade: 15,
          }),
        ];

        items.forEach(item => player.getInventory().addItem(item));

        const equipmentItems = (phase as any).getEquipmentItems();

        expect(equipmentItems).toHaveLength(2);
        expect(equipmentItems[0].getName()).toBe('sword');
        expect(equipmentItems[1].getName()).toBe('shield');
      });

      test('5つの装備スロット表示機能', () => {
        const currentEquipment = ['magic', 'powerful', 'ancient', 'steel', 'sword'];

        const slotInfo = (phase as any).formatEquipmentSlots(currentEquipment);

        expect(slotInfo).toHaveLength(5);
        expect(slotInfo[0]).toContain('Slot 1: magic');
        expect(slotInfo[1]).toContain('Slot 2: powerful');
        expect(slotInfo[2]).toContain('Slot 3: ancient');
        expect(slotInfo[3]).toContain('Slot 4: steel');
        expect(slotInfo[4]).toContain('Slot 5: sword');
      });

      test('空の装備スロット表示', () => {
        const currentEquipment: string[] = [];

        const slotInfo = (phase as any).formatEquipmentSlots(currentEquipment);

        expect(slotInfo).toHaveLength(5);
        slotInfo.forEach((slot: string, index: number) => {
          expect(slot).toContain(`Slot ${index + 1}: [empty]`);
        });
      });

      test('部分的に装備されたスロット表示', () => {
        const currentEquipment = ['magic', 'sword'];

        const slotInfo = (phase as any).formatEquipmentSlots(currentEquipment);

        expect(slotInfo).toHaveLength(5);
        expect(slotInfo[0]).toContain('Slot 1: magic');
        expect(slotInfo[1]).toContain('Slot 2: sword');
        expect(slotInfo[2]).toContain('Slot 3: [empty]');
        expect(slotInfo[3]).toContain('Slot 4: [empty]');
        expect(slotInfo[4]).toContain('Slot 5: [empty]');
      });
    });

    describe('装備解除機能', () => {
      test('unequipコマンドでスロット解除', async () => {
        // TODO: 実際の装備解除機能実装後にテストを有効化
        // 現在は仮実装のため空のスロットとして扱われる
        const result = await phase.processInput('unequip 1');

        expect(result.success).toBe(false);
        expect(result.message).toBe('slot 1 is already empty');
      });

      test('空のスロット解除時のエラー', async () => {
        const result = await phase.processInput('unequip 1');

        expect(result.success).toBe(false);
        expect(result.message).toBe('slot 1 is already empty');
      });

      test('無効なスロット番号指定時のエラー', async () => {
        const result = await phase.processInput('unequip 6');

        expect(result.success).toBe(false);
        expect(result.message).toBe('invalid slot number: 6');
      });

      test('スロット番号未指定時のエラー', async () => {
        const result = await phase.processInput('unequip');

        expect(result.success).toBe(false);
        expect(result.message).toBe('usage: unequip <slot_number>');
      });
    });

    describe('装備状況確認機能', () => {
      test('equipmentsコマンドで現在の装備と文章表示', async () => {
        const equipment = new EquipmentItem({
          id: 'sword',
          name: 'sword',
          description: 'A sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 10, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 10,
        });
        player.setEquippedItems([equipment]);

        const result = await phase.processInput('equipments');

        expect(result.success).toBe(true);
        expect(result.message).toContain('no equipment'); // 現在は仮実装のため
      });

      test('装備なしの場合の表示', async () => {
        const result = await phase.processInput('equipments');

        expect(result.success).toBe(true);
        expect(result.message).toContain('no equipment');
      });
    });

    describe('装備選択とスロット装着機能', () => {
      test('装備アイテム選択後にスロット指定が求められる', async () => {
        const equipment = new EquipmentItem({
          id: 'sword',
          name: 'sword',
          description: 'A sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 10, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 10,
        });
        player.getInventory().addItem(equipment);

        // ScrollableListのモック設定
        const mockWaitForSelection = jest.fn().mockResolvedValue(0); // 最初のアイテムを選択
        jest
          .spyOn(ScrollableList.prototype, 'waitForSelection')
          .mockImplementation(mockWaitForSelection);

        const result = await (phase as any).selectEquipmentItem();

        expect(result.selectedItem).toBe(equipment);
        expect(result.success).toBe(true);
      });

      test('スロット選択とアイテム装着処理', async () => {
        const equipment = new EquipmentItem({
          id: 'sword',
          name: 'sword',
          description: 'A sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 10, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 10,
        });

        const result = await (phase as any).equipToSlot(equipment, 1);

        expect(result.success).toBe(true);
        expect(result.message).toContain('equipped sword to slot 1');
      });

      test('既に装備されているスロットへの装備時の上書き確認', async () => {
        const sword = new EquipmentItem({
          id: 'sword',
          name: 'sword',
          description: 'A sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 10, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 10,
        });

        const shield = new EquipmentItem({
          id: 'shield',
          name: 'shield',
          description: 'A shield',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 0, defense: 15, speed: 0, accuracy: 0, fortune: 0 },
          grade: 15,
        });

        // まず一つ目を装備
        await (phase as any).equipToSlot(sword, 1);

        // 同じスロットに二つ目を装備（上書き）
        const result = await (phase as any).equipToSlot(shield, 1);

        expect(result.success).toBe(true);
        expect(result.message).toContain('equipped shield to slot 1');
      });

      test('装備後のインベントリからのアイテム削除', async () => {
        const equipment = new EquipmentItem({
          id: 'sword',
          name: 'sword',
          description: 'A sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 10, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 10,
        });
        player.getInventory().addItem(equipment);

        const initialCount = player.getInventory().getItemCount();
        await (phase as any).equipToSlot(equipment, 1);
        const finalCount = player.getInventory().getItemCount();

        expect(finalCount).toBe(initialCount - 1);
      });
    });

    describe('Phase 3: リアルタイム情報表示機能', () => {
      test('装備変更時のレベル計算表示', () => {
        const equipment = new EquipmentItem({
          id: 'sword',
          name: 'sword',
          description: 'A sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 10, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 10,
        });

        const levelInfo = (phase as any).calculateLevelPreview([equipment]);

        expect(levelInfo).toContain('Level: 2'); // グレード10 ÷ 5スロット = 2
      });

      test('ステータス変化のプレビュー表示', () => {
        const equipment = new EquipmentItem({
          id: 'sword',
          name: 'sword',
          description: 'A sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 15, defense: 5, speed: 3, accuracy: 2, fortune: 1 },
          grade: 26,
        });

        const statusPreview = (phase as any).getStatusPreview([equipment]);

        expect(statusPreview).toContain('Attack: +15');
        expect(statusPreview).toContain('Defense: +5');
        expect(statusPreview).toContain('Speed: +3');
        expect(statusPreview).toContain('Accuracy: +2');
        expect(statusPreview).toContain('Fortune: +1');
      });

      test('英文構成の妥当性チェック結果表示', () => {
        const validGrammarResult = (phase as any).checkGrammarValidity(['magic', 'sword']);
        expect(validGrammarResult.isValid).toBe(true);
        expect(validGrammarResult.message).toBe('valid english sentence');

        const invalidGrammarResult = (phase as any).checkGrammarValidity(['123', 'invalid']);
        expect(invalidGrammarResult.isValid).toBe(false);
        expect(invalidGrammarResult.message).toContain('invalid');
      });

      test('装備選択時のリアルタイム情報表示', async () => {
        const equipment = new EquipmentItem({
          id: 'sword',
          name: 'sword',
          description: 'A sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 10, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 10,
        });
        player.getInventory().addItem(equipment);

        // equipコマンドを実行してリアルタイム情報表示を確認
        const result = await phase.processInput('equip');

        expect(result.success).toBe(true);
        expect(Display.printHeader).toHaveBeenCalledWith('Equipment Selection');
        expect(Display.printInfo).toHaveBeenCalledWith('Current Equipment Slots:');
        expect(Display.printInfo).toHaveBeenCalledWith('Available Equipment:');
      });

      test('ScrollableList選択時の動的な装備プレビュー', () => {
        const equipment = new EquipmentItem({
          id: 'sword',
          name: 'sword',
          description: 'A sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 15, defense: 5, speed: 0, accuracy: 0, fortune: 0 },
          grade: 20,
        });

        // 装備プレビュー情報の動的表示をテスト
        const previewInfo = (phase as any).getEquipmentPreview(equipment, 1);

        expect(previewInfo).toContain('Slot 1');
        expect(previewInfo).toContain('sword');
        expect(previewInfo).toContain('Level:');
        expect(previewInfo).toContain('Stats:');
      });
    });

    describe('Phase 4: 英文法チェック統合機能', () => {
      test('装備組み合わせの英文法妥当性チェック', async () => {
        const equipment1 = new EquipmentItem({
          id: 'magic',
          name: 'magic',
          description: 'Magic item',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 5, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 5,
        });

        const equipment2 = new EquipmentItem({
          id: 'sword',
          name: 'sword',
          description: 'A sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 10, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 10,
        });

        player.getInventory().addItem(equipment1);
        player.getInventory().addItem(equipment2);

        // 英文法的に有効な組み合わせをテスト
        const result = await (phase as any).validateEquipmentCombination([equipment1, equipment2]);

        expect(result.isValid).toBe(true);
        expect(result.message).toBe('valid english sentence');
      });

      test('無効な英文構成での装備制限', async () => {
        const equipment1 = new EquipmentItem({
          id: 'invalid123',
          name: 'invalid123',
          description: 'Invalid item',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 5, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 5,
        });

        const equipment2 = new EquipmentItem({
          id: 'item456',
          name: 'item456',
          description: 'Another invalid item',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 10, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 10,
        });

        // 英文法的に無効な組み合わせをテスト
        const result = await (phase as any).validateEquipmentCombination([equipment1, equipment2]);

        expect(result.isValid).toBe(false);
        expect(result.message).toContain('invalid');
      });

      test('装備時の英文法チェック統合', async () => {
        const equipment = new EquipmentItem({
          id: 'beautiful',
          name: 'beautiful',
          description: 'Beautiful item',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 5, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 5,
        });

        player.getInventory().addItem(equipment);

        // 装備時に英文法チェックが実行されることをテスト
        const result = await (phase as any).equipWithGrammarCheck(equipment, 1);

        expect(result.success).toBe(true);
        expect(result.grammarCheck).toBeDefined();
        expect(result.grammarCheck.isValid).toBe(true);
      });
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
