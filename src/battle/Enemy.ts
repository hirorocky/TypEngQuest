import { Skill } from './Skill';
import { Battle } from './Battle';

/**
 * 敵のステータス情報
 */
export interface EnemyStats {
  maxHp: number;
  maxMp: number;
  strength: number;
  willpower: number;
  agility: number;
  fortune: number;
}

/**
 * ドロップアイテム情報
 */
export interface DropItem {
  itemId: string;
  dropRate: number;
}

/**
 * 敵の初期化パラメータ
 */
export interface EnemyParams {
  id: string;
  name: string;
  description: string;
  level: number;
  stats: EnemyStats;
  skills?: Skill[];
  drops?: DropItem[];
}

/**
 * 敵のJSONデータ
 */
export interface EnemyJSON {
  id: string;
  name: string;
  description: string;
  level: number;
  stats: EnemyStats;
  currentHp: number;
  currentMp: number;
  skills: Skill[];
  drops: DropItem[];
}

/**
 * 敵クラス - 敵キャラクターの基本構造とAI行動を管理する
 */
export class Enemy {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _description: string;
  private readonly _level: number;
  private readonly _stats: EnemyStats;
  private _currentHp: number;
  private _currentMp: number;
  private readonly _skills: Skill[];
  private readonly _drops: DropItem[];

  /**
   * Enemyのコンストラクタ
   * @param params 敵の初期化パラメータ
   * @throws {Error} レベルが負の値の場合
   * @throws {Error} ドロップ率が0-100の範囲外の場合
   */
  constructor(params: EnemyParams) {
    if (params.level <= 0) {
      throw new Error('Level must be positive');
    }

    // ドロップ率の検証
    if (params.drops) {
      for (const drop of params.drops) {
        if (drop.dropRate < 0 || drop.dropRate > 100) {
          throw new Error('Drop rate must be between 0 and 100');
        }
      }
    }

    this._id = params.id;
    this._name = params.name;
    this._description = params.description;
    this._level = params.level;
    this._stats = Object.freeze({ ...params.stats });
    this._currentHp = params.stats.maxHp;
    this._currentMp = params.stats.maxMp;
    this._skills = params.skills ? [...params.skills] : [];
    this._drops = params.drops ? [...params.drops] : [];
  }

  /** 敵ID */
  get id(): string {
    return this._id;
  }

  /** 敵名 */
  get name(): string {
    return this._name;
  }

  /** 敵の説明 */
  get description(): string {
    return this._description;
  }

  /** レベル */
  get level(): number {
    return this._level;
  }

  /** ステータス（読み取り専用） */
  get stats(): Readonly<EnemyStats> {
    return this._stats;
  }

  /** 現在のHP */
  get currentHp(): number {
    return this._currentHp;
  }

  /** 現在のMP */
  get currentMp(): number {
    return this._currentMp;
  }

  /** 所持技リスト（読み取り専用） */
  get skills(): readonly Skill[] {
    // 基本攻撃スキルを追加
    const basicAttackSkill = Battle.getNormalAttackSkill();
    return [basicAttackSkill, ...this._skills];
  }

  /** ドロップアイテムリスト（読み取り専用） */
  get drops(): readonly DropItem[] {
    return [...this._drops];
  }

  /**
   * ダメージを受ける
   * @param damage ダメージ量
   * @throws {Error} ダメージが負の値の場合
   */
  takeDamage(damage: number): void {
    if (damage < 0) {
      throw new Error('Damage must be non-negative');
    }
    this._currentHp = Math.max(0, this._currentHp - damage);
  }

  /**
   * HPを回復する
   * @param amount 回復量
   * @throws {Error} 回復量が負の値の場合
   */
  heal(amount: number): void {
    if (amount < 0) {
      throw new Error('Heal amount must be non-negative');
    }
    this._currentHp = Math.min(this._stats.maxHp, this._currentHp + amount);
  }

  /**
   * MPを消費する
   * @param amount 消費量
   * @returns 消費に成功した場合はtrue、MPが不足している場合はfalse
   */
  consumeMp(amount: number): boolean {
    if (this._currentMp < amount) {
      return false;
    }
    this._currentMp -= amount;
    return true;
  }

  /**
   * MPを回復する
   * @param amount 回復量
   */
  recoverMp(amount: number): void {
    this._currentMp = Math.min(this._stats.maxMp, this._currentMp + amount);
  }

  /**
   * 戦闘不能状態かどうかを判定
   * @returns HPが0以下の場合はtrue
   */
  isDefeated(): boolean {
    return this._currentHp <= 0;
  }

  /**
   * 使用可能な技を選択する（AI）
   * @returns 選択された技、使用可能な技がない場合はnull
   */
  selectSkill(): Skill | null {
    // 使用可能な技をフィルタリング
    const availableSkills = this._skills.filter(skill => skill.mpCost <= this._currentMp);

    if (availableSkills.length === 0) {
      return null;
    }

    // シンプルなAI: ランダムに選択
    const randomIndex = Math.floor(Math.random() * availableSkills.length);
    return availableSkills[randomIndex];
  }

  /**
   * JSONに変換する
   * @returns EnemyのJSON表現
   */
  toJSON(): EnemyJSON {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      level: this._level,
      stats: { ...this._stats },
      currentHp: this._currentHp,
      currentMp: this._currentMp,
      skills: [...this._skills],
      drops: [...this._drops],
    };
  }

  /**
   * 現在のHP/MPを設定する（fromJSON専用）
   * @param currentHp 現在のHP
   * @param currentMp 現在のMP
   */
  private setCurrentStats(currentHp: number, currentMp: number): void {
    this._currentHp = Math.max(0, Math.min(currentHp, this._stats.maxHp));
    this._currentMp = Math.max(0, Math.min(currentMp, this._stats.maxMp));
  }

  /**
   * JSONから復元する
   * @param json EnemyのJSON表現
   * @returns 復元されたEnemyインスタンス
   */
  static fromJSON(json: EnemyJSON): Enemy {
    const enemy = new Enemy({
      id: json.id,
      name: json.name,
      description: json.description,
      level: json.level,
      stats: json.stats,
      skills: json.skills,
      drops: json.drops,
    });

    // 現在のHP/MPを復元
    enemy.setCurrentStats(json.currentHp, json.currentMp);

    return enemy;
  }
}
