import { Player } from '../player/Player';
import { Enemy } from './Enemy';
import { Skill } from './Skill';
import { BattleCalculator } from './BattleCalculator';
import { TypingResult } from '../typing/types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 戦闘終了結果（統合版）
 */
export interface BattleEndResult {
  winner: 'player' | 'enemy';
  message: string;
  turns: number;
  enemyDefeated?: string;
  droppedItems?: string[];
}

/**
 * 選択されたスキル
 */
export interface SelectedSkill {
  skill: Skill;
  typingResult?: TypingResult;
}

/**
 * Battleクラス - 戦闘フローの制御とターン管理を行う
 */
export class Battle {
  /**
   * スキルデータを読み込む
   */
  private static skillsData: { skills: Skill[] } | null = null;

  private static loadSkillsData() {
    if (!Battle.skillsData) {
      // プロジェクトルートからの相対パスを使用
      const dataPath = path.resolve(process.cwd(), 'data/skills/skills.json');
      Battle.skillsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
    return Battle.skillsData;
  }

  /**
   * 通常攻撃用のスキルを取得
   */
  public static getNormalAttackSkill(): Skill {
    const data = Battle.loadSkillsData();
    if (!data) {
      throw new Error('Failed to load skills data');
    }
    const basicAttack = data.skills.find((skill: Skill) => skill.id === 'basic_attack');

    if (!basicAttack) {
      throw new Error('basic_attack skill not found in skills data');
    }

    return basicAttack as Skill;
  }

  private player: Player;
  private enemy: Enemy;
  private _isActive: boolean = false;
  private _currentTurn: number = 0;
  private _currentTurnActor: 'player' | 'enemy' | null = null;
  private battleResult: BattleEndResult | null = null;

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
   */
  end(): void {
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
    return BattleCalculator.calculatePlayerActionPoints(playerStats.agility);
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
   * 戦闘終了をチェックする
   * @returns 戦闘終了結果、継続の場合はnull
   */
  checkBattleEnd(): BattleEndResult | null {
    if (this.player.getBodyStats().getCurrentHP() <= 0) {
      this._isActive = false;
      const result: BattleEndResult = {
        winner: 'enemy',
        message: `You were defeated by ${this.enemy.name}...`,
        turns: this._currentTurn,
      };
      this.battleResult = result;
      return result;
    }

    if (this.enemy.isDefeated()) {
      this._isActive = false;
      const result: BattleEndResult = {
        winner: 'player',
        message: `You defeated ${this.enemy.name}!`,
        turns: this._currentTurn,
        enemyDefeated: this.enemy.name,
      };
      this.battleResult = result;
      return result;
    }

    return null;
  }

  /**
   * 戦闘結果を取得する
   * @returns 戦闘結果、戦闘中の場合はnull
   */
  getBattleResult(): BattleEndResult | null {
    return this.battleResult;
  }

  /**
   * ドロップアイテムを計算する
   * @returns ドロップしたアイテムIDのリスト
   */
  calculateDrops(): string[] {
    if (!this.battleResult || this.battleResult.winner !== 'player') {
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
