/**
 * フェーズ管理システム
 */

import { PhaseType, CommandResult, Command } from './types';
import { CommandParser } from './CommandParser';

export abstract class Phase {
  protected parser: CommandParser;

  constructor() {
    this.parser = new CommandParser();
  }

  abstract getType(): PhaseType;
  abstract initialize(): Promise<void>;
  abstract cleanup(): Promise<void>;

  async processInput(input: string): Promise<CommandResult> {
    return await this.parser.parse(input);
  }

  protected registerCommand(command: Command): void {
    this.parser.register(command);
  }

  protected unregisterCommand(name: string): void {
    this.parser.unregister(name);
  }

  getAvailableCommands(): string[] {
    return this.parser.getAvailableCommands();
  }
}
