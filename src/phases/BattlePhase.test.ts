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
        strength: 10,
        willpower: 8,
        agility: 6,
        fortune: 4,
      },
      physicalEvadeRate: 12,
      magicalEvadeRate: 8,
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
      // Math.randomを3層判定システム用に複数回の判定に対応
      // 逃走失敗 → 敵のターン → 敵の攻撃成功でダメージ発生
      const mockRandom = jest
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.01) // 敵スキル成功
        .mockReturnValueOnce(0.99) // プレイヤーの回避失敗
        .mockReturnValueOnce(0.01) // 効果成功
        .mockReturnValueOnce(0.95); // クリティカル失敗

      const result = await battlePhase.processInput('run');

      expect(result.success).toBe(true);
      expect(result.message).toContain('damage!');

      mockRandom.mockRestore();
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

  describe('敵の次回行動予告表示', () => {
    it('敵がスキルを持つ場合、次回行動を表示できる', () => {
      const enemyWithSkills = new Enemy({
        id: 'skilled_enemy',
        name: 'Skilled Enemy',
        description: 'Enemy with skills',
        level: 3,
        stats: { maxHp: 80, strength: 15, willpower: 12, agility: 70, fortune: 8 },
        physicalEvadeRate: 12,
        magicalEvadeRate: 8,
        skills: [
          {
            id: 'power_strike',
            name: 'Power Strike',
            description: 'A powerful physical attack',
            skillType: 'physical',
            mpCost: 0,
            mpCharge: 0,
            actionCost: 1,
            target: 'enemy',
            typingDifficulty: 2,
            skillSuccessRate: { baseRate: 90, typingInfluence: 1.0 },
            criticalRate: { baseRate: 10, typingInfluence: 0.5 },
            effects: [
              {
                type: 'damage',
                target: 'enemy',
                basePower: 50,
                successRate: 95,
                powerInfluence: { stat: 'strength', rate: 1.5 },
              },
            ],
          },
        ],
      });

      const Battle = require('../battle/Battle').Battle;
      const battle = new Battle(testPlayer, enemyWithSkills);
      battle.start();

      const battlePhaseWithSkills = new BattlePhase(mockWorld, mockTabCompleter, testPlayer);
      battlePhaseWithSkills.setBattle(battle);

      const displayOutput = battlePhaseWithSkills.displayEnemyNextAction();

      expect(displayOutput).toBeDefined();
      expect(displayOutput.join('\n')).toContain("Enemy's Next Action");
      expect(displayOutput.join('\n')).toContain('Power Strike');
      expect(displayOutput.join('\n')).toContain('Damage');
      expect(displayOutput.join('\n')).toContain('Physical');
      expect(displayOutput.join('\n')).toContain('Estimated Damage');
      expect(displayOutput.join('\n')).toContain('Success Rate: 95%');
    });

    it('敵がスキルを持たない場合、通常攻撃を表示する', () => {
      const Battle = require('../battle/Battle').Battle;
      const battle = new Battle(testPlayer, mockEnemy);
      battle.start();

      battlePhase.setBattle(battle);

      const displayOutput = battlePhase.displayEnemyNextAction();

      expect(displayOutput).toBeDefined();
      expect(displayOutput.join('\n')).toContain("Enemy's Next Action");
      expect(displayOutput.join('\n')).toContain('Basic Attack');
      expect(displayOutput.join('\n')).toContain('Damage');
    });

    it('複数の効果を持つスキルを正しく表示できる', () => {
      const enemyWithMultiEffectSkill = new Enemy({
        id: 'multi_effect_enemy',
        name: 'Multi Effect Enemy',
        description: 'Enemy with multi-effect skill',
        level: 5,
        stats: { maxHp: 100, strength: 20, willpower: 18, agility: 50, fortune: 10 },
        physicalEvadeRate: 15,
        magicalEvadeRate: 12,
        skills: [
          {
            id: 'combo_attack',
            name: 'Combo Attack',
            description: 'Multiple attacks',
            skillType: 'physical',
            mpCost: 0,
            mpCharge: 0,
            actionCost: 2,
            target: 'enemy',
            typingDifficulty: 3,
            skillSuccessRate: { baseRate: 85, typingInfluence: 1.0 },
            criticalRate: { baseRate: 15, typingInfluence: 0.5 },
            effects: [
              {
                type: 'damage',
                target: 'enemy',
                basePower: 30,
                successRate: 90,
                powerInfluence: { stat: 'strength', rate: 1.2 },
              },
              {
                type: 'damage',
                target: 'enemy',
                basePower: 40,
                successRate: 85,
                powerInfluence: { stat: 'strength', rate: 1.3 },
              },
            ],
          },
        ],
      });

      const Battle = require('../battle/Battle').Battle;
      const battle = new Battle(testPlayer, enemyWithMultiEffectSkill);
      battle.start();

      const battlePhaseWithMultiEffect = new BattlePhase(mockWorld, mockTabCompleter, testPlayer);
      battlePhaseWithMultiEffect.setBattle(battle);

      const displayOutput = battlePhaseWithMultiEffect.displayEnemyNextAction();

      expect(displayOutput).toBeDefined();
      expect(displayOutput.join('\n')).toContain('Combo Attack');
      expect(displayOutput.join('\n')).toContain('Effect 1');
      expect(displayOutput.join('\n')).toContain('Effect 2');
      expect(displayOutput.join('\n')).toContain('Success Rate: 90%');
      expect(displayOutput.join('\n')).toContain('Success Rate: 85%');
    });

    it('魔法スキルの場合、属性がMagicalと表示される', () => {
      const enemyWithMagicSkill = new Enemy({
        id: 'magic_enemy',
        name: 'Magic Enemy',
        description: 'Enemy with magic skill',
        level: 4,
        stats: { maxHp: 70, strength: 10, willpower: 25, agility: 40, fortune: 12 },
        physicalEvadeRate: 10,
        magicalEvadeRate: 5,
        skills: [
          {
            id: 'fireball',
            name: 'Fireball',
            description: 'A magical fire attack',
            skillType: 'magical',
            mpCost: 0,
            mpCharge: 0,
            actionCost: 1,
            target: 'enemy',
            typingDifficulty: 3,
            skillSuccessRate: { baseRate: 85, typingInfluence: 1.0 },
            criticalRate: { baseRate: 12, typingInfluence: 0.5 },
            effects: [
              {
                type: 'damage',
                target: 'enemy',
                basePower: 60,
                successRate: 88,
                powerInfluence: { stat: 'willpower', rate: 1.8 },
              },
            ],
          },
        ],
      });

      const Battle = require('../battle/Battle').Battle;
      const battle = new Battle(testPlayer, enemyWithMagicSkill);
      battle.start();

      const battlePhaseWithMagic = new BattlePhase(mockWorld, mockTabCompleter, testPlayer);
      battlePhaseWithMagic.setBattle(battle);

      const displayOutput = battlePhaseWithMagic.displayEnemyNextAction();

      expect(displayOutput).toBeDefined();
      expect(displayOutput.join('\n')).toContain('Fireball');
      expect(displayOutput.join('\n')).toContain('Magical');
      expect(displayOutput.join('\n')).toContain('Estimated Damage');
    });
  });
});
