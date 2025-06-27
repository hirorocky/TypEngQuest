import { Map } from '../world/map';
import { ElementManager } from '../world/elements';
import { Player } from '../core/player';
import { World } from '../world/world';
import { LocationType, ElementType, Element } from '../world/location';

/**
 * コマンド実行結果の型定義
 */
export interface CommandResult {
  success: boolean;
  output: string;
}

/**
 * タイピングチャレンジの難易度設定
 */
interface TypingChallenge {
  words: string[];
  timeLimit: number;
  description: string;
}

/**
 * 相互作用コマンドクラス - プレイヤーと要素の相互作用システム
 */
export class InteractionCommands {
  private map: Map;
  private elementManager: ElementManager;
  private player: Player;
  private world: World;

  constructor(map: Map, elementManager: ElementManager, player: Player, world: World) {
    this.map = map;
    this.elementManager = elementManager;
    this.player = player;
    this.world = world;
  }

  /**
   * interactコマンド - 要素との相互作用
   * @param filename - 相互作用するファイル名
   * @returns コマンド実行結果
   */
  interact(filename: string): CommandResult {
    if (!filename.trim()) {
      return {
        success: false,
        output: 'Usage: interact <filename>',
      };
    }

    const resolvedPath = this.map.resolvePath(filename);
    const location = this.map.findLocation(resolvedPath);

    if (!location) {
      return {
        success: false,
        output: `interact: ${filename}: No such file or directory`,
      };
    }

    if (location.getType() === LocationType.DIRECTORY) {
      return {
        success: false,
        output: `interact: ${filename}: Cannot interact with directory`,
      };
    }

    if (!location.isExplored()) {
      return {
        success: false,
        output: `interact: ${filename}: File must be explored first. Use 'cat ${filename}' to explore.`,
      };
    }

    if (!location.hasElement()) {
      return {
        success: false,
        output: `interact: ${filename}: File contains nothing to interact with.`,
      };
    }

    const element = location.getElement()!;
    return this.processElementInteraction(element, filename);
  }

  /**
   * 要素タイプに応じた相互作用処理
   * @param element - 相互作用する要素
   * @param filename - ファイル名
   * @returns 処理結果
   */
  private processElementInteraction(element: Element, filename: string): CommandResult {
    switch (element.type) {
      case ElementType.MONSTER:
        return this.handleMonsterInteraction(element, filename);
      case ElementType.TREASURE:
        return this.handleTreasureInteraction(element, filename);
      case ElementType.RANDOM_EVENT:
        return this.handleRandomEventInteraction(element, filename);
      case ElementType.SAVE_POINT:
        return this.handleSavePointInteraction(element, filename);
      default:
        return {
          success: false,
          output: `interact: ${filename}: Unknown element type`,
        };
    }
  }

  /**
   * モンスターとの相互作用処理
   * @param element - モンスター要素
   * @param filename - ファイル名
   * @returns 戦闘結果
   */
  private handleMonsterInteraction(element: Element, filename: string): CommandResult {
    if (element.data.defeated) {
      return {
        success: false,
        output: `interact: ${filename}: Monster already defeated`,
      };
    }

    const monsterName = element.data.name as string;
    const monsterHealth = element.data.health as number;
    const monsterAttack = element.data.attack as number;

    let output = `Battle started with ${monsterName}!\n`;
    output += `Monster Stats - Health: ${monsterHealth}, Attack: ${monsterAttack}\n`;

    // 戦闘ロジック: プレイヤー装備力 vs モンスター強さ
    const playerStats = this.player.getStats();
    const playerPower = playerStats.baseAttack + playerStats.equipmentAttack;
    const playerDefense = playerStats.baseDefense + playerStats.equipmentDefense;

    const battleResult = this.calculateBattleResult(
      playerPower,
      playerDefense,
      monsterHealth,
      monsterAttack
    );

    if (battleResult.victory) {
      element.data.defeated = true;
      this.player.addExperience(Math.floor(monsterHealth / 2));

      output += `Victory! You defeated ${monsterName}!\n`;
      output += `Experience gained: ${Math.floor(monsterHealth / 2)}`;
    } else {
      const damage = Math.max(1, monsterAttack - playerDefense);
      this.player.takeDamage(damage);

      output += `Defeat! ${monsterName} deals ${damage} damage!\n`;
      output += `Your health: ${this.player.getStats().currentHealth}/${this.player.getStats().maxHealth}`;
    }

    return {
      success: true,
      output,
    };
  }

  /**
   * 戦闘結果を計算する
   * @param playerPower - プレイヤー攻撃力
   * @param playerDefense - プレイヤー防御力
   * @param monsterHealth - モンスターHP
   * @param monsterAttack - モンスター攻撃力
   * @returns 戦闘結果
   */
  private calculateBattleResult(
    playerPower: number,
    playerDefense: number,
    monsterHealth: number,
    monsterAttack: number
  ): { victory: boolean } {
    // 簡単な戦闘ロジック: プレイヤー攻撃力がモンスターHPを上回れば勝利
    const playerDamage = Math.max(1, playerPower);
    const monsterDamage = Math.max(1, monsterAttack - playerDefense);

    // プレイヤーがモンスターを倒すのに必要なターン数
    const turnsToKillMonster = Math.ceil(monsterHealth / playerDamage);

    // モンスターがプレイヤーを倒すのに必要なターン数
    const currentHealth = this.player.getStats().currentHealth;
    const turnsToKillPlayer = Math.ceil(currentHealth / monsterDamage);

    return { victory: turnsToKillMonster <= turnsToKillPlayer };
  }

  /**
   * 宝箱との相互作用処理
   * @param element - 宝箱要素
   * @param filename - ファイル名
   * @returns 開封結果
   */
  private handleTreasureInteraction(element: Element, filename: string): CommandResult {
    if (element.data.opened) {
      return {
        success: false,
        output: `interact: ${filename}: Treasure already opened`,
      };
    }

    const contents = element.data.contents as string[];
    const rarity = element.data.rarity as string;

    element.data.opened = true;

    // 装備をプレイヤーのインベントリに追加
    contents.forEach(item => {
      this.player.addToInventory(item);
    });

    let output = `Treasure opened!\n`;
    output += `Rarity: ${rarity}\n`;
    output += `Equipment obtained: ${contents.join(', ')}\n`;
    output += `Items added to inventory.`;

    return {
      success: true,
      output,
    };
  }

  /**
   * ランダムイベントとの相互作用処理
   * @param element - ランダムイベント要素
   * @param filename - ファイル名
   * @returns イベント結果
   */
  private handleRandomEventInteraction(element: Element, filename: string): CommandResult {
    if (element.data.triggered) {
      return {
        success: false,
        output: `interact: ${filename}: Event already triggered`,
      };
    }

    const eventType = element.data.eventType as string;
    const description = element.data.description as string;
    const effects = element.data.effects as Record<string, number>;

    element.data.triggered = true;

    if (eventType === 'good') {
      return this.handleGoodEvent(description, effects);
    } else {
      return this.handleBadEvent(description, effects);
    }
  }

  /**
   * 良いイベント処理
   * @param description - イベント説明
   * @param effects - イベント効果
   * @returns 処理結果
   */
  private handleGoodEvent(description: string, effects: Record<string, number>): CommandResult {
    let output = `Event triggered: ${description}\n`;

    // 効果を適用
    Object.entries(effects).forEach(([effectType, value]) => {
      switch (effectType) {
        case 'experience':
          this.player.addExperience(value);
          output += `experience: +${value}\n`;
          break;
        case 'health':
          this.player.heal(value);
          output += `health: +${value}\n`;
          break;
        case 'mana':
          this.player.restoreMana(value);
          output += `mana: +${value}\n`;
          break;
      }
    });

    return {
      success: true,
      output: output.trim(),
    };
  }

  /**
   * 悪いイベント処理（タイピングチャレンジ）
   * @param description - イベント説明
   * @param effects - イベント効果
   * @returns 処理結果
   */
  private handleBadEvent(description: string, effects: Record<string, number>): CommandResult {
    const worldLevel = this.world.getLevel();
    const challenge = this.generateTypingChallenge(worldLevel);

    let output = `Dangerous event: ${description}\n`;
    output += `Level ${worldLevel} typing challenge required!\n`;
    output += `Challenge: ${challenge.description}\n`;
    output += `Words to type: ${challenge.words.join(' ')}\n`;
    output += `Time limit: ${challenge.timeLimit} seconds\n`;

    // 効果の警告表示
    Object.entries(effects).forEach(([effectType, value]) => {
      switch (effectType) {
        case 'healthDamage':
          output += `Potential damage: ${value}\n`;
          break;
        case 'manaDrain':
          output += `Potential mana loss: ${value}\n`;
          break;
      }
    });

    output += `(In actual gameplay, player would need to complete typing challenge to avoid effects)`;

    return {
      success: true,
      output,
    };
  }

  /**
   * ワールドレベルに応じたタイピングチャレンジを生成
   * @param worldLevel - ワールドレベル
   * @returns タイピングチャレンジ
   */
  private generateTypingChallenge(worldLevel: number): TypingChallenge {
    const challenges = {
      1: {
        words: ['fix', 'bug', 'code'],
        timeLimit: 15,
        description: 'Basic programming terms',
      },
      2: {
        words: ['function', 'variable', 'return'],
        timeLimit: 12,
        description: 'Common coding concepts',
      },
      3: {
        words: ['asynchronous', 'callback', 'promise'],
        timeLimit: 10,
        description: 'Intermediate programming concepts',
      },
      4: {
        words: ['polymorphism', 'encapsulation', 'inheritance'],
        timeLimit: 8,
        description: 'Advanced object-oriented programming',
      },
      5: {
        words: ['const recursiveFunction = (n) => n <= 1 ? 1 : n * recursiveFunction(n - 1)'],
        timeLimit: 6,
        description: 'Complex code syntax',
      },
    };

    const level = Math.min(worldLevel, 5);
    const baseChallenge = challenges[level as keyof typeof challenges];

    return {
      ...baseChallenge,
      words: [...baseChallenge.words], // 防御的コピー
    };
  }

  /**
   * セーブポイントとの相互作用処理
   * @param element - セーブポイント要素
   * @param filename - ファイル名
   * @returns 回復結果
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  private handleSavePointInteraction(element: Element, filename: string): CommandResult {
    const name = element.data.name as string;
    const healthRestore = element.data.healthRestore as number;
    const manaRestore = element.data.manaRestore as number;

    // HP/MP回復
    const currentStats = this.player.getStats();
    const healthBefore = currentStats.currentHealth;
    const manaBefore = currentStats.currentMana;

    this.player.heal(healthRestore);
    this.player.restoreMana(manaRestore);

    const statsAfter = this.player.getStats();
    const actualHealthRestored = statsAfter.currentHealth - healthBefore;
    const actualManaRestored = statsAfter.currentMana - manaBefore;

    let output = `Save point accessed: ${name}\n`;
    output += `Health restored: ${actualHealthRestored} (${statsAfter.currentHealth}/${statsAfter.maxHealth})\n`;
    output += `Mana restored: ${actualManaRestored} (${statsAfter.currentMana}/${statsAfter.maxMana})\n`;
    output += `Game saved successfully.`;

    return {
      success: true,
      output,
    };
  }
}
