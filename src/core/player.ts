export interface PlayerStats {
  level: number;
  experience: number;
  experienceToNext: number;

  // Base Stats
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  baseAccuracy: number;
  baseCritical: number;

  // Equipment Bonuses (calculated from equipped words)
  equipmentAttack: number;
  equipmentDefense: number;
  equipmentSpeed: number;
  equipmentAccuracy: number;
  equipmentCritical: number;

  // Health/Mana
  currentHealth: number;
  maxHealth: number;
  currentMana: number;
  maxMana: number;
}

export interface EquipmentSlot {
  slotNumber: number;
  word: string | null;
  wordType: 'article' | 'adjective' | 'noun' | 'verb' | 'adverb' | null;
}

// ワールド履歴情報の型定義
export interface WorldHistory {
  name: string;
  level: number;
  clearedAt: Date;
  bossName: string;
  exploredLocations: number;
}

export class Player {
  private stats: PlayerStats;
  private equipment: EquipmentSlot[];
  private inventory: string[];
  private name: string;

  // 鍵システム（1つまで保持可能）
  private hasKeyItem: boolean = false;

  // ワールド履歴システム
  private worldHistory: WorldHistory[] = [];

  constructor(name: string = 'Code Warrior') {
    this.name = name;
    this.stats = this.initializeStats();
    this.equipment = this.initializeEquipment();
    this.inventory = this.initializeInventory();
  }

  private initializeStats(): PlayerStats {
    return {
      level: 1,
      experience: 0,
      experienceToNext: 100,

      baseAttack: 10,
      baseDefense: 5,
      baseSpeed: 8,
      baseAccuracy: 7,
      baseCritical: 2,

      equipmentAttack: 0,
      equipmentDefense: 0,
      equipmentSpeed: 0,
      equipmentAccuracy: 0,
      equipmentCritical: 0,

      currentHealth: 50,
      maxHealth: 50,
      currentMana: 20,
      maxMana: 20,
    };
  }

  private initializeEquipment(): EquipmentSlot[] {
    return [
      { slotNumber: 1, word: null, wordType: null },
      { slotNumber: 2, word: null, wordType: null },
      { slotNumber: 3, word: null, wordType: null },
      { slotNumber: 4, word: null, wordType: null },
      { slotNumber: 5, word: null, wordType: null },
    ];
  }

  private initializeInventory(): string[] {
    // Starting words for new players
    return ['the', 'quick', 'brown', 'fox', 'jumps'];
  }

  // Getters
  getName(): string {
    return this.name;
  }

  getStats(): PlayerStats {
    return { ...this.stats };
  }

  getEquipment(): EquipmentSlot[] {
    return [...this.equipment];
  }

  getInventory(): string[] {
    return [...this.inventory];
  }

  // Equipment Management
  equipWord(slotNumber: number, word: string): boolean {
    if (slotNumber < 1 || slotNumber > 5) {
      return false;
    }

    if (!this.inventory.includes(word)) {
      return false;
    }

    const slot = this.equipment[slotNumber - 1];

    // If slot already has a word, return it to inventory
    if (slot.word) {
      this.inventory.push(slot.word);
    }

    // Equip new word
    slot.word = word;
    slot.wordType = this.determineWordType(word);

    // Remove word from inventory
    const wordIndex = this.inventory.indexOf(word);
    this.inventory.splice(wordIndex, 1);

    this.recalculateEquipmentStats();
    return true;
  }

  unequipWord(slotNumber: number): boolean {
    if (slotNumber < 1 || slotNumber > 5) {
      return false;
    }

    const slot = this.equipment[slotNumber - 1];
    if (!slot.word) {
      return false;
    }

    // Return word to inventory
    this.inventory.push(slot.word);
    slot.word = null;
    slot.wordType = null;

    this.recalculateEquipmentStats();
    return true;
  }

  private determineWordType(word: string): EquipmentSlot['wordType'] {
    // Simple word type determination (can be expanded with a proper dictionary)
    const articles = ['the', 'a', 'an'];
    const adjectives = ['quick', 'slow', 'strong', 'weak', 'clever', 'fast', 'powerful', 'sharp'];
    const verbs = ['jumps', 'runs', 'attacks', 'defends', 'casts', 'strikes'];
    const nouns = ['fox', 'warrior', 'wizard', 'knight', 'archer', 'code', 'bug'];

    if (articles.includes(word.toLowerCase())) return 'article';
    if (adjectives.includes(word.toLowerCase())) return 'adjective';
    if (verbs.includes(word.toLowerCase())) return 'verb';
    if (nouns.includes(word.toLowerCase())) return 'noun';

    return 'noun'; // Default
  }

  private recalculateEquipmentStats(): void {
    // Reset equipment bonuses
    this.stats.equipmentAttack = 0;
    this.stats.equipmentDefense = 0;
    this.stats.equipmentSpeed = 0;
    this.stats.equipmentAccuracy = 0;
    this.stats.equipmentCritical = 0;

    // Calculate bonuses from equipped words
    for (const slot of this.equipment) {
      if (slot.word) {
        const wordStats = this.getWordStats(slot.word);
        this.stats.equipmentAttack += wordStats.attack;
        this.stats.equipmentDefense += wordStats.defense;
        this.stats.equipmentSpeed += wordStats.speed;
        this.stats.equipmentAccuracy += wordStats.accuracy;
        this.stats.equipmentCritical += wordStats.critical;
      }
    }
  }

  private getWordStats(word: string): {
    attack: number;
    defense: number;
    speed: number;
    accuracy: number;
    critical: number;
  } {
    // Word stat database (simplified version)
    const wordStats: Record<
      string,
      { attack: number; defense: number; speed: number; accuracy: number; critical: number }
    > = {
      the: { attack: 2, defense: 1, speed: 0, accuracy: 1, critical: 0 },
      quick: { attack: 3, defense: 0, speed: 8, accuracy: 2, critical: 5 },
      strong: { attack: 12, defense: 3, speed: -2, accuracy: 0, critical: 3 },
      brown: { attack: 4, defense: 2, speed: 1, accuracy: 1, critical: 1 },
      fox: { attack: 6, defense: 1, speed: 5, accuracy: 3, critical: 4 },
      jumps: { attack: 8, defense: 0, speed: 6, accuracy: 2, critical: 3 },
    };

    return (
      wordStats[word.toLowerCase()] || { attack: 1, defense: 1, speed: 1, accuracy: 1, critical: 1 }
    );
  }

  // Calculate total stats (base + equipment)
  getTotalStats() {
    return {
      attack: this.stats.baseAttack + this.stats.equipmentAttack,
      defense: this.stats.baseDefense + this.stats.equipmentDefense,
      speed: this.stats.baseSpeed + this.stats.equipmentSpeed,
      accuracy: this.stats.baseAccuracy + this.stats.equipmentAccuracy,
      critical: this.stats.baseCritical + this.stats.equipmentCritical,
    };
  }

  // Experience and Leveling
  addExperience(amount: number): boolean {
    this.stats.experience += amount;

    if (this.stats.experience >= this.stats.experienceToNext) {
      return this.levelUp();
    }

    return false;
  }

  private levelUp(): boolean {
    this.stats.level += 1;
    this.stats.experience -= this.stats.experienceToNext;
    this.stats.experienceToNext = Math.floor(this.stats.experienceToNext * 1.5);

    // Increase base stats on level up
    this.stats.baseAttack += 2;
    this.stats.baseDefense += 2;
    this.stats.baseSpeed += 1;
    this.stats.baseAccuracy += 1;
    this.stats.baseCritical += 1;

    // Restore health and mana
    this.stats.maxHealth += 10;
    this.stats.maxMana += 5;
    this.stats.currentHealth = this.stats.maxHealth;
    this.stats.currentMana = this.stats.maxMana;

    return true;
  }

  // Health and Mana Management
  takeDamage(amount: number): void {
    this.stats.currentHealth = Math.max(0, this.stats.currentHealth - amount);
  }

  heal(amount: number): void {
    this.stats.currentHealth = Math.min(this.stats.maxHealth, this.stats.currentHealth + amount);
  }

  spendMana(amount: number): boolean {
    if (this.stats.currentMana >= amount) {
      this.stats.currentMana -= amount;
      return true;
    }
    return false;
  }

  restoreMana(amount: number): void {
    this.stats.currentMana = Math.min(this.stats.maxMana, this.stats.currentMana + amount);
  }

  isAlive(): boolean {
    return this.stats.currentHealth > 0;
  }

  // 鍵管理システム
  hasKey(): boolean {
    return this.hasKeyItem;
  }

  addKey(): void {
    // 鍵は1つまでしか持てない
    if (!this.hasKeyItem) {
      this.hasKeyItem = true;
    }
  }

  useKey(): boolean {
    if (this.hasKeyItem) {
      this.hasKeyItem = false;
      return true;
    }
    return false;
  }

  // ワールドリセット時の処理
  resetForNewWorld(): void {
    // 鍵を失う
    this.hasKeyItem = false;
  }

  // ワールド履歴管理システム
  getWorldHistory(): WorldHistory[] {
    return [...this.worldHistory]; // 防御的コピー
  }

  getClearedWorldCount(): number {
    return this.worldHistory.length;
  }

  addClearedWorld(worldInfo: WorldHistory): void {
    this.worldHistory.push({ ...worldInfo }); // 防御的コピー
  }

  getLastClearedWorld(): WorldHistory | null {
    if (this.worldHistory.length === 0) {
      return null;
    }
    return { ...this.worldHistory[this.worldHistory.length - 1] }; // 防御的コピー
  }

  // レベル調整機能
  adjustLevel(adjustment: number): void {
    const newLevel = Math.max(1, this.stats.level + adjustment);
    const levelDifference = newLevel - this.stats.level;

    // レベルが変わる場合のみステータス調整
    if (levelDifference !== 0) {
      this.stats.level = newLevel;

      // レベル変化に応じてステータス調整
      this.stats.baseAttack += levelDifference * 2;
      this.stats.baseDefense += levelDifference * 2;
      this.stats.baseSpeed += levelDifference * 1;
      this.stats.baseAccuracy += levelDifference * 1;
      this.stats.baseCritical += levelDifference * 1;

      // HP・MPの最大値調整
      this.stats.maxHealth += levelDifference * 10;
      this.stats.maxMana += levelDifference * 5;

      // レベルダウン時は現在値が最大値を超えないよう調整
      if (levelDifference < 0) {
        this.stats.currentHealth = Math.min(this.stats.currentHealth, this.stats.maxHealth);
        this.stats.currentMana = Math.min(this.stats.currentMana, this.stats.maxMana);
      }

      // 経験値の調整（新レベルに応じて設定）
      this.stats.experienceToNext = Math.floor(100 * Math.pow(1.5, newLevel - 1));
      this.stats.experience = Math.min(this.stats.experience, this.stats.experienceToNext - 1);
    }
  }
}
