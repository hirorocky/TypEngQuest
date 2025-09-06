import { BattlePhase } from './BattlePhase';
import { CommandParser } from '../core/CommandParser';
import { TabCompleter } from '../core/completion/TabCompleter';
import { Enemy } from '../battle/Enemy';
import { Player } from '../player/Player';

describe('BattlePhase EXモード', () => {
  let battlePhase: BattlePhase;
  let player: Player;
  let enemy: Enemy;
  let tab: TabCompleter;

  beforeEach(async () => {
    player = new Player('Hero', true);
    const parser = new CommandParser();
    tab = new TabCompleter(parser);
    battlePhase = new BattlePhase({} as any, tab, player);
    enemy = new Enemy({
      id: 'e1',
      name: 'Slime',
      description: 'dummy',
      level: 1,
      stats: { maxHp: 20, strength: 5, willpower: 5, agility: 5, fortune: 5 },
      physicalEvadeRate: 5,
      magicalEvadeRate: 5,
      skills: [],
      drops: [],
    });
    await battlePhase.initialize();
    battlePhase.setEnemy(enemy);
    await battlePhase.initialize();
    // バトル開始
    const Battle = require('../battle/Battle').Battle;
    const battle = new Battle(player, enemy);
    battle.start();
    if (battle.getCurrentTurnActor() === 'enemy') battle.nextTurn();
    battlePhase.setBattle(battle);
  });

  test('EX不足でfocus/sparkはエラー', async () => {
    const r1 = await (battlePhase as any).enterFocusMode();
    expect(r1.success).toBe(false);
    const r2 = await (battlePhase as any).enterSparkMode();
    expect(r2.success).toBe(false);
  });

  test('EXが閾値以上ならコマンドが遷移を返す', async () => {
    player.addExPoints(30);
    const rf = await (battlePhase as any).enterFocusMode();
    expect(rf.success).toBe(true);
    expect(rf.nextPhase).toBe('skillSelection');

    // EXが減っていること（30 -> 20）
    expect(player.getExPoints()).toBe(20);

    const rs = await (battlePhase as any).enterSparkMode();
    expect(rs.success).toBe(true);
    expect(rs.nextPhase).toBe('skillSelection');
    // さらに15消費（20 -> 5）
    expect(player.getExPoints()).toBe(5);
  });
});
