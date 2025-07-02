/**
 * 共通型定義
 */

export type PhaseType = 'title' | 'exploration' | 'dialog' | 'inventory' | 'battle' | 'typing';

export interface GameState {
  currentPhase: PhaseType;
  isRunning: boolean;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  nextPhase?: PhaseType;
  data?: Record<string, unknown>;
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  execute: (_args: string[]) => Promise<CommandResult>;
}

export class GameError extends Error {
  constructor(
    message: string,
    public _code?: string // 未使用だが将来用のためのプレースホルダー
  ) {
    super(message);
    this.name = 'GameError';
  }
}
