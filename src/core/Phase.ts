/**
 * フェーズ管理システム
 */

import { PhaseType, CommandResult, Command } from './types';
import { CommandParser } from './CommandParser';
import { World } from '../world/World';

export abstract class Phase {
  protected parser: CommandParser;
  protected world?: World;

  constructor(world?: World) {
    this.parser = new CommandParser();
    this.world = world;
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
