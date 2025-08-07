/**
 * 共通型定義
 */

export type PhaseType =
  | 'title'
  | 'exploration'
  | 'dialog'
  | 'inventory'
  | 'itemConsumption'
  | 'itemEquipment'
  | 'battle'
  | 'battleTyping'
  | 'skillSelection'
  | 'battleItemConsumption'
  | 'typing'
  | 'continue';

export const PhaseTypes = {
  TITLE: 'title' as const,
  EXPLORATION: 'exploration' as const,
  DIALOG: 'dialog' as const,
  INVENTORY: 'inventory' as const,
  ITEM_CONSUMPTION: 'itemConsumption' as const,
  ITEM_EQUIPMENT: 'itemEquipment' as const,
  BATTLE: 'battle' as const,
  BATTLE_TYPING: 'battleTyping' as const,
  SKILL_SELECTION: 'skillSelection' as const,
  BATTLE_ITEM_CONSUMPTION: 'battleItemConsumption' as const,
  TYPING: 'typing' as const,
  CONTINUE: 'continue' as const,
} as const satisfies Record<string, PhaseType>;

/**
 * フェーズ実行結果
 */
export interface PhaseResult {
  type: PhaseType;
  data?: Record<string, unknown>;
}

export interface GameState {
  currentPhase: PhaseType;
  isRunning: boolean;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  output?: string[];
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
