import { BattleCompletionProvider } from './BattleCompletionProvider';
import { CompletionContext } from '../CompletionContext';
import { World } from '../../../world/World';
import { FileSystem } from '../../../world/FileSystem';
import { FileNode, NodeType } from '../../../world/FileNode';
import { CommandParser } from '../../CommandParser';

describe('BattleCompletionProvider', () => {
  let provider: BattleCompletionProvider;
  let world: World;
  let fileSystem: FileSystem;
  let commandParser: CommandParser;

  beforeEach(() => {
    provider = new BattleCompletionProvider();
    commandParser = new CommandParser();
    
    // テスト用のファイル構造を構築
    const root = new FileNode('projects', NodeType.DIRECTORY);
    fileSystem = new FileSystem(root);
    
    // バトル可能なファイル（モンスターファイル）
    const monsterJs = new FileNode('monster.js', NodeType.FILE);
    const enemyPy = new FileNode('enemy.py', NodeType.FILE);
    const bossHtml = new FileNode('boss.html', NodeType.FILE);
    
    // バトル不可能なファイル
    const configJson = new FileNode('config.json', NodeType.FILE);
    const readmeMd = new FileNode('readme.md', NodeType.FILE);
    
    root.addChild(monsterJs);
    root.addChild(enemyPy);
    root.addChild(bossHtml);
    root.addChild(configJson);
    root.addChild(readmeMd);
    
    world = new World('tech-startup', 1, true);
    // テスト用ファイルシステムを設定
    (world as any).fileSystem = fileSystem;
  });

  describe('canComplete', () => {
    it('battleコマンドで引数がある場合にtrueを返す', () => {
      const context = new CompletionContext('battle main.', commandParser, null, world);
      expect(provider.canComplete(context)).toBe(true);
    });

    it('battleコマンド以外の場合にfalseを返す', () => {
      const context = new CompletionContext('ls main.', commandParser, null, world);
      expect(provider.canComplete(context)).toBe(false);
    });

    it('引数がない場合にfalseを返す', () => {
      const context = new CompletionContext('battle', commandParser, null, world);
      expect(provider.canComplete(context)).toBe(false);
    });

    it('worldがnullの場合にfalseを返す', () => {
      const context = new CompletionContext('battle main.', commandParser, null, null);
      expect(provider.canComplete(context)).toBe(false);
    });
  });

  describe('getCompletions', () => {
    it('モンスターファイルのみを返す', () => {
      const context = new CompletionContext('battle ', commandParser, null, world);
      const completions = provider.getCompletions(context);
      
      expect(completions).toContain('monster.js');
      expect(completions).toContain('enemy.py');
      expect(completions).toContain('boss.html');
      expect(completions).not.toContain('config.json');
      expect(completions).not.toContain('readme.md');
    });

    it('前置文字にマッチするファイルのみを返す', () => {
      const context = new CompletionContext('battle mo', commandParser, null, world);
      const completions = provider.getCompletions(context);
      
      expect(completions).toContain('monster.js');
      expect(completions).not.toContain('enemy.py');
      expect(completions).not.toContain('boss.html');
    });

    it('マッチするファイルがない場合は全モンスターファイルを返す', () => {
      const context = new CompletionContext('battle xyz', commandParser, null, world);
      const completions = provider.getCompletions(context);
      
      expect(completions).toContain('monster.js');
      expect(completions).toContain('enemy.py');
      expect(completions).toContain('boss.html');
    });

    it('worldがnullの場合は空配列を返す', () => {
      const context = new CompletionContext('battle mo', commandParser, null, null);
      const completions = provider.getCompletions(context);
      
      expect(completions).toEqual([]);
    });
  });

  describe('getPriority', () => {
    it('優先度10を返す', () => {
      expect(provider.getPriority()).toBe(10);
    });
  });
});