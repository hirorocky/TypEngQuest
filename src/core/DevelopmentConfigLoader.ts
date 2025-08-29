/**
 * 開発者モード用の設定ファイル読み込みユーティリティ
 */
import * as fs from 'fs';
import * as path from 'path';
import { World } from '../world/World';
import { DomainType } from '../world/domains';
import { Player } from '../player/Player';
import { FileSystem } from '../world/FileSystem';
import { FileNode, NodeType } from '../world/FileNode';
import { EquipmentItemData } from '../items/EquipmentItem';
import { Enemy, EnemyParams } from '../battle/Enemy';
// import { Skill } from '../battle/Skill'; // 現在未使用だがコメントアウトで保持

/**
 * World設定ファイルの型定義
 */
export interface WorldConfig {
  domainType: DomainType;
  level: number;
  isTest?: boolean;
  currentPath?: string;
  exploredPaths?: string[];
  keyLocation?: string | null;
  bossLocation?: string | null;
  hasKey?: boolean;
  description?: string;
}

/**
 * ファイルシステム設定ファイルの型定義
 */
export interface FileSystemConfig {
  rootName: string;
  structure: FileNodeConfig;
  specialItems?: {
    bossLocation?: string;
    keyLocation?: string;
  };
  description?: string;
}

/**
 * ファイルノード設定の型定義
 */
export interface FileNodeConfig {
  name: string;
  type: 'file' | 'directory';
  children?: FileNodeConfig[];
}

/**
 * Player設定ファイルの型定義
 */
export interface PlayerConfig {
  name: string;
  bodyStats: {
    level: number;
    hpDamage?: number;
    mpConsumption?: number;
  };
  equippedItems?: (EquipmentItemData | null)[]; // EquipmentItemDataとして保存
  inventory: {
    consumableItems: Array<{
      id: string;
      name: string;
      description: string;
      type: string;
      rarity: string;
      effects: Array<{ type: string; value: number }>;
    }>;
    equipmentItems: Array<{
      id: string;
      name: string;
      description: string;
      type: string;
      rarity: string;
      stats: { strength: number; willpower: number; agility: number; fortune: number };
      grade: number;
    }>;
  };
  description?: string;
}

/**
 * Enemy設定ファイルの型定義
 */
export interface EnemyConfig {
  enemies: Array<{
    id: string;
    name: string;
    level: number;
    maxHp: number;
    currentHp: number;
    strength: number;
    defense: number;
    agility: number;
    skills: Array<{
      name: string;
      power: number;
      accuracy: number;
      mpCost: number;
      description: string;
    }>;
    dropItems?: Array<{
      id: string;
      name: string;
      dropRate: number;
    }>;
    experiencePoints: number;
    goldReward: number;
  }>;
  defaultEnemyId: string;
}

/**
 * Battle設定ファイルの型定義
 */
export interface BattleConfig {
  battleSettings: {
    typingChallengeSettings: {
      minWordLength: number;
      maxWordLength: number;
      timeLimit: number;
      difficulty: string;
    };
    rewards: {
      experienceMultiplier: number;
      goldMultiplier: number;
    };
    escapeChance: number;
  };
  defaultBattleMode: string;
}

/**
 * 開発者モード用設定ローダークラス
 */
/**
 * デフォルトのspecialItems設定
 */
const DEFAULT_SPECIAL_ITEMS = {
  bossLocation: '/projects/web-app',
  keyLocation: '/projects/mobile-app/app.py',
};

export class DevelopmentConfigLoader {
  private static readonly CONFIG_DIR = path.join(process.cwd(), 'data', 'develop');
  private static readonly WORLD_CONFIG_FILE = 'world-config.json';
  private static readonly PLAYER_CONFIG_FILE = 'player-config.json';
  private static readonly FILESYSTEM_CONFIG_FILE = 'filesystem-config.json';
  private static readonly ENEMY_CONFIG_FILE = 'enemy-config.json';
  private static readonly BATTLE_CONFIG_FILE = 'battle-config.json';

  /**
   * World設定を読み込んでWorldインスタンスを生成する
   */
  static loadWorldFromConfig(): World {
    try {
      const configPath = path.join(this.CONFIG_DIR, this.WORLD_CONFIG_FILE);

      if (!fs.existsSync(configPath)) {
        console.warn(`World config file not found: ${configPath}, using default test world`);
        return World.generateTestWorld();
      }

      const configData = fs.readFileSync(configPath, 'utf-8');
      const config: WorldConfig = JSON.parse(configData);

      console.log(`📄 Loading world config from: ${configPath}`);
      console.log(`🌍 Domain: ${config.domainType}, Level: ${config.level}`);

      // Worldインスタンスを作成
      const world = new World(config.domainType, config.level, config.isTest ?? true);

      // ファイルシステムの設定をJSON設定で上書き
      const filesystemData = this.loadFileSystemConfigData();
      world.fileSystem = filesystemData.fileSystem;

      // specialItems設定の適用
      if (filesystemData.specialItems) {
        if (filesystemData.specialItems.bossLocation) {
          world.setBossLocation(filesystemData.specialItems.bossLocation);
        }
        if (filesystemData.specialItems.keyLocation) {
          world.setKeyLocation(filesystemData.specialItems.keyLocation);
        }
      }

      return world;
    } catch (error) {
      console.error('Failed to load world config:', error);
      console.warn('Falling back to default test world');
      return World.generateTestWorld();
    }
  }

  /**
   * ファイルシステム設定を読み込んでFileSystemインスタンスを生成する
   */
  static loadFileSystemFromConfig(): FileSystem {
    // この機能はloadFileSystemConfigData()で代替される
    const { fileSystem } = this.loadFileSystemConfigData();
    return fileSystem;
  }

  /**
   * ファイルシステム設定とspecialItems設定を読み込む
   */
  static loadFileSystemConfigData(): {
    fileSystem: FileSystem;
    specialItems?: FileSystemConfig['specialItems'];
  } {
    try {
      const configPath = path.join(this.CONFIG_DIR, this.FILESYSTEM_CONFIG_FILE);

      if (!fs.existsSync(configPath)) {
        return {
          fileSystem: this.createDefaultFileSystem(),
          specialItems: DEFAULT_SPECIAL_ITEMS,
        };
      }

      const configData = fs.readFileSync(configPath, 'utf-8');
      const config: FileSystemConfig = JSON.parse(configData);

      const rootNode = this.buildFileNodeFromConfig(config.structure);
      const fileSystem = new FileSystem(rootNode);

      return {
        fileSystem,
        specialItems: config.specialItems,
      };
    } catch (error) {
      console.error('Failed to load filesystem config:', error);
      return {
        fileSystem: this.createDefaultFileSystem(),
        specialItems: DEFAULT_SPECIAL_ITEMS,
      };
    }
  }

  /**
   * Player設定のrawデータを読み込む（Playerクラスのコンストラクタで使用）
   */
  static loadPlayerConfigData(): PlayerConfig | null {
    try {
      const configPath = path.join(this.CONFIG_DIR, this.PLAYER_CONFIG_FILE);

      if (!fs.existsSync(configPath)) {
        return null;
      }

      const configData = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Failed to load player config data:', error);
      return null;
    }
  }

  /**
   * 設定データからFileNodeを再帰的に構築する
   */
  /**
   * デフォルトのファイルシステム構造を生成
   */
  /**
   * デフォルトのファイルシステム構造を生成
   */
  private static createDefaultFileSystem(): FileSystem {
    // デフォルトのJSON設定を埋め込み
    const defaultConfig: { structure: FileNodeConfig } = {
      structure: {
        name: 'projects',
        type: 'directory',
        children: [{ name: 'README.md', type: 'file' }],
      },
    };

    const rootNode = this.buildFileNodeFromConfig(defaultConfig.structure);
    return new FileSystem(rootNode);
  }

  private static buildFileNodeFromConfig(config: FileNodeConfig): FileNode {
    const nodeType = config.type === 'directory' ? NodeType.DIRECTORY : NodeType.FILE;
    const node = new FileNode(config.name, nodeType);

    if (config.children) {
      for (const childConfig of config.children) {
        const childNode = this.buildFileNodeFromConfig(childConfig);
        node.addChild(childNode);
      }
    }

    return node;
  }

  /**
   * Player設定を読み込んでPlayerインスタンスを生成する
   */
  static loadPlayerFromConfig(): Player {
    const configData = this.loadPlayerConfigData();

    if (configData) {
      console.log(`📄 Loading player config from JSON`);
      console.log(`👤 Player: ${configData.name}, Level: ${configData.bodyStats.level}`);

      // Player生成時に開発モードをtrueにして、JSON設定を自動読み込み
      return new Player(configData.name, true);
    } else {
      console.warn('Player config file not found, using default test player');
      return new Player('Test Player', true);
    }
  }

  /**
   * Enemy設定を読み込む
   */
  static loadEnemyConfigData(): EnemyConfig | null {
    try {
      const configPath = path.join(this.CONFIG_DIR, this.ENEMY_CONFIG_FILE);

      if (!fs.existsSync(configPath)) {
        console.warn(`Enemy config file not found: ${configPath}`);
        return null;
      }

      const configData = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Failed to load enemy config:', error);
      return null;
    }
  }

  /**
   * Battle設定を読み込む
   */
  static loadBattleConfigData(): BattleConfig | null {
    try {
      const configPath = path.join(this.CONFIG_DIR, this.BATTLE_CONFIG_FILE);

      if (!fs.existsSync(configPath)) {
        console.warn(`Battle config file not found: ${configPath}`);
        return null;
      }

      const configData = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Failed to load battle config:', error);
      return null;
    }
  }

  /**
   * デフォルトのEnemyデータを取得
   */
  static getDefaultEnemy(): EnemyConfig['enemies'][0] | null {
    const enemyConfig = this.loadEnemyConfigData();
    if (!enemyConfig) {
      // フォールバックのEnemy
      return {
        id: 'default-enemy',
        name: 'Test Enemy',
        level: 1,
        maxHp: 50,
        currentHp: 50,
        strength: 10,
        defense: 5,
        agility: 5,
        skills: [],
        dropItems: [],
        experiencePoints: 10,
        goldReward: 5,
      };
    }

    const defaultEnemy = enemyConfig.enemies.find(e => e.id === enemyConfig.defaultEnemyId);
    return defaultEnemy || enemyConfig.enemies[0];
  }

  /**
   * JSON設定からEnemyインスタンスを作成
   */
  static createEnemyFromConfig(): Enemy | null {
    const enemyData = this.getDefaultEnemy();
    if (!enemyData) {
      return null;
    }

    // JSON設定をEnemyParams形式に変換
    const enemyParams: EnemyParams = {
      id: enemyData.id,
      name: enemyData.name,
      description: `Level ${enemyData.level} enemy`,
      level: enemyData.level,
      stats: {
        maxHp: enemyData.maxHp,
        strength: enemyData.strength,
        willpower: 10, // デフォルト値
        agility: enemyData.agility,
        fortune: 5, // デフォルト値
      },
      physicalEvadeRate: 5 + Math.floor(enemyData.agility / 15), // 回避率をagilityから算出
      magicalEvadeRate: 3 + Math.floor(enemyData.agility / 20),
      skills:
        enemyData.skills?.map((skill, index) => ({
          id: `${enemyData.id}-skill-${index}`,
          name: skill.name,
          description: skill.description,
          skillType: 'physical' as const, // デフォルト値
          mpCost: skill.mpCost,
          mpCharge: 0, // デフォルト値
          actionCost: 1, // デフォルト値
          target: 'enemy' as const, // デフォルト値
          typingDifficulty: 3, // デフォルト値
          skillSuccessRate: {
            baseRate: skill.accuracy,
            agilityInfluence: 0.5,
            typingInfluence: 0.8,
          },
          criticalRate: {
            baseRate: 8,
            fortuneInfluence: 0.5,
          },
          effects: [
            {
              type: 'damage' as const,
              target: 'enemy' as const,
              basePower: skill.power,
              powerInfluence: {
                stat: 'strength' as const,
                rate: 1.2,
              },
              successRate: 90,
            },
          ],
        })) || [],
      drops:
        enemyData.dropItems?.map(drop => ({
          itemId: drop.id,
          dropRate: drop.dropRate * 100, // パーセンテージに変換
        })) || [],
    };

    return new Enemy(enemyParams);
  }

  /**
   * 設定ファイルの存在確認
   */
  static checkConfigFiles(): { world: boolean; player: boolean; filesystem: boolean } {
    const worldConfigExists = fs.existsSync(path.join(this.CONFIG_DIR, this.WORLD_CONFIG_FILE));
    const playerConfigExists = fs.existsSync(path.join(this.CONFIG_DIR, this.PLAYER_CONFIG_FILE));
    const filesystemConfigExists = fs.existsSync(
      path.join(this.CONFIG_DIR, this.FILESYSTEM_CONFIG_FILE)
    );

    return {
      world: worldConfigExists,
      player: playerConfigExists,
      filesystem: filesystemConfigExists,
    };
  }
}
