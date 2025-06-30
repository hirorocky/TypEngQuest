import chalk from 'chalk';
import { SaveManager } from '../core/saveManager';
import { SaveResult, LoadResult, SaveFileInfo } from '../core/saveData';
import { Player } from '../core/player';
import { World } from '../world/world';
import { Map } from '../world/map';
import { ElementManager } from '../world/elements';
import { BattleCommands } from '../battle/battleCommands';

/**
 * セーブ・ロードコマンドの実行結果
 */
export interface SaveCommandResult {
  success: boolean;
  output: string;
}

/**
 * セーブ・ロードコマンドクラス
 * save/load/saves/deletesaveコマンドの実装
 */
export class SaveCommands {
  private saveManager: SaveManager;

  constructor(saveManager: SaveManager) {
    this.saveManager = saveManager;
  }

  /**
   * saveコマンド - ゲームをセーブする
   * @param args - コマンド引数 [slot, description?]
   * @param player - プレイヤーオブジェクト
   * @param world - ワールドオブジェクト
   * @param map - マップオブジェクト
   * @param elementManager - 要素マネージャー
   * @param battleCommands - 戦闘コマンド
   * @returns コマンド実行結果
   */
  async saveGame(
    args: string[],
    player: Player,
    world: World,
    map: Map,
    elementManager: ElementManager,
    battleCommands: BattleCommands
  ): Promise<SaveCommandResult> {
    if (args.length === 0) {
      return {
        success: false,
        output: `${chalk.red('Usage:')} save <slot> [description]
${chalk.gray('Example:')} save 1
${chalk.gray('        ')} save 1 "Before boss battle"
${chalk.gray('Slots 1-9:')} Manual saves
${chalk.gray('Slot 10:')} Auto-save (reserved)`,
      };
    }

    const slotArg = args[0];
    const slot = parseInt(slotArg, 10);

    if (isNaN(slot) || slot < 1 || slot > 9) {
      return {
        success: false,
        output: `${chalk.red('Error:')} Invalid slot number "${slotArg}". Must be 1-9.`,
      };
    }

    const description = args.slice(1).join(' ') || undefined;

    try {
      const result = await this.saveManager.saveGame(
        slot,
        player,
        world,
        map,
        elementManager,
        battleCommands,
        description
      );

      if (result.success) {
        return {
          success: true,
          output: `${chalk.green('✅ Game saved successfully!')}
${chalk.gray('Slot:')} ${slot}
${chalk.gray('Player:')} ${player.getName()} (Level ${player.getStats().level})
${chalk.gray('World:')} ${world.getName()} (Level ${world.getLevel()})${description ? `\n${chalk.gray('Description:')} ${description}` : ''}`,
        };
      } else {
        return {
          success: false,
          output: `${chalk.red('❌ Save failed:')} ${result.message}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        output: `${chalk.red('❌ Save error:')} ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * loadコマンド - ゲームをロードする
   * @param args - コマンド引数 [slot]
   * @returns コマンド実行結果とロードデータ
   */
  async loadGame(args: string[]): Promise<SaveCommandResult & { loadResult?: LoadResult }> {
    if (args.length === 0) {
      return {
        success: false,
        output: `${chalk.red('Usage:')} load <slot>
${chalk.gray('Example:')} load 1
${chalk.gray('Slots:')} 1-10 (10 is auto-save)`,
      };
    }

    const slotArg = args[0];
    const slot = parseInt(slotArg, 10);

    if (isNaN(slot) || slot < 1 || slot > 10) {
      return {
        success: false,
        output: `${chalk.red('Error:')} Invalid slot number "${slotArg}". Must be 1-10.`,
      };
    }

    try {
      const result = await this.saveManager.loadGame(slot);

      if (result.success && result.saveData) {
        const saveData = result.saveData;
        const playTimeHours = Math.floor(saveData.playTime / 3600);
        const playTimeMinutes = Math.floor((saveData.playTime % 3600) / 60);

        return {
          success: true,
          output: `${chalk.green('✅ Game loaded successfully!')}
${chalk.gray('Slot:')} ${slot}${slot === 10 ? ' (Auto-save)' : ''}
${chalk.gray('Player:')} ${saveData.player.name} (Level ${saveData.player.stats.level})
${chalk.gray('World:')} ${saveData.world.name} (Level ${saveData.world.level})
${chalk.gray('Play Time:')} ${playTimeHours}h ${playTimeMinutes}m
${chalk.gray('Saved:')} ${new Date(saveData.timestamp).toLocaleString()}${saveData.metadata.saveDescription ? `\n${chalk.gray('Description:')} ${saveData.metadata.saveDescription}` : ''}`,
          loadResult: result,
        };
      } else {
        return {
          success: false,
          output: `${chalk.red('❌ Load failed:')} ${result.message}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        output: `${chalk.red('❌ Load error:')} ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * savesコマンド - セーブファイル一覧を表示する
   * @returns コマンド実行結果
   */
  async listSaves(): Promise<SaveCommandResult> {
    try {
      const saveFiles = await this.saveManager.listSaveFiles();

      let output = `${chalk.yellow('💾 Save Files:')}\n`;
      output += chalk.gray('─'.repeat(60)) + '\n';

      const existingSaves = saveFiles.filter(save => save.exists);
      const emptySaves = saveFiles.filter(save => !save.exists);

      if (existingSaves.length === 0) {
        output += chalk.gray('  No save files found.\n');
      } else {
        // 既存のセーブファイルを表示
        for (const save of existingSaves) {
          const slotDisplay = save.slot === 10 ? '10 (Auto)' : save.slot.toString();
          const playTimeHours = Math.floor(save.playTime / 3600);
          const playTimeMinutes = Math.floor((save.playTime % 3600) / 60);
          const dateStr = new Date(save.timestamp).toLocaleString();

          output += `${chalk.cyan(`Slot ${slotDisplay}:`)} ${save.playerName} (Lv.${save.playerLevel})\n`;
          output += `  ${chalk.gray('World:')} ${save.worldName} (Lv.${save.worldLevel})\n`;
          output += `  ${chalk.gray('Time:')} ${playTimeHours}h ${playTimeMinutes}m  ${chalk.gray('Saved:')} ${dateStr}\n`;

          if (save.description) {
            output += `  ${chalk.gray('Note:')} ${save.description}\n`;
          }
          output += '\n';
        }

        // 空のスロットを表示
        if (emptySaves.length > 0) {
          output += chalk.gray('Empty slots: ');
          const emptySlotNumbers = emptySaves
            .filter(save => save.slot !== 10) // 自動セーブスロットは除外
            .map(save => save.slot.toString());
          output += chalk.gray(emptySlotNumbers.join(', ')) + '\n';
        }
      }

      output += chalk.gray('\nUse "save <slot>" to save, "load <slot>" to load.');

      return {
        success: true,
        output,
      };
    } catch (error) {
      return {
        success: false,
        output: `${chalk.red('❌ Error listing saves:')} ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * deletesaveコマンド - セーブファイルを削除する
   * @param args - コマンド引数 [slot]
   * @returns コマンド実行結果
   */
  async deleteSave(args: string[]): Promise<SaveCommandResult> {
    if (args.length === 0) {
      return {
        success: false,
        output: `${chalk.red('Usage:')} deletesave <slot>
${chalk.gray('Example:')} deletesave 3
${chalk.gray('Warning:')} This action cannot be undone!`,
      };
    }

    const slotArg = args[0];
    const slot = parseInt(slotArg, 10);

    if (isNaN(slot) || slot < 1 || slot > 10) {
      return {
        success: false,
        output: `${chalk.red('Error:')} Invalid slot number "${slotArg}". Must be 1-10.`,
      };
    }

    if (slot === 10) {
      return {
        success: false,
        output: `${chalk.red('Error:')} Cannot delete auto-save slot (slot 10).`,
      };
    }

    try {
      const result = await this.saveManager.deleteSave(slot);

      if (result.success) {
        return {
          success: true,
          output: `${chalk.green('✅ Save file deleted successfully!')}
${chalk.gray('Slot:')} ${slot}`,
        };
      } else {
        return {
          success: false,
          output: `${chalk.red('❌ Delete failed:')} ${result.message}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        output: `${chalk.red('❌ Delete error:')} ${error instanceof Error ? error.message : 'Unknown error'}`,
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
   * @returns 自動セーブ結果
   */
  async performAutoSave(
    player: Player,
    world: World,
    map: Map,
    elementManager: ElementManager,
    battleCommands: BattleCommands
  ): Promise<SaveResult> {
    return this.saveManager.autoSave(player, world, map, elementManager, battleCommands);
  }

  /**
   * 自動セーブの有効/無効を設定する
   * @param enabled - 有効にするかどうか
   * @returns 設定結果メッセージ
   */
  setAutoSaveEnabled(enabled: boolean): string {
    this.saveManager.setAutoSaveEnabled(enabled);
    const status = enabled ? chalk.green('enabled') : chalk.red('disabled');
    return `Auto-save ${status}.`;
  }

  /**
   * 自動セーブの状態を取得する
   * @returns 自動セーブの状態メッセージ
   */
  getAutoSaveStatus(): string {
    const enabled = this.saveManager.isAutoSaveEnabled();
    const status = enabled ? chalk.green('enabled') : chalk.red('disabled');
    return `Auto-save is currently ${status}.`;
  }
}
