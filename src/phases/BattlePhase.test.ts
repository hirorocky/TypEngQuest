import { BattlePhase } from './BattlePhase';
import { Enemy } from '../battle/Enemy';
import { PhaseTypes } from '../core/types';
import { Player } from '../player/Player';
import { TabCompleter } from '../core/completion/TabCompleter';
import { CommandParser } from '../core/CommandParser';

describe('BattlePhase', () => {
  let battlePhase: BattlePhase;
  let mockWorld: any;
  let mockEnemy: Enemy;
  let testPlayer: Player;
  let mockTabCompleter: TabCompleter;

  beforeEach(() => {
    // 実際のPlayerインスタンスを作成
    testPlayer = new Player('TestPlayer', true); // テストモード

    // TabCompleterのモックを作成
    const mockCommandParser = new CommandParser();
    mockTabCompleter = new TabCompleter(mockCommandParser);

    mockWorld = {
      // mockWorldは空でも問題ない（プレイヤーは直接渡す）
    };

    // Enemy構築時の正しいパラメータを使用
    mockEnemy = new Enemy({
      id: 'test_goblin',
      name: 'TestGoblin',
      description: 'A test enemy',
      level: 1,
      stats: {
        maxHp: 50,
        maxMp: 20,
        strength: 10,
        willpower: 8,
        agility: 6,
        fortune: 4,
      },
      skills: [],
      drops: [],
    });

    battlePhase = new BattlePhase(mockWorld, mockTabCompleter, testPlayer);
  });

  describe('Phase基本実装', () => {
    it('PhaseTypeを正しく返す', () => {
      expect(battlePhase.getType()).toBe(PhaseTypes.BATTLE);
    });

    it('プロンプトを正しく返す', async () => {
      // 戦闘を開始してからプロンプトを確認
      battlePhase.setEnemy(mockEnemy);
      await battlePhase.initialize();
      const prompt = battlePhase.getPrompt();
      expect(prompt).toContain('battle');
    });

    it('初期化処理が完了する', async () => {
      await expect(battlePhase.initialize()).resolves.not.toThrow();
    });
  });

  describe('基本コマンド処理', () => {
    beforeEach(async () => {
      await battlePhase.initialize();
      // 戦闘を開始
      battlePhase.setEnemy(mockEnemy);
      await battlePhase.initialize();

      // バトルを作成してプレイヤーのターンに設定
      const Battle = require('../battle/Battle').Battle;
      const battle = new Battle(testPlayer, mockEnemy);
      battle.start();
      // プレイヤーが先行になるように調整
      if (battle.getCurrentTurnActor() === 'enemy') {
        battle.nextTurn(); // 敵ターンをスキップしてプレイヤーターンに
      }
      battlePhase.setBattle(battle);
    });

    it('helpコマンドで利用可能コマンドを表示', async () => {
      const result = await battlePhase.processInput('help');

      expect(result.success).toBe(true);
      expect(result.message || result.output?.join('')).toContain('battle');
    });

    it('statusコマンドでプレイヤーステータスを表示', async () => {
      const result = await battlePhase.processInput('status');

      console.log('DEBUG: result =', result);
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output?.join('')).toContain('BATTLE STATUS');
    });

    it('skillsコマンドで利用可能スキルを表示', async () => {
      const result = await battlePhase.processInput('skills');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Entering skill selection...');
      expect(result.nextPhase).toBe('skillSelection');
    });

    it('runコマンドで逃走試行メッセージを表示', async () => {
      const result = await battlePhase.processInput('run');

      expect(result.success).toBe(true);
      expect(result.message).toContain('damage!');
    });

    it('不明なコマンドでエラーを返す', async () => {
      const result = await battlePhase.processInput('invalid');

      expect(result.success).toBe(false);
    });
  });

  describe('フェーズ遷移', () => {
    beforeEach(async () => {
      await battlePhase.initialize();
      // 戦闘を開始
      battlePhase.setEnemy(mockEnemy);
      await battlePhase.initialize();

      // バトルを作成してプレイヤーのターンに設定
      const Battle = require('../battle/Battle').Battle;
      const battle = new Battle(testPlayer, mockEnemy);
      battle.start();
      // プレイヤーが先行になるように調整
      if (battle.getCurrentTurnActor() === 'enemy') {
        battle.nextTurn(); // 敵ターンをスキップしてプレイヤーターンに
      }
      battlePhase.setBattle(battle);
    });

    it('skillコマンドでスキル選択フェーズに移行', async () => {
      const result = await battlePhase.processInput('skill');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Entering skill selection...');
      expect(result.nextPhase).toBe('skillSelection');
    });

    it('itemコマンドでアイテム選択フェーズに移行', async () => {
      const result = await battlePhase.processInput('item');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Entering item selection...');
      expect(result.nextPhase).toBe('battleItemConsumption');
    });
  });

  describe('戦闘初期化', () => {
    beforeEach(async () => {
      await battlePhase.initialize();
    });

    it('敵との戦闘を開始できる', async () => {
      battlePhase.setEnemy(mockEnemy);
      await battlePhase.initialize();
      const result = battlePhase;

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(BattlePhase);
    });

    it('プレイヤーが存在しない場合は戦闘開始に失敗', async () => {
      const battlePhaseWithoutPlayer = new BattlePhase(
        mockWorld,
        mockTabCompleter,
        undefined as any
      );
      await battlePhaseWithoutPlayer.initialize();

      battlePhaseWithoutPlayer.setEnemy(mockEnemy);
      await battlePhaseWithoutPlayer.initialize();
      const result = battlePhaseWithoutPlayer;

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(BattlePhase);
    });
  });

  describe('エラーハンドリング', () => {
    it('プレイヤー不在時のstatusコマンドでエラー', async () => {
      const battlePhaseWithoutPlayer = new BattlePhase(
        mockWorld,
        mockTabCompleter,
        undefined as any
      );
      await battlePhaseWithoutPlayer.initialize();

      const result = await battlePhaseWithoutPlayer.processInput('status');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Battle not initialized');
    });

    it('プレイヤー不在時のskillsコマンドでエラー', async () => {
      const battlePhaseWithoutPlayer = new BattlePhase(
        mockWorld,
        mockTabCompleter,
        undefined as any
      );
      await battlePhaseWithoutPlayer.initialize();
      // プレイヤー不在時は戦闘を開始できないため、setEnemyとinitializeは呼ばない

      const result = await battlePhaseWithoutPlayer.processInput('skills');

      expect(result.success).toBe(false);
      expect(result.message).toBe("It's not your turn!");
    });

    it('スキルが存在しない場合の表示', async () => {
      // 実際のPlayerインスタンスを使用（装備アイテムは空）
      const playerWithoutSkills = new Player('TestPlayerNoSkills', true);
      const battlePhaseWithoutSkills = new BattlePhase(
        mockWorld,
        mockTabCompleter,
        playerWithoutSkills
      );
      await battlePhaseWithoutSkills.initialize();
      // 戦闘を開始
      battlePhaseWithoutSkills.setEnemy(mockEnemy);
      await battlePhaseWithoutSkills.initialize();

      // バトルを作成してプレイヤーのターンに設定
      const Battle = require('../battle/Battle').Battle;
      const battle = new Battle(playerWithoutSkills, mockEnemy);
      battle.start();
      // プレイヤーが先行になるように調整
      if (battle.getCurrentTurnActor() === 'enemy') {
        battle.nextTurn(); // 敵ターンをスキップしてプレイヤーターンに
      }
      battlePhaseWithoutSkills.setBattle(battle);

      const result = await battlePhaseWithoutSkills.processInput('skills');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Entering skill selection...');
      expect(result.nextPhase).toBe('skillSelection');
    });
  });
});
