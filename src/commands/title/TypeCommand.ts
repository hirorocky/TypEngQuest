import { BaseCommand, CommandContext } from '../BaseCommand';
import { CommandResult, PhaseTypes } from '../../core/types';
import { TypingDifficulty } from '../../typing/types';

/**
 * タイピングテストコマンド - TitlePhaseからTypingPhaseに遷移
 */
export class TypeCommand extends BaseCommand {
  public name = 'type';
  public description = 'Start typing test (optional: difficulty 1-5)';

  protected executeInternal(args: string[], _context: CommandContext): CommandResult {
    let difficulty: TypingDifficulty | undefined;

    // 引数がある場合は難易度として解析
    if (args.length > 0) {
      const difficultyArg = parseInt(args[0], 10);
      
      if (isNaN(difficultyArg) || difficultyArg < 1 || difficultyArg > 5) {
        return {
          success: false,
          message: 'Invalid difficulty. Please specify a number between 1-5.',
        };
      }
      
      difficulty = difficultyArg as TypingDifficulty;
    }

    console.log('Starting typing test...');
    if (difficulty) {
      console.log(`Difficulty: ${difficulty}`);
    } else {
      console.log('Difficulty: Random');
    }

    return {
      success: true,
      message: 'Entering typing test mode',
      nextPhase: PhaseTypes.TYPING,
      data: { difficulty },
    };
  }

  public getHelp(): string[] {
    return [
      'Usage: type [difficulty]',
      '  Start typing test mode',
      '',
      'Arguments:',
      '  difficulty  Optional difficulty level (1-5)',
      '              If not specified, random difficulty will be used',
      '',
      'Examples:',
      '  type        Start with random difficulty',
      '  type 1      Start with difficulty 1 (easiest)',
      '  type 5      Start with difficulty 5 (hardest)',
    ];
  }
}