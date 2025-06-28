import chalk from 'chalk';
import type { Game } from '../core/game';

/**
 * コマンドプロセッサークラス - ユーザー入力コマンドを解析・実行する
 */
export class CommandProcessor {
  private game: Game;

  /**
   * CommandProcessorインスタンスを初期化する
   * @param game - ゲームインスタンス
   */
  constructor(game: Game) {
    this.game = game;
  }

  /**
   * 入力されたコマンドを処理する
   * @param command - 実行するコマンド文字列
   */
  async process(command: string): Promise<void> {
    if (!command) return;

    const [mainCommand, ...args] = command.toLowerCase().split(' ');
    this.executeCommand(mainCommand, args, command);
  }

  /**
   * コマンドを実行する
   * @param mainCommand - メインコマンド
   * @param args - コマンド引数配列
   * @param originalCommand - 元のコマンド文字列
   */
  private executeCommand(mainCommand: string, args: string[], originalCommand: string): void {
    const commands: Record<string, () => void> = {
      help: () => this.showHelp(),
      status: () => this.showStatus(),
      inventory: () => this.showInventory(),
      equipment: () => this.showEquipment(),
      equip: () => this.equipWord(args),
      unequip: () => this.unequipWord(args),
      validate: () => this.validateEquipment(),
      start: () => this.startGame(),
      battle: () => this.startBattle(args),
      attack: () => this.performAttack(args),
      flee: () => this.fleeBattle(),
      quit: () => this.game.quit(),
      exit: () => this.game.quit(),
    };

    const commandHandler = commands[mainCommand];
    if (commandHandler) {
      commandHandler();
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
    console.log('  quit / exit        - Exit game');

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

    console.log(chalk.gray('\n💡 Example: equip 1 the'));
    console.log(chalk.gray('         battle app.js'));
    console.log(chalk.gray('         attack function\n'));
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
    console.log(chalk.green('🎮 Starting adventure...'));
    console.log(chalk.gray('(Game mechanics coming soon!)'));
    // TODO: Implement actual game start logic
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
}
