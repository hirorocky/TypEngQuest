import { Player } from '../player/Player';
import { Enemy } from './Enemy';
import { Skill } from './Skill';
import { BattleCalculator } from './BattleCalculator';
import { TypingResult } from '../typing/types';

/**
 * プレイヤーの技使用結果
 */
export interface PlayerSkillResult {
  success: boolean;
  damage: number;
  message: string;
  critical?: boolean;
}

/**
 * 敵の行動結果
 */
export interface EnemyActionResult {
  skillUsed: Skill;
  damage: number;
  message: string;
  critical?: boolean;
}

/**
 * 戦闘終了結果
 */
export interface BattleEndResult {
  winner: 'player' | 'enemy';
  message: string;
}

/**
 * 戦闘の最終結果
 */
export interface BattleResult {
  victory: boolean;
  turns: number;
  enemyDefeated?: string;
  droppedItems?: string[];
}

/**
 * Battleクラス - 戦闘フローの制御とターン管理を行う
 */
export class Battle {
  // 戦闘で使用する定数
  private static readonly NORMAL_ATTACK_ACCURACY = 90;
  private static readonly NORMAL_ATTACK_POWER = 1.0;

  // 通常攻撃用のデフォルトSkill
  private static readonly NORMAL_ATTACK_SKILL: Skill = {
    id: 'normal_attack',
    name: 'Attack',
    description: 'A basic attack',
    mpCost: 0,
    mpCharge: 0,
    actionCost: 1,
    power: Battle.NORMAL_ATTACK_POWER,
    accuracy: Battle.NORMAL_ATTACK_ACCURACY,
    target: 'enemy',
    typingDifficulty: 1,
  };

  private player: Player;
  private enemy: Enemy;
  private _isActive: boolean = false;
  private _currentTurn: number = 0;
  private battleResult: BattleResult | null = null;

  /**
   * Battleのコンストラクタ
   * @param player プレイヤー
   * @param enemy 敵
   */
  constructor(player: Player, enemy: Enemy) {
    this.player = player;
    this.enemy = enemy;
  }

  /** 戦闘がアクティブかどうか */
  get isActive(): boolean {
    return this._isActive;
  }

  /** 現在のターン数 */
  get currentTurn(): number {
    return this._currentTurn;
  }

  /**
   * 戦闘を開始する
   * @returns 開始メッセージ
   * @throws {Error} 既に戦闘が開始されている場合
   */
  start(): string {
    if (this._isActive) {
      throw new Error('Battle already started');
    }

    this._isActive = true;
    this._currentTurn = 1;
    this.battleResult = null;

    return `${this.enemy.name} appeared!`;
  }

  /**
   * 戦闘を終了する
   * @throws {Error} 戦闘が開始されていない場合
   */
  end(): void {
    if (!this._isActive) {
      throw new Error('Battle not started');
    }

    this._isActive = false;
  }

  /**
   * 次のターンに進める
   */
  nextTurn(): void {
    this._currentTurn++;
  }

  /**
   * 現在のターンが誰のターンか判定する
   * @returns 'player' または 'enemy'
   */
  getCurrentTurnActor(): 'player' | 'enemy' {
    const playerStats = this.player.getTotalStats();
    const enemyAgility = this.enemy.stats.agility;

    if (playerStats.agility > enemyAgility) {
      return 'player';
    } else if (playerStats.agility < enemyAgility) {
      return 'enemy';
    } else {
      // 敏捷性が同じ場合はランダム
      return Math.random() < 0.5 ? 'player' : 'enemy';
    }
  }

  /**
   * プレイヤーが技を使用する
   * @param skill 使用する技
   * @param typingResult タイピング結果（オプション）
   * @returns 技の使用結果
   */
  playerUseSkill(skill: Skill, typingResult?: TypingResult): PlayerSkillResult {
    const playerStats = this.player.getTotalStats();
    const enemyStats = this.enemy.stats;

    // 命中判定
    const hitRate = this.calculateEnhancedHitRate(playerStats, skill, typingResult);
    const evadeRate = BattleCalculator.calculateEvadeRate(enemyStats.agility);

    if (!BattleCalculator.isHit(hitRate, evadeRate)) {
      return {
        success: false,
        damage: 0,
        message: `${skill.name} missed!`,
      };
    }

    // クリティカル判定とダメージ計算
    const criticalRate = this.calculateEnhancedCriticalRate(playerStats, typingResult);
    const isCritical = BattleCalculator.isCritical(criticalRate);

    let damage = BattleCalculator.calculateDamage(
      playerStats.strength,
      enemyStats.willpower,
      skill.power,
      isCritical
    );

    // タイピング効果倍率適用
    damage = this.applyTypingEffectMultiplier(damage, typingResult);

    // ダメージを与える
    this.enemy.takeDamage(damage);

    return {
      success: true,
      damage,
      message: this.generateSkillMessage(skill.name, damage, isCritical, typingResult),
      critical: isCritical,
    };
  }

  /**
   * タイピング結果を考慮した命中率を計算する
   */
  private calculateEnhancedHitRate(
    playerStats: any,
    skill: Skill,
    typingResult?: TypingResult
  ): number {
    let hitRate = BattleCalculator.calculateHitRate(skill.accuracy);

    if (typingResult?.isSuccess) {
      hitRate = BattleCalculator.calculateTypingSpeedBonus(
        hitRate,
        playerStats.agility,
        typingResult.speedRating
      );
    }

    return hitRate;
  }

  /**
   * タイピング結果を考慮したクリティカル率を計算する
   */
  private calculateEnhancedCriticalRate(playerStats: any, typingResult?: TypingResult): number {
    let criticalRate = BattleCalculator.calculateCriticalRate(playerStats.fortune);

    if (typingResult?.isSuccess) {
      criticalRate = BattleCalculator.calculateTypingAccuracyBonus(
        criticalRate,
        playerStats.agility,
        typingResult.accuracyRating
      );
    }

    return criticalRate;
  }

  /**
   * タイピング効果倍率をダメージに適用する
   */
  private applyTypingEffectMultiplier(damage: number, typingResult?: TypingResult): number {
    if (typingResult?.isSuccess) {
      const effectMultiplier = BattleCalculator.calculateTypingEffectMultiplier(
        typingResult.totalRating
      );
      return Math.floor(damage * effectMultiplier);
    }
    return damage;
  }

  /**
   * スキル使用メッセージを生成する
   */
  private generateSkillMessage(
    skillName: string,
    damage: number,
    isCritical: boolean,
    typingResult?: TypingResult
  ): string {
    let message = `${skillName} dealt ${damage} damage!`;
    if (isCritical) {
      message += ' Critical hit!';
    }
    if (typingResult?.isSuccess && typingResult.totalRating > 100) {
      message += ' Great typing!';
    }
    return message;
  }

  /**
   * 敵の行動を実行する
   * @returns 敵の行動結果
   */
  enemyAction(): EnemyActionResult {
    // 技を選択（なければ通常攻撃）
    const selectedSkill = this.enemy.selectSkill() || Battle.NORMAL_ATTACK_SKILL;

    const playerStats = this.player.getTotalStats();
    const enemyStats = this.enemy.stats;

    // 命中判定
    const hitRate = BattleCalculator.calculateHitRate(selectedSkill.accuracy);
    const evadeRate = BattleCalculator.calculateEvadeRate(playerStats.agility);

    if (!BattleCalculator.isHit(hitRate, evadeRate)) {
      return {
        skillUsed: selectedSkill,
        damage: 0,
        message: `${this.enemy.name} used ${selectedSkill.name} but missed!`,
      };
    }

    // クリティカル判定
    const criticalRate = BattleCalculator.calculateCriticalRate(enemyStats.fortune);
    const isCritical = BattleCalculator.isCritical(criticalRate);

    // ダメージ計算
    const damage = BattleCalculator.calculateDamage(
      enemyStats.strength,
      0, // プレイヤーへの攻撃では防御力を考慮しない
      selectedSkill.power,
      isCritical
    );

    // ダメージを与える
    this.player.getBodyStats().takeDamage(damage);

    return {
      skillUsed: selectedSkill,
      damage,
      message: `${this.enemy.name} used ${selectedSkill.name} and dealt ${damage} damage!${
        isCritical ? ' Critical hit!' : ''
      }`,
      critical: isCritical,
    };
  }

  /**
   * 戦闘終了をチェックする
   * @returns 戦闘終了結果、継続の場合はnull
   */
  checkBattleEnd(): BattleEndResult | null {
    if (this.enemy.isDefeated()) {
      this._isActive = false;
      this.battleResult = {
        victory: true,
        turns: this._currentTurn,
        enemyDefeated: this.enemy.name,
      };
      return {
        winner: 'player',
        message: `You defeated ${this.enemy.name}!`,
      };
    }

    if (this.player.getBodyStats().getCurrentHP() <= 0) {
      this._isActive = false;
      this.battleResult = {
        victory: false,
        turns: this._currentTurn,
      };
      return {
        winner: 'enemy',
        message: `You were defeated by ${this.enemy.name}...`,
      };
    }

    return null;
  }

  /**
   * 戦闘結果を取得する
   * @returns 戦闘結果、戦闘中の場合はnull
   */
  getBattleResult(): BattleResult | null {
    return this.battleResult;
  }

  /**
   * ドロップアイテムを計算する
   * @returns ドロップしたアイテムIDのリスト
   */
  calculateDrops(): string[] {
    if (!this.battleResult || !this.battleResult.victory) {
      return [];
    }

    const playerStats = this.player.getTotalStats();
    const worldLevel = 1; // TODO: ワールドレベルを取得する実装が必要
    const dropRate = BattleCalculator.calculateDropRate(playerStats.fortune, worldLevel);

    const droppedItems: string[] = [];

    // ドロップ率がそもそも0の場合は何もドロップしない
    if (dropRate === 0) {
      return droppedItems;
    }

    // 基本ドロップ率の判定（一度だけ）
    const baseDropRoll = Math.random() * 100;
    if (baseDropRoll >= dropRate) {
      return droppedItems; // ドロップしない
    }

    // 基本ドロップ率を通った場合のみ、各アイテムの個別判定を行う
    for (const drop of this.enemy.drops) {
      const itemDropRoll = Math.random() * 100;
      if (itemDropRoll < drop.dropRate) {
        droppedItems.push(drop.itemId);
      }
    }

    // 結果に保存
    if (this.battleResult) {
      this.battleResult.droppedItems = droppedItems;
    }

    return droppedItems;
  }
}
