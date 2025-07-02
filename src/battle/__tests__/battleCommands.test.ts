import { BattleCommands } from '../battleCommands';
import { Player } from '../../core/player';
import { Map } from '../../world/map';
import { World } from '../../world/world';
import { ElementManager } from '../../world/elements';
import { Location, LocationType } from '../../world/location';
import { TypingChallenge, ChallengeDifficulty } from '../typingChallenge';

// TypingChallengeをモック化
jest.mock('../typingChallenge', () => ({
  TypingChallenge: jest.fn().mockImplementation(() => ({
    generateChallenge: jest.fn().mockReturnValue({
      word: 'test',
      difficulty: 1,
      timeLimit: 5000
    }),
    calculateAccuracy: jest.fn().mockReturnValue(100),
    calculateWPM: jest.fn().mockReturnValue(60),
    evaluateTyping: jest.fn().mockReturnValue({
      accuracy: 100,
      wpm: 60,
      damage: 25,
      isCorrect: true,
      isPerfect: true
    }),
    calculateDamageMultiplier: jest.fn().mockReturnValue(1.5)
  })),
  ChallengeDifficulty: {
    BASIC: 1,
    INTERMEDIATE: 2,
    ADVANCED: 3,
    PROGRAMMING: 4,
    EXPERT: 5
  }
}));

describe('BattleCommandsクラス', () => {
  let battleCommands: BattleCommands;
  let player: Player;
  let map: Map;
  let world: World;
  let elementManager: ElementManager;

  beforeEach(() => {
    player = new Player('Test Warrior');
    map = new Map(undefined, 1, false); // autogenerate=falseで自動生成を無効化
    world = new World('Test World', 1, map);
    elementManager = new ElementManager();
    battleCommands = new BattleCommands(player, map, world, elementManager);

    // プレイヤーに基本装備を設定
    player.equipWord(1, 'the');
    player.equipWord(2, 'quick');
    
    // テスト用の場所を手動で作成
    map.addLocation(new Location('src', '/', LocationType.DIRECTORY));
    map.addLocation(new Location('app.js', '/src', LocationType.FILE));
    map.addLocation(new Location('README.md', '/', LocationType.FILE));
  });

  describe('戦闘開始', () => {
    test('新しい戦闘セッションを開始', () => {
      const location = map.findLocation('/src/app.js');
      location?.markExplored();
      const monster = elementManager.createMonsterElement('Syntax Error Bug', 50, 15);
      location?.setElement(monster.type, monster.data);

      const result = battleCommands.startBattle('app.js');

      expect(result.success).toBe(true);
      expect(result.output).toContain('Battle started');
      expect(result.output).toContain('Syntax Error Bug');
      expect(battleCommands.isInBattle()).toBe(true);
    });

    test('存在しないファイルでの戦闘開始失敗', () => {
      const result = battleCommands.startBattle('nonexistent.js');

      expect(result.success).toBe(false);
      expect(result.output).toContain('Location not found');
      expect(battleCommands.isInBattle()).toBe(false);
    });

    test('モンスターがいない場所での戦闘開始失敗', () => {
      const location = map.findLocation('/src/README.md');
      location?.markExplored();
      const savePoint = elementManager.createSavePointElement('Documentation Hub', 50, 25);
      location?.setElement(savePoint.type, savePoint.data);

      const result = battleCommands.startBattle('README.md');

      expect(result.success).toBe(false);
      expect(result.output).toContain('No enemy found');
      expect(battleCommands.isInBattle()).toBe(false);
    });

    test('既に倒されたモンスターでの戦闘開始失敗', () => {
      const location = map.findLocation('/src/app.js');
      location?.markExplored();
      const monster = elementManager.createMonsterElement('Syntax Error Bug', 50, 15);
      monster.data.defeated = true;
      location?.setElement(monster.type, monster.data);

      const result = battleCommands.startBattle('app.js');

      expect(result.success).toBe(false);
      expect(result.output).toContain('already defeated');
      expect(battleCommands.isInBattle()).toBe(false);
    });

    test('既に戦闘中の場合の重複開始失敗', () => {
      const location = map.findLocation('/src/app.js');
      location?.markExplored();
      const monster = elementManager.createMonsterElement('Syntax Error Bug', 50, 15);
      location?.setElement(monster.type, monster.data);

      battleCommands.startBattle('app.js');
      const result = battleCommands.startBattle('app.js');

      expect(result.success).toBe(false);
      expect(result.output).toContain('already in battle');
    });
  });

  describe('タイピング攻撃', () => {
    beforeEach(() => {
      const location = map.findLocation('/src/app.js');
      location?.markExplored();
      const monster = elementManager.createMonsterElement('Syntax Error Bug', 50, 15);
      location?.setElement(monster.type, monster.data);
      battleCommands.startBattle('app.js');
    });

    test('完璧なタイピング攻撃', () => {
      const challenge = battleCommands.getCurrentChallenge();
      expect(challenge).toBeDefined();

      const result = battleCommands.performTypingAttack(challenge!.word, 2.0);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Perfect');
      expect(result.output).toContain('damage');
      expect(result.output).toContain('100% accuracy');
    });

    test('部分的に正しいタイピング攻撃', () => {
      const challenge = battleCommands.getCurrentChallenge();
      const wrongInput = challenge!.word.slice(0, -1) + 'x'; // 最後の文字を間違える

      const result = battleCommands.performTypingAttack(wrongInput, 3.0);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Hit');
      expect(result.output).toContain('damage');
      expect(result.output).not.toContain('Perfect');
    });

    test('完全に間違ったタイピング攻撃', () => {
      const result = battleCommands.performTypingAttack('wronginput', 5.0);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Miss');
      expect(result.output).toContain('0% accuracy');
    });

    test('戦闘中でない場合の攻撃失敗', () => {
      battleCommands.endBattle(); // 戦闘終了

      const result = battleCommands.performTypingAttack('test', 2.0);

      expect(result.success).toBe(false);
      expect(result.output).toContain('not in battle');
    });

    test('タイムアウト攻撃', () => {
      const challenge = battleCommands.getCurrentChallenge();
      const timeLimit = challenge!.timeLimit;

      const result = battleCommands.performTypingAttack(challenge!.word, timeLimit + 1);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Too slow');
      expect(result.output).toContain('timeout');
    });
  });

  describe('敵のターン', () => {
    beforeEach(() => {
      const location = map.findLocation('/src/app.js');
      location?.markExplored();
      const monster = elementManager.createMonsterElement('Syntax Error Bug', 50, 15);
      location?.setElement(monster.type, monster.data);
      battleCommands.startBattle('app.js');
    });

    test('敵の攻撃処理', () => {
      const initialHealth = player.getStats().currentHealth;

      const result = battleCommands.processEnemyTurn();

      expect(result.success).toBe(true);
      expect(result.output).toContain('attacks');
      expect(result.output).toContain('damage');

      const currentHealth = player.getStats().currentHealth;
      expect(currentHealth).toBeLessThan(initialHealth);
    });

    test('プレイヤーのHP0時の敗北判定', () => {
      // プレイヤーのHPを1まで減らす
      const currentHealth = player.getStats().currentHealth;
      player.takeDamage(currentHealth - 1);

      const result = battleCommands.processEnemyTurn();

      expect(result.success).toBe(true);
      expect(result.output).toContain('attacks');
      expect(player.getStats().currentHealth).toBe(0);
      
      // checkBattleEnd で敗北判定
      const battleEnd = battleCommands.checkBattleEnd();
      expect(battleEnd.status).toBe('defeat');
      expect(battleEnd.output).toContain('defeated');
      expect(battleCommands.isInBattle()).toBe(false);
    });
  });

  describe('戦闘終了', () => {
    beforeEach(() => {
      const location = map.findLocation('/src/app.js');
      location?.markExplored();
      const monster = elementManager.createMonsterElement('Syntax Error Bug', 30, 15); // 低HP
      location?.setElement(monster.type, monster.data);
      battleCommands.startBattle('app.js');
    });

    test('敵撃破による勝利', () => {
      // 強力な攻撃でモンスターを倒す
      const challenge = battleCommands.getCurrentChallenge();
      battleCommands.performTypingAttack(challenge!.word, 1.0);

      // モンスターのHPが0以下になるまで攻撃を続ける（テスト用）
      let battleResult = battleCommands.checkBattleEnd();
      let attempts = 0;
      while (battleResult.status === 'ongoing' && attempts < 10) {
        const newChallenge = battleCommands.getCurrentChallenge();
        if (newChallenge) {
          battleCommands.performTypingAttack(newChallenge.word, 1.0);
          battleResult = battleCommands.checkBattleEnd();
        }
        attempts++;
      }

      expect(battleResult.status).toBe('victory');
      expect(battleResult.output).toContain('Victory');
      expect(battleCommands.isInBattle()).toBe(false);
    });

    test('敗北時の処理', () => {
      // プレイヤーのHPを0にする
      const currentHealth = player.getStats().currentHealth;
      player.takeDamage(currentHealth);

      const battleResult = battleCommands.checkBattleEnd();

      expect(battleResult.status).toBe('defeat');
      expect(battleResult.output).toContain('defeated');
      expect(battleCommands.isInBattle()).toBe(false);
    });

    test('戦闘逃走', () => {
      const result = battleCommands.fleeBattle();

      expect(result.success).toBe(true);
      expect(result.output).toContain('fled');
      expect(battleCommands.isInBattle()).toBe(false);
    });
  });

  describe('戦闘状態管理', () => {
    test('戦闘情報の取得', () => {
      const location = map.findLocation('/src/app.js');
      location?.markExplored();
      const monster = elementManager.createMonsterElement('Syntax Error Bug', 50, 15);
      location?.setElement(monster.type, monster.data);
      battleCommands.startBattle('app.js');

      const battleInfo = battleCommands.getBattleInfo();

      expect(battleInfo).toBeDefined();
      expect(battleInfo).not.toBeNull();
      expect(battleInfo!.enemyName).toBe('Syntax Error Bug');
      expect(battleInfo!.enemyHealth).toBe(50);
      expect(battleInfo!.enemyMaxHealth).toBe(50);
      expect(battleInfo!.turn).toBe(1);
    });

    test('現在のチャレンジ取得', () => {
      const location = map.findLocation('/src/app.js');
      location?.markExplored();
      const monster = elementManager.createMonsterElement('Syntax Error Bug', 50, 15);
      location?.setElement(monster.type, monster.data);
      battleCommands.startBattle('app.js');

      const challenge = battleCommands.getCurrentChallenge();

      expect(challenge).toBeDefined();
      expect(challenge!.word).toBeDefined();
      expect(challenge!.timeLimit).toBeGreaterThan(0);
      expect(challenge!.difficulty).toBeDefined();
    });

    test('戦闘中でない場合のチャレンジ取得', () => {
      const challenge = battleCommands.getCurrentChallenge();

      expect(challenge).toBeNull();
    });
  });

  describe('ダメージ計算', () => {
    test('装備ボーナスを含むダメージ計算', () => {
      const location = map.findLocation('/src/app.js');
      location?.markExplored();
      const monster = elementManager.createMonsterElement('Syntax Error Bug', 50, 15);
      location?.setElement(monster.type, monster.data);
      battleCommands.startBattle('app.js');

      const typingResult = {
        input: 'function',
        accuracy: 100,
        speed: 60,
        timeUsed: 2.0,
        perfect: true,
      };

      const damage = battleCommands.calculateDamage(typingResult);

      expect(damage).toBeGreaterThan(10); // 基本攻撃力 + 装備ボーナス
      expect(damage).toBeLessThan(100); // 理論的最大値
    });

    test('低品質タイピングでの最小ダメージ保証', () => {
      const location = map.findLocation('/src/app.js');
      location?.markExplored();
      const monster = elementManager.createMonsterElement('Syntax Error Bug', 50, 15);
      location?.setElement(monster.type, monster.data);
      battleCommands.startBattle('app.js');

      const typingResult = {
        input: '',
        accuracy: 0,
        speed: 0,
        timeUsed: 10.0,
        perfect: false,
      };

      const damage = battleCommands.calculateDamage(typingResult);

      expect(damage).toBeGreaterThan(0); // 最小ダメージ保証
      expect(damage).toBeLessThan(5); // 基本攻撃力の半分程度
    });
  });

  describe('難易度調整', () => {
    test('ワールドレベルに応じたチャレンジ難易度', () => {
      // レベル1ワールド
      const location1 = map.findLocation('/src/app.js');
      location1?.markExplored();
      const monster1 = elementManager.createMonsterElement('Bug', 30, 10);
      location1?.setElement(monster1.type, monster1.data);
      
      battleCommands.startBattle('app.js');
      const challenge1 = battleCommands.getCurrentChallenge();
      battleCommands.endBattle();

      // レベル3ワールドを作成
      const highLevelWorld = new World('Hard World', 3, map);
      const highLevelBattle = new BattleCommands(player, map, highLevelWorld, elementManager);
      
      const location2 = map.findLocation('/src/config.json');
      location2?.markExplored();
      const monster2 = elementManager.createMonsterElement('Advanced Bug', 80, 25);
      location2?.setElement(monster2.type, monster2.data);
      
      highLevelBattle.startBattle('config.json');
      const challenge2 = highLevelBattle.getCurrentChallenge();

      expect(challenge1).toBeDefined();
      expect(challenge2).toBeDefined();
      // 高レベルワールドでは短い制限時間またはより難しい単語
      expect(challenge2!.difficulty).toBeGreaterThanOrEqual(challenge1!.difficulty);
    });
  });
});