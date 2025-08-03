import { Player } from '../player/Player';
import { Enemy } from './Enemy';
import { Skill } from './Skill';
import { BattleCalculator } from './BattleCalculator';

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
  action: 'skill' | 'attack';
  skillUsed?: Skill;
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
    const enemySpeed = this.enemy.stats.speed;

    if (playerStats.speed > enemySpeed) {
      return 'player';
    } else if (playerStats.speed < enemySpeed) {
      return 'enemy';
    } else {
      // 速度が同じ場合はランダム
      return Math.random() < 0.5 ? 'player' : 'enemy';
    }
  }

  /**
   * プレイヤーが技を使用する
   * @param skill 使用する技
   * @returns 技の使用結果
   */
  playerUseSkill(skill: Skill): PlayerSkillResult {
    const playerStats = this.player.getTotalStats();
    const enemyStats = this.enemy.stats;

    // 命中判定
    const hitRate = BattleCalculator.calculateHitRate(playerStats.accuracy, skill.accuracy);
    const evadeRate = BattleCalculator.calculateEvadeRate(enemyStats.speed);

    if (!BattleCalculator.isHit(hitRate, evadeRate)) {
      return {
        success: false,
        damage: 0,
        message: `${skill.name} missed!`,
      };
    }

    // クリティカル判定
    const criticalRate = BattleCalculator.calculateCriticalRate(playerStats.fortune);
    const isCritical = BattleCalculator.isCritical(criticalRate);

    // ダメージ計算
    const damage = BattleCalculator.calculateDamage(
      playerStats.attack,
      enemyStats.defense,
      skill.power,
      isCritical
    );

    // ダメージを与える
    this.enemy.takeDamage(damage);

    return {
      success: true,
      damage,
      message: `${skill.name} dealt ${damage} damage!${isCritical ? ' Critical hit!' : ''}`,
      critical: isCritical,
    };
  }

  /**
   * 敵の行動を実行する
   * @returns 敵の行動結果
   */
  enemyAction(): EnemyActionResult {
    const selectedSkill = this.enemy.selectSkill();

    if (selectedSkill) {
      // 技を使用
      const playerStats = this.player.getTotalStats();
      const enemyStats = this.enemy.stats;

      // 命中判定
      const hitRate = BattleCalculator.calculateHitRate(
        enemyStats.accuracy,
        selectedSkill.accuracy
      );
      const evadeRate = BattleCalculator.calculateEvadeRate(playerStats.speed);

      if (!BattleCalculator.isHit(hitRate, evadeRate)) {
        return {
          action: 'skill',
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
        enemyStats.attack,
        playerStats.defense,
        selectedSkill.power,
        isCritical
      );

      // ダメージを与える
      this.player.getBodyStats().takeDamage(damage);

      return {
        action: 'skill',
        skillUsed: selectedSkill,
        damage,
        message: `${this.enemy.name} used ${selectedSkill.name} and dealt ${damage} damage!${
          isCritical ? ' Critical hit!' : ''
        }`,
        critical: isCritical,
      };
    } else {
      // 通常攻撃
      const playerStats = this.player.getTotalStats();
      const enemyStats = this.enemy.stats;

      // 命中判定（通常攻撃は命中率90%）
      const hitRate = BattleCalculator.calculateHitRate(enemyStats.accuracy, 90);
      const evadeRate = BattleCalculator.calculateEvadeRate(playerStats.speed);

      if (!BattleCalculator.isHit(hitRate, evadeRate)) {
        return {
          action: 'attack',
          damage: 0,
          message: `${this.enemy.name} attacks but missed!`,
        };
      }

      // ダメージ計算（通常攻撃は威力1.0）
      const damage = BattleCalculator.calculateDamage(enemyStats.attack, playerStats.defense, 1.0);

      // ダメージを与える
      this.player.getBodyStats().takeDamage(damage);

      return {
        action: 'attack',
        damage,
        message: `${this.enemy.name} attacks and deals ${damage} damage!`,
      };
    }
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

    for (const drop of this.enemy.drops) {
      // まず基本ドロップ率の判定
      const baseDropRoll = Math.random() * 100;
      if (baseDropRoll < dropRate) {
        // 次に個別アイテムのドロップ率判定
        const itemDropRoll = Math.random() * 100;
        if (itemDropRoll < drop.dropRate) {
          droppedItems.push(drop.itemId);
        }
      }
    }

    // 結果に保存
    if (this.battleResult) {
      this.battleResult.droppedItems = droppedItems;
    }

    return droppedItems;
  }
}
