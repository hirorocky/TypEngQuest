import { TypingDifficulty } from './types';

/**
 * タイピング問題文データベース - 難易度別問題文管理
 */
export class WordDatabase {
  private readonly textsByDifficulty: Map<TypingDifficulty, string[]>;

  constructor() {
    this.textsByDifficulty = new Map();
    this.initializeTexts();
  }

  /**
   * 指定難易度からランダムに問題文を選択
   * @param difficulty - 難易度（1-5）
   * @returns ランダムに選択された問題文
   */
  getRandomText(difficulty: TypingDifficulty): string {
    const texts = this.textsByDifficulty.get(difficulty);

    if (!texts || texts.length === 0) {
      // フォールバック: 難易度1の最初の問題文を返す
      const fallbackTexts = this.textsByDifficulty.get(1);
      return fallbackTexts?.[0] || 'hello';
    }

    const randomIndex = Math.floor(Math.random() * texts.length);
    return texts[randomIndex];
  }

  /**
   * 指定難易度の全問題文を取得
   * @param difficulty - 難易度（1-5）
   * @returns 問題文の配列
   */
  getAllTextsForDifficulty(difficulty: TypingDifficulty): string[] {
    return this.textsByDifficulty.get(difficulty) || [];
  }

  /**
   * 指定難易度の問題文数を取得
   * @param difficulty - 難易度（1-5）
   * @returns 問題文数
   */
  getTotalCount(difficulty: TypingDifficulty): number {
    const texts = this.textsByDifficulty.get(difficulty);
    return texts ? texts.length : 0;
  }

  /**
   * 問題文データを初期化
   */
  private initializeTexts(): void {
    // 難易度1: 基本的な英単語（20文字以下）
    this.textsByDifficulty.set(1, [
      'hello',
      'world',
      'typing',
      'game',
      'quest',
      'adventure',
      'magic',
      'sword',
      'shield',
      'potion',
      'dragon',
      'castle',
      'forest',
      'village',
      'hero',
      'monster',
      'treasure',
      'crystal',
      'power',
      'level up',
    ]);

    // 難易度2: 少し長い単語や簡単な文章（30文字以下）
    this.textsByDifficulty.set(2, [
      'welcome to the game',
      'start your adventure',
      'find the treasure',
      'defeat the monster',
      'explore the dungeon',
      'cast magic spell',
      'upgrade your equipment',
      'complete the quest',
      'save the princess',
      'unlock new abilities',
      'discover hidden secrets',
      'journey through lands',
      'battle fierce enemies',
      'collect rare items',
      'master your skills',
      'become a legend',
      'protect the kingdom',
      'solve ancient puzzles',
      'forge powerful weapons',
      'learn new techniques',
    ]);

    // 難易度3: 数字や記号を含む文章（40文字以下）
    this.textsByDifficulty.set(3, [
      'Player level: 25 (Experience: 1,250)',
      'Health: 100/100, Mana: 50/75',
      'Gold: 1,500 coins in your inventory',
      'Damage dealt: 45 points to the enemy!',
      'Critical hit! Damage multiplied by 2x',
      'Quest completed: "Find the Lost Ring"',
      'Achievement unlocked: "First Victory"',
      'Items found: 3x Potion, 1x Magic Stone',
      'Location: Forest of Whispers (Zone 2)',
      'Time remaining: 02:45 until sunset',
      'Score: 95,750 points (Rank: S)',
      'Combo multiplier: x4.5 (Keep it up!)',
      'Speed: 45 WPM, Accuracy: 98.5%',
      'Equipment: +15 ATK, +8 DEF, +12 MAG',
      'Status effect: Blessed (+20% EXP)',
      'Boss encounter: "Shadow Dragon" (Lv.30)',
      'Map completed: 75% (15/20 areas)',
      'Next level requires: 850 more EXP',
      'Rare drop chance: 12.5% (Lucky!)',
      'Trading post: Buy/Sell items here',
    ]);

    // 難易度4: より複雑な文章（50文字以下）
    this.textsByDifficulty.set(4, [
      'The ancient prophecy speaks of chosen hero...',
      'Navigate through treacherous paths and puzzles',
      'Your typing speed determines battle power!',
      'Beware: the guardian requires perfect accuracy.',
      'Combine elements: Fire + Water = Steam (2x damage)',
      'Warning! Boss battle ahead - prepare strongest',
      'Hidden passage discovered behind waterfall...',
      'The mystical artifact glows with magic power',
      'Spell components needed: 5x Moonstone, 3x Phoenix',
      'Challenge accepted: Type without looking at keys',
      'Advanced technique: Chain combos for max effect',
      'The tower\'s riddle: "What types but never speaks?"',
      'Equipment synthesis: Merge items to create power',
      'Time trial mode: Complete dungeon in under 5 min',
      'Master difficulty: Face the ultimate test',
      'Perfect run achieved: Zero errors, maximum speed!',
      'The sage whispers: "Speed without accuracy is...',
      'Legendary quest available: "The Typing Master"',
      'Final boss approaches: Use everything you learned',
      'Victory condition: Maintain 99%+ accuracy always',
    ]);

    // 難易度5: 最も複雑で長い文章（60文字以下）
    this.textsByDifficulty.set(5, [
      'In the realm where keystrokes echo through digital valleys',
      'The ultimate challenge awaits those who dare to type fast',
      'Master the art of touch typing: fingers dance across keys',
      'Legend tells of warriors who conquered words with speed...',
      'Behold! The sacred keyboard holds secrets of ancient wisdom',
      'Through dedication and practice, mere mortals become gods...',
      'The final trial demands perfection: no room for hesitation',
      'As shadows lengthen, the last boss emerges from darkness.',
      'Your journey ends here, but your skills will echo forever',
      'The Typing Quest concludes with mastery over mind & muscle',
      'Congratulations, champion! You have achieved the impossible',
      'From humble beginnings to legendary status: your evolution',
      'The keyboard sings your praise: a symphony of perfect keys',
      'Words bend to your will; sentences flow like rivers of...',
      'Time slows as your fingers find their rhythm: zen achieved',
      'In this moment, you transcend mere typing and become art',
      'The crowd cheers as you complete the impossible challenge!',
      'Your name will be remembered in the halls of typing fame',
      'Master of Masters, Teacher of Teachers: your legacy lives',
      'The end is but a new beginning: teach others your wisdom',
    ]);
  }
}
