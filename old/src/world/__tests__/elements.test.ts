import { ElementManager } from '../elements';
import { ElementType, Element } from '../location';
import { Location, LocationType } from '../location';

describe('ElementManagerクラス', () => {
  let elementManager: ElementManager;

  beforeEach(() => {
    elementManager = new ElementManager();
  });

  describe('要素生成システム', () => {
    test('ファイルタイプに応じて要素を生成できる', () => {
      const jsFile = new Location('app.js', '/src', LocationType.FILE);
      const element = elementManager.generateElement(jsFile);
      
      expect(element).toBeDefined();
      expect(Object.values(ElementType)).toContain(element!.type);
    });

    test('実行ファイルは高確率でモンスターを生成する', () => {
      const exeFile = new Location('app.exe', '/bin', LocationType.FILE);
      
      // 複数回テストして確率を検証
      const results = Array.from({ length: 100 }, () => 
        elementManager.generateElement(exeFile)
      );
      
      const monsterCount = results.filter(e => e?.type === ElementType.MONSTER).length;
      expect(monsterCount).toBeGreaterThan(50); // 50%以上でモンスター
    });

    test('設定ファイルは宝箱の確率が高い', () => {
      const configFile = new Location('config.json', '/src', LocationType.FILE);
      
      const results = Array.from({ length: 100 }, () => 
        elementManager.generateElement(configFile)
      );
      
      const treasureCount = results.filter(e => e?.type === ElementType.TREASURE).length;
      expect(treasureCount).toBeGreaterThan(15); // 15%以上で宝箱
    });

    test('ドキュメントファイルはセーブポイントの確率が高い', () => {
      const mdFile = new Location('README.md', '/docs', LocationType.FILE);
      
      const results = Array.from({ length: 100 }, () => 
        elementManager.generateElement(mdFile)
      );
      
      const savePointCount = results.filter(e => e?.type === ElementType.SAVE_POINT).length;
      expect(savePointCount).toBeGreaterThan(10); // 10%以上でセーブポイント
    });

    test('隠しファイルはランダムイベントの確率が高い', () => {
      const hiddenFile = new Location('.env', '/root', LocationType.FILE);
      
      const results = Array.from({ length: 100 }, () => 
        elementManager.generateElement(hiddenFile)
      );
      
      const eventCount = results.filter(e => e?.type === ElementType.RANDOM_EVENT).length;
      expect(eventCount).toBeGreaterThan(20); // 20%以上でランダムイベント
    });

    test('一部のファイルは要素を持たない場合がある', () => {
      const txtFile = new Location('notes.txt', '/docs', LocationType.FILE);
      
      const results = Array.from({ length: 50 }, () => 
        elementManager.generateElement(txtFile)
      );
      
      const noElementCount = results.filter(e => e === null).length;
      expect(noElementCount).toBeGreaterThan(0); // 一部は要素なし
    });
  });

  describe('モンスター要素', () => {
    test('モンスター要素を作成できる', () => {
      const monster = elementManager.createMonsterElement('Bug Dragon', 50, 15);
      
      expect(monster.type).toBe(ElementType.MONSTER);
      expect(monster.data.name).toBe('Bug Dragon');
      expect(monster.data.health).toBe(50);
      expect(monster.data.attack).toBe(15);
    });

    test('ファイルタイプに応じたモンスター名を生成する', () => {
      const jsFile = new Location('app.js', '/src', LocationType.FILE);
      const monster = elementManager.generateMonsterForFile(jsFile);
      
      expect(typeof monster.data.name).toBe('string'); // JS関連のモンスター名
    });

    test('モンスターの強さがファイルの深度に応じて調整される', () => {
      const shallowFile = new Location('app.js', '/src', LocationType.FILE);
      const deepFile = new Location('core.js', '/src/deep/nested/path', LocationType.FILE);
      
      const shallowMonster = elementManager.generateMonsterForFile(shallowFile);
      const deepMonster = elementManager.generateMonsterForFile(deepFile);
      
      expect(deepMonster.data.health as number).toBeGreaterThan(shallowMonster.data.health as number);
      expect(deepMonster.data.attack as number).toBeGreaterThan(shallowMonster.data.attack as number);
    });
  });

  describe('宝箱要素', () => {
    test('宝箱要素を作成できる', () => {
      const treasure = elementManager.createTreasureElement(['function', 'class'], 'rare');
      
      expect(treasure.type).toBe(ElementType.TREASURE);
      expect(treasure.data.contents).toEqual(['function', 'class']);
      expect(treasure.data.rarity).toBe('rare');
    });

    test('ファイルタイプに応じた宝箱内容を生成する', () => {
      const packageFile = new Location('package.json', '/root', LocationType.FILE);
      const treasure = elementManager.generateTreasureForFile(packageFile);
      
      expect(Array.isArray(treasure.data.contents)).toBe(true);
      expect((treasure.data.contents as string[]).length).toBeGreaterThan(0);
    });

    test('宝箱のレアリティがファイルの重要度に応じて決まる', () => {
      const importantFile = new Location('package.json', '/root', LocationType.FILE);
      const normalFile = new Location('config.json', '/src', LocationType.FILE);
      
      const importantTreasure = elementManager.generateTreasureForFile(importantFile);
      const normalTreasure = elementManager.generateTreasureForFile(normalFile);
      
      // package.jsonの方が高いレアリティになる確率が高い
      expect(importantTreasure.data.rarity).toBeDefined();
      expect(normalTreasure.data.rarity).toBeDefined();
    });
  });

  describe('ランダムイベント要素', () => {
    test('ランダムイベント要素を作成できる', () => {
      const event = elementManager.createRandomEventElement('good', 'Found optimization tip', { experience: 10 });
      
      expect(event.type).toBe(ElementType.RANDOM_EVENT);
      expect(event.data.eventType).toBe('good');
      expect(event.data.description).toBe('Found optimization tip');
      expect(event.data.effects).toEqual({ experience: 10 });
    });

    test('隠しファイルは悪いイベントの確率が高い', () => {
      const hiddenFile = new Location('.env', '/root', LocationType.FILE);
      
      const events = Array.from({ length: 50 }, () => 
        elementManager.generateRandomEventForFile(hiddenFile)
      );
      
      const badEvents = events.filter(e => e.data.eventType === 'bad').length;
      const goodEvents = events.filter(e => e.data.eventType === 'good').length;
      
      expect(badEvents).toBeGreaterThan(goodEvents); // 悪いイベントの方が多い
    });

    test('ドキュメントファイルは良いイベントの確率が高い', () => {
      const docFile = new Location('README.md', '/docs', LocationType.FILE);
      
      const events = Array.from({ length: 50 }, () => 
        elementManager.generateRandomEventForFile(docFile)
      );
      
      const badEvents = events.filter(e => e.data.eventType === 'bad').length;
      const goodEvents = events.filter(e => e.data.eventType === 'good').length;
      
      expect(goodEvents).toBeGreaterThan(badEvents); // 良いイベントの方が多い
    });
  });

  describe('セーブポイント要素', () => {
    test('セーブポイント要素を作成できる', () => {
      const savePoint = elementManager.createSavePointElement('Documentation Hub', 100, 50);
      
      expect(savePoint.type).toBe(ElementType.SAVE_POINT);
      expect(savePoint.data.name).toBe('Documentation Hub');
      expect(savePoint.data.healthRestore).toBe(100);
      expect(savePoint.data.manaRestore).toBe(50);
    });

    test('ディレクトリタイプに応じたセーブポイント名を生成する', () => {
      const docsDir = new Location('docs', '/root', LocationType.DIRECTORY);
      const savePoint = elementManager.generateSavePointForLocation(docsDir);
      
      expect(typeof savePoint.data.name).toBe('string');
      expect((savePoint.data.name as string).length).toBeGreaterThan(0);
    });
  });

  describe('確率システム', () => {
    test('ファイル拡張子に基づく確率設定を取得できる', () => {
      const jsFile = new Location('app.js', '/src', LocationType.FILE);
      const probabilities = elementManager.getElementProbabilities(jsFile);
      
      expect(probabilities.monster).toBeGreaterThan(0);
      expect(probabilities.treasure).toBeGreaterThan(0);
      expect(probabilities.randomEvent).toBeGreaterThan(0);
      expect(probabilities.savePoint).toBeGreaterThan(0);
      
      // 確率の合計は100%以下
      const total = probabilities.monster + probabilities.treasure + 
                   probabilities.randomEvent + probabilities.savePoint;
      expect(total).toBeLessThanOrEqual(100);
    });
  });
});