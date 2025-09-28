import { BattleItemConsumptionPhase } from './BattleItemConsumptionPhase';
import { PhaseTypes } from '../core/types';
import { ItemType } from '../items/types';

describe('BattleItemConsumptionPhase', () => {
  let battleItemPhase: BattleItemConsumptionPhase;
  let mockPlayer: any;
  let mockOnItemUsed: jest.Mock;
  let mockOnBack: jest.Mock;

  beforeEach(() => {
    mockPlayer = {
      getInventory: jest.fn().mockReturnValue({
        getItems: jest.fn().mockReturnValue([
          {
            name: 'Health Potion',
            type: 'potion',
            effects: [{ type: 'heal', value: 50 }],
            use: jest.fn().mockResolvedValue({ success: true }),
            getType: jest.fn().mockReturnValue(ItemType.POTION),
            getName: jest.fn().mockReturnValue('Health Potion'),
            getEffects: jest.fn().mockReturnValue([{ type: 'heal', value: 50 }]),
          },
          {
            name: 'Mana Potion',
            type: 'potion',
            effects: [{ type: 'restore_mp', value: 30 }],
            use: jest.fn().mockResolvedValue({ success: true }),
            getType: jest.fn().mockReturnValue(ItemType.POTION),
            getName: jest.fn().mockReturnValue('Mana Potion'),
            getEffects: jest.fn().mockReturnValue([{ type: 'restore_mp', value: 30 }]),
          },
          {
            name: 'Charm',
            type: 'accessory',
            effects: [{ type: 'fortune', value: 10 }],
            getType: jest.fn().mockReturnValue(ItemType.ACCESSORY),
            getName: jest.fn().mockReturnValue('Charm'),
            getEffects: jest.fn().mockReturnValue([{ type: 'fortune', value: 10 }]),
          },
        ]),
        removeItem: jest.fn(),
      }),
      getBodyStats: jest.fn().mockReturnValue({
        getCurrentHP: jest.fn().mockReturnValue(50),
        getMaxHP: jest.fn().mockReturnValue(100),
        getCurrentMP: jest.fn().mockReturnValue(20),
        getMaxMP: jest.fn().mockReturnValue(50),
      }),
    };

    mockOnItemUsed = jest.fn();
    mockOnBack = jest.fn();
    battleItemPhase = new BattleItemConsumptionPhase({
      player: mockPlayer,
      onItemUsed: mockOnItemUsed,
      onBack: mockOnBack,
    });
  });

  describe('Phase基本実装', () => {
    it('PhaseTypeを正しく返す', () => {
      expect(battleItemPhase.getType()).toBe(PhaseTypes.BATTLE_ITEM_CONSUMPTION);
    });

    it('プロンプトを正しく返す', () => {
      const prompt = battleItemPhase.getPrompt();
      expect(prompt).toContain('item');
    });

    it('初期化処理が完了する', async () => {
      await expect(battleItemPhase.initialize()).resolves.not.toThrow();
    });
  });

  describe('アイテム表示と使用', () => {
    beforeEach(async () => {
      await battleItemPhase.initialize();
    });

    it('利用可能消費アイテム一覧を表示', async () => {
      const result = await battleItemPhase.processInput('list');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Available items');
      expect(result.output).toContain('  1. Health Potion (heal: 50)');
      expect(result.output).toContain('  2. Mana Potion (restore_mp: 30)');
      expect(result.output).not.toContain('Charm'); // 非消費アイテムは除外
    });

    it('アイテム番号選択で正しいアイテムを使用', async () => {
      const result = await battleItemPhase.processInput('1');

      expect(result.success).toBe(true);
      expect(mockOnItemUsed).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Health Potion' })
      );
    });

    it('アイテム名で選択', async () => {
      const result = await battleItemPhase.processInput('mana potion');

      expect(result.success).toBe(true);
      expect(mockOnItemUsed).toHaveBeenCalledWith(expect.objectContaining({ name: 'Mana Potion' }));
    });

    it('アイテム使用後にインベントリから削除', async () => {
      const removeItemSpy = jest.fn();
      mockPlayer.getInventory().removeItem = removeItemSpy;

      await battleItemPhase.processInput('1');

      expect(removeItemSpy).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Health Potion' })
      );
    });
  });

  describe('コマンド処理', () => {
    beforeEach(async () => {
      await battleItemPhase.initialize();
    });

    it('helpコマンドで利用可能コマンドを表示', async () => {
      const result = await battleItemPhase.processInput('help');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Item Selection Commands');
    });

    it('backコマンドで前フェーズに戻る', async () => {
      const result = await battleItemPhase.processInput('back');

      expect(result.success).toBe(true);
      expect(mockOnBack).toHaveBeenCalled();
    });

    it('statusコマンドでプレイヤー状態を表示', async () => {
      const result = await battleItemPhase.processInput('status');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Player Status:');
      expect(result.output).toContain('  HP: 50/100');
      expect(result.output).toContain('  MP: 20/50');
    });

    it('不正なアイテム番号でエラー', async () => {
      const result = await battleItemPhase.processInput('999');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown command');
    });

    it('存在しないアイテム名でエラー', async () => {
      const result = await battleItemPhase.processInput('nonexistent');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown command');
    });
  });

  describe('エラーハンドリング', () => {
    it('消費アイテムが存在しない場合の処理', async () => {
      mockPlayer.getInventory().getItems.mockReturnValue([
        {
          name: 'Charm',
          type: 'accessory',
          effects: [{ type: 'fortune', value: 10 }],
          getType: jest.fn().mockReturnValue(ItemType.ACCESSORY),
          getName: jest.fn().mockReturnValue('Charm'),
          getEffects: jest.fn().mockReturnValue([{ type: 'fortune', value: 10 }]),
        },
      ]);
      const emptyItemPhase = new BattleItemConsumptionPhase({
        player: mockPlayer,
        onItemUsed: mockOnItemUsed,
        onBack: mockOnBack,
      });
      await emptyItemPhase.initialize();

      const result = await emptyItemPhase.processInput('list');

      expect(result.success).toBe(true);
      expect(result.message).toContain('No potions available');
    });

    it('プレイヤーが存在しない場合の処理', async () => {
      const phaseWithoutPlayer = new BattleItemConsumptionPhase({
        player: null as any,
        onItemUsed: mockOnItemUsed,
        onBack: mockOnBack,
      });
      await phaseWithoutPlayer.initialize();

      const result = await phaseWithoutPlayer.processInput('list');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Player not available');
    });

    it('アイテム使用失敗時の処理', async () => {
      const failingItem = {
        name: 'Broken Potion',
        type: 'potion',
        effects: [{ type: 'heal', value: 50 }],
        use: jest.fn().mockRejectedValue(new Error('Item is broken')),
        getType: jest.fn().mockReturnValue(ItemType.POTION),
        getName: jest.fn().mockReturnValue('Broken Potion'),
        getEffects: jest.fn().mockReturnValue([{ type: 'heal', value: 50 }]),
      };
      mockPlayer.getInventory().getItems.mockReturnValue([failingItem]);

      const failingPhase = new BattleItemConsumptionPhase({
        player: mockPlayer,
        onItemUsed: mockOnItemUsed,
        onBack: mockOnBack,
      });
      await failingPhase.initialize();

      const result = await failingPhase.processInput('1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to use item');
    });
  });
});
