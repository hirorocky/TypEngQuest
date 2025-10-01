import { Battle } from './Battle';
import { Player } from '../player/Player';
import { Enemy } from './Enemy';

describe('Battle', () => {
  let battle: Battle;
  let player: Player;
  let enemy: Enemy;

  beforeEach(() => {
    player = new Player('Test Player');
    enemy = new Enemy({
      id: 'test_enemy',
      name: 'Test Enemy',
      description: 'Test enemy description',
      level: 1,
      stats: {
        maxHp: 100,
        strength: 10,
        willpower: 8,
        agility: 12,
        fortune: 5,
      },
      physicalEvadeRate: 15,
      magicalEvadeRate: 10,
      skills: [],
      drops: [],
    });
    battle = new Battle(player, enemy);
  });

  describe('基本的な戦闘機能', () => {
    it('戦闘を開始できる', () => {
      const message = battle.start();
      expect(message).toBe('Test Enemy appeared!');
      expect(battle.isActive).toBe(true);
      expect(battle.currentTurn).toBe(1);
    });

    it('戦闘終了チェックが正常に動作する', () => {
      battle.start();

      // 敵を倒した状態をシミュレート
      enemy.takeDamage(100);

      const result = battle.checkBattleEnd();
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('player');
    });

    it('行動ポイントを正しく計算する', () => {
      const actionPoints = battle.calculatePlayerActionPoints();
      expect(actionPoints).toBeGreaterThan(0);
    });

    it('新しいターンを開始できる', () => {
      battle.start();
      const initialTurn = battle.currentTurn;

      battle.nextTurn();

      expect(battle.currentTurn).toBe(initialTurn + 1);
    });

    it('戦闘を終了できる', () => {
      battle.start();
      expect(battle.isActive).toBe(true);

      battle.end();
      expect(battle.isActive).toBe(false);
    });

    it('戦闘がアクティブでない場合にend()でエラーをスローする', () => {
      // 戦闘が開始されていない状態
      expect(battle.isActive).toBe(false);

      expect(() => battle.end()).toThrow('Battle is not active');
    });

    it('ターンを進められる', () => {
      battle.start();
      const initialTurn = battle.currentTurn;
      const initialActor = battle.getCurrentTurnActor();

      battle.nextTurn();

      expect(battle.currentTurn).toBe(initialTurn + 1);
      expect(battle.getCurrentTurnActor()).not.toBe(initialActor);
    });

    it('先攻を正しく決定する', () => {
      battle.start();
      const actor = battle.getCurrentTurnActor();
      expect(actor === 'player' || actor === 'enemy').toBe(true);
    });

    it('ドロップアイテムを計算する', () => {
      battle.start();
      // 勝利状態を作る
      enemy.takeDamage(100);
      battle.checkBattleEnd();

      const drops = battle.calculateDrops();
      expect(Array.isArray(drops)).toBe(true);
    });
  });

  describe('通常攻撃スキルの取得', () => {
    it('通常攻撃スキルを取得できる', () => {
      const normalAttack = Battle.getNormalAttackSkill();
      expect(normalAttack).toBeDefined();
      expect(normalAttack.id).toBe('basic_attack');
    });
  });

  describe('敵の次回行動予告システム', () => {
    it('戦闘開始時に敵の次回スキルが選択される', () => {
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
            id: 'test_skill',
            name: 'Test Skill',
            description: 'A test skill',
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
              },
            ],
          },
        ],
      });

      const battleWithSkills = new Battle(player, enemyWithSkills);
      battleWithSkills.start();
      expect(enemyWithSkills.nextSkillId).not.toBeNull();
      expect(enemyWithSkills.nextSkillId).toBe('test_skill');
    });

    it('敵ターン終了後に次回スキルが選択される', () => {
      const enemyWithSkills = new Enemy({
        id: 'skilled_enemy2',
        name: 'Skilled Enemy 2',
        description: 'Enemy with skills',
        level: 3,
        stats: { maxHp: 80, strength: 15, willpower: 12, agility: 70, fortune: 8 },
        physicalEvadeRate: 12,
        magicalEvadeRate: 8,
        skills: [
          {
            id: 'skill_a',
            name: 'Skill A',
            description: 'Skill A',
            skillType: 'physical',
            mpCost: 0,
            mpCharge: 0,
            actionCost: 1,
            target: 'enemy',
            typingDifficulty: 2,
            skillSuccessRate: { baseRate: 90, typingInfluence: 1.0 },
            criticalRate: { baseRate: 10, typingInfluence: 0.5 },
            effects: [{ type: 'damage', target: 'enemy', basePower: 50, successRate: 95 }],
          },
        ],
      });

      const battleWithSkills = new Battle(player, enemyWithSkills);
      battleWithSkills.start();

      // 敵ターンになるまで進める
      if (battleWithSkills.getCurrentTurnActor() === 'player') {
        battleWithSkills.nextTurn();
      }

      // 敵ターンを実行（nextTurnを呼ぶとプレイヤーターンになる）
      battleWithSkills.nextTurn();

      // 次回スキルが設定されている
      expect(enemyWithSkills.nextSkillId).toBeDefined();
      expect(enemyWithSkills.nextSkillId).toBe('skill_a');
    });

    it('スキルを持たない敵の場合はnullが設定される', () => {
      const noSkillEnemy = new Enemy({
        id: 'no_skill_enemy',
        name: 'No Skill Enemy',
        description: 'Enemy without skills',
        level: 1,
        stats: { maxHp: 50, strength: 10, willpower: 5, agility: 60, fortune: 5 },
        physicalEvadeRate: 10,
        magicalEvadeRate: 5,
      });

      const battleWithNoSkillEnemy = new Battle(player, noSkillEnemy);
      battleWithNoSkillEnemy.start();

      expect(noSkillEnemy.nextSkillId).toBeNull();
    });
  });
});
