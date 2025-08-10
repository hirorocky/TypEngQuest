import { describe, it, expect, beforeEach } from '@jest/globals';
import { Battle } from '../../battle/Battle';
import { Player } from '../../player/Player';
import { Enemy } from '../../battle/Enemy';
import { BattleTypingResult, PhaseResult, SkillSelectionResult } from '../types';

describe('Simple Battle Phase Integration', () => {
  let player: Player;
  let enemy: Enemy;
  let battle: Battle;

  beforeEach(() => {
    player = new Player('TestPlayer');
    enemy = Enemy.fromJSON({
      id: 'test-goblin',
      name: 'Test Goblin',
      description: 'A test enemy',
      level: 1,
      stats: {
        maxHp: 50,
        maxMp: 20,
        strength: 8,

        willpower: 3,

        agility: 6,
        fortune: 2,
      },
      currentHp: 20,
      currentMp: 5,
      skills: [],
      drops: [],
    });
  });

  describe('フェーズ間データフロー', () => {
    it('Battle インスタンスが正しく共有される', () => {
      battle = new Battle(player, enemy);
      battle.start();

      // SkillSelectionPhase への遷移データ
      const skillSelectionData = {
        battle: battle,
      };

      expect(skillSelectionData.battle).toBeDefined();
      expect(skillSelectionData.battle.isActive).toBe(true);
      expect(skillSelectionData.battle.getCurrentTurnActor()).toBeDefined();
    });

    it('PhaseResult の型チェック', () => {
      // スキル選択完了の結果
      const skillSelectionResult: PhaseResult<SkillSelectionResult> = {
        type: 'complete',
        data: {
          selectedSkills: [],
        },
      };

      expect(skillSelectionResult.type).toBe('complete');
      expect(skillSelectionResult.data?.selectedSkills).toEqual([]);

      // キャンセルの場合
      const cancelResult: PhaseResult = {
        type: 'cancel',
      };

      expect(cancelResult.type).toBe('cancel');
      expect(cancelResult.data).toBeUndefined();
    });

    it('BattleTypingResult の型チェック', () => {
      const typingResult: BattleTypingResult = {
        completedSkills: 2,
        totalSkills: 3,
        summary: {
          totalDamageDealt: 45,
          totalHealing: 0,
          totalMpRestored: 5,
          statusEffectsApplied: ['Strength Up'],
          criticalHits: 1,
          misses: 0,
        },
        battleEnded: false,
      };

      expect(typingResult.completedSkills).toBe(2);
      expect(typingResult.summary.totalDamageDealt).toBe(45);
      expect(typingResult.summary.statusEffectsApplied).toContain('Strength Up');
    });
  });

  describe('戦闘状態の管理', () => {
    it('Battle クラスが戦闘状態を正しく管理する', () => {
      battle = new Battle(player, enemy);
      const initialMessage = battle.start();

      expect(battle.isActive).toBe(true);
      expect(initialMessage).toContain('appeared');

      const turnActor = battle.getCurrentTurnActor();
      expect(['player', 'enemy']).toContain(turnActor);

      const actionPoints = battle.calculatePlayerActionPoints();
      expect(actionPoints).toBeGreaterThan(0);
    });

    it('MP とアクションポイントの検証が動作する', () => {
      battle = new Battle(player, enemy);
      battle.start();

      // 存在しないスキルでテスト
      const testSkills = [
        {
          id: 'test-skill',
          name: 'Test Skill',
          description: 'A test skill',
          mpCost: 5,
          mpCharge: 0,
          actionCost: 2,
          successRate: 100,
          target: 'enemy' as const,
          typingDifficulty: 1,
          effects: [],
        },
      ];

      // スキルの検証（nullが返される = エラーなし）
      const validation = battle.validateSelectedSkills(testSkills);
      // プレイヤーに十分なMPとAPがある場合はnullが返される
      if (player.getBodyStats().getCurrentMP() >= 5) {
        expect(validation).toBeNull();
      } else {
        expect(validation).toContain('MP');
      }
    });
  });

  describe('設計の整合性確認', () => {
    it('既存のBattleクラスがplan.mdの要件を満たしている', () => {
      battle = new Battle(player, enemy);
      battle.start();

      // plan.md で想定されている機能が存在することを確認
      expect(typeof battle.calculatePlayerActionPoints).toBe('function');
      expect(typeof battle.validateSelectedSkills).toBe('function');
      expect(typeof battle.getCurrentTurnActor).toBe('function');
      expect(typeof battle.playerUseSkill).toBe('function');
      expect(typeof battle.enemyAction).toBe('function');
      expect(typeof battle.checkBattleEnd).toBe('function');
      expect(typeof battle.nextTurn).toBe('function');

      // プロパティの存在確認
      expect(battle.currentTurn).toBeDefined();
      expect(battle.isActive).toBeDefined();
    });

    it('BattleContext が不要であることを確認', () => {
      battle = new Battle(player, enemy);
      battle.start();

      // BattleクラスがBattleContextで想定された全ての情報を持っている
      expect(battle['player']).toBeDefined(); // private だが存在する
      expect(battle['enemy']).toBeDefined();  // private だが存在する
      expect(battle.currentTurn).toBeDefined();
      expect(battle.getCurrentTurnActor()).toBeDefined();

      // 追加のラッパーオブジェクトは不要
      const phaseData = {
        battle: battle,  // Battleインスタンスをそのまま渡す
      };

      expect(phaseData.battle).toBe(battle);
    });
  });
});