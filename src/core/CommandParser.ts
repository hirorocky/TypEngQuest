/**
 * コマンド解析器
 */

import { Command, CommandResult } from './types';

export class CommandParser {
  private commands: Map<string, Command> = new Map();
  private history: string[] = [];

  constructor() {
    this.registerGlobalCommands();
  }

  private registerGlobalCommands(): void {
    this.register({
      name: 'help',
      aliases: ['h', '?'],
      description: 'Show available commands',
      execute: async () => this.showHelp(),
    });

    this.register({
      name: 'clear',
      aliases: ['cls'],
      description: 'Clear the screen',
      execute: async () => {
        const { Display } = await import('../ui/Display');
        Display.clear();
        return { success: true };
      },
    });

    this.register({
      name: 'history',
      description: 'Show command history',
      execute: async () => this.showHistory(),
    });
  }

  register(command: Command): void {
    this.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach(alias => {
        this.commands.set(alias, command);
      });
    }
  }

  unregister(name: string): void {
    const command = this.commands.get(name);
    if (command) {
      this.commands.delete(name);
      if (command.aliases) {
        command.aliases.forEach(alias => {
          this.commands.delete(alias);
        });
      }
    }
  }

  async parse(input: string): Promise<CommandResult> {
    const trimmed = input.trim();
    if (!trimmed) {
      return { success: true };
    }

    // Add to history
    this.history.push(trimmed);
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }

    const parts = this.parseInput(trimmed);
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const command = this.commands.get(commandName);
    if (!command) {
      return {
        success: false,
        message: `Unknown command: ${commandName}. Type 'help' for available commands.`,
      };
    }

    try {
      return await command.execute(args);
    } catch (error) {
      return {
        success: false,
        message: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private parseInput(input: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const result = this.processCharacter(char, current, inQuotes, quoteChar);

      current = result.current;
      inQuotes = result.inQuotes;
      quoteChar = result.quoteChar;

      if (result.shouldPush) {
        parts.push(current);
        current = '';
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  }

  private processCharacter(
    char: string,
    current: string,
    inQuotes: boolean,
    quoteChar: string
  ): {
    current: string;
    inQuotes: boolean;
    quoteChar: string;
    shouldPush: boolean;
  } {
    if ((char === '"' || char === "'") && !inQuotes) {
      return { current, inQuotes: true, quoteChar: char, shouldPush: false };
    }

    if (char === quoteChar && inQuotes) {
      return { current, inQuotes: false, quoteChar: '', shouldPush: false };
    }

    if (char === ' ' && !inQuotes) {
      return { current, inQuotes, quoteChar, shouldPush: current !== '' };
    }

    return { current: current + char, inQuotes, quoteChar, shouldPush: false };
  }

  private async showHelp(): Promise<CommandResult> {
    const { Display } = await import('../ui/Display');
    const { bold, cyan } = await import('../ui/colors');

    Display.printHeader('Available Commands');

    const uniqueCommands = new Map<string, Command>();
    this.commands.forEach((command, name) => {
      if (name === command.name) {
        uniqueCommands.set(name, command);
      }
    });

    uniqueCommands.forEach(command => {
      const aliases = command.aliases ? ` (${command.aliases.join(', ')})` : '';
      console.log(`  ${bold(cyan(command.name))}${aliases} - ${command.description}`);
    });

    return { success: true };
  }

  private async showHistory(): Promise<CommandResult> {
    const { Display } = await import('../ui/Display');
    const { dim } = await import('../ui/colors');

    Display.printHeader('Command History');

    if (this.history.length === 0) {
      console.log(dim('  No commands in history'));
    } else {
      this.history.forEach((cmd, index) => {
        console.log(`  ${dim((index + 1).toString().padStart(3))}. ${cmd}`);
      });
    }

    return { success: true };
  }

  getAvailableCommands(): string[] {
    const uniqueCommands = new Set<string>();
    this.commands.forEach(command => {
      uniqueCommands.add(command.name);
    });
    return Array.from(uniqueCommands);
  }

  getHistory(): string[] {
    return [...this.history];
  }
}
