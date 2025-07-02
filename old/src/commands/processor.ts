import chalk from 'chalk';
import type { Game } from '../core/game';
import { SaveCommands, type GameContext } from './saveCommands';
import { NavigationCommands } from './navigation';
import { FileInvestigationCommands } from './fileInvestigation';
import { Map } from '../world/map';
import { World } from '../world/world';
import { BattleCommands } from '../battle/battleCommands';
import { InteractionCommands } from './interaction';

/**
 * コマンドプロセッサークラス - ユーザー入力コマンドを解析・実行する
 */
export class CommandProcessor {
  private game: Game;
  private saveCommands: SaveCommands;
  private navigationCommands: NavigationCommands;
  private fileInvestigationCommands: FileInvestigationCommands;

  /**
   * CommandProcessorインスタンスを初期化する
   * @param game - ゲームインスタンス
   */
  constructor(game: Game) {
    this.game = game;
    this.saveCommands = new SaveCommands(game.getSaveManager());
    this.navigationCommands = new NavigationCommands(game.getMap());
    this.fileInvestigationCommands = new FileInvestigationCommands(
      game.getMap(),
      game.getElementManager()
    );
  }

  /**
   * 入力されたコマンドを処理する
   * @param command - 実行するコマンド文字列
   */
  async process(command: string): Promise<void> {
    if (!command) return;

    // コマンドを分割してからメインコマンドのみ小文字化（引数の大文字小文字は保持）
    const [mainCommand, ...args] = command.split(' ');
    await this.executeCommand(mainCommand.toLowerCase(), args, command);
  }

  /**
   * コマンドを実行する
   * @param mainCommand - メインコマンド
   * @param args - コマンド引数配列
   * @param originalCommand - 元のコマンド文字列
   */
  private async executeCommand(
    mainCommand: string,
    args: string[],
    originalCommand: string
  ): Promise<void> {
    const commands: Record<string, () => void | Promise<void>> = {
      help: () => this.showHelp(),
      status: () => this.showStatus(),
      inventory: () => this.showInventory(),
      equipment: () => this.showEquipment(),
      equip: () => this.equipWord(args),
      unequip: () => this.unequipWord(args),
      validate: () => this.validateEquipment(),
      start: () => this.startGame(),
      world: () => this.showWorldInfo(),
      newworld: () => this.startNewWorld(args),
      cd: () => this.changeDirectory(args),
      ls: () => this.listDirectory(args),
      pwd: () => this.showCurrentPath(),
      file: () => this.investigateFile(args),
      cat: () => this.readFile(args),
      head: () => this.previewFile(args),
      interact: () => this.interactWithElement(args),
      battle: () => this.startBattle(args),
      attack: () => this.performAttack(args),
      flee: () => this.fleeBattle(),
      avoid: () => this.avoidEvent(args),
      skip: () => this.skipEvent(),
      events: () => this.showEventStats(),
      save: () => this.saveGame(args),
      load: () => this.loadGame(args),
      saves: () => this.listSaves(),
      deletesave: () => this.deleteSave(args),
      autosave: () => this.toggleAutoSave(args),
      quit: () => this.game.quit(),
      exit: () => this.game.quit(),
    };

    const commandHandler = commands[mainCommand];
    if (commandHandler) {
      await commandHandler();
    } else {
      this.showUnknownCommand(originalCommand);
    }
  }

  private showUnknownCommand(command: string): void {
    console.log(chalk.red(`Unknown command: ${command}`));
    console.log(chalk.gray('Type "help" for available commands.'));
  }

  private showHelp(): void {
    console.log(chalk.yellow('\n📚 Available Commands:'));
    console.log(chalk.gray('─'.repeat(40)));

    console.log(chalk.cyan('🎮 Game Commands:'));
    console.log('  start              - Begin adventure');
    console.log('  status             - Show player stats');
    console.log('  world              - Show world information');
    console.log('  newworld [level]   - Start new world');
    console.log('  quit / exit        - Exit game');

    console.log(chalk.cyan('\n🗺️  Navigation Commands:'));
    console.log('  cd <path>          - Change directory');
    console.log('  ls [options]       - List directory contents');
    console.log('  pwd                - Show current path');

    console.log(chalk.cyan('\n🔍 File Investigation Commands:'));
    console.log('  file <filename>    - Investigate file type and hints');
    console.log('  cat <filename>     - Read file and trigger elements');
    console.log('  head <filename>    - Preview file contents');
    console.log('  interact <filename> - Interact with map elements');

    console.log(chalk.cyan('\n⚔️  Equipment Commands:'));
    console.log('  inventory          - Show available words');
    console.log('  equipment          - Show equipped words');
    console.log('  equip <slot> <word> - Equip word to slot (1-5)');
    console.log('  unequip <slot>     - Remove word from slot');
    console.log('  validate           - Check sentence grammar');

    console.log(chalk.cyan('\n⚡ Battle Commands:'));
    console.log('  battle <filename>  - Start battle with enemy');
    console.log('  attack <word>      - Perform typing attack');
    console.log('  flee               - Escape from battle');

    console.log(chalk.cyan('\n🎲 Event Commands:'));
    console.log('  avoid <word> <time> - Avoid bad event with typing');
    console.log('  skip               - Skip event (accept consequences)');
    console.log('  events             - Show event statistics');

    console.log(chalk.cyan('\n💾 Save Commands:'));
    console.log('  save <slot> [desc] - Save game to slot (1-9)');
    console.log('  load <slot>        - Load game from slot (1-10)');
    console.log('  saves              - List all save files');
    console.log('  deletesave <slot>  - Delete save file');
    console.log('  autosave [on/off]  - Toggle auto-save');

    console.log(chalk.gray('\n💡 Example: equip 1 the'));
    console.log(chalk.gray('         cd src/components'));
    console.log(chalk.gray('         ls -la'));
    console.log(chalk.gray('         file app.js'));
    console.log(chalk.gray('         cat app.js'));
    console.log(chalk.gray('         interact app.js'));
    console.log(chalk.gray('         save 1 "Before boss"'));
    console.log(chalk.gray('         load 1\n'));
  }

  private showStatus(): void {
    const player = this.game.getPlayer();
    const stats = player.getStats();
    const totalStats = player.getTotalStats();

    console.log(chalk.yellow(`\n⚔️  ${player.getName()} - Level ${stats.level}`));
    console.log(chalk.gray('─'.repeat(40)));

    console.log(chalk.green(`💚 Health: ${stats.currentHealth}/${stats.maxHealth}`));
    console.log(chalk.blue(`💙 Mana: ${stats.currentMana}/${stats.maxMana}`));
    console.log(chalk.magenta(`⭐ Experience: ${stats.experience}/${stats.experienceToNext}`));

    console.log(chalk.cyan('\n📊 Combat Stats:'));
    console.log(
      `  Attack:   ${stats.baseAttack} + ${stats.equipmentAttack} = ${totalStats.attack}`
    );
    console.log(
      `  Defense:  ${stats.baseDefense} + ${stats.equipmentDefense} = ${totalStats.defense}`
    );
    console.log(`  Speed:    ${stats.baseSpeed} + ${stats.equipmentSpeed} = ${totalStats.speed}`);
    console.log(
      `  Accuracy: ${stats.baseAccuracy} + ${stats.equipmentAccuracy} = ${totalStats.accuracy}`
    );
    console.log(
      `  Critical: ${stats.baseCritical} + ${stats.equipmentCritical} = ${totalStats.critical}\n`
    );
  }

  private showWorldInfo(): void {
    const world = this.game.getWorld();
    const map = this.game.getMap();
    const player = this.game.getPlayer();

    console.log(chalk.yellow(`\n🌍 ${world.getName()} - Level ${world.getLevel()}`));
    console.log(chalk.gray('─'.repeat(40)));

    console.log(chalk.cyan(`📍 Current Location: ${map.getCurrentPath()}`));

    // ワールド統計
    const allLocations = map.getAllLocations();
    const exploredLocations = allLocations.filter(loc => loc.isExplored());
    const maxDepth = map.getMaxDepth();

    console.log(
      chalk.green(`🗺️  Exploration: ${exploredLocations.length}/${allLocations.length} locations`)
    );
    console.log(chalk.blue(`📊 World Depth: ${maxDepth} levels`));

    // ボス状態
    if (world.isCleared()) {
      console.log(chalk.green('👑 Boss Status: DEFEATED ✅'));
      console.log(
        chalk.yellow('🎉 World Cleared! You can start a new world or continue exploring.')
      );
    } else {
      console.log(chalk.red('👹 Boss Status: ALIVE'));
      console.log(chalk.gray('   Find and defeat the boss to clear this world!'));
    }

    // プレイヤーの鍵状態
    if (player.hasKey()) {
      console.log(chalk.magenta('🗝️  You have a key - find the boss chamber!'));
    } else {
      console.log(chalk.gray('🗝️  No key - explore and battle to find one'));
    }

    console.log();
  }

  private showInventory(): void {
    const player = this.game.getPlayer();
    const inventory = player.getInventory();

    console.log(chalk.yellow('\n🎒 Word Inventory:'));
    console.log(chalk.gray('─'.repeat(40)));

    if (inventory.length === 0) {
      console.log(chalk.gray('  (empty)'));
    } else {
      inventory.forEach((word, index) => {
        console.log(`  ${index + 1}. ${chalk.green(word)}`);
      });
    }
    console.log();
  }

  private showEquipment(): void {
    const player = this.game.getPlayer();
    const equipment = player.getEquipment();

    console.log(chalk.yellow('\n⚔️  Equipment Slots:'));
    console.log(chalk.gray('─'.repeat(40)));

    equipment.forEach(slot => {
      const wordDisplay = slot.word ? chalk.green(slot.word) : chalk.gray('(empty)');
      const typeDisplay = slot.wordType ? chalk.gray(`[${slot.wordType}]`) : '';
      console.log(`  Slot ${slot.slotNumber}: ${wordDisplay} ${typeDisplay}`);
    });

    console.log();
    this.validateEquipment();
  }

  private equipWord(args: string[]): void {
    if (args.length !== 2) {
      console.log(chalk.red('Usage: equip <slot> <word>'));
      console.log(chalk.gray('Example: equip 1 the'));
      return;
    }

    const slotNumber = parseInt(args[0]);
    const word = args[1];

    if (isNaN(slotNumber) || slotNumber < 1 || slotNumber > 5) {
      console.log(chalk.red('Slot number must be 1-5'));
      return;
    }

    const player = this.game.getPlayer();
    const success = player.equipWord(slotNumber, word);

    if (success) {
      console.log(chalk.green(`✅ Equipped "${word}" to slot ${slotNumber}`));
      this.validateEquipment();
    } else {
      console.log(chalk.red(`❌ Cannot equip "${word}" - check if word is in inventory`));
    }
  }

  private unequipWord(args: string[]): void {
    if (args.length !== 1) {
      console.log(chalk.red('Usage: unequip <slot>'));
      console.log(chalk.gray('Example: unequip 1'));
      return;
    }

    const slotNumber = parseInt(args[0]);

    if (isNaN(slotNumber) || slotNumber < 1 || slotNumber > 5) {
      console.log(chalk.red('Slot number must be 1-5'));
      return;
    }

    const player = this.game.getPlayer();
    const success = player.unequipWord(slotNumber);

    if (success) {
      console.log(chalk.green(`✅ Unequipped word from slot ${slotNumber}`));
    } else {
      console.log(chalk.red(`❌ No word equipped in slot ${slotNumber}`));
    }
  }

  private validateEquipment(): void {
    const player = this.game.getPlayer();
    const equipment = player.getEquipment();

    const equippedWords = equipment.filter(slot => slot.word !== null).map(slot => slot.word);

    if (equippedWords.length === 0) {
      console.log(chalk.gray('📝 No words equipped'));
      return;
    }

    const sentence = equippedWords.join(' ');
    const isValid = this.checkGrammar(equipment);

    console.log(chalk.yellow('📝 Current Sentence:'));
    console.log(`   "${sentence}"`);

    if (isValid) {
      const totalStats = player.getTotalStats();
      console.log(chalk.green('✅ Valid grammar! Combat ready.'));
      console.log(
        chalk.cyan(
          `⚡ Total Combat Power: ${totalStats.attack + totalStats.speed + totalStats.critical}`
        )
      );
    } else {
      console.log(chalk.red('❌ Invalid grammar - reduced combat effectiveness'));
      console.log(chalk.gray('   Tip: Try arranging words in proper English sentence order'));
    }
    console.log();
  }

  private checkGrammar(
    equipment: Array<{ word: string | null; wordType: string | null }>
  ): boolean {
    const equippedSlots = equipment.filter(slot => slot.word !== null);

    if (equippedSlots.length === 0) return false;
    if (equippedSlots.length === 1) return true; // Single word is always valid

    // Simple grammar rules (can be expanded)
    const wordTypes = equippedSlots.map(slot => slot.wordType);

    // Basic patterns: Article + (Adjective) + Noun + Verb
    // For now, just check if we have at least one noun and one verb for multi-word sentences
    if (equippedSlots.length >= 2) {
      const hasNoun = wordTypes.includes('noun');
      const hasVerb = wordTypes.includes('verb');
      return hasNoun || hasVerb; // At least one content word
    }

    return true;
  }

  private startGame(): void {
    console.log(chalk.green('🎮 Starting TypEngQuest Adventure!'));
    console.log(chalk.gray('─'.repeat(50)));

    const player = this.game.getPlayer();
    const world = this.game.getWorld();
    const map = this.game.getMap();

    // ゲーム状態を開始モードに設定
    this.game.setScreen('game');

    // 現在のゲーム状況を表示
    console.log(chalk.yellow(`🌟 Welcome to ${world.getName()} (Level ${world.getLevel()})`));
    console.log(chalk.cyan(`📍 Current location: ${map.getCurrentPath()}`));
    console.log(chalk.green(`⚔️  ${player.getName()} - Level ${player.getStats().level}`));
    console.log(
      chalk.blue(`💚 HP: ${player.getStats().currentHealth}/${player.getStats().maxHealth}`)
    );
    console.log(
      chalk.magenta(`💙 MP: ${player.getStats().currentMana}/${player.getStats().maxMana}`)
    );

    console.log(chalk.yellow('\n🎯 Objective:'));
    console.log('  • Explore the file system using cd, ls, pwd');
    console.log('  • Investigate files with file, cat, head commands');
    console.log('  • Interact with discovered elements using interact');
    console.log('  • Battle monsters and collect treasures');
    console.log('  • Find and defeat the boss to clear the world');

    console.log(chalk.gray('\n💡 Start by typing "ls" to see what\'s around you'));
    console.log(chalk.gray('   Or use "help" to see all available commands\n'));
  }

  private startNewWorld(args: string[]): void {
    const currentWorld = this.game.getWorld();

    // 現在のワールドがクリアされているか確認
    if (!currentWorld.isCleared()) {
      console.log(chalk.red('❌ Cannot start new world - current world boss not defeated!'));
      console.log(chalk.gray('   Complete the current world first.'));
      return;
    }

    // 新しいワールドレベルを決定
    let newLevel = currentWorld.getLevel() + 1;
    if (args.length > 0) {
      const inputLevel = parseInt(args[0]);
      if (!isNaN(inputLevel) && inputLevel >= 1) {
        newLevel = inputLevel;
      }
    }

    // プレイヤーにレベル調整の選択肢を提供
    console.log(chalk.yellow(`🌟 Starting new world - Level ${newLevel}`));
    console.log(chalk.cyan('Choose your approach:'));
    console.log('  • "maintain" - Keep current level');
    console.log('  • "adjust" - Adjust level to world difficulty');
    console.log('  • "decline" - Start at lower level for extra challenge');
    console.log(chalk.gray('Type your choice after this command...'));

    // 新しいワールドとマップを作成
    const newMap = new Map();
    const newWorldName = `Development World ${newLevel}`;
    const newWorld = new World(newWorldName, newLevel, newMap);

    // プレイヤーを新しいワールド用にリセット
    const player = this.game.getPlayer();
    player.resetForNewWorld();

    // ゲーム状態を更新
    const elementManager = this.game.getElementManager();
    const battleCommands = new BattleCommands(player, newMap, newWorld, elementManager);
    const interactionCommands = new InteractionCommands(newMap, elementManager, player, newWorld);

    this.game.setState({
      world: newWorld,
      map: newMap,
      battleCommands,
      interactionCommands,
    });

    // 新しいコマンドインスタンスを作成
    this.navigationCommands = new NavigationCommands(newMap);
    this.fileInvestigationCommands = new FileInvestigationCommands(newMap, elementManager);

    console.log(chalk.green(`✅ New world created: ${newWorldName}`));
    console.log(chalk.cyan(`📍 Starting location: ${newMap.getCurrentPath()}`));
    console.log(chalk.yellow('🎯 New adventure begins! Good luck, adventurer!'));
    console.log(chalk.gray('Type "world" to see world information.\n'));
  }

  // Battle Commands
  private startBattle(args: string[]): void {
    if (args.length === 0) {
      console.log(chalk.red('Usage: battle <filename>'));
      console.log(chalk.gray('Example: battle app.js'));
      return;
    }

    const filename = args[0];
    const battleCommands = this.game.getBattleCommands();
    const result = battleCommands.startBattle(filename);

    if (result.success) {
      console.log(chalk.green(result.output));
      this.game.setScreen('battle');
    } else {
      console.log(chalk.red(result.output));
    }
  }

  private performAttack(args: string[]): void {
    const battleCommands = this.game.getBattleCommands();

    if (!battleCommands.isInBattle()) {
      console.log(chalk.red('Not in battle. Use "battle <filename>" to start a battle.'));
      return;
    }

    if (args.length === 0) {
      const challenge = battleCommands.getCurrentChallenge();
      if (challenge) {
        console.log(chalk.yellow(`Current challenge: "${challenge.word}"`));
        console.log(chalk.gray(`Time limit: ${challenge.timeLimit}s`));
        console.log(chalk.gray('Usage: attack <typed_word> [time_used]'));
      }
      return;
    }

    const typedWord = args.join(' ');
    const timeUsed = args.length > 1 ? parseFloat(args[args.length - 1]) : 2.0;

    const result = battleCommands.performTypingAttack(typedWord, timeUsed);

    if (result.success) {
      console.log(chalk.cyan(result.output));

      if (!battleCommands.isInBattle()) {
        this.game.setScreen('game');
      }
    } else {
      console.log(chalk.red(result.output));
    }
  }

  private fleeBattle(): void {
    const battleCommands = this.game.getBattleCommands();
    const result = battleCommands.fleeBattle();

    if (result.success) {
      console.log(chalk.yellow(result.output));
      this.game.setScreen('game');
    } else {
      console.log(chalk.red(result.output));
    }
  }

  // Random Event Commands
  private avoidEvent(args: string[]): void {
    if (args.length < 1) {
      console.log(chalk.red('Usage: avoid <word> [time_used]'));
      console.log(chalk.gray('Example: avoid function 2.5'));
      return;
    }

    const word = args[0];
    const timeUsed = args.length > 1 ? parseFloat(args[1]) : 3.0;

    // InteractionCommandsからRandomEventManagerにアクセス
    const gameState = this.game.getState();
    if (!gameState.interactionCommands) {
      console.log(chalk.red('Event system not available.'));
      return;
    }

    const result = gameState.interactionCommands.avoidEvent(word, timeUsed);

    if (result.success) {
      console.log(chalk.cyan(result.output));
    } else {
      console.log(chalk.red(result.output));
    }
  }

  private skipEvent(): void {
    // InteractionCommandsからRandomEventManagerにアクセス
    const gameState = this.game.getState();
    if (!gameState.interactionCommands) {
      console.log(chalk.red('Event system not available.'));
      return;
    }

    const result = gameState.interactionCommands.skipEvent();

    if (result.success) {
      console.log(chalk.yellow(result.output));
    } else {
      console.log(chalk.red(result.output));
    }
  }

  private showEventStats(): void {
    // InteractionCommandsからRandomEventManagerにアクセス
    const gameState = this.game.getState();
    if (!gameState.interactionCommands) {
      console.log(chalk.red('Event system not available.'));
      return;
    }

    const eventManager = gameState.interactionCommands.getRandomEventManager();
    const stats = eventManager.getEventStats();
    const history = eventManager.getEventHistory();
    const activeBuffs = eventManager.getActiveBuffs();
    const activeDebuffs = eventManager.getActiveDebuffs();

    console.log(chalk.yellow('\n📊 Event Statistics:'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(`Total Events: ${stats.totalEvents}`);
    console.log(`Good Events: ${stats.goodEvents}`);
    console.log(`Bad Events: ${stats.badEvents}`);
    console.log(`Avoidance Success Rate: ${Math.round(stats.avoidanceSuccessRate * 100)}%`);

    if (activeBuffs.length > 0) {
      console.log(chalk.green('\n✨ Active Buffs:'));
      activeBuffs.forEach(buff => {
        console.log(`  ${buff.statType}: +${buff.value} (${buff.duration} turns left)`);
      });
    }

    if (activeDebuffs.length > 0) {
      console.log(chalk.red('\n💔 Active Debuffs:'));
      activeDebuffs.forEach(debuff => {
        console.log(`  ${debuff.statType}: ${debuff.value} (${debuff.duration} turns left)`);
      });
    }

    if (history.length > 0) {
      console.log(chalk.cyan('\n📝 Recent Events:'));
      const recent = history.slice(-5).reverse();
      recent.forEach(event => {
        const typeColor = event.type === 'good' ? chalk.green : chalk.red;
        const timestamp = event.timestamp.toLocaleTimeString();
        console.log(`  ${timestamp} - ${typeColor(event.type.toUpperCase())} event`);
      });
    }

    console.log('');
  }

  // Save Commands
  private async saveGame(args: string[]): Promise<void> {
    const gameState = this.game.getState();
    const gameContext: GameContext = {
      player: gameState.player,
      world: gameState.world,
      map: gameState.map,
      elementManager: gameState.elementManager,
      battleCommands: gameState.battleCommands,
    };

    const result = await this.saveCommands.saveGame(args, gameContext);
    console.log(result.output);
  }

  private async loadGame(args: string[]): Promise<void> {
    const result = await this.saveCommands.loadGame(args);
    console.log(result.output);

    // ロードが成功した場合、ゲーム状態を復元する
    if (result.success && result.loadResult?.saveData) {
      console.log(chalk.cyan('\n🔄 Restoring game state...'));

      const restoreSuccess = await this.game.restoreGameState(result.loadResult.saveData);

      if (restoreSuccess) {
        console.log(chalk.green('🎮 Ready to continue your adventure!'));
        console.log(chalk.gray('Type "status" to check your current state.'));
      } else {
        console.log(chalk.red('⚠️  Game state restoration failed.'));
        console.log(chalk.gray('Some data may not have been restored correctly.'));
      }
    }
  }

  private async listSaves(): Promise<void> {
    const result = await this.saveCommands.listSaves();
    console.log(result.output);
  }

  private async deleteSave(args: string[]): Promise<void> {
    const result = await this.saveCommands.deleteSave(args);
    console.log(result.output);
  }

  private toggleAutoSave(args: string[]): void {
    if (args.length === 0) {
      // 現在の状態を表示
      console.log(this.saveCommands.getAutoSaveStatus());
      return;
    }

    const setting = args[0].toLowerCase();
    if (setting === 'on' || setting === 'enable') {
      console.log(this.saveCommands.setAutoSaveEnabled(true));
    } else if (setting === 'off' || setting === 'disable') {
      console.log(this.saveCommands.setAutoSaveEnabled(false));
    } else {
      console.log(chalk.red('Usage: autosave [on/off]'));
      console.log(chalk.gray('Example: autosave on'));
    }
  }

  // Navigation Commands
  private changeDirectory(args: string[]): void {
    const path = args.length > 0 ? args[0] : undefined;
    const result = this.navigationCommands.cd(path);

    if (result.success) {
      if (result.message) {
        console.log(chalk.green(`📁 ${result.message}`));
      }
    } else {
      console.log(chalk.red(result.message));
    }
  }

  private listDirectory(args: string[]): void {
    const options = args.join(' ');
    const result = this.navigationCommands.ls(options);

    if (result.success) {
      if (result.message) {
        console.log(result.message);
      }
    } else {
      console.log(chalk.red(result.message));
    }
  }

  private showCurrentPath(): void {
    const result = this.navigationCommands.pwd();
    console.log(chalk.cyan(result.message));
  }

  // File Investigation Commands
  private investigateFile(args: string[]): void {
    if (args.length === 0) {
      console.log(chalk.red('Usage: file <filename>'));
      console.log(chalk.gray('Example: file app.js'));
      return;
    }

    const filename = args[0];
    const result = this.fileInvestigationCommands.file(filename);

    if (result.success) {
      console.log(result.output);
    } else {
      console.log(chalk.red(result.output));
    }
  }

  private readFile(args: string[]): void {
    if (args.length === 0) {
      console.log(chalk.red('Usage: cat <filename>'));
      console.log(chalk.gray('Example: cat app.js'));
      return;
    }

    const filename = args[0];
    const result = this.fileInvestigationCommands.cat(filename);

    if (result.success) {
      console.log(result.output);
    } else {
      console.log(chalk.red(result.output));
    }
  }

  private previewFile(args: string[]): void {
    if (args.length === 0) {
      console.log(chalk.red('Usage: head <filename>'));
      console.log(chalk.gray('Example: head app.js'));
      return;
    }

    const filename = args[0];
    const result = this.fileInvestigationCommands.head(filename);

    if (result.success) {
      console.log(result.output);
    } else {
      console.log(chalk.red(result.output));
    }
  }

  // Element Interaction Commands
  private interactWithElement(args: string[]): void {
    if (args.length === 0) {
      console.log(chalk.red('Usage: interact <filename>'));
      console.log(chalk.gray('Example: interact app.js'));
      return;
    }

    const filename = args[0];
    const interactionCommands = this.game.getInteractionCommands();
    const result = interactionCommands.interact(filename);

    if (result.success) {
      console.log(result.output);
    } else {
      console.log(chalk.red(result.output));
    }
  }
}
