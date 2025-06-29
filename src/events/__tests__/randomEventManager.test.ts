import { RandomEventManager, RandomEvent, EventEffect, AvoidanceResult } from '../randomEventManager';
import { Player } from '../../core/player';
import { World } from '../../world/world';
import { Map } from '../../world/map';
import { TypingChallenge, TypingResult } from '../../battle/typingChallenge';

describe('RandomEventManagerクラス', () => {
  let randomEventManager: RandomEventManager;
  let player: Player;
  let world: World;
  let map: Map;

  beforeEach(() => {
    player = new Player('Test Player');
    map = new Map();
    world = new World('Test World', 1, map);
    randomEventManager = new RandomEventManager(player, world);
  });

  describe('イベント生成', () => {
    test('良いイベントを生成する', () => {
      const goodEvent = randomEventManager.generateRandomEvent('good');

      expect(goodEvent.type).toBe('good');
      expect(goodEvent.id).toBeDefined();
      expect(goodEvent.description).toBeDefined();
      expect(goodEvent.effects).toBeDefined();
      expect(goodEvent.effects.length).toBeGreaterThan(0);
    });

    test('悪いイベントを生成する', () => {
      const badEvent = randomEventManager.generateRandomEvent('bad');

      expect(badEvent.type).toBe('bad');
      expect(badEvent.id).toBeDefined();
      expect(badEvent.description).toBeDefined();
      expect(badEvent.effects).toBeDefined();
      expect(badEvent.effects.length).toBeGreaterThan(0);
      expect(badEvent.severity).toBeGreaterThan(0);
      expect(badEvent.severity).toBeLessThanOrEqual(5);
    });

    test('ワールドレベルに応じてイベント強度が調整される', () => {
      const lowLevelWorld = new World('Easy World', 1, map);
      const highLevelWorld = new World('Hard World', 5, map);
      
      const lowLevelManager = new RandomEventManager(player, lowLevelWorld);
      const highLevelManager = new RandomEventManager(player, highLevelWorld);

      const lowLevelEvent = lowLevelManager.generateRandomEvent('bad');
      const highLevelEvent = highLevelManager.generateRandomEvent('bad');

      expect(highLevelEvent.severity || 1).toBeGreaterThanOrEqual(lowLevelEvent.severity || 1);
    });

    test('ファイルタイプに応じたイベントが生成される', () => {
      const jsEvent = randomEventManager.generateEventForFile('.js');
      const jsonEvent = randomEventManager.generateEventForFile('.json');
      const mdEvent = randomEventManager.generateEventForFile('.md');

      expect(jsEvent).toBeDefined();
      expect(jsonEvent).toBeDefined();
      expect(mdEvent).toBeDefined();
      
      // ファイルタイプごとの特性をテスト
      expect(jsEvent.category).toBeDefined();
    });
  });

  describe('良いイベント処理', () => {
    test('経験値ボーナスイベント', () => {
      const experienceEvent: RandomEvent = {
        id: 'exp_bonus_1',
        type: 'good',
        category: 'experience',
        description: 'Found optimization tip!',
        effects: [
          { type: 'experience', value: 50 }
        ]
      };

      const initialExp = player.getStats().experience;
      const result = randomEventManager.processGoodEvent(experienceEvent);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Found optimization tip!');
      expect(result.output).toContain('experience: +50');
      expect(player.getStats().experience).toBe(initialExp + 50);
    });

    test('装備発見イベント', () => {
      const equipmentEvent: RandomEvent = {
        id: 'equipment_find_1',
        type: 'good',
        category: 'equipment',
        description: 'Discovered a rare function keyword!',
        effects: [
          { type: 'equipment', value: 1, equipmentName: 'async' }
        ]
      };

      const initialInventorySize = player.getInventory().length;
      const result = randomEventManager.processGoodEvent(equipmentEvent);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Discovered a rare function keyword!');
      expect(result.output).toContain('Equipment obtained: async');
      expect(player.getInventory().length).toBe(initialInventorySize + 1);
      expect(player.getInventory()).toContain('async');
    });

    test('ステータスアップイベント', () => {
      const statusEvent: RandomEvent = {
        id: 'status_buff_1',
        type: 'good',
        category: 'status',
        description: 'Feeling inspired by clean code!',
        effects: [
          { type: 'statusBuff', value: 5, duration: 3, statType: 'attack' }
        ]
      };

      const result = randomEventManager.processGoodEvent(statusEvent);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Feeling inspired by clean code!');
      expect(result.output).toContain('Attack +5 for 3 turns');
      
      const buffs = randomEventManager.getActiveBuffs();
      expect(buffs.length).toBe(1);
      expect(buffs[0].statType).toBe('attack');
      expect(buffs[0].value).toBe(5);
    });

    test('複数効果のイベント', () => {
      const multiEvent: RandomEvent = {
        id: 'multi_good_1',
        type: 'good',
        category: 'mixed',
        description: 'Found a comprehensive tutorial!',
        effects: [
          { type: 'experience', value: 30 },
          { type: 'health', value: 20 },
          { type: 'mana', value: 15 }
        ]
      };

      const initialExp = player.getStats().experience;
      const initialHealth = player.getStats().currentHealth;
      const initialMana = player.getStats().currentMana;

      const result = randomEventManager.processGoodEvent(multiEvent);

      expect(result.success).toBe(true);
      expect(result.output).toContain('experience: +30');
      expect(result.output).toContain('health: +20');
      expect(result.output).toContain('mana: +15');
      expect(player.getStats().experience).toBe(initialExp + 30);
    });
  });

  describe('悪いイベント処理', () => {
    test('ダメージイベントでタイピングチャレンジが生成される', () => {
      const damageEvent: RandomEvent = {
        id: 'damage_1',
        type: 'bad',
        category: 'damage',
        description: 'Memory leak detected!',
        severity: 3,
        effects: [
          { type: 'damage', value: 25 }
        ]
      };

      const challenge = randomEventManager.generateAvoidanceChallenge(damageEvent);

      expect(challenge).toBeDefined();
      expect(challenge.word).toBeDefined();
      expect(challenge.word.length).toBeGreaterThan(0);
      expect(challenge.timeLimit).toBeGreaterThan(0);
      expect(challenge.timeLimit).toBeLessThan(30);
      expect(challenge.difficulty).toBeGreaterThanOrEqual(1);
      expect(challenge.difficulty).toBeLessThanOrEqual(5);
    });

    test('タイピング回避の完全成功', () => {
      const damageEvent: RandomEvent = {
        id: 'damage_1',
        type: 'bad',
        category: 'damage',
        description: 'Syntax error encountered!',
        severity: 2,
        effects: [
          { type: 'damage', value: 20 }
        ]
      };

      const perfectTyping: TypingResult = {
        input: 'function',
        accuracy: 100,
        speed: 60,
        timeUsed: 2.0,
        perfect: true
      };

      const result = randomEventManager.processTypingAvoidance(damageEvent, perfectTyping);

      expect(result.success).toBe('complete');
      expect(result.reduction).toBe(1.0); // 100%軽減
      expect(result.typingResult).toBe(perfectTyping);
    });

    test('タイピング回避の部分成功', () => {
      const damageEvent: RandomEvent = {
        id: 'damage_1',
        type: 'bad',
        category: 'damage',
        description: 'Buffer overflow warning!',
        severity: 3,
        effects: [
          { type: 'damage', value: 30 }
        ]
      };

      const partialTyping: TypingResult = {
        input: 'functoin', // 1文字間違い
        accuracy: 85,
        speed: 40,
        timeUsed: 3.5,
        perfect: false
      };

      const result = randomEventManager.processTypingAvoidance(damageEvent, partialTyping);

      expect(result.success).toBe('partial');
      expect(result.reduction).toBeGreaterThan(0.5);
      expect(result.reduction).toBeLessThan(1.0);
    });

    test('タイピング回避の失敗', () => {
      const damageEvent: RandomEvent = {
        id: 'damage_1',
        type: 'bad',
        category: 'damage',
        description: 'Critical system error!',
        severity: 4,
        effects: [
          { type: 'damage', value: 40 }
        ]
      };

      const failedTyping: TypingResult = {
        input: 'wrong',
        accuracy: 20,
        speed: 10,
        timeUsed: 8.0,
        perfect: false
      };

      const result = randomEventManager.processTypingAvoidance(damageEvent, failedTyping);

      expect(result.success).toBe('failed');
      expect(result.reduction).toBe(0.0); // 軽減なし
    });

    test('悪いイベントの効果適用', () => {
      const damageEvent: RandomEvent = {
        id: 'damage_1',
        type: 'bad',
        category: 'damage',
        description: 'Segmentation fault!',
        severity: 3,
        effects: [
          { type: 'damage', value: 30 }
        ]
      };

      const avoidanceResult: AvoidanceResult = {
        success: 'partial',
        reduction: 0.6, // 60%軽減
        typingResult: {
          input: 'function',
          accuracy: 80,
          speed: 45,
          timeUsed: 3.0,
          perfect: false
        }
      };

      const initialHealth = player.getStats().currentHealth;
      const result = randomEventManager.processBadEvent(damageEvent, avoidanceResult);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Segmentation fault!');
      expect(result.output).toContain('Partial avoidance');
      expect(result.output).toContain('60% damage reduction');
      
      const actualDamage = Math.round(30 * (1 - 0.6)); // 12ダメージ
      expect(player.getStats().currentHealth).toBe(initialHealth - actualDamage);
    });
  });

  describe('デバフシステム', () => {
    test('ステータスデバフの適用', () => {
      const debuffEvent: RandomEvent = {
        id: 'debuff_1',
        type: 'bad',
        category: 'debuff',
        description: 'Code fatigue setting in...',
        severity: 2,
        effects: [
          { type: 'statusDebuff', value: 3, duration: 5, statType: 'speed' }
        ]
      };

      const noAvoidance: AvoidanceResult = {
        success: 'failed',
        reduction: 0.0,
        typingResult: {
          input: '',
          accuracy: 0,
          speed: 0,
          timeUsed: 10.0,
          perfect: false
        }
      };

      const result = randomEventManager.processBadEvent(debuffEvent, noAvoidance);

      expect(result.success).toBe(true);
      const debuffs = randomEventManager.getActiveDebuffs();
      expect(debuffs.length).toBe(1);
      expect(debuffs[0].statType).toBe('speed');
      expect(debuffs[0].value).toBe(-3);
      expect(debuffs[0].duration).toBe(5);
    });
  });

  describe('バフ・デバフ管理', () => {
    test('ターン経過でバフ・デバフが減少', () => {
      // バフを追加
      const buffEvent: RandomEvent = {
        id: 'buff_1',
        type: 'good',
        category: 'status',
        description: 'Caffeine boost!',
        effects: [
          { type: 'statusBuff', value: 5, duration: 2, statType: 'speed' }
        ]
      };

      randomEventManager.processGoodEvent(buffEvent);
      expect(randomEventManager.getActiveBuffs().length).toBe(1);

      // 1ターン経過
      randomEventManager.processTurnEnd();
      expect(randomEventManager.getActiveBuffs()[0].duration).toBe(1);

      // 2ターン経過
      randomEventManager.processTurnEnd();
      expect(randomEventManager.getActiveBuffs().length).toBe(0);
    });

    test('プレイヤーの総合ステータス計算', () => {
      // バフとデバフを同時適用
      randomEventManager.addBuff('attack', 10, 3);
      randomEventManager.addDebuff('defense', 5, 2);

      const modifiedStats = randomEventManager.getModifiedPlayerStats();
      const baseStats = player.getStats();

      expect(modifiedStats.totalAttack).toBe(baseStats.baseAttack + baseStats.equipmentAttack + 10);
      expect(modifiedStats.totalDefense).toBe(baseStats.baseDefense + baseStats.equipmentDefense - 5);
    });
  });

  describe('イベント統計', () => {
    test('イベント発生履歴の記録', () => {
      const event1 = randomEventManager.generateRandomEvent('good');
      const event2 = randomEventManager.generateRandomEvent('bad');

      randomEventManager.processGoodEvent(event1);
      
      const history = randomEventManager.getEventHistory();
      expect(history.length).toBe(1);
      expect(history[0].eventId).toBe(event1.id);
      expect(history[0].success).toBe(true);
    });

    test('イベントタイプ別統計', () => {
      // 複数イベントを処理
      for (let i = 0; i < 5; i++) {
        const goodEvent = randomEventManager.generateRandomEvent('good');
        randomEventManager.processGoodEvent(goodEvent);
      }
      
      for (let i = 0; i < 3; i++) {
        const badEvent = randomEventManager.generateRandomEvent('bad');
        const failedAvoidance: AvoidanceResult = {
          success: 'failed',
          reduction: 0.0,
          typingResult: { input: '', accuracy: 0, speed: 0, timeUsed: 10.0, perfect: false }
        };
        randomEventManager.processBadEvent(badEvent, failedAvoidance);
      }

      const stats = randomEventManager.getEventStats();
      expect(stats.totalEvents).toBe(8);
      expect(stats.goodEvents).toBe(5);
      expect(stats.badEvents).toBe(3);
      expect(stats.avoidanceSuccessRate).toBe(0); // 全て失敗
    });
  });

  describe('特殊イベント', () => {
    test('連鎖イベントの処理', () => {
      const chainEvent: RandomEvent = {
        id: 'chain_1',
        type: 'good',
        category: 'special',
        description: 'Found a tutorial series!',
        effects: [
          { type: 'experience', value: 20 },
          { type: 'chainEvent', value: 1, nextEventType: 'good' }
        ]
      };

      const result = randomEventManager.processGoodEvent(chainEvent);
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('This triggers another event');
      
      const nextEvent = randomEventManager.getNextChainEvent();
      expect(nextEvent).toBeDefined();
      expect(nextEvent!.type).toBe('good');
    });
  });
});