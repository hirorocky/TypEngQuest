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
        maxMp: 50,
        strength: 10,
        willpower: 8,
        agility: 12,
        fortune: 5,
      },
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
});
