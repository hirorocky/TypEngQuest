import { Phase } from '../core/Phase';
import { PhaseResult, PhaseTypes, CommandContext } from '../core/types';
import { Battle, SelectedSkill } from '../battle/Battle';
import { Enemy } from '../battle/Enemy';

/**
 * BattlePhaseクラス - 戦闘フェーズの制御を行う
 */
export class BattlePhase extends Phase {
  private battle: Battle | null = null;
  private selectedSkills: SelectedSkill[] = [];
  private actionPoints: number = 0;

  /**
   * Battleインスタンスを取得（nullチェック付き）
   */
  private getBattle(): Battle {
    if (!this.battle) {
      throw new Error('battle not initialized');
    }
    return this.battle;
  }

  /**
   * フェーズを開始する
   */
  async start(context?: CommandContext): Promise<PhaseResult> {
    if (!context?.enemy) {
      return this.error('no enemy specified for battle');
    }

    const enemy = context.enemy as Enemy;
    this.battle = new Battle(this.game.player, enemy);
    const message = this.battle.start();

    // 戦闘開始メッセージを表示
    this.output(message);
    this.output('');

    // 最初のターンを開始
    return this.startTurn();
  }

  /**
   * ターンを開始する
   */
  private startTurn(): PhaseResult {
    try {
      const battle = this.getBattle();
      const actor = battle.getCurrentTurnActor();

      if (actor === 'player') {
        return this.startPlayerTurn();
      } else {
        return this.executeEnemyTurn();
      }
    } catch (_error) {
      return this.error('battle not initialized');
    }
  }

  /**
   * プレイヤーターンを開始する
   */
  private startPlayerTurn(): PhaseResult {
    try {
      const battle = this.getBattle();
      this.selectedSkills = [];
      this.actionPoints = battle.calculatePlayerActionPoints();

      this.output(`===== Turn ${battle.currentTurn} - Your turn =====`);
      this.output(`Action Points: ${this.actionPoints}`);
      this.output('');
      this.output('Select skills to use (up to action point limit):');
      this.output('Type "skills" to see available skills');
      this.output('Type "select <skill_name>" to add a skill');
      this.output('Type "confirm" to execute selected skills');
      this.output('Type "clear" to clear selections');

      return this.success();
    } catch (_error) {
      return this.error('battle not initialized');
    }
  }

  /**
   * 敵ターンを実行する
   */
  private executeEnemyTurn(): PhaseResult {
    try {
      const battle = this.getBattle();
      this.output(`===== Turn ${battle.currentTurn} - Enemy turn =====`);

      const result = battle.enemyAction();
      this.output(result.message);

      // 戦闘終了チェック
      const battleEnd = battle.checkBattleEnd();
      if (battleEnd) {
        return this.endBattle(battleEnd.winner === 'player');
      }

      // 次のターンへ
      battle.nextTurn();
      return this.startTurn();
    } catch (_error) {
      return this.error('battle not initialized');
    }
  }

  /**
   * コマンドを処理する
   */
  async processCommand(input: string): Promise<PhaseResult> {
    try {
      this.getBattle(); // Nullチェックのみ
      const [command, ...args] = input.trim().toLowerCase().split(/\s+/);

      switch (command) {
        case 'skills':
          return this.showAvailableSkills();

        case 'select':
          return this.selectSkill(args.join(' '));

        case 'confirm':
          return this.confirmAndExecuteSkills();

        case 'clear':
          this.selectedSkills = [];
          this.output('skill selection cleared');
          return this.success();

        case 'status':
          return this.showBattleStatus();

        case 'run':
          return this.attemptEscape();

        default:
          return this.error(`unknown command: ${command}`);
      }
    } catch (_error) {
      return this.error('battle not initialized');
    }
  }

  /**
   * 利用可能なスキルを表示
   */
  private showAvailableSkills(): PhaseResult {
    const equipment = this.game.player.getEquipment();
    const skills = equipment.getAllSkills();

    if (skills.length === 0) {
      this.output('No skills available');
      return this.success();
    }

    this.output('Available skills:');
    skills.forEach(skill => {
      this.output(`  ${skill.name} - Cost: ${skill.actionCost} AP, ${skill.mpCost} MP`);
    });

    return this.success();
  }

  /**
   * スキルを選択
   */
  private selectSkill(skillName: string): PhaseResult {
    const equipment = this.game.player.getEquipment();
    const skills = equipment.getAllSkills();
    const skill = skills.find(s => s.name.toLowerCase() === skillName);

    if (!skill) {
      return this.error(`skill not found: ${skillName}`);
    }

    // 行動ポイントチェック
    const totalCost =
      this.selectedSkills.reduce((sum, s) => sum + s.skill.actionCost, 0) + skill.actionCost;
    if (totalCost > this.actionPoints) {
      return this.error(`not enough action points (need ${totalCost}, have ${this.actionPoints})`);
    }

    this.selectedSkills.push({ skill });
    this.output(`${skill.name} selected (Total AP: ${totalCost}/${this.actionPoints})`);

    return this.success();
  }

  /**
   * 選択したスキルを確定して実行
   */
  private async confirmAndExecuteSkills(): Promise<PhaseResult> {
    const battle = this.getBattle();

    if (this.selectedSkills.length === 0) {
      return this.error('no skills selected');
    }

    // スキルの検証
    const skills = this.selectedSkills.map(s => s.skill);
    const validationError = battle.validateSelectedSkills(skills);
    if (validationError) {
      return this.error(validationError);
    }

    // タイピングチャレンジ（実際の実装では各スキルごとに行う）
    this.output('Executing skills...');

    // スキル実行
    const turnResult = battle.playerUseMultipleSkills(this.selectedSkills);

    // 結果表示
    turnResult.skillResults.forEach(result => {
      this.output(result.message);
    });

    if (turnResult.totalDamage > 0) {
      this.output(`Total damage: ${turnResult.totalDamage}`);
    }

    // 戦闘終了チェック
    const battleEnd = battle.checkBattleEnd();
    if (battleEnd) {
      return this.endBattle(battleEnd.winner === 'player');
    }

    // 次のターンへ
    battle.nextTurn();
    return this.startTurn();
  }

  /**
   * 戦闘ステータスを表示
   */
  private showBattleStatus(): PhaseResult {
    const playerStats = this.game.player.getBodyStats();
    this.output(`Player HP: ${playerStats.getCurrentHP()}/${playerStats.getMaxHP()}`);
    this.output(`Player MP: ${playerStats.getCurrentMP()}/${playerStats.getMaxMP()}`);
    // Enemy status would be shown here

    return this.success();
  }

  /**
   * 逃走を試みる
   */
  private attemptEscape(): PhaseResult {
    // 逃走処理（簡略化）
    this.output('You cannot escape from this battle!');
    return this.success();
  }

  /**
   * 戦闘を終了する
   */
  private endBattle(victory: boolean): PhaseResult {
    try {
      const battle = this.getBattle();

      if (victory) {
        this.output('Victory!');

        // ドロップアイテム処理
        const drops = battle.calculateDrops();
        if (drops.length > 0) {
          this.output('Items dropped:');
          drops.forEach(item => {
            this.output(`  - ${item}`);
          });
        }

        // HP/MP回復
        const playerStats = this.game.player.getBodyStats();
        playerStats.healHP(playerStats.getMaxHP());
        playerStats.resetMP();
      } else {
        this.output('Defeat...');
      }

      // 探索フェーズに戻る
      return this.successWithPhase(PhaseTypes.EXPLORATION);
    } catch (_error) {
      return this.error('battle not initialized');
    }
  }

  /**
   * ヘルプメッセージを表示
   */
  help(): PhaseResult {
    this.output('Battle Phase Commands:');
    this.output('  skills         - Show available skills');
    this.output('  select <skill> - Select a skill to use');
    this.output('  confirm        - Execute selected skills');
    this.output('  clear          - Clear skill selection');
    this.output('  status         - Show battle status');
    this.output('  run            - Attempt to escape');
    return this.success();
  }
}
