import { Element, ElementType, Location, LocationType } from './location';

/**
 * 要素確率情報の型定義
 */
export interface ElementProbabilities {
  monster: number;
  treasure: number;
  randomEvent: number;
  savePoint: number;
}

/**
 * ファイルタイプ別確率設定の型定義
 */
export interface FileTypeProbabilities {
  [key: string]: ElementProbabilities;
}

/**
 * 要素管理クラス - マップ上の各場所に配置される要素（モンスター、宝箱等）を生成・管理する
 */
export class ElementManager {
  private fileTypeProbabilities!: FileTypeProbabilities;
  private monsterNames!: { [key: string]: string[] };
  private treasureContents!: { [key: string]: string[] };
  private eventTemplates!: { good: string[]; bad: string[] };
  private savePointNames!: string[];

  constructor() {
    this.initializeFileTypeProbabilities();
    this.initializeMonsterNames();
    this.initializeTreasureContents();
    this.initializeEventTemplates();
    this.initializeSavePointNames();
  }

  /**
   * ファイルタイプ別の確率設定を初期化する
   */
  private initializeFileTypeProbabilities(): void {
    this.fileTypeProbabilities = {
      '.exe': { monster: 80, treasure: 5, randomEvent: 10, savePoint: 5 },
      '.bin': { monster: 75, treasure: 10, randomEvent: 10, savePoint: 5 },
      '.js': { monster: 60, treasure: 15, randomEvent: 20, savePoint: 5 },
      '.ts': { monster: 60, treasure: 15, randomEvent: 20, savePoint: 5 },
      '.py': { monster: 55, treasure: 20, randomEvent: 20, savePoint: 5 },
      '.json': { monster: 20, treasure: 30, randomEvent: 25, savePoint: 25 },
      '.yaml': { monster: 20, treasure: 30, randomEvent: 25, savePoint: 25 },
      '.md': { monster: 10, treasure: 15, randomEvent: 25, savePoint: 50 },
      '.txt': { monster: 15, treasure: 20, randomEvent: 30, savePoint: 25 },
      hidden: { monster: 30, treasure: 10, randomEvent: 50, savePoint: 10 }, // .で始まるファイル
      default: { monster: 40, treasure: 20, randomEvent: 25, savePoint: 15 },
    };
  }

  /**
   * モンスター名を初期化する
   */
  private initializeMonsterNames(): void {
    this.monsterNames = {
      '.js': ['Syntax Error Bug', 'Undefined Variable Ghost', 'Callback Hell Demon'],
      '.ts': ['Type Mismatch Dragon', 'Compilation Error Beast', 'Interface Violation Wraith'],
      '.py': ['Indentation Error Snake', 'Import Error Basilisk', 'Runtime Exception Hydra'],
      '.json': ['Parse Error Gremlin', 'Schema Validation Fiend', 'Malformed Data Specter'],
      default: ['Code Bug', 'Logic Error', 'Runtime Exception', 'Memory Leak Monster'],
    };
  }

  /**
   * 宝箱内容を初期化する
   */
  private initializeTreasureContents(): void {
    this.treasureContents = {
      '.js': ['function', 'const', 'async', 'await', 'promise'],
      '.ts': ['interface', 'type', 'generic', 'decorator', 'namespace'],
      '.py': ['def', 'class', 'import', 'lambda', 'generator'],
      '.json': ['config', 'data', 'schema', 'property', 'value'],
      'package.json': ['dependency', 'script', 'version', 'module', 'package'],
      default: ['code', 'function', 'variable', 'method', 'object'],
    };
  }

  /**
   * イベントテンプレートを初期化する
   */
  private initializeEventTemplates(): void {
    this.eventTemplates = {
      good: [
        'Found optimization tip',
        'Discovered useful library',
        'Code review insights gained',
        'Performance improvement found',
        'Security vulnerability patched',
      ],
      bad: [
        'Encountered merge conflict',
        'Database connection lost',
        'Memory usage spike detected',
        'Deprecated API warning',
        'Unit test failure discovered',
      ],
    };
  }

  /**
   * セーブポイント名を初期化する
   */
  private initializeSavePointNames(): void {
    this.savePointNames = [
      'Documentation Hub',
      'Knowledge Base',
      'Reference Library',
      'Learning Center',
      'Help Desk',
      'Code Archive',
      'Tutorial Station',
    ];
  }

  /**
   * 場所に応じて要素を生成する
   * @param location - 要素を生成する場所
   * @returns 生成された要素（要素なしの場合はnull）
   */
  generateElement(location: Location): Element | null {
    const probabilities = this.getElementProbabilities(location);
    const random = Math.random() * 100;

    let cumulative = 0;

    cumulative += probabilities.monster;
    if (random <= cumulative) {
      return this.generateMonsterForFile(location);
    }

    cumulative += probabilities.treasure;
    if (random <= cumulative) {
      return this.generateTreasureForFile(location);
    }

    cumulative += probabilities.randomEvent;
    if (random <= cumulative) {
      return this.generateRandomEventForFile(location);
    }

    cumulative += probabilities.savePoint;
    if (random <= cumulative) {
      return this.generateSavePointForLocation(location);
    }

    return null; // 要素なし
  }

  /**
   * 場所の要素生成確率を取得する
   * @param location - 確率を取得する場所
   * @returns 要素確率情報
   */
  getElementProbabilities(location: Location): ElementProbabilities {
    if (location.getType() === LocationType.DIRECTORY) {
      return { monster: 5, treasure: 10, randomEvent: 15, savePoint: 20 };
    }

    const extension = location.getFileExtension();
    const isHidden = location.isHidden();

    if (isHidden) {
      return this.fileTypeProbabilities['hidden'];
    }

    return this.fileTypeProbabilities[extension] || this.fileTypeProbabilities['default'];
  }

  /**
   * モンスター要素を作成する
   * @param name - モンスター名
   * @param health - HP
   * @param attack - 攻撃力
   * @returns モンスター要素
   */
  createMonsterElement(name: string, health: number, attack: number): Element {
    return {
      type: ElementType.MONSTER,
      data: {
        name,
        health,
        attack,
        defeated: false,
      },
    };
  }

  /**
   * ファイルに応じたモンスターを生成する
   * @param location - ファイル場所
   * @returns モンスター要素
   */
  generateMonsterForFile(location: Location): Element {
    const extension = location.getFileExtension();
    const depth = location.getPath().split('/').length - 1;

    // 深度に応じて強さを調整
    const baseHealth = 30 + depth * 10;
    const baseAttack = 10 + depth * 3;

    // ファイルタイプに応じたモンスター名
    const namePool = this.monsterNames[extension] || this.monsterNames['default'];
    const name = namePool[Math.floor(Math.random() * namePool.length)];

    return this.createMonsterElement(name, baseHealth, baseAttack);
  }

  /**
   * 宝箱要素を作成する
   * @param contents - 宝箱の中身
   * @param rarity - レアリティ
   * @returns 宝箱要素
   */
  createTreasureElement(contents: string[], rarity: string): Element {
    return {
      type: ElementType.TREASURE,
      data: {
        contents,
        rarity,
        opened: false,
      },
    };
  }

  /**
   * ファイルに応じた宝箱を生成する
   * @param location - ファイル場所
   * @returns 宝箱要素
   */
  generateTreasureForFile(location: Location): Element {
    const extension = location.getFileExtension();
    const fileName = location.getName();

    // ファイルタイプに応じた内容
    let contentPool = this.treasureContents[extension] || this.treasureContents['default'];

    // 特別なファイル名の場合
    if (fileName === 'package.json') {
      contentPool = this.treasureContents['package.json'];
    }

    // 1-3個のアイテムを選択
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const contents = Array.from(
      { length: itemCount },
      () => contentPool[Math.floor(Math.random() * contentPool.length)]
    );

    // レアリティ決定
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const weights = [50, 30, 15, 4, 1]; // 確率重み
    const rarity = this.selectByWeight(rarities, weights);

    return this.createTreasureElement(contents, rarity);
  }

  /**
   * ランダムイベント要素を作成する
   * @param eventType - イベントタイプ（good/bad）
   * @param description - イベント説明
   * @param effects - イベント効果
   * @returns ランダムイベント要素
   */
  createRandomEventElement(
    eventType: string,
    description: string,
    effects: Record<string, number>
  ): Element {
    return {
      type: ElementType.RANDOM_EVENT,
      data: {
        eventType,
        description,
        effects,
        triggered: false,
      },
    };
  }

  /**
   * ファイルに応じたランダムイベントを生成する
   * @param location - ファイル場所
   * @returns ランダムイベント要素
   */
  generateRandomEventForFile(location: Location): Element {
    const isHidden = location.isHidden();
    const extension = location.getFileExtension();

    // 隠しファイルは悪いイベント確率高め、ドキュメントは良いイベント確率高め
    let goodProbability = 0.5;
    if (isHidden) {
      goodProbability = 0.3;
    } else if (extension === '.md' || extension === '.txt') {
      goodProbability = 0.7;
    }

    const isGood = Math.random() < goodProbability;
    const eventType = isGood ? 'good' : 'bad';

    const templates = this.eventTemplates[eventType];
    const description = templates[Math.floor(Math.random() * templates.length)];

    const effects: Record<string, number> = isGood
      ? { experience: Math.floor(Math.random() * 20) + 5 }
      : { healthDamage: Math.floor(Math.random() * 15) + 5 };

    return this.createRandomEventElement(eventType, description, effects);
  }

  /**
   * セーブポイント要素を作成する
   * @param name - セーブポイント名
   * @param healthRestore - HP回復量
   * @param manaRestore - MP回復量
   * @returns セーブポイント要素
   */
  createSavePointElement(name: string, healthRestore: number, manaRestore: number): Element {
    return {
      type: ElementType.SAVE_POINT,
      data: {
        name,
        healthRestore,
        manaRestore,
        used: false,
      },
    };
  }

  /**
   * 場所に応じたセーブポイントを生成する
   * @param location - 場所
   * @returns セーブポイント要素
   */
  generateSavePointForLocation(location: Location): Element {
    // 将来的に場所に応じた名前生成を実装予定
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const _unused = location.getName();

    const name = this.savePointNames[Math.floor(Math.random() * this.savePointNames.length)];
    const healthRestore = Math.floor(Math.random() * 50) + 50; // 50-100
    const manaRestore = Math.floor(Math.random() * 30) + 20; // 20-50

    return this.createSavePointElement(name, healthRestore, manaRestore);
  }

  /**
   * 重み付きランダム選択
   * @param items - 選択肢配列
   * @param weights - 重み配列
   * @returns 選択された項目
   */
  private selectByWeight<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }
}
