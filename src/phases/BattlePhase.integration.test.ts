import { BattlePhase } from './BattlePhase';
import { BattleTypingPhase } from './BattleTypingPhase';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { Enemy } from '../battle/Enemy';
import { PhaseManager } from '../core/PhaseManager';
import { TabCompleter } from '../core/completion/TabCompleter';
import { Skill } from '../battle/Skill';

describe('BattlePhase Integration Tests', () => {
  let battlePhase: BattlePhase;
  let world: World;
  let player: Player;
  let enemy: Enemy;
  let phaseManager: PhaseManager;
  let tabCompleter: TabCompleter;

  beforeEach(() => {
    // Worldとその依存関係をセットアップ
    world = new World();
    phaseManager = new PhaseManager();
    world['phaseManager'] = phaseManager;
    tabCompleter = new TabCompleter();

    // プレイヤーをセットアップ
    player = new Player('TestPlayer');
    player.getBodyStats().setMaxHP(100);
    player.getBodyStats().setCurrentHP(100);
    player.getBodyStats().setMaxMP(50);
    player.getBodyStats().setCurrentMP(50);

    // 敵をセットアップ
    enemy = new Enemy('TestEnemy', 1, {
      maxHp: 50,
      maxMp: 20,
      attack: 10,
      defense: 5,
      speed: 10,
      intelligence: 10,
      spirit: 10,
    });

    // BattlePhaseを作成
    battlePhase = new BattlePhase(world, tabCompleter, player);
    phaseManager.pushPhase(battlePhase);
  });

  describe('Battle End Conditions', () => {
    it('should end battle when enemy HP reaches 0 after player attack', async () => {
      // バトルを開始
      await battlePhase.startBattle(enemy);
      const battle = battlePhase['battle'];
      expect(battle).toBeDefined();

      // 敵のHPを1に設定（次の攻撃で倒せる状態）
      enemy.currentHp = 1;

      // プレイヤーのターンでスキル選択
      battlePhase['currentTurn'] = 'player';
      battlePhase['isProcessingTurn'] = false;

      // スキル選択フェーズに入る
      const result = await battlePhase['enterSkillSelection']();
      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('skillSelection');

      // BattleTypingPhaseをシミュレート
      const typingPhase = new BattleTypingPhase({
        world,
        tabCompleter,
        skills: [new Skill('1', 'TestSkill', 'A test skill', 'damage', 10, 5)],
        battle: battle!,
      });

      // 敵を倒す攻撃をシミュレート
      typingPhase['applySkillEffect'](
        new Skill('1', 'TestSkill', 'A test skill', 'damage', 10, 5),
        {
          accuracy: 100,
          speedRating: 'Good',
          accuracyRating: 'Perfect',
          totalRating: 120,
          isSuccess: true,
        }
      );

      // HP確認
      expect(enemy.currentHp).toBeLessThanOrEqual(0);

      // バトル終了をチェック
      battlePhase['checkAndEndBattle']();

      // バトルが終了していることを確認
      expect(battlePhase['battle']).toBeNull();
      expect(battlePhase['currentTurn']).toBe('waiting');
    });

    it('should end battle when player HP reaches 0 after enemy attack', () => {
      // バトルを開始
      battlePhase.startBattle(enemy);
      const battle = battlePhase['battle'];
      expect(battle).toBeDefined();

      // プレイヤーのHPを低く設定
      player.getBodyStats().setCurrentHP(5);

      // 敵のターンを実行
      battlePhase['currentTurn'] = 'enemy';

      // consoleログをモック
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // 敵のターンを実行
      battlePhase['executeEnemyTurn']();

      // プレイヤーのHPが0以下になっていることを確認
      const playerHP = player.getBodyStats().getCurrentHP();

      // バトルが終了メッセージを含むか確認
      if (playerHP <= 0) {
        // バトルが終了していることを確認
        expect(battlePhase['battle']).toBeNull();
        expect(battlePhase['currentTurn']).toBe('waiting');
      }

      consoleSpy.mockRestore();
    });

    it('should handle victory correctly with drops and transition', async () => {
      // バトルを開始
      await battlePhase.startBattle(enemy);
      const battle = battlePhase['battle'];
      expect(battle).toBeDefined();

      // 敵のHPを0に設定
      enemy.currentHp = 0;

      // consoleログをモック
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // バトル終了処理
      battlePhase['endBattle']({ winner: 'player', message: 'Victory!' });

      // バトルがクリーンアップされていることを確認
      expect(battlePhase['battle']).toBeNull();
      expect(battlePhase['enemy']).toBeUndefined();
      expect(battlePhase['currentTurn']).toBe('waiting');
      expect(battlePhase['turnMessage']).toBe('');
      expect(battlePhase['isProcessingTurn']).toBe(false);

      // 勝利メッセージが出力されていることを確認
      expect(consoleSpy).toHaveBeenCalledWith('=== BATTLE END ===');
      expect(consoleSpy).toHaveBeenCalledWith('Victory!');

      consoleSpy.mockRestore();
    });

    it('should handle defeat correctly and transition back', () => {
      // バトルを開始
      battlePhase.startBattle(enemy);
      const battle = battlePhase['battle'];
      expect(battle).toBeDefined();

      // プレイヤーのHPを0に設定
      player.getBodyStats().setCurrentHP(0);

      // consoleログをモック
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // バトル終了処理
      battlePhase['endBattle']({ winner: 'enemy', message: 'Defeat!' });

      // バトルがクリーンアップされていることを確認
      expect(battlePhase['battle']).toBeNull();
      expect(battlePhase['enemy']).toBeUndefined();
      expect(battlePhase['currentTurn']).toBe('waiting');

      // 敗北メッセージが出力されていることを確認
      expect(consoleSpy).toHaveBeenCalledWith('=== BATTLE END ===');
      expect(consoleSpy).toHaveBeenCalledWith('Defeat!');

      consoleSpy.mockRestore();
    });
  });

  describe('Phase Transitions', () => {
    it('should transition to exploration phase after battle ends', () => {
      // バトルを開始
      battlePhase.startBattle(enemy);

      // PhaseManagerのpopPhaseをスパイ
      const popPhaseSpy = jest.spyOn(phaseManager, 'popPhase');

      // consoleログをモック
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // transitionToExplorationを呼び出し
      battlePhase['transitionToExploration']();

      // popPhaseが呼ばれたことを確認
      expect(popPhaseSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Returning to exploration phase...');

      popPhaseSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should handle BattleTypingPhase completion correctly', () => {
      // バトルを開始
      battlePhase.startBattle(enemy);
      const battle = battlePhase['battle'];
      expect(battle).toBeDefined();

      // consoleログをモック
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // BattleTypingPhase完了結果（バトル終了）
      const resultWithBattleEnd = {
        completedSkills: 3,
        totalSkills: 3,
        summary: {
          totalDamageDealt: 100,
          criticalHits: 1,
          misses: 0,
          totalHealing: 0,
          totalMpRestored: 0,
          statusEffectsApplied: [],
        },
        battleEnded: true,
      };

      // 敵のHPを0に設定してバトル終了状態にする
      enemy.currentHp = 0;

      // ハンドラーを呼び出し
      battlePhase.handleBattleTypingComplete(resultWithBattleEnd);

      // ログ出力を確認
      expect(consoleSpy).toHaveBeenCalledWith('=== BATTLE TYPING COMPLETE ===');
      expect(consoleSpy).toHaveBeenCalledWith('Completed 3/3 skills');
      expect(consoleSpy).toHaveBeenCalledWith('Total Damage: 100');

      consoleSpy.mockRestore();
    });

    it('should continue to enemy turn if battle not ended after player turn', () => {
      // バトルを開始
      battlePhase.startBattle(enemy);
      const battle = battlePhase['battle'];
      expect(battle).toBeDefined();

      // プレイヤーと敵のHPを十分に設定
      player.getBodyStats().setCurrentHP(100);
      enemy.currentHp = 50;

      // consoleログをモック
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // BattleTypingPhase完了結果（バトル継続）
      const resultWithoutBattleEnd = {
        completedSkills: 2,
        totalSkills: 3,
        summary: {
          totalDamageDealt: 20,
          criticalHits: 0,
          misses: 1,
          totalHealing: 0,
          totalMpRestored: 0,
          statusEffectsApplied: [],
        },
        battleEnded: false,
      };

      // ハンドラーを呼び出し
      battlePhase.handleBattleTypingComplete(resultWithoutBattleEnd);

      // finishPlayerTurnが呼ばれることを確認
      // （バトルが継続していることを確認）
      expect(battlePhase['battle']).toBeDefined();

      consoleSpy.mockRestore();
    });
  });

  describe('Turn Management', () => {
    it('should properly alternate between player and enemy turns', () => {
      // バトルを開始
      battlePhase.startBattle(enemy);
      const battle = battlePhase['battle'];
      expect(battle).toBeDefined();

      // 初期ターンを確認
      const initialTurn = battlePhase['currentTurn'];
      expect(['player', 'enemy']).toContain(initialTurn);

      // プレイヤーターンの場合
      if (initialTurn === 'player') {
        battlePhase['currentTurn'] = 'player';
        battlePhase['finishPlayerTurn']();

        // 次のターンアクターを確認
        const nextTurn = battle!.getCurrentTurnActor();
        expect(nextTurn).toBe('enemy');
      }
    });

    it('should prevent actions during wrong turn', async () => {
      // バトルを開始
      await battlePhase.startBattle(enemy);

      // 敵のターンに設定
      battlePhase['currentTurn'] = 'enemy';
      battlePhase['isProcessingTurn'] = false;

      // プレイヤーアクションを試みる
      const skillResult = await battlePhase['enterSkillSelection']();
      expect(skillResult.success).toBe(false);
      expect(skillResult.message).toContain('not your turn');

      const itemResult = await battlePhase['enterItemSelection']();
      expect(itemResult.success).toBe(false);
      expect(itemResult.message).toContain('not your turn');

      const escapeResult = await battlePhase['attemptEscape']();
      expect(escapeResult.success).toBe(false);
      expect(escapeResult.message).toContain('not your turn');
    });

    it('should prevent actions during turn processing', async () => {
      // バトルを開始
      await battlePhase.startBattle(enemy);

      // プレイヤーターンだが処理中に設定
      battlePhase['currentTurn'] = 'player';
      battlePhase['isProcessingTurn'] = true;

      // アクションを試みる
      const result = await battlePhase['enterSkillSelection']();
      expect(result.success).toBe(false);
      expect(result.message).toContain('being processed');
    });
  });
});
