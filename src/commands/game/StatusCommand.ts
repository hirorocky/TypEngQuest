import { BaseCommand, CommandContext } from '../BaseCommand';
import { CommandResult } from '../../core/types';

/**
 * statusコマンド - プレイヤーのステータスとHP/MPを表示する
 */
export class StatusCommand extends BaseCommand {
  public name = 'status';
  public description = 'display player status and equipment bonuses';

  /**
   * statusコマンドを実行する
   * @param args - コマンドの引数（無視される）
   * @param context - コマンド実行のコンテキスト
   * @returns 実行結果
   */
  protected executeInternal(_args: string[], context: CommandContext): CommandResult {
    try {
      if (!context.player) {
        return this.error('player not initialized');
      }

      const player = context.player;
      const stats = player.getStats();

      if (!stats) {
        return this.error('unable to get player stats');
      }

      // プレイヤー基本情報
      const name = player.getName();
      const level = player.getLevel();

      // HP/MP情報
      const currentHP = stats.getCurrentHP();
      const maxHP = stats.getMaxHP();
      const currentMP = stats.getCurrentMP();
      const maxMP = stats.getMaxMP();

      // ステータス情報
      const attack = stats.getAttack();
      const defense = stats.getDefense();
      const speed = stats.getSpeed();
      const accuracy = stats.getAccuracy();
      const fortune = stats.getFortune();

      // HP/MPバーを生成
      const hpBar = this.generateBar(currentHP, maxHP);
      const mpBar = this.generateBar(currentMP, maxMP);

      // ステータス表示を構築
      const statusDisplay = [
        `=== ${name} ===`,
        `Level: ${level}`,
        '',
        `HP: ${currentHP}/${maxHP} ${hpBar}`,
        `MP: ${currentMP}/${maxMP} ${mpBar}`,
        '',
        `Attack: ${attack}`,
        `Defense: ${defense}`,
        `Speed: ${speed}`,
        `Accuracy: ${accuracy}`,
        `Fortune: ${fortune}`,
      ].join('\n');

      return this.success(statusDisplay);
    } catch (_error) {
      return this.error('unable to get player stats');
    }
  }

  /**
   * HP/MPバーを生成する
   * @param current - 現在値
   * @param max - 最大値
   * @returns バー文字列（20文字固定）
   */
  private generateBar(current: number, max: number): string {
    const barLength = 20;
    const filledLength = max > 0 ? Math.round((current / max) * barLength) : 0;
    const emptyLength = barLength - filledLength;

    const filled = '■'.repeat(filledLength);
    const empty = '□'.repeat(emptyLength);

    return filled + empty;
  }

  /**
   * ヘルプメッセージを取得する
   * @returns ヘルプメッセージの配列
   */
  public getHelp(): string[] {
    return [
      'status - display player status and equipment bonuses',
      '',
      'Shows current HP, MP, and all character statistics.',
      'Available in exploration, battle, and inventory phases.',
    ];
  }
}