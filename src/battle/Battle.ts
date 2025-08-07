import { Player } from '../player/Player';
import { BodyStats } from '../player/BodyStats';
import { Enemy } from './Enemy';
import { Skill } from './Skill';
import { BattleCalculator } from './BattleCalculator';
import { TypingResult } from '../typing/types';

// Player.getTotalStats()の戻り値の型
interface TotalStatsResult {
  strength: number;
  willpower: number;
  agility: number;
  fortune: number;
}

// Enemy.statsの型
interface EnemyStats {
  agility: number;
  willpower: number;
  [key: string]: number;
}

/**
 * プレイヤーの技使用結果
 */
export interface PlayerSkillResult {
  success: boolean;
  damage: number;
  message: string;
  critical?: boolean;
  mpRecovered?: number;
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
 * 選択されたスキル
 */
export interface SelectedSkill {
  skill: Skill;
  typingResult?: TypingResult;
}

/**
 * プレイヤーターン結果
 */
export interface PlayerTurnResult {
  skillResults: PlayerSkillResult[];
  totalDamage: number;
  totalMpRecovered: number;
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

  // 行動ポイント関連の定数
  private static readonly BASE_ACTION_POINTS = 3;
  private static readonly AGILITY_TO_AP_DIVISOR = 50;

  // MP回復倍率の定数
  private static readonly MP_RECOVERY_PERFECT_MULTIPLIER = 1.5;
  private static readonly MP_RECOVERY_GREAT_MULTIPLIER = 1.2;

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
  private _currentTurnActor: 'player' | 'enemy' | null = null;
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

    // 最初のターンアクターを決定
    this._currentTurnActor = this.decideFirstTurnActor();

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
    // ターンアクターを交代
    this._currentTurnActor = this._currentTurnActor === 'player' ? 'enemy' : 'player';
  }

  /**
   * 現在のターンが誰のターンか判定する
   * @returns 'player' または 'enemy'
   */
  getCurrentTurnActor(): 'player' | 'enemy' {
    if (!this._currentTurnActor) {
      throw new Error('Battle not started');
    }
    return this._currentTurnActor;
  }

  /**
   * 最初のターンアクターを決定する
   * @returns 'player' または 'enemy'
   */
  private decideFirstTurnActor(): 'player' | 'enemy' {
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
   * プレイヤーの行動ポイントを計算する
   * @returns 行動ポイント
   */
  calculatePlayerActionPoints(): number {
    const playerStats = this.player.getTotalStats();
    // 基本行動ポイント: 3
    // agilityボーナス: agility / 50（端数切り捨て）
    const basePoints = Battle.BASE_ACTION_POINTS;
    const agilityBonus = Math.floor(playerStats.agility / Battle.AGILITY_TO_AP_DIVISOR);
    return Math.max(1, basePoints + agilityBonus);
  }

  /**
   * 選択されたスキルの合計行動コストを計算する
   * @param skills 選択されたスキル
   * @returns 合計行動コスト
   */
  calculateTotalActionCost(skills: Skill[]): number {
    return skills.reduce((total, skill) => total + skill.actionCost, 0);
  }

  /**
   * プレイヤーが選択したスキルを使用可能かチェックする
   * @param skills 選択されたスキル
   * @returns エラーメッセージ（使用可能な場合はnull）
   */
  validateSelectedSkills(skills: Skill[]): string | null {
    if (skills.length === 0) {
      return 'No skills selected';
    }

    const actionPoints = this.calculatePlayerActionPoints();
    const totalCost = this.calculateTotalActionCost(skills);

    if (totalCost > actionPoints) {
      return `Action cost (${totalCost}) exceeds action points (${actionPoints})`;
    }

    const playerBodyStats = this.player.getBodyStats();
    const totalMpCost = skills.reduce((total, skill) => total + skill.mpCost, 0);

    if (playerBodyStats.getCurrentMP() < totalMpCost) {
      return `Not enough MP! Need ${totalMpCost} MP but only have ${playerBodyStats.getCurrentMP()} MP.`;
    }

    return null;
  }

  /**
   * プレイヤーの複数スキルを使用する
   * @param selectedSkills 選択されたスキル
   * @returns プレイヤーターン結果
   */
  playerUseMultipleSkills(selectedSkills: SelectedSkill[]): PlayerTurnResult {
    const skillResults: PlayerSkillResult[] = [];
    let totalDamage = 0;
    let totalMpRecovered = 0;

    for (const { skill, typingResult } of selectedSkills) {
      const result = this.playerUseSkill(skill, typingResult);
      skillResults.push(result);
      totalDamage += result.damage;
      if (result.mpRecovered) {
        totalMpRecovered += result.mpRecovered;
      }
    }

    return {
      skillResults,
      totalDamage,
      totalMpRecovered,
    };
  }

  /**
   * プレイヤーが技を使用する
   * @param skill 使用する技
   * @param typingResult タイピング結果（オプション）
   * @returns 技の使用結果
   */
  playerUseSkill(skill: Skill, typingResult?: TypingResult): PlayerSkillResult {
    const playerBodyStats = this.player.getBodyStats();

    // MPチェックと消費
    const mpCheckResult = this.checkAndConsumeMp(playerBodyStats, skill);
    if (mpCheckResult) {
      return mpCheckResult;
    }

    // 命中判定
    const playerStats = this.player.getTotalStats();
    const enemyStats = this.enemy.stats;
    const hitResult = this.checkHit(playerStats, enemyStats, skill, typingResult);
    if (hitResult) {
      return hitResult;
    }

    // ダメージ計算と適用
    const { damage, isCritical } = this.calculateAndApplyDamage(
      playerStats,
      enemyStats,
      skill,
      typingResult
    );

    // MP回復処理
    const mpRecovered = this.processMpRecovery(playerBodyStats, skill, typingResult);

    return {
      success: true,
      damage,
      message:
        this.generateSkillMessage(skill.name, damage, isCritical, typingResult) +
        (mpRecovered > 0 ? ` Recovered ${mpRecovered} MP.` : ''),
      critical: isCritical,
      mpRecovered,
    };
  }

  /**
   * MPチェックと消費を行う
   */
  private checkAndConsumeMp(playerBodyStats: BodyStats, skill: Skill): PlayerSkillResult | null {
    if (playerBodyStats.getCurrentMP() < skill.mpCost) {
      return {
        success: false,
        damage: 0,
        message: `Not enough MP! Need ${skill.mpCost} MP but only have ${playerBodyStats.getCurrentMP()} MP.`,
      };
    }
    playerBodyStats.consumeMP(skill.mpCost);
    return null;
  }

  /**
   * 命中判定を行う
   */
  private checkHit(
    playerStats: TotalStatsResult,
    enemyStats: EnemyStats,
    skill: Skill,
    typingResult?: TypingResult
  ): PlayerSkillResult | null {
    const hitRate = this.calculateEnhancedHitRate(playerStats, skill, typingResult);
    const evadeRate = BattleCalculator.calculateEvadeRate(enemyStats.agility);

    if (!BattleCalculator.isHit(hitRate, evadeRate)) {
      // ミス時もMP回復量を計算
      const playerBodyStats = this.player.getBodyStats();
      const mpRecovered = this.processMpRecovery(playerBodyStats, skill, typingResult);
      return {
        success: false,
        damage: 0,
        message: `${skill.name} missed!${mpRecovered > 0 ? ` Recovered ${mpRecovered} MP.` : ''}`,
        mpRecovered,
      };
    }
    return null;
  }

  /**
   * ダメージ計算と適用を行う
   */
  private calculateAndApplyDamage(
    playerStats: TotalStatsResult,
    enemyStats: EnemyStats,
    skill: Skill,
    typingResult?: TypingResult
  ): { damage: number; isCritical: boolean } {
    const criticalRate = this.calculateEnhancedCriticalRate(playerStats, typingResult);
    const isCritical = BattleCalculator.isCritical(criticalRate);

    let damage = BattleCalculator.calculateDamage(
      playerStats.strength,
      enemyStats.willpower,
      skill.power,
      isCritical
    );

    damage = this.applyTypingEffectMultiplier(damage, typingResult);
    this.enemy.takeDamage(damage);

    return { damage, isCritical };
  }

  /**
   * MP回復処理を行う
   */
  private processMpRecovery(
    playerBodyStats: BodyStats,
    skill: Skill,
    typingResult?: TypingResult
  ): number {
    let mpRecovered = skill.mpCharge;
    if (mpRecovered > 0) {
      if (typingResult?.accuracyRating === 'Perfect') {
        mpRecovered = Math.floor(mpRecovered * Battle.MP_RECOVERY_PERFECT_MULTIPLIER);
      } else if (typingResult?.accuracyRating === 'Great') {
        mpRecovered = Math.floor(mpRecovered * Battle.MP_RECOVERY_GREAT_MULTIPLIER);
      }
      playerBodyStats.healMP(mpRecovered);
    }
    return mpRecovered;
  }

  /**
   * タイピング結果を考慮した命中率を計算する
   */
  private calculateEnhancedHitRate(
    playerStats: TotalStatsResult,
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
  private calculateEnhancedCriticalRate(
    playerStats: TotalStatsResult,
    typingResult?: TypingResult
  ): number {
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

    // MP消費チェック
    if (this.enemy.currentMp < selectedSkill.mpCost) {
      // MPが足りない場合は通常攻撃
      const normalAttackSkill = Battle.NORMAL_ATTACK_SKILL;
      return this.performEnemyAttack(normalAttackSkill);
    }

    // MP消費処理
    this.enemy.consumeMp(selectedSkill.mpCost);

    const result = this.performEnemyAttack(selectedSkill);

    // MP回復処理
    if (selectedSkill.mpCharge > 0) {
      this.enemy.recoverMp(selectedSkill.mpCharge);
    }

    return result;
  }

  /**
   * 敵の攻撃を実行する
   * @param skill 使用する技
   * @returns 攻撃結果
   */
  private performEnemyAttack(skill: Skill): EnemyActionResult {
    const playerStats = this.player.getTotalStats();
    const enemyStats = this.enemy.stats;

    // 命中判定
    const hitRate = BattleCalculator.calculateHitRate(skill.accuracy);
    const evadeRate = BattleCalculator.calculateEvadeRate(playerStats.agility);

    if (!BattleCalculator.isHit(hitRate, evadeRate)) {
      return {
        skillUsed: skill,
        damage: 0,
        message: `${this.enemy.name} used ${skill.name} but missed!`,
      };
    }

    // クリティカル判定
    const criticalRate = BattleCalculator.calculateCriticalRate(enemyStats.fortune);
    const isCritical = BattleCalculator.isCritical(criticalRate);

    // ダメージ計算
    const damage = BattleCalculator.calculateDamage(
      enemyStats.strength,
      0, // プレイヤーへの攻撃では防御力を考慮しない
      skill.power,
      isCritical
    );

    // ダメージを与える
    this.player.getBodyStats().takeDamage(damage);

    return {
      skillUsed: skill,
      damage,
      message: `${this.enemy.name} used ${skill.name} and dealt ${damage} damage!${
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
