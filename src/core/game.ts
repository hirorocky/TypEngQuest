import chalk from 'chalk';
import { input } from '@inquirer/prompts';
import { Player } from './player';
import { CommandProcessor } from '../commands/processor';
import { Map } from '../world/map';
import { World } from '../world/world';
import { ElementManager } from '../world/elements';
import { BattleCommands } from '../battle/battleCommands';
import { InteractionCommands } from '../commands/interaction';
import { SaveManager } from './saveManager';
import { SaveData } from './saveData';
import { EnhancedCli } from '../cli/enhancedCli';

export interface GameState {
  isRunning: boolean;
  currentScreen: 'menu' | 'game' | 'battle' | 'equipment' | 'quit';
  player: Player;
  map: Map;
  world: World;
  elementManager: ElementManager;
  battleCommands: BattleCommands;
  interactionCommands: InteractionCommands;
  saveManager: SaveManager;
}

export class Game {
  private state: GameState;
  private commandProcessor: CommandProcessor;
  private enhancedCli?: EnhancedCli;

  constructor() {
    const player = new Player();
    const map = new Map();
    const world = new World('Development World', 1, map);
    const elementManager = new ElementManager();
    const battleCommands = new BattleCommands(player, map, world, elementManager);
    const interactionCommands = new InteractionCommands(map, elementManager, player, world);
    const saveManager = new SaveManager();

    this.state = {
      isRunning: false,
      currentScreen: 'menu',
      player,
      map,
      world,
      elementManager,
      battleCommands,
      interactionCommands,
      saveManager,
    };
    this.commandProcessor = new CommandProcessor(this);
  }

  async start(): Promise<void> {
    this.state.isRunning = true;

    console.log(chalk.green('Welcome to CodeQuest RPG!'));
    console.log(chalk.gray('Type "help" for available commands.\n'));

    // 拡張CLIモードを使用するかどうかを確認
    if (process.env.ENHANCED_CLI === 'true' || process.argv.includes('--enhanced')) {
      this.startEnhancedCli();
    } else {
      await this.mainLoop();
    }
  }

  private async mainLoop(): Promise<void> {
    while (this.state.isRunning) {
      try {
        const command = await input({
          message: chalk.cyan('> '),
        });

        await this.commandProcessor.process(command.trim());
      } catch (error) {
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  }

  // Game State Management
  getState(): GameState {
    return this.state;
  }

  getPlayer(): Player {
    return this.state.player;
  }

  getMap(): Map {
    return this.state.map;
  }

  getWorld(): World {
    return this.state.world;
  }

  getElementManager(): ElementManager {
    return this.state.elementManager;
  }

  getBattleCommands(): BattleCommands {
    return this.state.battleCommands;
  }

  getInteractionCommands(): InteractionCommands {
    return this.state.interactionCommands;
  }

  getSaveManager(): SaveManager {
    return this.state.saveManager;
  }

  getCommandProcessor(): CommandProcessor {
    return this.commandProcessor;
  }

  setState(newState: Partial<GameState>): void {
    this.state = { ...this.state, ...newState };
  }

  /**
   * 拡張CLIモードを開始する
   */
  private startEnhancedCli(): void {
    this.enhancedCli = new EnhancedCli(this);
    this.enhancedCli.start();
  }

  quit(): void {
    console.log(chalk.yellow('Thanks for playing CodeQuest RPG!'));
    console.log(chalk.gray('May your code be bug-free and your typing swift! 🚀\n'));
    this.state.isRunning = false;
  }

  // Screen Management
  setScreen(screen: GameState['currentScreen']): void {
    this.state.currentScreen = screen;
  }

  getCurrentScreen(): GameState['currentScreen'] {
    return this.state.currentScreen;
  }

  /**
   * セーブデータからゲーム状態を復元する
   * @param saveData - 復元するセーブデータ
   * @returns 復元が成功したかどうか
   */
  async restoreGameState(saveData: SaveData): Promise<boolean> {
    try {
      // プレイヤー状態の復元
      this.restorePlayerState(saveData.player);

      // ワールド状態の復元
      this.restoreWorldState(saveData.world);

      // マップ状態の復元
      this.restoreMapState(saveData.mapLocations);

      // ゲーム状態の復元
      this.restoreGameControlState(saveData.gameState);

      // イベントシステム状態の復元
      this.restoreEventSystemState(saveData.eventSystem);

      console.log(chalk.green('✅ Game state restored successfully!'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Failed to restore game state:'), error);
      return false;
    }
  }

  /**
   * プレイヤー状態を復元する
   * @param playerData - プレイヤーのセーブデータ
   */
  private restorePlayerState(playerData: SaveData['player']): void {
    const player = this.state.player;

    // レベルの調整
    const currentLevel = player.getStats().level;
    const targetLevel = playerData.stats.level;
    const levelDiff = targetLevel - currentLevel;

    if (levelDiff !== 0) {
      player.adjustLevel(levelDiff);
    }

    // HP/MPの復元
    const currentStats = player.getStats();
    const healthDiff = playerData.stats.currentHealth - currentStats.currentHealth;
    const manaDiff = playerData.stats.currentMana - currentStats.currentMana;

    if (healthDiff > 0) {
      player.heal(healthDiff);
    } else if (healthDiff < 0) {
      player.takeDamage(-healthDiff);
    }

    if (manaDiff > 0) {
      player.restoreMana(manaDiff);
    }

    // 装備の復元
    for (let slot = 1; slot <= 5; slot++) {
      player.unequipWord(slot);
    }

    playerData.equipment.forEach(equipmentSlot => {
      if (equipmentSlot.word) {
        player.equipWord(equipmentSlot.slotNumber, equipmentSlot.word);
      }
    });

    // インベントリの復元
    const currentInventory = player.getInventory();
    playerData.inventory.forEach(item => {
      if (!currentInventory.includes(item)) {
        player.addToInventory(item);
      }
    });

    // 鍵の状態復元
    const currentHasKey = player.hasKey();
    if (playerData.hasKey && !currentHasKey) {
      player.addKey();
    } else if (!playerData.hasKey && currentHasKey) {
      player.useKey();
    }
  }

  /**
   * ワールド状態を復元する
   * @param worldData - ワールドのセーブデータ
   */
  private restoreWorldState(worldData: SaveData['world']): void {
    const currentWorld = this.state.world;

    // ワールド名とレベルが異なる場合は新しいワールドを作成
    if (currentWorld.getName() !== worldData.name || currentWorld.getLevel() !== worldData.level) {
      const newWorld = new World(worldData.name, worldData.level, this.state.map);
      this.state.world = newWorld;

      // BattleCommandsとInteractionCommandsを新しいワールドで更新
      const player = this.state.player;
      const map = this.state.map;
      const elementManager = this.state.elementManager;

      this.state.battleCommands = new BattleCommands(player, map, newWorld, elementManager);
      this.state.interactionCommands = new InteractionCommands(
        map,
        elementManager,
        player,
        newWorld
      );
    }

    // ボス状態の復元
    if (worldData.bossDefeated) {
      this.state.world.defeatBoss();
    }
  }

  /**
   * マップ状態を復元する
   * @param mapLocations - マップロケーションのセーブデータ
   */
  private restoreMapState(mapLocations: SaveData['mapLocations']): void {
    const map = this.state.map;

    mapLocations.forEach(locationData => {
      const location = map.findLocation(locationData.path);
      if (location) {
        if (locationData.isExplored) {
          location.markExplored();
        }

        if (locationData.hasElement && locationData.elementData) {
          location.setElement(locationData.elementData.type as any, locationData.elementData.data);
        }
      }
    });
  }

  /**
   * ゲーム制御状態を復元する
   * @param gameStateData - ゲーム状態のセーブデータ
   */
  private restoreGameControlState(gameStateData: SaveData['gameState']): void {
    this.state.currentScreen = gameStateData.currentScreen;

    if (gameStateData.isInBattle && gameStateData.battleData) {
      console.log(chalk.yellow('⚠️  Battle state restoration is simplified.'));
    }
  }

  /**
   * イベントシステム状態を復元する
   * @param eventSystemData - イベントシステムのセーブデータ
   */
  private restoreEventSystemState(eventSystemData: SaveData['eventSystem']): void {
    console.log(`Restored ${eventSystemData.eventHistory.length} event history entries`);
    console.log(`Event stats: ${eventSystemData.eventStats.totalEvents} total events`);

    if (eventSystemData.activeBuffs.length > 0) {
      console.log(`${eventSystemData.activeBuffs.length} active buffs to restore`);
    }

    if (eventSystemData.activeDebuffs.length > 0) {
      console.log(`${eventSystemData.activeDebuffs.length} active debuffs to restore`);
    }
  }
}
