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
    mpCharge: 0,
    actionCost: 1,
    successRate: 90,
    target: 'enemy',
    typingDifficulty: 2,
    effects: [
      {
        type: 'damage',
        power: 1.2,
        target: 'enemy',
      },
    ],
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
        strength: 20,
        willpower: 10,
        agility: 90,
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
        strength: 10,
        willpower: 10,
        agility: 100, // 敵より速い
        fortune: 10,
      });

      // 戦闘を再開始してターンアクターを再計算
      battle.end();
      battle.start();
      const turn = battle.getCurrentTurnActor();
      expect(turn).toBe('player');
    });

    it('速度が同じ場合はランダムに決定される', () => {
      jest.spyOn(player, 'getTotalStats').mockReturnValue({
        strength: 10,
        willpower: 10,
        agility: 90, // 敵と同じ速度
        fortune: 10,
      });

      // Math.randomをモック
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0.4); // 50%未満なのでプレイヤー
      battle.end();
      battle.start();
      expect(battle.getCurrentTurnActor()).toBe('player');

      mockRandom.mockReturnValue(0.6); // 50%以上なので敵
      battle.end();
      battle.start();
      expect(battle.getCurrentTurnActor()).toBe('enemy');

      mockRandom.mockRestore();
    });

    it('ターンを進めるとアクターが交代する', () => {
      jest.spyOn(player, 'getTotalStats').mockReturnValue({
        strength: 10,
        willpower: 10,
        agility: 100, // 敵より速い
        fortune: 10,
      });

      battle.end();
      battle.start();
      expect(battle.getCurrentTurnActor()).toBe('player');

      battle.nextTurn();
      expect(battle.currentTurn).toBe(2);
      expect(battle.getCurrentTurnActor()).toBe('enemy');

      battle.nextTurn();
      expect(battle.currentTurn).toBe(3);
      expect(battle.getCurrentTurnActor()).toBe('player');
    });
  });

  describe('行動ポイントシステム', () => {
    beforeEach(() => {
      battle.start();
    });

    it.each([
      { agility: 50, expectedAP: 4 },
      { agility: 100, expectedAP: 5 },
      { agility: 25, expectedAP: 3 },
    ])('プレイヤーの行動ポイントを計算できる (agility: $agility)', ({ agility, expectedAP }) => {
      jest.spyOn(player, 'getTotalStats').mockReturnValue({
        strength: 10,
        willpower: 10,
        agility,
        fortune: 10,
      });
      expect(battle.calculatePlayerActionPoints()).toBe(expectedAP);
    });

    it('スキルの合計コストを計算できる', () => {
      const skills: Skill[] = [
        { ...mockSkill, actionCost: 2 },
        { ...mockSkill, actionCost: 1 },
        { ...mockSkill, actionCost: 3 },
      ];
      expect(battle.calculateTotalActionCost(skills)).toBe(6);
    });

    it('選択したスキルが使用可能かチェックできる', () => {
      jest.spyOn(player, 'getTotalStats').mockReturnValue({
        strength: 10,
        willpower: 10,
        agility: 50, // AP = 4
        fortune: 10,
      });

      const bodyStats = player.getBodyStats();
      jest.spyOn(bodyStats, 'getCurrentMP').mockReturnValue(20);

      // 正常ケース
      const validSkills = [
        { ...mockSkill, actionCost: 2, mpCost: 5 },
        { ...mockSkill, actionCost: 2, mpCost: 10 },
      ];
      expect(battle.validateSelectedSkills(validSkills)).toBeNull();

      // アクションコスト超過
      const costlySkills = [
        { ...mockSkill, actionCost: 3, mpCost: 5 },
        { ...mockSkill, actionCost: 3, mpCost: 5 },
      ];
      const result1 = battle.validateSelectedSkills(costlySkills);
      expect(result1).toContain('Action cost (6) exceeds action points (4)');

      // MP不足
      const mpHeavySkills = [
        { ...mockSkill, actionCost: 2, mpCost: 15 },
        { ...mockSkill, actionCost: 2, mpCost: 10 },
      ];
      const result2 = battle.validateSelectedSkills(mpHeavySkills);
      expect(result2).toContain('Not enough MP');

      // スキル未選択
      expect(battle.validateSelectedSkills([])).toBe('No skills selected');
    });
  });

  describe('複数スキル使用', () => {
    beforeEach(() => {
      battle.start();
      jest.spyOn(player, 'getTotalStats').mockReturnValue({
        strength: 30,
        willpower: 10,
        agility: 120,
        fortune: 20,
      });
      jest.spyOn(BattleCalculator, 'calculateHitRate').mockReturnValue(100);
      jest.spyOn(BattleCalculator, 'calculateEvadeRate').mockReturnValue(0);
      jest.spyOn(BattleCalculator, 'isHit').mockReturnValue(true);
      jest.spyOn(BattleCalculator, 'calculateDamage').mockReturnValue(25);
      jest.spyOn(BattleCalculator, 'calculateCriticalRate').mockReturnValue(10);
      jest.spyOn(BattleCalculator, 'isCritical').mockReturnValue(false);
    });

    it('複数スキルを連続で使用できる', () => {
      const selectedSkills = [
        { skill: { ...mockSkill, name: 'Attack1' }, typingResult: undefined },
        { skill: { ...mockSkill, name: 'Attack2' }, typingResult: undefined },
      ];

      const result = battle.playerUseMultipleSkills(selectedSkills);

      expect(result.skillResults).toHaveLength(2);
      expect(result.skillResults[0].success).toBe(true);
      expect(result.skillResults[1].success).toBe(true);
      expect(result.totalDamage).toBe(50); // 25 * 2
    });

    it('タイピング結果がスキルごとに反映される', () => {
      const typingResult1 = {
        speedRating: 'S' as const,
        accuracyRating: 'Perfect' as const,
        totalRating: 150,
        timeTaken: 1000,
        accuracy: 100,
        isSuccess: true,
      };

      const typingResult2 = {
        speedRating: 'C' as const,
        accuracyRating: 'Good' as const,
        totalRating: 80,
        timeTaken: 5000,
        accuracy: 90,
        isSuccess: true,
      };

      const selectedSkills = [
        { skill: { ...mockSkill, name: 'Attack1', mpCharge: 10 }, typingResult: typingResult1 },
        { skill: { ...mockSkill, name: 'Attack2', mpCharge: 0 }, typingResult: typingResult2 },
      ];

      jest
        .spyOn(BattleCalculator, 'calculateTypingEffectMultiplier')
        .mockReturnValueOnce(1.5) // S/Perfect
        .mockReturnValueOnce(0.8); // C/Good

      const result = battle.playerUseMultipleSkills(selectedSkills);

      expect(result.skillResults[0].damage).toBe(37); // floor(25 * 1.5)
      expect(result.skillResults[1].damage).toBe(20); // floor(25 * 0.8)
      expect(result.totalDamage).toBe(57);
      expect(result.totalMpRecovered).toBe(15); // 10 * 1.5 (Perfect bonus)
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
        mpCharge: 0,
        actionCost: 1,
        successRate: 100,
        target: 'enemy',
        typingDifficulty: 1,
        effects: [
          {
            type: 'damage',
            power: 1.0,
            target: 'enemy',
          },
        ],
      };

      jest.spyOn(player, 'getTotalStats').mockReturnValue({
        strength: 30,
        willpower: 10,
        agility: 120,
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
        mpCharge: 0,
        actionCost: 1,
        successRate: 50,
        target: 'enemy',
        typingDifficulty: 1,
        effects: [
          {
            type: 'damage',
            power: 1.0,
            target: 'enemy',
          },
        ],
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
      expect(result.skillUsed?.name).toBe('Basic Attack');
      expect(result.damage).toBe(10);
      expect(result.message).toContain('Basic Attack');
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
          strength: 15,
          willpower: 8,
          agility: 80,
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
        strength: 10,
        willpower: 10,
        agility: 20,
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

  describe('タイピングボーナス機能', () => {
    let battle: Battle;
    let player: Player;
    let enemy: Enemy;
    let skill: Skill;

    beforeEach(() => {
      player = new Player('test');
      enemy = new Enemy({
        id: 'goblin',
        name: 'Goblin',
        description: 'A small goblin',
        level: 1,
        stats: {
          maxHp: 50,
          maxMp: 20,
          strength: 15,
          willpower: 10,
          agility: 90,
          fortune: 30,
        },
        skills: [],
        drops: [],
      });

      skill = {
        id: 'fireball',
        name: 'Fireball',
        description: 'A basic fire spell',
        mpCost: 5,
        mpCharge: 0,
        actionCost: 1,
        successRate: 90,
        target: 'enemy',
        typingDifficulty: 2,
        effects: [
          {
            type: 'damage',
            power: 1.5,
            target: 'enemy',
          },
        ],
      };

      battle = new Battle(player, enemy);
    });

    it('タイピング結果なしの場合は通常の計算', () => {
      const result = battle.playerUseSkill(skill);
      expect(result.success).toBe(true);
    });

    it('タイピング成功時に速度・精度・効果倍率ボーナスを適用', () => {
      const typingResult = {
        speedRating: 'S' as const,
        accuracyRating: 'Perfect' as const,
        totalRating: 150,
        timeTaken: 1000,
        accuracy: 100,
        isSuccess: true,
      };

      // BattleCalculatorのメソッドをモック
      const mockSpeedBonus = jest.spyOn(BattleCalculator, 'calculateTypingSpeedBonus');
      const mockAccuracyBonus = jest.spyOn(BattleCalculator, 'calculateTypingAccuracyBonus');
      const mockEffectMultiplier = jest.spyOn(BattleCalculator, 'calculateTypingEffectMultiplier');

      mockSpeedBonus.mockReturnValue(95); // 高い命中率
      mockAccuracyBonus.mockReturnValue(30); // 高いクリティカル率
      mockEffectMultiplier.mockReturnValue(1.5); // 150%効果

      const result = battle.playerUseSkill(skill, typingResult);

      expect(mockSpeedBonus).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'S');
      expect(mockAccuracyBonus).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Perfect'
      );
      expect(mockEffectMultiplier).toHaveBeenCalledWith(150);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Great typing!');

      mockSpeedBonus.mockRestore();
      mockAccuracyBonus.mockRestore();
      mockEffectMultiplier.mockRestore();
    });

    it('タイピング失敗時はボーナスを適用しない', () => {
      const typingResult = {
        speedRating: 'F' as const,
        accuracyRating: 'Poor' as const,
        totalRating: 0,
        timeTaken: 5000,
        accuracy: 50,
        isSuccess: false,
      };

      const mockSpeedBonus = jest.spyOn(BattleCalculator, 'calculateTypingSpeedBonus');
      const mockAccuracyBonus = jest.spyOn(BattleCalculator, 'calculateTypingAccuracyBonus');
      const mockEffectMultiplier = jest.spyOn(BattleCalculator, 'calculateTypingEffectMultiplier');

      battle.playerUseSkill(skill, typingResult);

      // タイピング失敗時はボーナスメソッドが呼ばれない
      expect(mockSpeedBonus).not.toHaveBeenCalled();
      expect(mockAccuracyBonus).not.toHaveBeenCalled();
      expect(mockEffectMultiplier).not.toHaveBeenCalled();

      mockSpeedBonus.mockRestore();
      mockAccuracyBonus.mockRestore();
      mockEffectMultiplier.mockRestore();
    });

    it('タイピング成功だが標準評価の場合はGreat typingメッセージを表示しない', () => {
      const typingResult = {
        speedRating: 'B' as const,
        accuracyRating: 'Good' as const,
        totalRating: 100, // 標準評価
        timeTaken: 3000,
        accuracy: 95,
        isSuccess: true,
      };

      const result = battle.playerUseSkill(skill, typingResult);
      expect(result.message).not.toContain('Great typing!');
    });
  });

  describe('MP管理システム', () => {
    const skillWithMPCost: Skill = {
      id: 'power_strike',
      name: 'Power Strike',
      description: 'A powerful strike',
      mpCost: 10,
      mpCharge: 0,
      actionCost: 1,
      successRate: 90,
      target: 'enemy',
      typingDifficulty: 2,
      effects: [
        {
          type: 'damage',
          power: 1.5,
          target: 'enemy',
        },
      ],
    };

    const skillWithMPCharge: Skill = {
      id: 'healing_strike',
      name: 'Healing Strike',
      description: 'A strike that recovers MP',
      mpCost: 5,
      mpCharge: 8,
      actionCost: 1,
      successRate: 90,
      target: 'enemy',
      typingDifficulty: 2,
      effects: [
        {
          type: 'damage',
          power: 1.2,
          target: 'enemy',
        },
      ],
    };

    beforeEach(() => {
      battle.start();
    });

    it('MP不足時は技を使用できない', () => {
      const playerBodyStats = player.getBodyStats();
      // MPを消費して残りを9にする
      playerBodyStats.consumeMP(playerBodyStats.getCurrentMP() - 9);

      const result = battle.playerUseSkill(skillWithMPCost);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Not enough MP!');
      expect(result.message).toContain('Need 10 MP but only have 9 MP');
    });

    it('MP消費が正常に動作する', () => {
      const playerBodyStats = player.getBodyStats();
      const initialMP = playerBodyStats.getCurrentMP();

      jest.spyOn(BattleCalculator, 'isHit').mockReturnValue(true);
      jest.spyOn(BattleCalculator, 'calculateDamage').mockReturnValue(25);

      battle.playerUseSkill(skillWithMPCost);

      expect(playerBodyStats.getCurrentMP()).toBe(initialMP - 10);
    });

    it('MP回復が正常に動作する', () => {
      const playerBodyStats = player.getBodyStats();
      // MPを一部消費
      playerBodyStats.consumeMP(20);
      const mpAfterConsumption = playerBodyStats.getCurrentMP();

      jest.spyOn(BattleCalculator, 'isHit').mockReturnValue(true);
      jest.spyOn(BattleCalculator, 'calculateDamage').mockReturnValue(25);

      const result = battle.playerUseSkill(skillWithMPCharge);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Recovered 8 MP');
      // MP消費5 + MP回復8 = +3
      expect(playerBodyStats.getCurrentMP()).toBe(mpAfterConsumption - 5 + 8);
    });

    it('攻撃ミス時もMP回復は発生する', () => {
      const playerBodyStats = player.getBodyStats();
      // MPを一部消費
      playerBodyStats.consumeMP(20);
      const mpAfterConsumption = playerBodyStats.getCurrentMP();

      jest.spyOn(BattleCalculator, 'isHit').mockReturnValue(false);

      const result = battle.playerUseSkill(skillWithMPCharge);

      expect(result.success).toBe(false);
      expect(result.message).toContain('missed!');
      expect(result.message).toContain('Recovered 8 MP');
      // MP消費5 + MP回復8 = +3
      expect(playerBodyStats.getCurrentMP()).toBe(mpAfterConsumption - 5 + 8);
    });

    it('敵のMP不足時は通常攻撃に変更される', () => {
      // 敵のMPを消費して足りなくする
      enemy.consumeMp(enemy.currentMp);

      const skillWithHighMPCost: Skill = {
        ...mockSkill,
        mpCost: 50,
      };

      jest.spyOn(enemy, 'selectSkill').mockReturnValue(skillWithHighMPCost);
      jest.spyOn(BattleCalculator, 'isHit').mockReturnValue(true);
      jest.spyOn(BattleCalculator, 'calculateDamage').mockReturnValue(15);

      const result = battle.enemyAction();

      // 通常攻撃が使用される
      expect(result.skillUsed.id).toBe('basic_attack');
      expect(result.skillUsed.mpCost).toBe(0);
    });
  });
});
