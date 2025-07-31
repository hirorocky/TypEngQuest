/**
 * Title -> Exploration -> Inventoryフェーズ移行の統合テスト
 *
 * テスト対象:
 * - TitlePhaseからExplorationPhaseへの移行
 * - ExplorationPhaseからInventoryPhaseへの移行 
 * - InventoryPhaseからExplorationPhaseへの移行
 * - フェーズ移行時の状態管理
 * - アイテム操作の連携動作
 */

import { jest } from '@jest/globals';
import { TestGameHelper } from './helpers/TestGameHelper';
import { withMocks } from './helpers/SimplifiedMockHelper';
import { ConsumableItem, EffectType } from '../../items/ConsumableItem';
import { ItemType, ItemRarity } from '../../items/Item';

describe('Title -> Exploration -> Inventoryフェーズ移行の統合テスト', () => {
  let gameHelper: TestGameHelper;
  let mockRandom: any;

  beforeEach(() => {
    gameHelper = new TestGameHelper();
    // Math.randomをモックして決定的な動作にする
    mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    mockRandom.mockRestore();
  });

  afterEach(async () => {
    await gameHelper.cleanup();
  });

  describe('基本的なフェーズ移行', () => {
    test('Title -> Exploration -> Inventory -> Explorationの順でフェーズ移行できること', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();

      // モックを設定
      mocks.mockProcessExit();
      mocks.useFakeTimers();

      // 1. Title -> Exploration
      await game['transitionToPhase']('title');
      expect(game.getCurrentPhase()).toBe('title');

      const titlePhase = (game as any).currentPhase;
      const startResultPromise = titlePhase.processInput('start');
      
      // simulateLoadingの500msのsetTimeoutを進める
      jest.advanceTimersByTime(500);
      await Promise.resolve();

      const startResult = await startResultPromise;
      expect(startResult.success).toBe(true);
      expect(startResult.nextPhase).toBe('exploration');

      // 2. Exploration -> Inventory
      await game['transitionToPhase']('exploration');
      expect(game.getCurrentPhase()).toBe('exploration');

      const explorationPhase = (game as any).currentPhase;
      const inventoryResult = await explorationPhase.processInput('inventory');
      
      expect(inventoryResult.success).toBe(true);
      expect(inventoryResult.nextPhase).toBe('inventory');

      // 3. Inventory -> Exploration
      await game['transitionToPhase']('inventory');
      expect(game.getCurrentPhase()).toBe('inventory');

      const inventoryPhase = (game as any).currentPhase;
      const backResult = await inventoryPhase.processInput('back');
      
      expect(backResult.success).toBe(true);
      expect(backResult.nextPhase).toBe('exploration');
    }));

    test('inventoryコマンドの別名でも移行できること', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();
      mocks.mockProcessExit();

      await game['transitionToPhase']('exploration');
      const explorationPhase = (game as any).currentPhase;

      // inventoryコマンドのエイリアスをテスト
      const result = await explorationPhase.processInput('inv');
      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('inventory');
    }));
  });

  describe('Inventoryフェーズでの操作', () => {
    test('空のインベントリでもフェーズ移行できること', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();
      mocks.mockProcessExit();

      // Explorationフェーズに移行
      await game['transitionToPhase']('exploration');
      const explorationPhase = (game as any).currentPhase;

      // インベントリに移行
      const inventoryResult = await explorationPhase.processInput('inventory');
      expect(inventoryResult.success).toBe(true);
      expect(inventoryResult.nextPhase).toBe('inventory');

      // インベントリフェーズでの操作をテスト
      await game['transitionToPhase']('inventory');
      const inventoryPhase = (game as any).currentPhase;
      
      // 空のインベントリでのconsumeコマンドテスト
      const consumeResult = await inventoryPhase.processInput('consume');
      expect(consumeResult.success).toBe(true);
      expect(consumeResult.nextPhase).toBe('itemConsumption');

      // 戻るコマンドのテスト
      const exitResult = await inventoryPhase.processInput('exit');
      expect(exitResult.success).toBe(true);
      expect(exitResult.nextPhase).toBe('exploration');
    }));

    test('アイテムがある状態でのインベントリ操作', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();
      mocks.mockProcessExit();

      // プレイヤーにテストアイテムを追加
      await game['transitionToPhase']('exploration');
      const player = (game as any).currentPlayer;
      
      // プレイヤーにダメージを与える（HP回復アイテムを使用可能にするため）
      const stats = player.getStats();
      stats.takeDamage(30); // HPを減少させる
      
      const testItem = new ConsumableItem({
        id: 'test-potion-1',
        name: 'Test Potion',
        description: 'A test healing potion',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [{ type: EffectType.HEAL_HP, value: 50 }],
      });

      player.getInventory().addItem(testItem);

      // インベントリフェーズに移行
      const explorationPhase = (game as any).currentPhase;
      const inventoryResult = await explorationPhase.processInput('inventory');
      expect(inventoryResult.success).toBe(true);

      await game['transitionToPhase']('inventory');
      const inventoryPhase = (game as any).currentPhase;

      // ScrollableListのモックを設定
      const { ScrollableList } = require('../../ui/ScrollableList');
      jest.spyOn(ScrollableList.prototype, 'waitForSelection').mockResolvedValue(0);
      
      // アイテムの使用テスト
      const consumeResult = await inventoryPhase.processInput('consume');
      expect(consumeResult.success).toBe(true);
      expect(consumeResult.nextPhase).toBe('itemConsumption');

      // アイテムはまだインベントリに残っている（ItemConsumptionPhaseで削除される）
      const items = player.getInventory().getItems();
      expect(items.length).toBe(1);
    }));
  });

  describe('フェーズ移行時の画面表示', () => {
    test('各フェーズ移行時に適切な画面表示がされること', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();
      mocks.mockProcessExit();

      gameHelper.startCapturingConsole();

      // Title -> Exploration
      await game['transitionToPhase']('exploration');
      let output = gameHelper.getCapturedOutput();
      expect(output.some(line => line.includes('exploration'))).toBe(true);

      gameHelper.stopCapturingConsole();
      gameHelper.startCapturingConsole();

      // Exploration -> Inventory
      await game['transitionToPhase']('inventory');
      output = gameHelper.getCapturedOutput();
      expect(output.some(line => line.includes('inventory'))).toBe(true);

      gameHelper.stopCapturingConsole();
    }));

    test('inventoryコマンド実行時に適切なメッセージが表示されること', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();
      mocks.mockProcessExit();

      await game['transitionToPhase']('exploration');
      const explorationPhase = (game as any).currentPhase;

      gameHelper.startCapturingConsole();

      const result = await explorationPhase.processInput('inventory');
      expect(result.success).toBe(true);
      expect(result.message).toContain('opening inventory');

      gameHelper.stopCapturingConsole();
    }));
  });

  describe('エラーハンドリング', () => {
    test('inventoryフェーズで無効なコマンドを入力した場合のエラー処理', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();
      mocks.mockProcessExit();

      // ExplorationフェーズでWorld/Playerを初期化してからInventoryフェーズに移行
      await game['transitionToPhase']('exploration');
      await game['transitionToPhase']('inventory');
      const inventoryPhase = (game as any).currentPhase;

      const result = await inventoryPhase.processInput('invalidcommand');
      expect(result.success).toBe(false);
      expect(result.message).toContain('command not found');
      expect(result.nextPhase).toBeUndefined();
    }));

    test('inventoryフェーズでヘルプコマンドが正常動作すること', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();
      mocks.mockProcessExit();

      // ExplorationフェーズでWorld/Playerを初期化してからInventoryフェーズに移行
      await game['transitionToPhase']('exploration');
      await game['transitionToPhase']('inventory');
      const inventoryPhase = (game as any).currentPhase;

      // ヘルプコマンドのテスト
      const helpResult = await inventoryPhase.processInput('help');
      expect(helpResult.success).toBe(true);

      const hResult = await inventoryPhase.processInput('h');
      expect(hResult.success).toBe(true);

      const questionResult = await inventoryPhase.processInput('?');
      expect(questionResult.success).toBe(true);
    }));
  });

  describe('状態の一貫性', () => {
    test('フェーズ移行後もプレイヤーとワールドの状態が保持されること', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();
      mocks.mockProcessExit();

      // Explorationフェーズでプレイヤー状態を確認
      await game['transitionToPhase']('exploration');
      const originalPlayer = (game as any).currentPlayer;
      const originalWorld = (game as any).currentWorld;

      // Inventoryフェーズに移行
      await game['transitionToPhase']('inventory');
      const inventoryPhase = (game as any).currentPhase;

      // 同じプレイヤーとワールドが参照されていることを確認
      expect(inventoryPhase['player']).toBe(originalPlayer);
      expect(inventoryPhase['world']).toBe(originalWorld);

      // Explorationフェーズに戻る
      await game['transitionToPhase']('exploration');
      const newExplorationPhase = (game as any).currentPhase;

      // 状態が維持されていることを確認
      expect(newExplorationPhase['player']).toBe(originalPlayer);
      expect(newExplorationPhase['world']).toBe(originalWorld);
    }));

    test('インベントリ操作がプレイヤー状態に正しく反映されること', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();
      mocks.mockProcessExit();

      await game['transitionToPhase']('exploration');
      const player = (game as any).currentPlayer;

      // テストアイテムを追加
      const testItem = new ConsumableItem({
        id: 'hp-potion-test',
        name: 'HP Potion',
        description: 'Restores 30 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [{ type: EffectType.HEAL_HP, value: 30 }],
      });

      player.getInventory().addItem(testItem);
      const initialItemCount = player.getInventory().getItemCount();
      expect(initialItemCount).toBe(1);

      // プレイヤーにダメージを与える（HP回復をテストするため）
      const stats = player.getStats();
      const maxHP = stats.getMaxHP();
      stats.takeDamage(20);
      const damagedHP = stats.getCurrentHP();
      expect(damagedHP).toBe(maxHP - 20);

      // Inventoryフェーズでアイテム使用
      await game['transitionToPhase']('inventory');
      const inventoryPhase = (game as any).currentPhase;
      
      // ScrollableListのモックを設定
      const { ScrollableList } = require('../../ui/ScrollableList');
      jest.spyOn(ScrollableList.prototype, 'waitForSelection').mockResolvedValue(0);
      
      await inventoryPhase.processInput('consume');

      // アイテムはまだインベントリに残っている（ItemConsumptionPhaseで使用されるまで）
      expect(player.getInventory().getItemCount()).toBe(1);
      expect(stats.getCurrentHP()).toBe(damagedHP); // HPはまだ回復していない
    }));
  });
});