import fs from 'fs';
import path from 'path';
import {
  SaveData,
  SaveResult,
  LoadResult,
  SaveFileInfo,
  SavedPlayerData,
  SavedWorldData,
  SavedLocationData,
  SavedEventData,
  SavedGameState,
} from './saveData';
import { Player } from './player';
import { World } from '../world/world';
import { Map } from '../world/map';
import { ElementManager } from '../world/elements';
import { BattleCommands } from '../battle/battleCommands';
import { RandomEventManager } from '../events/randomEventManager';

/**
 * セーブ・ロードシステムの管理クラス
 * ゲーム状態の永続化と復元を担当
 */
export class SaveManager {
  private readonly savesDirectory: string;
  private readonly currentVersion: string = '1.0.0';
  private readonly maxSlots: number = 10;
  private autoSaveEnabled: boolean = true;

  constructor(savesDirectory: string = './saves') {
    this.savesDirectory = savesDirectory;
    this.initializeSavesDirectory();
  }

  /**
   * セーブディレクトリを初期化する
   */
  private initializeSavesDirectory(): void {
    try {
      if (!fs.existsSync(this.savesDirectory)) {
        fs.mkdirSync(this.savesDirectory, { recursive: true });
      }
    } catch (error) {
      throw new Error(
        `Failed to create saves directory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * ゲームをセーブする
   * @param slot - セーブスロット番号（1-9: 手動セーブ, 10: 自動セーブ）
   * @param player - プレイヤーオブジェクト
   * @param world - ワールドオブジェクト
   * @param map - マップオブジェクト
   * @param elementManager - 要素マネージャー
   * @param battleCommands - 戦闘コマンド
   * @param description - セーブの説明（オプション）
   * @returns セーブ結果
   */
  async saveGame(
    slot: number,
    player: Player,
    world: World,
    map: Map,
    elementManager: ElementManager,
    battleCommands: BattleCommands,
    description?: string
  ): Promise<SaveResult> {
    try {
      // 入力検証
      if (!this.isValidSlot(slot)) {
        return {
          success: false,
          message: `Invalid slot number: ${slot}. Must be between 1 and ${this.maxSlots}.`,
        };
      }

      if (!player || !world || !map || !elementManager || !battleCommands) {
        return {
          success: false,
          message: 'Invalid game objects provided for saving.',
        };
      }

      // セーブデータを構築
      const saveData: SaveData = {
        version: this.currentVersion,
        timestamp: new Date().toISOString(),
        playTime: this.calculatePlayTime(player),
        slot,
        player: this.convertPlayerData(player),
        world: this.convertWorldData(world),
        gameState: this.convertGameState(battleCommands),
        mapLocations: this.convertMapData(map),
        eventSystem: this.convertEventData(elementManager),
        metadata: {
          gameName: 'TypEngQuest',
          saveDescription: description,
        },
      };

      // ファイルに保存
      const filePath = this.getSaveFilePath(slot);
      fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2), 'utf8');

      return {
        success: true,
        message:
          slot === 10 ? 'Auto-saved successfully.' : `Game saved successfully to slot ${slot}.`,
        slot,
        filePath,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to save game: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * ゲームをロードする
   * @param slot - ロードするセーブスロット番号
   * @returns ロード結果
   */
  async loadGame(slot: number): Promise<LoadResult> {
    try {
      // 入力検証
      if (!this.isValidSlot(slot)) {
        return {
          success: false,
          message: `Invalid slot number: ${slot}. Must be between 1 and ${this.maxSlots}.`,
        };
      }

      const filePath = this.getSaveFilePath(slot);

      // ファイル存在確認
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          message: `Save file not found in slot ${slot}.`,
        };
      }

      // ファイル読み込み
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const saveData: SaveData = JSON.parse(fileContent);

      // バージョン互換性チェック
      if (!this.isCompatibleVersion(saveData.version)) {
        return {
          success: false,
          message: `Save file version ${saveData.version} is not compatible with current version ${this.currentVersion}.`,
        };
      }

      // データ整合性チェック
      if (!this.validateSaveData(saveData)) {
        return {
          success: false,
          message: 'Save file is corrupted or invalid.',
        };
      }

      return {
        success: true,
        message: `Game loaded successfully from slot ${slot}.`,
        saveData,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return {
          success: false,
          message: `Save file is corrupted: ${error.message}`,
        };
      }
      return {
        success: false,
        message: `Failed to load game: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * セーブファイル一覧を取得する
   * @returns セーブファイル情報の配列
   */
  async listSaveFiles(): Promise<SaveFileInfo[]> {
    const saveFiles: SaveFileInfo[] = [];

    // 全スロットを初期化
    for (let slot = 1; slot <= this.maxSlots; slot++) {
      saveFiles.push({
        slot,
        timestamp: '',
        playTime: 0,
        playerName: '',
        playerLevel: 0,
        worldName: '',
        worldLevel: 0,
        exists: false,
      });
    }

    try {
      const files = fs.readdirSync(this.savesDirectory);
      const saveFileNames = files.filter(
        file => file.startsWith('save-') && file.endsWith('.json')
      );

      for (const fileName of saveFileNames) {
        const match = fileName.match(/save-(\d+)\.json/);
        if (match) {
          const slot = parseInt(match[1], 10);
          if (slot >= 1 && slot <= this.maxSlots) {
            try {
              const filePath = path.join(this.savesDirectory, fileName);
              const stats = fs.statSync(filePath);
              const content = fs.readFileSync(filePath, 'utf8');
              const saveData: SaveData = JSON.parse(content);

              saveFiles[slot - 1] = {
                slot,
                timestamp: saveData.timestamp,
                playTime: saveData.playTime,
                playerName: saveData.player.name,
                playerLevel: saveData.player.stats.level,
                worldName: saveData.world.name,
                worldLevel: saveData.world.level,
                description: saveData.metadata.saveDescription,
                exists: true,
              };
            } catch (error) {
              // 個別ファイルの読み込みエラーは無視してスキップ
              console.warn(`Failed to read save file ${fileName}: ${error}`);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to list save files: ${error}`);
    }

    return saveFiles;
  }

  /**
   * セーブファイルを削除する
   * @param slot - 削除するセーブスロット番号
   * @returns 削除結果
   */
  async deleteSave(slot: number): Promise<SaveResult> {
    try {
      if (!this.isValidSlot(slot)) {
        return {
          success: false,
          message: `Invalid slot number: ${slot}. Must be between 1 and ${this.maxSlots}.`,
        };
      }

      const filePath = this.getSaveFilePath(slot);

      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          message: `Save file not found in slot ${slot}.`,
        };
      }

      fs.unlinkSync(filePath);

      return {
        success: true,
        message: `Save file in slot ${slot} deleted successfully.`,
        slot,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete save file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 自動セーブを実行する
   * @param player - プレイヤーオブジェクト
   * @param world - ワールドオブジェクト
   * @param map - マップオブジェクト
   * @param elementManager - 要素マネージャー
   * @param battleCommands - 戦闘コマンド
   * @returns セーブ結果
   */
  async autoSave(
    player: Player,
    world: World,
    map: Map,
    elementManager: ElementManager,
    battleCommands: BattleCommands
  ): Promise<SaveResult> {
    if (!this.autoSaveEnabled) {
      return {
        success: false,
        message: 'Auto-save is disabled.',
      };
    }

    return this.saveGame(10, player, world, map, elementManager, battleCommands, 'Auto-save');
  }

  /**
   * 自動セーブの有効/無効を設定する
   * @param enabled - 有効にするかどうか
   */
  setAutoSaveEnabled(enabled: boolean): void {
    this.autoSaveEnabled = enabled;
  }

  /**
   * 自動セーブが有効かどうかを取得する
   * @returns 自動セーブが有効かどうか
   */
  isAutoSaveEnabled(): boolean {
    return this.autoSaveEnabled;
  }

  /**
   * 現在のバージョンを取得する
   * @returns 現在のバージョン
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  // データ変換メソッド

  /**
   * プレイヤーデータをセーブ用に変換する
   * @param player - プレイヤーオブジェクト
   * @returns セーブ用プレイヤーデータ
   */
  convertPlayerData(player: Player): SavedPlayerData {
    const stats = player.getStats();
    const equipment = player.getEquipment();
    const inventory = player.getInventory();

    return {
      name: player.getName(),
      stats: {
        level: stats.level,
        experience: stats.experience,
        experienceToNext: stats.experienceToNext,
        currentHealth: stats.currentHealth,
        maxHealth: stats.maxHealth,
        currentMana: stats.currentMana,
        maxMana: stats.maxMana,
        baseAttack: stats.baseAttack,
        baseDefense: stats.baseDefense,
        baseSpeed: stats.baseSpeed,
        baseAccuracy: stats.baseAccuracy,
        baseCritical: stats.baseCritical,
        equipmentAttack: stats.equipmentAttack,
        equipmentDefense: stats.equipmentDefense,
        equipmentSpeed: stats.equipmentSpeed,
        equipmentAccuracy: stats.equipmentAccuracy,
        equipmentCritical: stats.equipmentCritical,
      },
      equipment: equipment.map(slot => ({
        slotNumber: slot.slotNumber,
        word: slot.word,
        wordType: slot.wordType,
      })),
      inventory: [...inventory],
      hasKey: player.hasKey(),
      worldHistory: player.getWorldHistory().map(history => ({
        worldName: history.name,
        level: history.level,
        clearedAt: history.clearedAt.toISOString(),
        memories: [history.bossName], // bossNameをmemories配列として保存
      })),
    };
  }

  /**
   * ワールドデータをセーブ用に変換する
   * @param world - ワールドオブジェクト
   * @returns セーブ用ワールドデータ
   */
  convertWorldData(world: World): SavedWorldData {
    const boss = world.getBoss();

    return {
      name: world.getName(),
      level: world.getLevel(),
      bossDefeated: world.isCleared(),
      keyObtained: false, // 実際の実装では鍵取得状態を追跡する必要がある
      bossData: boss
        ? {
            name: boss.getName(),
            health: boss.getCurrentHealth(),
            maxHealth: boss.getMaxHealth(),
            defeated: boss.isDefeated(),
          }
        : undefined,
    };
  }

  /**
   * マップデータをセーブ用に変換する
   * @param map - マップオブジェクト
   * @returns セーブ用マップデータ
   */
  convertMapData(map: Map): SavedLocationData[] {
    const allLocations = map.getAllLocations();

    return allLocations.map(location => ({
      path: location.getPath(),
      type: location.isFile() ? 'file' : 'directory',
      isExplored: location.isExplored(),
      hasElement: location.hasElement(),
      elementData: location.hasElement()
        ? {
            type: location.getElement()!.type,
            data: location.getElement()!.data,
          }
        : undefined,
    }));
  }

  /**
   * イベントシステムデータをセーブ用に変換する
   * @param elementManager - 要素マネージャー
   * @returns セーブ用イベントデータ
   */
  convertEventData(elementManager: ElementManager): SavedEventData {
    // 実際の実装では、InteractionCommandsからRandomEventManagerにアクセスして
    // バフ・デバフ・イベント履歴を取得する必要がある
    // 現在はプレースホルダーデータを返す
    return {
      activeBuffs: [],
      activeDebuffs: [],
      eventHistory: [],
      eventStats: {
        totalEvents: 0,
        goodEvents: 0,
        badEvents: 0,
        avoidanceSuccessRate: 0,
      },
    };
  }

  /**
   * ゲーム状態をセーブ用に変換する
   * @param battleCommands - 戦闘コマンド
   * @returns セーブ用ゲーム状態
   */
  convertGameState(battleCommands: BattleCommands): SavedGameState {
    const isInBattle = battleCommands.isInBattle();
    const currentChallenge = battleCommands.getCurrentChallenge();
    const battleInfo = battleCommands.getBattleInfo();

    return {
      currentScreen: isInBattle ? 'battle' : 'game',
      currentPath: '/', // 実際の実装では現在のパスを取得
      isInBattle,
      battleData:
        isInBattle && battleInfo
          ? {
              enemyName: battleInfo.enemyName,
              enemyHealth: battleInfo.enemyHealth,
              enemyMaxHealth: battleInfo.enemyMaxHealth,
              currentChallenge: currentChallenge
                ? {
                    word: currentChallenge.word,
                    timeLimit: currentChallenge.timeLimit,
                    difficulty: currentChallenge.difficulty,
                  }
                : undefined,
            }
          : undefined,
    };
  }

  // ユーティリティメソッド

  /**
   * セーブスロット番号が有効かどうかをチェックする
   * @param slot - スロット番号
   * @returns 有効かどうか
   */
  private isValidSlot(slot: number): boolean {
    return Number.isInteger(slot) && slot >= 1 && slot <= this.maxSlots;
  }

  /**
   * セーブファイルのパスを取得する
   * @param slot - スロット番号
   * @returns ファイルパス
   */
  private getSaveFilePath(slot: number): string {
    return path.join(this.savesDirectory, `save-${slot}.json`);
  }

  /**
   * プレイ時間を計算する
   * @param player - プレイヤーオブジェクト
   * @returns プレイ時間（秒）
   */
  private calculatePlayTime(player: Player): number {
    // 実際の実装では、ゲーム開始時からの経過時間を計算する
    // 現在はプレイヤーレベルに基づく概算値を返す
    return player.getStats().level * 300; // レベル×5分
  }

  /**
   * バージョン互換性をチェックする
   * @param saveVersion - セーブファイルのバージョン
   * @returns 互換性があるかどうか
   */
  private isCompatibleVersion(saveVersion: string): boolean {
    const currentMajor = parseInt(this.currentVersion.split('.')[0], 10);
    const saveMajor = parseInt(saveVersion.split('.')[0], 10);

    // メジャーバージョンが同じなら互換性あり
    return currentMajor === saveMajor;
  }

  /**
   * セーブデータの整合性をチェックする
   * @param saveData - セーブデータ
   * @returns 整合性があるかどうか
   */
  private validateSaveData(saveData: SaveData): boolean {
    try {
      // 必須フィールドの存在確認
      return !!(
        saveData.version &&
        saveData.timestamp &&
        saveData.player &&
        saveData.player.name &&
        saveData.player.stats &&
        saveData.world &&
        saveData.world.name &&
        saveData.gameState &&
        saveData.metadata
      );
    } catch {
      return false;
    }
  }
}
