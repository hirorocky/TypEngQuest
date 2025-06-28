import { InteractionCommands } from '../interaction';
import { Map } from '../../world/map';
import { ElementManager } from '../../world/elements';
import { Player } from '../../core/player';
import { World } from '../../world/world';
import { Location, LocationType, ElementType } from '../../world/location';

describe('InteractionCommandsクラス', () => {
  let interactionCommands: InteractionCommands;
  let map: Map;
  let elementManager: ElementManager;
  let player: Player;
  let world: World;

  beforeEach(() => {
    map = new Map();
    elementManager = new ElementManager();
    player = new Player();
    world = new World('Test World', 1, map);
    interactionCommands = new InteractionCommands(map, elementManager, player, world);

    // テスト用マップセットアップ
    const srcDir = new Location('src', '/', LocationType.DIRECTORY);
    const monsterFile = new Location('app.js', '/src', LocationType.FILE);
    const treasureFile = new Location('config.json', '/src', LocationType.FILE);
    const eventFile = new Location('.env', '/src', LocationType.FILE);
    const saveFile = new Location('README.md', '/src', LocationType.FILE);
    
    map.addLocation(srcDir);
    map.addLocation(monsterFile);
    map.addLocation(treasureFile);
    map.addLocation(eventFile);
    map.addLocation(saveFile);
    map.navigateTo('/src');
  });

  describe('基本機能', () => {
    test('引数なしでエラーを返す', () => {
      const result = interactionCommands.interact('');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('Usage: interact <filename>');
    });

    test('存在しないファイルでエラーを返す', () => {
      const result = interactionCommands.interact('nonexistent.txt');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('No such file or directory');
    });

    test('探索されていないファイルでエラーを返す', () => {
      const result = interactionCommands.interact('app.js');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('must be explored first');
      expect(result.output).toContain('cat app.js');
    });

    test('要素が存在しないファイルでエラーを返す', () => {
      const location = map.findLocation('/src/app.js');
      location?.markExplored(); // 探索済みにするが要素なし
      
      const result = interactionCommands.interact('app.js');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('nothing to interact with');
    });
  });

  describe('モンスター相互作用', () => {
    beforeEach(() => {
      const location = map.findLocation('/src/app.js');
      location?.markExplored();
      const monster = elementManager.createMonsterElement('Syntax Error Bug', 50, 15);
      location?.setElement(monster.type, monster.data);
    });

    test('モンスターとの戦闘開始', () => {
      const result = interactionCommands.interact('app.js');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Battle started');
      expect(result.output).toContain('Syntax Error Bug');
      expect(result.output).toContain('Health: 50');
      expect(result.output).toContain('Attack: 15');
    });

    test('既に倒されたモンスターは戦闘不可', () => {
      const location = map.findLocation('/src/app.js');
      const element = location?.getElement();
      element!.data.defeated = true;
      
      const result = interactionCommands.interact('app.js');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('already defeated');
    });

    test('戦闘勝利時の処理', () => {
      // プレイヤーの攻撃力を高くしてモンスターを倒せるようにする
      player.equipWord(1, 'powerful');
      player.equipWord(2, 'attack');
      
      const result = interactionCommands.interact('app.js');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Victory');
      
      // モンスターが倒された状態になっている
      const location = map.findLocation('/src/app.js');
      const element = location?.getElement();
      expect(element?.data.defeated).toBe(true);
      
      // TODO: 装備ドロップシステムは別クラス（EquipmentDropManager）で実装予定
      // expect(result.output).toContain('Equipment dropped');
    });

    test('戦闘敗北時の処理', () => {
      // プレイヤーの装備を弱くして、HPも大幅に減らす
      player.unequipWord(1);
      player.unequipWord(2);
      player.takeDamage(45); // HPを5にしてモンスターが勝ちやすくする
      
      const result = interactionCommands.interact('app.js');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Defeat!');
      expect(result.output).toContain('damage');
    });
  });

  describe('宝箱相互作用', () => {
    beforeEach(() => {
      const location = map.findLocation('/src/config.json');
      location?.markExplored();
      const treasure = elementManager.createTreasureElement(['function', 'class'], 'rare');
      location?.setElement(treasure.type, treasure.data);
    });

    test('宝箱を開いて装備を獲得', () => {
      const initialInventorySize = player.getInventory().length;
      
      const result = interactionCommands.interact('config.json');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Treasure opened');
      expect(result.output).toContain('rare');
      expect(result.output).toContain('function');
      expect(result.output).toContain('class');
      
      // インベントリに追加されている
      expect(player.getInventory().length).toBeGreaterThan(initialInventorySize);
      
      // 宝箱が開封済みになっている
      const location = map.findLocation('/src/config.json');
      const element = location?.getElement();
      expect(element?.data.opened).toBe(true);
    });

    test('既に開封された宝箱は使用不可', () => {
      const location = map.findLocation('/src/config.json');
      const element = location?.getElement();
      element!.data.opened = true;
      
      const result = interactionCommands.interact('config.json');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('already opened');
    });
  });

  describe('ランダムイベント相互作用', () => {
    test('良いイベントの実行', () => {
      const location = map.findLocation('/src/.env');
      location?.markExplored();
      const goodEvent = elementManager.createRandomEventElement(
        'good',
        'Found optimization tip',
        { experience: 20 }
      );
      location?.setElement(goodEvent.type, goodEvent.data);
      
      const initialExperience = player.getStats().experience;
      
      const result = interactionCommands.interact('.env');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Event triggered');
      expect(result.output).toContain('Found optimization tip');
      expect(result.output).toContain('experience: +20');
      
      // 経験値が増加している
      expect(player.getStats().experience).toBe(initialExperience + 20);
      
      // イベントがトリガー済みになっている
      const element = location?.getElement();
      expect(element?.data.triggered).toBe(true);
    });

    test('悪いイベントのタイピング回避チャレンジ', () => {
      const location = map.findLocation('/src/.env');
      location?.markExplored();
      const badEvent = elementManager.createRandomEventElement(
        'bad',
        'Memory usage spike detected',
        { healthDamage: 15 }
      );
      location?.setElement(badEvent.type, badEvent.data);
      
      const result = interactionCommands.interact('.env');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Dangerous event');
      expect(result.output).toContain('Memory usage spike detected');
      expect(result.output).toContain('typing challenge');
      expect(result.output).toContain('damage: 15');
    });

    test('ワールドレベルに応じたタイピング難易度', () => {
      // 高レベルワールドでテスト
      const highLevelWorld = new World('Hard World', 5, map);
      const highLevelCommands = new InteractionCommands(map, elementManager, player, highLevelWorld);
      
      const location = map.findLocation('/src/.env');
      location?.markExplored();
      const badEvent = elementManager.createRandomEventElement(
        'bad',
        'Critical system error',
        { healthDamage: 25 }
      );
      location?.setElement(badEvent.type, badEvent.data);
      
      const result = highLevelCommands.interact('.env');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Level 5');
      expect(result.output).toContain('typing challenge');
      // 高レベルは長い単語や複雑な構文が要求される
      expect(result.output).toMatch(/length|complex|difficult/i);
    });

    test('既にトリガーされたイベントは使用不可', () => {
      const location = map.findLocation('/src/.env');
      location?.markExplored();
      const event = elementManager.createRandomEventElement('good', 'Test event', { experience: 10 });
      location?.setElement(event.type, event.data);
      event.data.triggered = true;
      
      const result = interactionCommands.interact('.env');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('already triggered');
    });
  });

  describe('セーブポイント相互作用', () => {
    beforeEach(() => {
      const location = map.findLocation('/src/README.md');
      location?.markExplored();
      const savePoint = elementManager.createSavePointElement('Documentation Hub', 100, 50);
      location?.setElement(savePoint.type, savePoint.data);
    });

    test('セーブポイントでの回復', () => {
      // プレイヤーのHPとMPを減らす
      player.takeDamage(30);
      player.spendMana(20);
      
      const result = interactionCommands.interact('README.md');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Save point accessed');
      expect(result.output).toContain('Documentation Hub');
      expect(result.output).toContain('Health restored: 30');
      expect(result.output).toContain('Mana restored: 20');
      expect(result.output).toContain('Game saved');
    });

    test('セーブポイントは繰り返し使用可能', () => {
      // 1回目の使用
      interactionCommands.interact('README.md');
      
      // 2回目の使用も成功するべき
      const result = interactionCommands.interact('README.md');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Save point accessed');
    });

    test('最大HPを超えて回復しない', () => {
      const maxHealth = player.getStats().maxHealth;
      
      const result = interactionCommands.interact('README.md');
      
      expect(result.success).toBe(true);
      expect(player.getStats().currentHealth).toBe(maxHealth);
    });
  });

  describe('エラーハンドリング', () => {
    test('ディレクトリに対してエラーを返す', () => {
      map.navigateTo('/');
      const result = interactionCommands.interact('src');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('Cannot interact with directory');
    });

    test('未知の要素タイプでエラーを返す', () => {
      const location = map.findLocation('/src/app.js');
      location?.markExplored();
      location?.setElement('unknown' as ElementType, { data: 'test' });
      
      const result = interactionCommands.interact('app.js');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('Unknown element type');
    });
  });

  describe('統合テスト', () => {
    test('複数の要素との連続相互作用', () => {
      // 宝箱を開く
      const treasureLocation = map.findLocation('/src/config.json');
      treasureLocation?.markExplored();
      const treasure = elementManager.createTreasureElement(['function'], 'common');
      treasureLocation?.setElement(treasure.type, treasure.data);
      
      const treasureResult = interactionCommands.interact('config.json');
      expect(treasureResult.success).toBe(true);
      
      // セーブポイントを使用
      const saveLocation = map.findLocation('/src/README.md');
      saveLocation?.markExplored();
      const savePoint = elementManager.createSavePointElement('Hub', 50, 25);
      saveLocation?.setElement(savePoint.type, savePoint.data);
      
      const saveResult = interactionCommands.interact('README.md');
      expect(saveResult.success).toBe(true);
    });
  });
});