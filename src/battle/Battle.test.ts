import { Battle } from './Battle';
import { Player } from '../player/Player';
import { Enemy } from './Enemy';
import { Skill } from './Skill';
import { BattleCalculator } from './BattleCalculator';

describe('Battle', () => {
  let battle: Battle;
  let player: Player;
  let enemy: Enemy;

  const mockSkill: Skill = {
    id: 'test_attack',
    name: 'Test Attack',
    description: 'A test attack',
    mpCost: 5,
    power: 1.2,
    accuracy: 90,
    target: 'enemy',
    element: 'physical',
    typingDifficulty: 2,
  };

  beforeEach(() => {
    player = new Player('TestPlayer');
    enemy = new Enemy({
      id: 'test_enemy',
      name: 'Test Enemy',
      description: 'A test enemy',
      level: 5,
      stats: {
        maxHp: 100,
        maxMp: 30,
        attack: 20,
        defense: 10,
        speed: 15,
        accuracy: 75,
        fortune: 10,
      },
      skills: [mockSkill],
    });

    battle = new Battle(player, enemy);
  });

  describe('戦闘開始・終了処理', () => {
    it('戦闘を開始できる', () => {
      expect(battle.isActive).toBe(false);
      battle.start();
      expect(battle.isActive).toBe(true);
      expect(battle.currentTurn).toBe(1);
    });

    it('戦闘を終了できる', () => {
      battle.start();
      expect(battle.isActive).toBe(true);
      battle.end();
      expect(battle.isActive).toBe(false);
    });

    it('戦闘開始時に初期メッセージが返される', () => {
      const result = battle.start();
      expect(result).toContain('Test Enemy appeared!');
    });

    it('戦闘が既に開始されている場合はエラーになる', () => {
      battle.start();
      expect(() => battle.start()).toThrow('Battle already started');
    });

    it('戦闘が開始されていない状態で終了しようとするとエラーになる', () => {
      expect(() => battle.end()).toThrow('Battle not started');
    });
  });

  describe('ターン制御', () => {
    beforeEach(() => {
      battle.start();
    });

    it('ターンを進行できる', () => {
      expect(battle.currentTurn).toBe(1);
      battle.nextTurn();
      expect(battle.currentTurn).toBe(2);
    });

    it('現在のターンが誰のターンか判定できる', () => {
      // プレイヤーの速度を設定
      jest.spyOn(player, 'getTotalStats').mockReturnValue({
        attack: 10,
        defense: 10,
        speed: 20, // 敵より速い
        accuracy: 10,
        fortune: 10,
      });

      const turn = battle.getCurrentTurnActor();
      expect(turn).toBe('player');
    });

    it('速度が同じ場合はランダムに決定される', () => {
      jest.spyOn(player, 'getTotalStats').mockReturnValue({
        attack: 10,
        defense: 10,
        speed: 15, // 敵と同じ速度
        accuracy: 10,
        fortune: 10,
      });

      // Math.randomをモック
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0.4); // 50%未満なのでプレイヤー
      expect(battle.getCurrentTurnActor()).toBe('player');

      mockRandom.mockReturnValue(0.6); // 50%以上なので敵
      expect(battle.getCurrentTurnActor()).toBe('enemy');

      mockRandom.mockRestore();
    });
  });

  describe('行動処理', () => {
    beforeEach(() => {
      battle.start();
    });

    it('プレイヤーが技を使用できる', () => {
      const playerSkill: Skill = {
        id: 'player_attack',
        name: 'Player Attack',
        description: 'Player attack',
        mpCost: 0,
        power: 1.0,
        accuracy: 100,
        target: 'enemy',
        element: 'physical',
        typingDifficulty: 1,
      };

      jest.spyOn(player, 'getTotalStats').mockReturnValue({
        attack: 30,
        defense: 10,
        speed: 20,
        accuracy: 100,
        fortune: 10,
      });

      // BattleCalculatorのモック
      jest.spyOn(BattleCalculator, 'calculateHitRate').mockReturnValue(100);
      jest.spyOn(BattleCalculator, 'calculateEvadeRate').mockReturnValue(0);
      jest.spyOn(BattleCalculator, 'isHit').mockReturnValue(true);
      jest.spyOn(BattleCalculator, 'calculateDamage').mockReturnValue(25);

      const result = battle.playerUseSkill(playerSkill);
      expect(result.success).toBe(true);
      expect(result.damage).toBe(25);
      expect(result.message).toContain('Player Attack');
      expect(enemy.currentHp).toBe(75);
    });

    it('プレイヤーの攻撃がミスする場合', () => {
      const playerSkill: Skill = {
        id: 'player_attack',
        name: 'Player Attack',
        description: 'Player attack',
        mpCost: 0,
        power: 1.0,
        accuracy: 50,
        target: 'enemy',
        element: 'physical',
        typingDifficulty: 1,
      };

      jest.spyOn(BattleCalculator, 'isHit').mockReturnValue(false);

      const result = battle.playerUseSkill(playerSkill);
      expect(result.success).toBe(false);
      expect(result.damage).toBe(0);
      expect(result.message).toContain('missed');
      expect(enemy.currentHp).toBe(100);
    });

    it('敵が技を使用できる', () => {
      jest.spyOn(enemy, 'selectSkill').mockReturnValue(mockSkill);
      jest.spyOn(BattleCalculator, 'calculateHitRate').mockReturnValue(90);
      jest.spyOn(BattleCalculator, 'calculateEvadeRate').mockReturnValue(10);
      jest.spyOn(BattleCalculator, 'isHit').mockReturnValue(true);
      jest.spyOn(BattleCalculator, 'calculateDamage').mockReturnValue(15);

      const playerBodyStats = player.getBodyStats();
      jest.spyOn(playerBodyStats, 'getCurrentHP').mockReturnValue(100);
      jest.spyOn(playerBodyStats, 'takeDamage');

      const result = battle.enemyAction();
      expect(result.action).toBe('skill');
      expect(result.skillUsed).toBe(mockSkill);
      expect(result.damage).toBe(15);
      expect(result.message).toContain('Test Attack');
      expect(playerBodyStats.takeDamage).toHaveBeenCalledWith(15);
    });

    it('敵が使用可能な技がない場合は通常攻撃する', () => {
      jest.spyOn(enemy, 'selectSkill').mockReturnValue(null);
      jest.spyOn(BattleCalculator, 'calculateHitRate').mockReturnValue(90);
      jest.spyOn(BattleCalculator, 'calculateEvadeRate').mockReturnValue(10);
      jest.spyOn(BattleCalculator, 'isHit').mockReturnValue(true);
      jest.spyOn(BattleCalculator, 'calculateDamage').mockReturnValue(10);

      const playerBodyStats = player.getBodyStats();
      jest.spyOn(playerBodyStats, 'takeDamage');

      const result = battle.enemyAction();
      expect(result.action).toBe('attack');
      expect(result.damage).toBe(10);
      expect(result.message).toContain('attacks');
    });
  });

  describe('勝敗判定', () => {
    beforeEach(() => {
      battle.start();
    });

    it('敵のHPが0になったら勝利', () => {
      enemy.takeDamage(100);
      const result = battle.checkBattleEnd();
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('player');
      expect(result?.message).toContain('defeated');
      expect(battle.isActive).toBe(false);
    });

    it('プレイヤーのHPが0になったら敗北', () => {
      const playerBodyStats = player.getBodyStats();
      jest.spyOn(playerBodyStats, 'getCurrentHP').mockReturnValue(0);

      const result = battle.checkBattleEnd();
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('enemy');
      expect(result?.message).toContain('defeated');
      expect(battle.isActive).toBe(false);
    });

    it('両者のHPが残っている場合は継続', () => {
      const result = battle.checkBattleEnd();
      expect(result).toBeNull();
      expect(battle.isActive).toBe(true);
    });
  });

  describe('戦闘結果取得', () => {
    it('勝利時の結果を取得できる', () => {
      battle.start();
      enemy.takeDamage(100);
      battle.checkBattleEnd();

      const result = battle.getBattleResult();
      expect(result).not.toBeNull();
      expect(result?.victory).toBe(true);
      expect(result?.turns).toBe(1);
      expect(result?.enemyDefeated).toBe('Test Enemy');
    });

    it('敗北時の結果を取得できる', () => {
      battle.start();
      const playerBodyStats = player.getBodyStats();
      jest.spyOn(playerBodyStats, 'getCurrentHP').mockReturnValue(0);
      battle.checkBattleEnd();

      const result = battle.getBattleResult();
      expect(result).not.toBeNull();
      expect(result?.victory).toBe(false);
      expect(result?.turns).toBe(1);
    });

    it('戦闘中は結果を取得できない', () => {
      battle.start();
      const result = battle.getBattleResult();
      expect(result).toBeNull();
    });
  });

  describe('ドロップアイテム判定', () => {
    it('アイテムドロップ判定ができる', () => {
      const dropEnemy = new Enemy({
        id: 'drop_enemy',
        name: 'Drop Enemy',
        description: 'Enemy with drops',
        level: 5,
        stats: {
          maxHp: 50,
          maxMp: 10,
          attack: 15,
          defense: 8,
          speed: 10,
          accuracy: 70,
          fortune: 5,
        },
        drops: [
          { itemId: 'potion', dropRate: 100 }, // 100%ドロップ
          { itemId: 'rare_item', dropRate: 0 }, // 0%ドロップ
        ],
      });

      const dropBattle = new Battle(player, dropEnemy);
      dropBattle.start();
      dropEnemy.takeDamage(50);
      dropBattle.checkBattleEnd();

      jest.spyOn(player, 'getTotalStats').mockReturnValue({
        attack: 10,
        defense: 10,
        speed: 10,
        accuracy: 10,
        fortune: 50,
      });

      jest.spyOn(BattleCalculator, 'calculateDropRate').mockReturnValue(70);
      const mockRandom = jest.spyOn(Math, 'random');

      // 最初のアイテム（100%）は必ずドロップ
      mockRandom.mockReturnValueOnce(0.5); // 50 < 70なのでドロップ判定成功
      mockRandom.mockReturnValueOnce(0.5); // 50 < 100なのでドロップ

      // 2番目のアイテム（0%）は絶対ドロップしない
      mockRandom.mockReturnValueOnce(0.5); // 50 < 70なのでドロップ判定成功
      mockRandom.mockReturnValueOnce(0.5); // 50 > 0なのでドロップしない

      const drops = dropBattle.calculateDrops();
      expect(drops).toHaveLength(1);
      expect(drops[0]).toBe('potion');

      mockRandom.mockRestore();
    });

    it('ドロップ率が0の場合はドロップしない', () => {
      jest.spyOn(BattleCalculator, 'calculateDropRate').mockReturnValue(0);

      enemy.takeDamage(100);
      battle.checkBattleEnd();

      const drops = battle.calculateDrops();
      expect(drops).toHaveLength(0);
    });
  });
});
