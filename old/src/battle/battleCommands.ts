import { Player } from '../core/player';
import { Map } from '../world/map';
import { World } from '../world/world';
import { ElementManager } from '../world/elements';
import { Element } from '../world/location';
import { TypingChallenge, Challenge, TypingResult, ChallengeDifficulty } from './typingChallenge';

/**
 * コマンド実行結果
 */
export interface CommandResult {
  success: boolean;
  output: string;
}

/**
 * 戦闘情報
 */
export interface BattleInfo {
  enemyName: string;
  enemyHealth: number;
  enemyMaxHealth: number;
  enemyAttack: number;
  turn: number;
  location: string;
}

/**
 * 戦闘終了結果
 */
export interface BattleEndResult {
  status: 'ongoing' | 'victory' | 'defeat';
  output: string;
}

/**
 * 戦闘状態
 */
interface BattleState {
  isActive: boolean;
  enemy: Element | null;
  location: string;
  turn: number;
  currentChallenge: Challenge | null;
}

/**
 * 戦闘コマンドシステム
 * タイピングベースの戦闘を管理する
 */
export class BattleCommands {
  private typingChallenge: TypingChallenge;
  private battleState: BattleState;

  constructor(
    // eslint-disable-next-line no-unused-vars
    private _player: Player,
    // eslint-disable-next-line no-unused-vars
    private _map: Map,
    // eslint-disable-next-line no-unused-vars
    private _world: World,
    // eslint-disable-next-line no-unused-vars
    private _elementManager: ElementManager
  ) {
    this.typingChallenge = new TypingChallenge();
    this.battleState = {
      isActive: false,
      enemy: null,
      location: '',
      turn: 0,
      currentChallenge: null,
    };
  }

  /**
   * 戦闘を開始する
   * @param filename - 戦闘対象のファイル名
   * @returns 戦闘開始結果
   */
  startBattle(filename: string): CommandResult {
    if (this.battleState.isActive) {
      return {
        success: false,
        output: 'battle: already in battle. Use "flee" to escape or finish current battle.',
      };
    }

    const location =
      this._map.findLocation('/' + filename) || this._map.findLocation('/src/' + filename);
    if (!location) {
      return {
        success: false,
        output: `battle: ${filename}: Location not found`,
      };
    }

    const element = location.getElement();
    if (!element || element.type !== 'monster') {
      return {
        success: false,
        output: `battle: ${filename}: No enemy found at this location`,
      };
    }

    if (element.data.defeated) {
      return {
        success: false,
        output: `battle: ${filename}: Enemy already defeated`,
      };
    }

    // 戦闘状態を初期化
    this.battleState = {
      isActive: true,
      enemy: element,
      location: filename,
      turn: 1,
      currentChallenge: null,
    };

    // 最初のタイピングチャレンジを生成
    this.generateNewChallenge();

    const enemyName = element.data.name as string;
    const enemyHealth = element.data.health as number;
    const enemyAttack = element.data.attack as number;

    let output = `Battle started with ${enemyName}!\n`;
    output += `Enemy Stats - Health: ${enemyHealth}, Attack: ${enemyAttack}\n`;
    output += `Turn ${this.battleState.turn}: Your turn!\n`;
    output += this.getCurrentChallengeText();

    return {
      success: true,
      output,
    };
  }

  /**
   * タイピング攻撃を実行する
   * @param input - プレイヤーの入力
   * @param timeUsed - 使用時間（秒）
   * @returns 攻撃結果
   */
  performTypingAttack(input: string, timeUsed: number): CommandResult {
    if (!this.battleState.isActive || !this.battleState.currentChallenge) {
      return {
        success: false,
        output: 'battle: not in battle. Use "battle <filename>" to start.',
      };
    }

    const challenge = this.battleState.currentChallenge;

    // タイムアウトチェック
    if (timeUsed > challenge.timeLimit) {
      let output = `Too slow! Time limit exceeded (${challenge.timeLimit}s)\n`;
      output += 'Your attack fails due to timeout.\n';

      // 敵のターンに移行
      const enemyResult = this.processEnemyTurn();
      output += enemyResult.output;

      return {
        success: true,
        output,
      };
    }

    // タイピング結果を評価
    const typingResult = this.typingChallenge.evaluateTyping(challenge.word, input, timeUsed);
    const damage = this.calculateDamage(typingResult);

    // 敵にダメージを与える
    this.battleState.enemy!.data.health = Math.max(
      0,
      (this.battleState.enemy!.data.health as number) - damage
    );

    let output = this.formatAttackResult(typingResult, damage);

    // 戦闘終了チェック
    const battleEnd = this.checkBattleEnd();
    if (battleEnd.status !== 'ongoing') {
      output += battleEnd.output;
      return {
        success: true,
        output,
      };
    }

    // 敵のターン
    const enemyResult = this.processEnemyTurn();
    output += enemyResult.output;

    // 再度戦闘終了チェック
    const finalCheck = this.checkBattleEnd();
    if (finalCheck.status !== 'ongoing') {
      output += finalCheck.output;
      return {
        success: true,
        output,
      };
    }

    // 次のターンの準備
    this.battleState.turn++;
    this.generateNewChallenge();
    output += `\nTurn ${this.battleState.turn}: Your turn!\n`;
    output += this.getCurrentChallengeText();

    return {
      success: true,
      output,
    };
  }

  /**
   * 敵のターンを処理する
   * @returns 敵の行動結果
   */
  processEnemyTurn(): CommandResult {
    if (!this.battleState.isActive || !this.battleState.enemy) {
      return {
        success: false,
        output: 'Error: Invalid battle state',
      };
    }

    const enemyName = this.battleState.enemy.data.name as string;
    const enemyAttack = this.battleState.enemy.data.attack as number;
    const playerStats = this._player.getStats();
    const playerDefense = playerStats.baseDefense + playerStats.equipmentDefense;

    const damage = Math.max(1, enemyAttack - playerDefense);
    this._player.takeDamage(damage);

    let output = `${enemyName} attacks you for ${damage} damage!\n`;
    output += `Your health: ${this._player.getStats().currentHealth}/${this._player.getStats().maxHealth}`;

    return {
      success: true,
      output,
    };
  }

  /**
   * 戦闘終了条件をチェックする
   * @returns 戦闘終了結果
   */
  checkBattleEnd(): BattleEndResult {
    if (!this.battleState.isActive) {
      return { status: 'ongoing', output: '' };
    }

    // プレイヤー敗北チェック
    if (!this._player.isAlive()) {
      this.endBattle();
      return {
        status: 'defeat',
        output: '\nYou have been defeated! Game Over.\n',
      };
    }

    // 敵撃破チェック
    if (this.battleState.enemy && (this.battleState.enemy.data.health as number) <= 0) {
      const enemyName = this.battleState.enemy.data.name as string;
      const experience = Math.floor((this.battleState.enemy.data.maxHealth as number) / 2);

      // 敵を撃破状態にする
      this.battleState.enemy.data.defeated = true;

      // 経験値獲得
      const levelUp = this._player.addExperience(experience);

      this.endBattle();

      let output = `\nVictory! You defeated ${enemyName}!\n`;
      output += `Experience gained: ${experience}`;

      if (levelUp) {
        output += '\nLevel Up! Your stats have increased!';
      }

      return {
        status: 'victory',
        output,
      };
    }

    return { status: 'ongoing', output: '' };
  }

  /**
   * 戦闘から逃走する
   * @returns 逃走結果
   */
  fleeBattle(): CommandResult {
    if (!this.battleState.isActive) {
      return {
        success: false,
        output: 'battle: not in battle',
      };
    }

    this.endBattle();

    return {
      success: true,
      output: 'You fled from the battle!',
    };
  }

  /**
   * 戦闘を終了する
   */
  endBattle(): void {
    this.battleState = {
      isActive: false,
      enemy: null,
      location: '',
      turn: 0,
      currentChallenge: null,
    };
  }

  /**
   * 戦闘中かどうかを確認する
   * @returns 戦闘中の場合true
   */
  isInBattle(): boolean {
    return this.battleState.isActive;
  }

  /**
   * 現在の戦闘情報を取得する
   * @returns 戦闘情報、戦闘中でない場合null
   */
  getBattleInfo(): BattleInfo | null {
    if (!this.battleState.isActive || !this.battleState.enemy) {
      return null;
    }

    return {
      enemyName: this.battleState.enemy.data.name as string,
      enemyHealth: this.battleState.enemy.data.health as number,
      enemyMaxHealth: this.battleState.enemy.data.maxHealth as number,
      enemyAttack: this.battleState.enemy.data.attack as number,
      turn: this.battleState.turn,
      location: this.battleState.location,
    };
  }

  /**
   * 現在のタイピングチャレンジを取得する
   * @returns 現在のチャレンジ、戦闘中でない場合null
   */
  getCurrentChallenge(): Challenge | null {
    return this.battleState.currentChallenge;
  }

  /**
   * タイピング結果からダメージを計算する
   * @param typingResult - タイピング結果
   * @returns 計算されたダメージ
   */
  calculateDamage(typingResult: TypingResult): number {
    const playerStats = this._player.getStats();
    const baseAttack = playerStats.baseAttack + playerStats.equipmentAttack;

    const typingMultiplier = this.typingChallenge.calculateDamageMultiplier(typingResult);

    const damage = Math.round(baseAttack * typingMultiplier);

    // 最小ダメージ1を保証
    return Math.max(1, damage);
  }

  /**
   * 新しいタイピングチャレンジを生成する
   */
  private generateNewChallenge(): void {
    const difficulty = this.getDifficultyForCurrentWorld();
    this.battleState.currentChallenge = this.typingChallenge.generateChallenge(difficulty);
  }

  /**
   * 現在のワールドレベルに応じた難易度を取得する
   * @returns チャレンジ難易度
   */
  private getDifficultyForCurrentWorld(): ChallengeDifficulty {
    const worldLevel = this._world.getLevel();

    if (worldLevel >= 5) return ChallengeDifficulty.EXPERT;
    if (worldLevel >= 4) return ChallengeDifficulty.PROGRAMMING;
    if (worldLevel >= 3) return ChallengeDifficulty.ADVANCED;
    if (worldLevel >= 2) return ChallengeDifficulty.INTERMEDIATE;
    return ChallengeDifficulty.BASIC;
  }

  /**
   * 現在のチャレンジテキストを取得する
   * @returns チャレンジの表示テキスト
   */
  private getCurrentChallengeText(): string {
    if (!this.battleState.currentChallenge) {
      return 'No challenge available';
    }

    const challenge = this.battleState.currentChallenge;
    return `Type: "${challenge.word}" (Time limit: ${challenge.timeLimit}s)`;
  }

  /**
   * 攻撃結果をフォーマットする
   * @param typingResult - タイピング結果
   * @param damage - 与えたダメージ
   * @returns フォーマットされた結果テキスト
   */
  private formatAttackResult(typingResult: TypingResult, damage: number): string {
    let output = '';

    if (typingResult.perfect) {
      output += `Perfect! "${typingResult.input}" `;
    } else if (typingResult.accuracy >= 80) {
      output += `Hit! "${typingResult.input}" `;
    } else if (typingResult.accuracy >= 50) {
      output += `Partial hit! "${typingResult.input}" `;
    } else {
      output += `Miss! "${typingResult.input}" `;
    }

    output += `(${typingResult.accuracy}% accuracy, ${typingResult.speed} WPM)\n`;
    output += `You deal ${damage} damage!\n`;

    const enemyHealth = this.battleState.enemy!.data.health as number;
    const enemyMaxHealth = this.battleState.enemy!.data.maxHealth as number;
    output += `Enemy health: ${enemyHealth}/${enemyMaxHealth}`;

    return output;
  }
}
