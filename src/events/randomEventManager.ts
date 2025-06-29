import { Player } from '../core/player';
import { World } from '../world/world';
import { TypingChallenge, TypingResult, ChallengeDifficulty } from '../battle/typingChallenge';

/**
 * ランダムイベントの定義
 */
export interface RandomEvent {
  id: string;
  type: 'good' | 'bad';
  category: 'experience' | 'equipment' | 'status' | 'damage' | 'debuff' | 'mixed' | 'special';
  description: string;
  effects: EventEffect[];
  severity?: number; // 悪いイベントの深刻度（1-5）
}

/**
 * イベント効果の定義
 */
export interface EventEffect {
  type:
    | 'experience'
    | 'health'
    | 'mana'
    | 'damage'
    | 'equipment'
    | 'statusBuff'
    | 'statusDebuff'
    | 'chainEvent';
  value: number;
  duration?: number; // 一時効果の持続時間（ターン数）
  statType?: string; // 対象ステータス（attack, defense, speed, accuracy, critical）
  equipmentName?: string; // 装備名
  nextEventType?: 'good' | 'bad'; // 連鎖イベント用
}

/**
 * タイピング回避チャレンジの定義
 */
export interface TypingAvoidanceChallenge {
  word: string;
  timeLimit: number;
  difficulty: number;
  successThreshold: number; // 成功判定の精度閾値
}

/**
 * 回避結果の定義
 */
export interface AvoidanceResult {
  success: 'complete' | 'partial' | 'failed';
  reduction: number; // 効果軽減率（0-1）
  typingResult: TypingResult;
}

/**
 * コマンド実行結果
 */
export interface CommandResult {
  success: boolean;
  output: string;
}

/**
 * バフ・デバフ効果
 */
interface StatusEffect {
  statType: string;
  value: number;
  duration: number;
  isPositive: boolean;
}

/**
 * イベント履歴
 */
interface EventHistory {
  eventId: string;
  type: 'good' | 'bad';
  timestamp: Date;
  success: boolean;
  avoidanceSuccess?: 'complete' | 'partial' | 'failed';
}

/**
 * プレイヤー修正ステータス
 */
interface ModifiedPlayerStats {
  totalAttack: number;
  totalDefense: number;
  totalSpeed: number;
  totalAccuracy: number;
  totalCritical: number;
}

/**
 * イベント統計
 */
interface EventStats {
  totalEvents: number;
  goodEvents: number;
  badEvents: number;
  avoidanceSuccessRate: number;
}

/**
 * ランダムイベントマネージャー
 * ランダムイベントの生成、処理、タイピング回避システムを管理する
 */
export class RandomEventManager {
  private typingChallenge: TypingChallenge;
  private activeBuffs: StatusEffect[] = [];
  private activeDebuffs: StatusEffect[] = [];
  private eventHistory: EventHistory[] = [];
  private chainEvent: RandomEvent | null = null;

  // イベントデータベース
  private goodEvents = {
    experience: [
      { description: 'Found an optimization tip!', baseValue: 30 },
      { description: 'Discovered a useful code pattern!', baseValue: 25 },
      { description: 'Read an insightful programming article!', baseValue: 40 },
      { description: 'Learned a new debugging technique!', baseValue: 35 },
    ],
    equipment: [
      {
        description: 'Discovered a rare function keyword!',
        equipment: ['async', 'await', 'const', 'let'],
      },
      {
        description: 'Found advanced programming construct!',
        equipment: ['interface', 'abstract', 'generic', 'decorator'],
      },
      {
        description: 'Uncovered powerful utility function!',
        equipment: ['map', 'filter', 'reduce', 'forEach'],
      },
    ],
    status: [
      { description: 'Feeling inspired by clean code!', stat: 'attack', value: 5, duration: 3 },
      { description: 'Boosted by successful compilation!', stat: 'speed', value: 3, duration: 4 },
      { description: 'Energized by coffee break!', stat: 'accuracy', value: 4, duration: 2 },
    ],
  };

  private badEvents = {
    damage: [
      { description: 'Memory leak detected!', baseValue: 20, severity: 2 },
      { description: 'Segmentation fault occurred!', baseValue: 30, severity: 3 },
      { description: 'Critical system error!', baseValue: 40, severity: 4 },
      { description: 'Stack overflow exception!', baseValue: 25, severity: 3 },
    ],
    debuff: [
      {
        description: 'Code fatigue setting in...',
        stat: 'speed',
        value: 3,
        duration: 5,
        severity: 2,
      },
      {
        description: 'Confusion from complex logic!',
        stat: 'accuracy',
        value: 4,
        duration: 3,
        severity: 2,
      },
      {
        description: 'Overwhelmed by technical debt!',
        stat: 'attack',
        value: 5,
        duration: 4,
        severity: 3,
      },
    ],
  };

  constructor(
    private player: Player,
    private world: World
  ) {
    this.typingChallenge = new TypingChallenge();
  }

  /**
   * ランダムイベントを生成する
   * @param type - イベントタイプ（'good' | 'bad'）
   * @returns 生成されたランダムイベント
   */
  generateRandomEvent(type: 'good' | 'bad'): RandomEvent {
    const worldLevel = this.world.getLevel();
    const eventId = this.generateEventId();

    if (type === 'good') {
      return this.generateGoodEvent(eventId, worldLevel);
    } else {
      return this.generateBadEvent(eventId, worldLevel);
    }
  }

  /**
   * ファイルタイプに応じたイベントを生成する
   * @param fileExtension - ファイル拡張子
   * @returns 生成されたランダムイベント
   */
  generateEventForFile(fileExtension: string): RandomEvent {
    const eventType = this.determineEventTypeByFile(fileExtension);
    const event = this.generateRandomEvent(eventType);

    // ファイルタイプ特有の調整
    this.adjustEventForFileType(event, fileExtension);

    return event;
  }

  /**
   * 良いイベントを処理する
   * @param event - 処理する良いイベント
   * @returns 処理結果
   */
  processGoodEvent(event: RandomEvent): CommandResult {
    let output = `Event triggered: ${event.description}\n`;

    for (const effect of event.effects) {
      output += this.processGoodEventEffect(effect);
    }

    this.recordEvent(event, true);
    return {
      success: true,
      output: output.trim(),
    };
  }

  private processGoodEventEffect(effect: EventEffect): string {
    switch (effect.type) {
      case 'experience':
        return this.processExperienceEffect(effect);
      case 'health':
        return this.processHealthEffect(effect);
      case 'mana':
        return this.processManaEffect(effect);
      case 'equipment':
        return this.processEquipmentEffect(effect);
      case 'statusBuff':
        return this.processStatusBuffEffect(effect);
      case 'chainEvent':
        return this.processChainEventEffect(effect);
      default:
        return '';
    }
  }

  private processExperienceEffect(effect: EventEffect): string {
    this.player.addExperience(effect.value);
    return `experience: +${effect.value}\n`;
  }

  private processHealthEffect(effect: EventEffect): string {
    this.player.heal(effect.value);
    return `health: +${effect.value}\n`;
  }

  private processManaEffect(effect: EventEffect): string {
    this.player.restoreMana(effect.value);
    return `mana: +${effect.value}\n`;
  }

  private processEquipmentEffect(effect: EventEffect): string {
    if (effect.equipmentName) {
      this.player.addToInventory(effect.equipmentName);
      return `Equipment obtained: ${effect.equipmentName}\n`;
    }
    return '';
  }

  private processStatusBuffEffect(effect: EventEffect): string {
    if (effect.statType && effect.duration) {
      this.addBuff(effect.statType, effect.value, effect.duration);
      return `${this.capitalizeFirst(effect.statType)} +${effect.value} for ${effect.duration} turns\n`;
    }
    return '';
  }

  private processChainEventEffect(effect: EventEffect): string {
    if (effect.nextEventType) {
      this.chainEvent = this.generateRandomEvent(effect.nextEventType);
      return `This triggers another event!\n`;
    }
    return '';
  }

  /**
   * タイピング回避チャレンジを生成する
   * @param event - 悪いイベント
   * @returns タイピング回避チャレンジ
   */
  generateAvoidanceChallenge(event: RandomEvent): TypingAvoidanceChallenge {
    const worldLevel = this.world.getLevel();
    const severity = event.severity || 1;

    // 難易度を決定（ワールドレベル + イベント深刻度）
    const baseDifficulty = Math.min(5, Math.max(1, worldLevel + severity - 2));
    const difficulty = this.mapToDifficulty(baseDifficulty);

    const challenge = this.typingChallenge.generateChallenge(difficulty);

    // 制限時間を深刻度に応じて調整（深刻なほど短時間）
    const timeLimit = Math.max(5, Math.round((challenge.timeLimit * (6 - severity)) / 5));

    // 成功閾値を設定（深刻なほど高精度要求）
    const successThreshold = Math.max(60, 70 + severity * 5);

    return {
      word: challenge.word,
      timeLimit,
      difficulty: challenge.difficulty,
      successThreshold,
    };
  }

  /**
   * タイピング回避結果を処理する
   * @param event - 悪いイベント
   * @param typingResult - タイピング結果
   * @returns 回避結果
   */
  processTypingAvoidance(event: RandomEvent, typingResult: TypingResult): AvoidanceResult {
    const challenge = this.generateAvoidanceChallenge(event);

    if (typingResult.perfect && typingResult.accuracy === 100) {
      return {
        success: 'complete',
        reduction: 1.0, // 100%軽減
        typingResult,
      };
    }

    if (typingResult.accuracy >= challenge.successThreshold) {
      // 部分成功：精度に基づいて軽減率を計算
      const reduction = Math.min(0.9, (typingResult.accuracy / 100) * 0.8 + 0.1);
      return {
        success: 'partial',
        reduction,
        typingResult,
      };
    }

    return {
      success: 'failed',
      reduction: 0.0, // 軽減なし
      typingResult,
    };
  }

  /**
   * 悪いイベントを処理する
   * @param event - 悪いイベント
   * @param avoidanceResult - タイピング回避結果
   * @returns 処理結果
   */
  processBadEvent(event: RandomEvent, avoidanceResult: AvoidanceResult): CommandResult {
    let output = `Dangerous event: ${event.description}\n`;
    output += this.getAvoidanceResultMessage(avoidanceResult);

    // 効果を適用（軽減率を考慮）
    for (const effect of event.effects) {
      output += this.processBadEventEffect(effect, avoidanceResult);
    }

    this.recordEvent(event, true, avoidanceResult.success);
    return {
      success: true,
      output: output.trim(),
    };
  }

  private getAvoidanceResultMessage(avoidanceResult: AvoidanceResult): string {
    switch (avoidanceResult.success) {
      case 'complete':
        return `Perfect avoidance! No negative effects.\n`;
      case 'partial': {
        const reductionPercent = Math.round(avoidanceResult.reduction * 100);
        return `Partial avoidance! ${reductionPercent}% damage reduction.\n`;
      }
      case 'failed':
        return `Avoidance failed! Full effects applied.\n`;
      default:
        return '';
    }
  }

  private processBadEventEffect(effect: EventEffect, avoidanceResult: AvoidanceResult): string {
    const reducedValue = Math.round(effect.value * (1 - avoidanceResult.reduction));

    switch (effect.type) {
      case 'damage':
        if (reducedValue > 0) {
          this.player.takeDamage(reducedValue);
          return `damage: -${reducedValue}\n`;
        }
        return '';
      case 'statusDebuff': {
        if (effect.statType && effect.duration && reducedValue > 0) {
          const duration = Math.max(
            1,
            Math.round(effect.duration * (1 - avoidanceResult.reduction * 0.5))
          );
          this.addDebuff(effect.statType, reducedValue, duration);
          return `${this.capitalizeFirst(effect.statType)} -${reducedValue} for ${duration} turns\n`;
        }
        return '';
      }
      default:
        return '';
    }
  }

  /**
   * バフを追加する
   * @param statType - ステータスタイプ
   * @param value - 効果値
   * @param duration - 持続時間
   */
  addBuff(statType: string, value: number, duration: number): void {
    this.activeBuffs.push({
      statType,
      value,
      duration,
      isPositive: true,
    });
  }

  /**
   * デバフを追加する
   * @param statType - ステータスタイプ
   * @param value - 効果値
   * @param duration - 持続時間
   */
  addDebuff(statType: string, value: number, duration: number): void {
    this.activeDebuffs.push({
      statType,
      value: -value, // デバフは負の値
      duration,
      isPositive: false,
    });
  }

  /**
   * アクティブなバフを取得する
   * @returns アクティブなバフ一覧
   */
  getActiveBuffs(): StatusEffect[] {
    return [...this.activeBuffs];
  }

  /**
   * アクティブなデバフを取得する
   * @returns アクティブなデバフ一覧
   */
  getActiveDebuffs(): StatusEffect[] {
    return [...this.activeDebuffs];
  }

  /**
   * ターン終了処理（バフ・デバフの持続時間減少）
   */
  processTurnEnd(): void {
    this.activeBuffs = this.activeBuffs.filter(buff => {
      buff.duration--;
      return buff.duration > 0;
    });

    this.activeDebuffs = this.activeDebuffs.filter(debuff => {
      debuff.duration--;
      return debuff.duration > 0;
    });
  }

  /**
   * 修正されたプレイヤーステータスを取得する
   * @returns バフ・デバフ適用後のステータス
   */
  getModifiedPlayerStats(): ModifiedPlayerStats {
    const totalStats = this.player.getTotalStats();

    const modifiers = {
      attack: 0,
      defense: 0,
      speed: 0,
      accuracy: 0,
      critical: 0,
    };

    // バフ・デバフを適用
    [...this.activeBuffs, ...this.activeDebuffs].forEach(effect => {
      if (Object.prototype.hasOwnProperty.call(modifiers, effect.statType)) {
        modifiers[effect.statType as keyof typeof modifiers] += effect.value;
      }
    });

    return {
      totalAttack: totalStats.attack + modifiers.attack,
      totalDefense: totalStats.defense + modifiers.defense,
      totalSpeed: totalStats.speed + modifiers.speed,
      totalAccuracy: totalStats.accuracy + modifiers.accuracy,
      totalCritical: totalStats.critical + modifiers.critical,
    };
  }

  /**
   * イベント履歴を取得する
   * @returns イベント履歴
   */
  getEventHistory(): EventHistory[] {
    return [...this.eventHistory];
  }

  /**
   * イベント統計を取得する
   * @returns イベント統計
   */
  getEventStats(): EventStats {
    const total = this.eventHistory.length;
    const good = this.eventHistory.filter(e => e.type === 'good').length;
    const bad = this.eventHistory.filter(e => e.type === 'bad').length;

    const badWithAvoidance = this.eventHistory.filter(e => e.type === 'bad' && e.avoidanceSuccess);
    const successfulAvoidances = badWithAvoidance.filter(
      e => e.avoidanceSuccess === 'complete' || e.avoidanceSuccess === 'partial'
    ).length;
    const avoidanceRate =
      badWithAvoidance.length > 0 ? successfulAvoidances / badWithAvoidance.length : 0;

    return {
      totalEvents: total,
      goodEvents: good,
      badEvents: bad,
      avoidanceSuccessRate: avoidanceRate,
    };
  }

  /**
   * 次の連鎖イベントを取得する
   * @returns 連鎖イベント（ある場合）
   */
  getNextChainEvent(): RandomEvent | null {
    const event = this.chainEvent;
    this.chainEvent = null; // 取得後にクリア
    return event;
  }

  // Private methods

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateGoodEvent(id: string, worldLevel: number): RandomEvent {
    const categories = Object.keys(this.goodEvents) as Array<keyof typeof this.goodEvents>;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const templates = this.goodEvents[category];
    const template = templates[Math.floor(Math.random() * templates.length)];

    const effects: EventEffect[] = [];

    switch (category) {
      case 'experience': {
        effects.push({
          type: 'experience',
          value: Math.round((template as any).baseValue * (1 + worldLevel * 0.2)),
        });
        break;
      }
      case 'equipment': {
        const equipment = (template as any).equipment;
        const selectedEquipment = equipment[Math.floor(Math.random() * equipment.length)];
        effects.push({
          type: 'equipment',
          value: 1,
          equipmentName: selectedEquipment,
        });
        break;
      }
      case 'status': {
        effects.push({
          type: 'statusBuff',
          value: (template as any).value,
          duration: (template as any).duration,
          statType: (template as any).stat,
        });
        break;
      }
    }

    return {
      id,
      type: 'good',
      category: category as any,
      description: template.description,
      effects,
    };
  }

  private generateBadEvent(id: string, worldLevel: number): RandomEvent {
    const categories = Object.keys(this.badEvents) as Array<keyof typeof this.badEvents>;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const templates = this.badEvents[category];
    const template = templates[Math.floor(Math.random() * templates.length)];

    const effects: EventEffect[] = [];
    const severity = Math.min(5, (template as any).severity + Math.floor(worldLevel / 2));

    switch (category) {
      case 'damage': {
        effects.push({
          type: 'damage',
          value: Math.round((template as any).baseValue * (1 + worldLevel * 0.3)),
        });
        break;
      }
      case 'debuff': {
        effects.push({
          type: 'statusDebuff',
          value: (template as any).value,
          duration: (template as any).duration,
          statType: (template as any).stat,
        });
        break;
      }
    }

    return {
      id,
      type: 'bad',
      category: category as any,
      description: template.description,
      effects,
      severity,
    };
  }

  private determineEventTypeByFile(fileExtension: string): 'good' | 'bad' {
    // ファイルタイプに基づく確率
    const badEventProbability = {
      '.exe': 0.7,
      '.bin': 0.7,
      '.dll': 0.6,
      '.tmp': 0.6,
      '.log': 0.5,
      '.error': 0.8,
      '.crash': 0.9,
      '.md': 0.2,
      '.txt': 0.3,
      '.json': 0.4,
    };

    const probability =
      badEventProbability[fileExtension as keyof typeof badEventProbability] || 0.5;
    return Math.random() < probability ? 'bad' : 'good';
  }

  private adjustEventForFileType(event: RandomEvent, fileExtension: string): void {
    // ファイルタイプ特有の調整をここで実装
    if (fileExtension === '.js' || fileExtension === '.ts') {
      event.category = 'bug' as any;
    } else if (fileExtension === '.json') {
      event.category = 'configuration' as any;
    }
  }

  private mapToDifficulty(level: number): ChallengeDifficulty {
    switch (level) {
      case 1:
        return ChallengeDifficulty.BASIC;
      case 2:
        return ChallengeDifficulty.INTERMEDIATE;
      case 3:
        return ChallengeDifficulty.ADVANCED;
      case 4:
        return ChallengeDifficulty.PROGRAMMING;
      case 5:
        return ChallengeDifficulty.EXPERT;
      default:
        return ChallengeDifficulty.BASIC;
    }
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private recordEvent(
    event: RandomEvent,
    success: boolean,
    avoidanceSuccess?: 'complete' | 'partial' | 'failed'
  ): void {
    this.eventHistory.push({
      eventId: event.id,
      type: event.type,
      timestamp: new Date(),
      success,
      avoidanceSuccess,
    });
  }
}
