/**
 * セーブデータの型定義
 * ゲーム状態の完全な保存・復元に必要な全データ構造を定義
 */

/**
 * プレイヤーの装備情報
 */
export interface SavedEquipmentSlot {
  slotNumber: number;
  word: string | null;
  wordType: string | null;
}

/**
 * プレイヤーのステータス情報
 */
export interface SavedPlayerStats {
  level: number;
  experience: number;
  experienceToNext: number;
  currentHealth: number;
  maxHealth: number;
  currentMana: number;
  maxMana: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  baseAccuracy: number;
  baseCritical: number;
  equipmentAttack: number;
  equipmentDefense: number;
  equipmentSpeed: number;
  equipmentAccuracy: number;
  equipmentCritical: number;
}

/**
 * プレイヤーの保存データ
 */
export interface SavedPlayerData {
  name: string;
  stats: SavedPlayerStats;
  equipment: SavedEquipmentSlot[];
  inventory: string[];
  hasKey: boolean;
  worldHistory: Array<{
    worldName: string;
    level: number;
    clearedAt: string;
    memories: string[];
  }>;
}

/**
 * マップ上の場所の保存データ
 */
export interface SavedLocationData {
  path: string;
  type: 'file' | 'directory';
  isExplored: boolean;
  hasElement: boolean;
  elementData?: {
    type: string;
    data: Record<string, unknown>;
  };
}

/**
 * ワールドの保存データ
 */
export interface SavedWorldData {
  name: string;
  level: number;
  bossDefeated: boolean;
  keyObtained: boolean;
  bossData?: {
    name: string;
    health: number;
    maxHealth: number;
    defeated: boolean;
  };
}

/**
 * ランダムイベントシステムの保存データ
 */
export interface SavedEventData {
  activeBuffs: Array<{
    statType: string;
    value: number;
    duration: number;
  }>;
  activeDebuffs: Array<{
    statType: string;
    value: number;
    duration: number;
  }>;
  eventHistory: Array<{
    eventId: string;
    type: 'good' | 'bad';
    timestamp: string;
    success: boolean;
    avoidanceSuccess?: 'complete' | 'partial' | 'failed';
  }>;
  eventStats: {
    totalEvents: number;
    goodEvents: number;
    badEvents: number;
    avoidanceSuccessRate: number;
  };
}

/**
 * ゲーム状態の保存データ
 */
export interface SavedGameState {
  currentScreen: 'menu' | 'game' | 'battle' | 'equipment' | 'quit';
  currentPath: string;
  isInBattle: boolean;
  battleData?: {
    enemyName: string;
    enemyHealth: number;
    enemyMaxHealth: number;
    currentChallenge?: {
      word: string;
      timeLimit: number;
      difficulty: number;
    };
  };
}

/**
 * 完全なセーブデータ
 */
export interface SaveData {
  version: string;
  timestamp: string;
  playTime: number;
  slot: number;
  player: SavedPlayerData;
  world: SavedWorldData;
  gameState: SavedGameState;
  mapLocations: SavedLocationData[];
  eventSystem: SavedEventData;
  metadata: {
    gameName: string;
    saveDescription?: string;
    screenshot?: string;
  };
}

/**
 * セーブファイルの情報（一覧表示用）
 */
export interface SaveFileInfo {
  slot: number;
  timestamp: string;
  playTime: number;
  playerName: string;
  playerLevel: number;
  worldName: string;
  worldLevel: number;
  description?: string;
  exists: boolean;
}

/**
 * セーブ操作の結果
 */
export interface SaveResult {
  success: boolean;
  message: string;
  slot?: number;
  filePath?: string;
}

/**
 * ロード操作の結果
 */
export interface LoadResult {
  success: boolean;
  message: string;
  saveData?: SaveData;
}
