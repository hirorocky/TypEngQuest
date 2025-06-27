/**
 * 戦闘フェーズの型定義
 */
export type BattlePhase = 'normal' | 'critical' | 'desperate' | 'defeated';

/**
 * ボスクラス - ワールドのボスエネミーを管理する
 */
export class Boss {
  private id: string;
  private name: string;
  private maxHealth: number;
  private currentHealth: number;
  private attackPower: number;
  private specialAbilities: string[] = [];
  private defeated: boolean = false;

  /**
   * ボスインスタンスを初期化する
   * @param id - ボスの一意識別子
   * @param name - ボス名
   * @param maxHealth - 最大HP
   * @param attackPower - 攻撃力
   */
  constructor(id: string, name: string, maxHealth: number, attackPower: number) {
    this.id = id;
    this.name = name;
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.attackPower = attackPower;
  }

  /**
   * ボスIDを取得
   */
  getId(): string {
    return this.id;
  }

  /**
   * ボス名を取得
   */
  getName(): string {
    return this.name;
  }

  /**
   * 最大HPを取得
   */
  getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * 現在HPを取得
   */
  getCurrentHealth(): number {
    return this.currentHealth;
  }

  /**
   * 攻撃力を取得
   */
  getAttackPower(): number {
    return this.attackPower;
  }

  /**
   * 撃破状態を取得
   */
  isDefeated(): boolean {
    return this.defeated;
  }

  /**
   * 生存状態を取得
   */
  isAlive(): boolean {
    return this.currentHealth > 0 && !this.defeated;
  }

  /**
   * ダメージを受ける
   */
  takeDamage(damage: number): void {
    if (damage <= 0) return;

    this.currentHealth = Math.max(0, this.currentHealth - damage);

    if (this.currentHealth === 0) {
      this.defeated = true;
    }
  }

  /**
   * 回復する
   */
  heal(amount: number): void {
    if (this.defeated || amount <= 0) return;

    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
  }

  /**
   * HPパーセンテージを取得
   */
  getHealthPercentage(): number {
    return this.currentHealth / this.maxHealth;
  }

  /**
   * 残りHPを取得
   */
  getRemainingHealth(): number {
    return this.currentHealth;
  }

  /**
   * 特殊能力を設定
   */
  setSpecialAbilities(abilities: string[]): void {
    this.specialAbilities = [...abilities];
  }

  /**
   * 特殊能力一覧を取得
   */
  getSpecialAbilities(): string[] {
    return [...this.specialAbilities];
  }

  /**
   * ランダムな特殊能力を選択
   */
  getRandomAbility(): string | null {
    if (this.specialAbilities.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * this.specialAbilities.length);
    return this.specialAbilities[randomIndex];
  }

  /**
   * 戦闘フェーズを取得
   */
  getBattlePhase(): BattlePhase {
    if (this.defeated) return 'defeated';

    const healthPercentage = this.getHealthPercentage();

    if (healthPercentage <= 0.2) return 'desperate';
    if (healthPercentage <= 0.5) return 'critical';
    return 'normal';
  }

  /**
   * レベル別ボス生成
   */
  static createForLevel(level: number, id: string, name: string): Boss {
    // レベルに応じたステータス計算
    const baseHealth = 100;
    const baseAttack = 20;

    // レベル倍率（レベル1=1.0, レベル2=1.5, レベル3=2.0...）
    const multiplier = 1 + (level - 1) * 0.5;

    const health = Math.floor(baseHealth * multiplier);
    const attack = Math.floor(baseAttack * multiplier);

    return new Boss(id, name, health, attack);
  }

  /**
   * ボス状態を文字列で取得
   */
  getStatusString(): string {
    if (this.defeated) {
      return `${this.name} [DEFEATED] (0/${this.maxHealth} HP)`;
    }

    const healthPercentage = Math.floor(this.getHealthPercentage() * 100);
    const phase = this.getBattlePhase();

    return `${this.name} (${this.currentHealth}/${this.maxHealth} HP - ${healthPercentage}%) [${phase}]`;
  }
}
