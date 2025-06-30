import { SaveManager } from '../saveManager';
import { SaveData, SaveResult, LoadResult, SaveFileInfo } from '../saveData';
import { Player } from '../player';
import { World } from '../../world/world';
import { Map } from '../../world/map';
import { BattleCommands } from '../../battle/battleCommands';
import { ElementManager } from '../../world/elements';
import fs from 'fs';
import path from 'path';

// テスト用のモック関数
jest.mock('fs');
jest.mock('path');

describe('SaveManagerクラス', () => {
  let saveManager: SaveManager;
  let player: Player;
  let world: World;
  let map: Map;
  let elementManager: ElementManager;
  let battleCommands: BattleCommands;
  const mockSavesDir = './test-saves';

  beforeEach(() => {
    // テスト環境のセットアップ
    player = new Player('TestPlayer');
    map = new Map();
    world = new World('TestWorld', 1, map);
    elementManager = new ElementManager();
    battleCommands = new BattleCommands(player, map, world, elementManager);

    saveManager = new SaveManager(mockSavesDir);

    // fsモックのリセット
    jest.clearAllMocks();
  });

  describe('初期化', () => {
    test('SaveManagerインスタンスが正常に作成される', () => {
      expect(saveManager).toBeDefined();
      expect(saveManager).toBeInstanceOf(SaveManager);
    });

    test('セーブディレクトリが存在しない場合に作成される', () => {
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockMkdirSync = fs.mkdirSync as jest.MockedFunction<typeof fs.mkdirSync>;

      mockExistsSync.mockReturnValue(false);

      new SaveManager(mockSavesDir);

      expect(mockMkdirSync).toHaveBeenCalledWith(mockSavesDir, { recursive: true });
    });

    test('セーブディレクトリが既に存在する場合は作成されない', () => {
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockMkdirSync = fs.mkdirSync as jest.MockedFunction<typeof fs.mkdirSync>;

      mockExistsSync.mockReturnValue(true);

      new SaveManager(mockSavesDir);

      expect(mockMkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('セーブ機能', () => {
    test('プレイヤーデータを正常にセーブできる', async () => {
      const mockWriteFileSync = fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>;
      mockWriteFileSync.mockImplementation(() => {});

      const result = await saveManager.saveGame(1, player, world, map, elementManager, battleCommands);

      expect(result.success).toBe(true);
      expect(result.slot).toBe(1);
      expect(result.message).toContain('successfully');
      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    });

    test('セーブデータの構造が正しい', async () => {
      const mockWriteFileSync = fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>;
      let savedData: string = '';

      mockWriteFileSync.mockImplementation((filePath, data) => {
        savedData = data as string;
      });

      await saveManager.saveGame(1, player, world, map, elementManager, battleCommands);

      const saveData: SaveData = JSON.parse(savedData);

      expect(saveData.version).toBeDefined();
      expect(saveData.timestamp).toBeDefined();
      expect(saveData.slot).toBe(1);
      expect(saveData.player).toBeDefined();
      expect(saveData.player.name).toBe('TestPlayer');
      expect(saveData.world).toBeDefined();
      expect(saveData.world.name).toBe('TestWorld');
      expect(saveData.metadata).toBeDefined();
    });

    test('セーブスロット番号の検証', async () => {
      const result1 = await saveManager.saveGame(0, player, world, map, elementManager, battleCommands);
      expect(result1.success).toBe(false);
      expect(result1.message).toContain('Invalid slot');

      const result2 = await saveManager.saveGame(11, player, world, map, elementManager, battleCommands);
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('Invalid slot');
    });

    test('ファイル書き込みエラーの処理', async () => {
      const mockWriteFileSync = fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>;
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await saveManager.saveGame(1, player, world, map, elementManager, battleCommands);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to save');
    });

    test('セーブファイルの命名規則が正しい', async () => {
      const mockWriteFileSync = fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>;
      let filePath: string = '';

      mockWriteFileSync.mockImplementation((path, data) => {
        filePath = path as string;
      });

      await saveManager.saveGame(3, player, world, map, elementManager, battleCommands);

      expect(filePath).toContain('save-3.json');
    });
  });

  describe('ロード機能', () => {
    const mockSaveData: SaveData = {
      version: '1.0.0',
      timestamp: '2025-06-29T00:00:00.000Z',
      playTime: 3600,
      slot: 1,
      player: {
        name: 'TestPlayer',
        stats: {
          level: 5,
          experience: 100,
          experienceToNext: 200,
          currentHealth: 80,
          maxHealth: 100,
          currentMana: 50,
          maxMana: 60,
          baseAttack: 10,
          baseDefense: 8,
          baseSpeed: 6,
          baseAccuracy: 75,
          baseCritical: 5,
          equipmentAttack: 2,
          equipmentDefense: 1,
          equipmentSpeed: 0,
          equipmentAccuracy: 5,
          equipmentCritical: 1,
        },
        equipment: [
          { slotNumber: 1, word: 'the', wordType: 'article' },
          { slotNumber: 2, word: null, wordType: null },
          { slotNumber: 3, word: null, wordType: null },
          { slotNumber: 4, word: null, wordType: null },
          { slotNumber: 5, word: null, wordType: null },
        ],
        inventory: ['quick', 'brown', 'fox'],
        hasKey: false,
        worldHistory: [],
      },
      world: {
        name: 'TestWorld',
        level: 1,
        bossDefeated: false,
        keyObtained: false,
      },
      gameState: {
        currentScreen: 'game',
        currentPath: '/',
        isInBattle: false,
      },
      mapLocations: [],
      eventSystem: {
        activeBuffs: [],
        activeDebuffs: [],
        eventHistory: [],
        eventStats: {
          totalEvents: 0,
          goodEvents: 0,
          badEvents: 0,
          avoidanceSuccessRate: 0,
        },
      },
      metadata: {
        gameName: 'TypEngQuest',
        saveDescription: 'Test save',
      },
    };

    test('セーブデータを正常にロードできる', async () => {
      const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(mockSaveData));

      const result = await saveManager.loadGame(1);

      expect(result.success).toBe(true);
      expect(result.saveData).toBeDefined();
      expect(result.saveData!.player.name).toBe('TestPlayer');
      expect(result.saveData!.player.stats.level).toBe(5);
    });

    test('存在しないセーブスロットのロード', async () => {
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      mockExistsSync.mockReturnValue(false);

      const result = await saveManager.loadGame(1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
      expect(result.saveData).toBeUndefined();
    });

    test('無効なスロット番号のロード', async () => {
      const result1 = await saveManager.loadGame(0);
      expect(result1.success).toBe(false);
      expect(result1.message).toContain('Invalid slot');

      const result2 = await saveManager.loadGame(11);
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('Invalid slot');
    });

    test('破損したセーブファイルの処理', async () => {
      const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('invalid json data');

      const result = await saveManager.loadGame(1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('corrupted');
    });

    test('ファイル読み込みエラーの処理', async () => {
      const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await saveManager.loadGame(1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to load');
    });
  });

  describe('セーブファイル管理', () => {
    test('セーブファイル一覧を取得できる', async () => {
      const mockReaddirSync = fs.readdirSync as jest.MockedFunction<typeof fs.readdirSync>;
      const mockStatSync = fs.statSync as jest.MockedFunction<typeof fs.statSync>;
      const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;

      mockReaddirSync.mockReturnValue(['save-1.json', 'save-3.json', 'other-file.txt'] as any);
      mockStatSync.mockReturnValue({ mtime: new Date('2025-06-29') } as any);
      mockReadFileSync.mockImplementation((filePath) => {
        const baseSaveData = {
          version: '1.0.0',
          timestamp: '2025-06-29T00:00:00.000Z',
          playTime: 3600,
          world: {
            name: 'TestWorld',
            level: 1,
            bossDefeated: false,
            keyObtained: false,
          },
          gameState: {
            currentScreen: 'game' as const,
            currentPath: '/',
            isInBattle: false,
          },
          mapLocations: [],
          eventSystem: {
            activeBuffs: [],
            activeDebuffs: [],
            eventHistory: [],
            eventStats: {
              totalEvents: 0,
              goodEvents: 0,
              badEvents: 0,
              avoidanceSuccessRate: 0,
            },
          },
          metadata: {
            gameName: 'TypEngQuest',
            saveDescription: 'Test save',
          },
        };
        
        const basePlayerStats = {
          level: 1,
          experience: 0,
          experienceToNext: 100,
          currentHealth: 100,
          maxHealth: 100,
          currentMana: 50,
          maxMana: 50,
          baseAttack: 10,
          baseDefense: 8,
          baseSpeed: 6,
          baseAccuracy: 75,
          baseCritical: 5,
          equipmentAttack: 0,
          equipmentDefense: 0,
          equipmentSpeed: 0,
          equipmentAccuracy: 0,
          equipmentCritical: 0,
        };
        
        if (filePath.toString().includes('save-1.json')) {
          return JSON.stringify({
            ...baseSaveData,
            slot: 1,
            player: {
              name: 'Player1',
              stats: { ...basePlayerStats, level: 5 },
              equipment: [],
              inventory: [],
              hasKey: false,
              worldHistory: [],
            },
          });
        }
        if (filePath.toString().includes('save-3.json')) {
          return JSON.stringify({
            ...baseSaveData,
            slot: 3,
            player: {
              name: 'Player3',
              stats: { ...basePlayerStats, level: 10 },
              equipment: [],
              inventory: [],
              hasKey: false,
              worldHistory: [],
            },
          });
        }
        return '{}';
      });

      const saveFiles = await saveManager.listSaveFiles();

      expect(saveFiles).toHaveLength(10); // 全10スロット
      expect(saveFiles[0].exists).toBe(true);
      expect(saveFiles[0].playerName).toBe('Player1');
      expect(saveFiles[0].playerLevel).toBe(5);
      expect(saveFiles[2].exists).toBe(true);
      expect(saveFiles[2].playerName).toBe('Player3');
      expect(saveFiles[2].playerLevel).toBe(10);
      expect(saveFiles[1].exists).toBe(false);
    });

    test('セーブファイル削除機能', async () => {
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockUnlinkSync = fs.unlinkSync as jest.MockedFunction<typeof fs.unlinkSync>;

      mockExistsSync.mockReturnValue(true);

      const result = await saveManager.deleteSave(2);

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted');
      expect(mockUnlinkSync).toHaveBeenCalledTimes(1);
    });

    test('存在しないセーブファイルの削除試行', async () => {
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      mockExistsSync.mockReturnValue(false);

      const result = await saveManager.deleteSave(2);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('データ変換機能', () => {
    test('プレイヤーデータの変換が正しい', () => {
      // レベルアップとアイテム取得
      player.addExperience(100);
      player.addToInventory('function');
      player.equipWord(1, 'the');

      const convertedData = saveManager.convertPlayerData(player);

      expect(convertedData.name).toBe(player.getName());
      expect(convertedData.stats.experience).toBe(player.getStats().experience);
      expect(convertedData.inventory).toContain('function');
      expect(convertedData.equipment[0].word).toBe('the');
    });

    test('ワールドデータの変換が正しい', () => {
      const convertedData = saveManager.convertWorldData(world);

      expect(convertedData.name).toBe(world.getName());
      expect(convertedData.level).toBe(world.getLevel());
      expect(convertedData.bossDefeated).toBe(false);
      expect(convertedData.keyObtained).toBe(false);
    });

    test('マップデータの変換が正しい', () => {
      // いくつかの場所を探索済みにする
      const location1 = map.findLocation('/test.js');
      const location2 = map.findLocation('/data.json');

      if (location1) {
        location1.markExplored();
      }
      if (location2) {
        location2.markExplored();
      }

      const convertedData = saveManager.convertMapData(map);

      expect(convertedData).toBeDefined();
      expect(Array.isArray(convertedData)).toBe(true);
      
      // 探索済みの場所が含まれているか確認
      const exploredLocations = convertedData.filter(loc => loc.isExplored);
      expect(exploredLocations.length).toBeGreaterThan(0);
    });
  });

  describe('自動セーブ機能', () => {
    test('自動セーブスロット（スロット10）への保存', async () => {
      const mockWriteFileSync = fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>;
      mockWriteFileSync.mockImplementation(() => {});

      const result = await saveManager.autoSave(player, world, map, elementManager, battleCommands);

      expect(result.success).toBe(true);
      expect(result.slot).toBe(10); // 自動セーブ専用スロット
      expect(result.message).toContain('Auto-saved');
    });

    test('自動セーブの有効/無効切り替え', () => {
      expect(saveManager.isAutoSaveEnabled()).toBe(true); // デフォルトは有効

      saveManager.setAutoSaveEnabled(false);
      expect(saveManager.isAutoSaveEnabled()).toBe(false);

      saveManager.setAutoSaveEnabled(true);
      expect(saveManager.isAutoSaveEnabled()).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    test('無効な引数での処理', async () => {
      const result = await saveManager.saveGame(1, null as any, world, map, elementManager, battleCommands);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    test('セーブディレクトリのアクセス権限エラー', () => {
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockMkdirSync = fs.mkdirSync as jest.MockedFunction<typeof fs.mkdirSync>;

      mockExistsSync.mockReturnValue(false);
      mockMkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => {
        new SaveManager('/invalid/path');
      }).toThrow('Failed to create saves directory');
    });
  });

  describe('バージョン互換性', () => {
    test('古いバージョンのセーブデータの検出', async () => {
      const oldSaveData = {
        version: '0.9.0',
        // 他のフィールドは省略
      };

      const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(oldSaveData));

      const result = await saveManager.loadGame(1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('version');
    });

    test('現在のバージョンの取得', () => {
      const version = saveManager.getCurrentVersion();
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+$/); // semver形式
    });
  });
});