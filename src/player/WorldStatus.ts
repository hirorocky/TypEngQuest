import * as fs from 'fs';
import * as path from 'path';

/**
 * ワールドステータスの種別
 */
export type WorldStatusType = 'buff' | 'debuff' | 'special';

/**
 * ワールドステータスの名前
 */
export type WorldStatusName =
  // Buffs (良い効果)
  | 'Strength Blessing'
  | 'Willpower Blessing'
  | 'Agility Blessing'
  | 'Fortune Blessing'
  | 'Experience Boost'
  | 'Item Drop Boost'
  // Debuffs (悪い効果)
  | 'Strength Curse'
  | 'Willpower Curse'
  | 'Agility Curse'
  | 'Fortune Curse'
  | 'Experience Penalty'
  // Special (特殊効果)
  | 'Critical Master'
  | 'Dodge Master'
  | 'Skill Power Boost'
  | 'MP Efficiency';

/**
 * ワールドステータスの効果
 */
export interface WorldStatusEffects {
  /** strength（攻撃力）増減値 */
  strength?: number;
  /** willpower（意志力）増減値 */
  willpower?: number;
  /** agility（敏捷性）増減値 */
  agility?: number;
  /** fortune（幸運）増減値 */
  fortune?: number;
  /** 経験値取得倍率（1.0 = 100%） */
  experienceMultiplier?: number;
  /** アイテムドロップ率倍率（1.0 = 100%） */
  dropRateMultiplier?: number;
  /** クリティカル率追加値（%） */
  criticalRateBonus?: number;
  /** 回避率追加値（%） */
  dodgeRateBonus?: number;
  /** スキル威力倍率（1.0 = 100%） */
  skillPowerMultiplier?: number;
  /** MP消費倍率（1.0 = 100%, 0.8 = 20%削減） */
  mpCostMultiplier?: number;
}

/**
 * ワールドステータス
 * ワールド中継続する特殊な効果を管理するためのインターフェース
 */
export interface WorldStatus {
  /** 一意識別子 */
  id: string;
  /** 名前 */
  name: WorldStatusName;
  /** 種別 */
  type: WorldStatusType;
  /** ステータスへの影響 */
  effects: WorldStatusEffects;
  /** 説明文 */
  description: string;
  /** 同じ効果を重ねがけ可能か */
  stackable: boolean;
}

/**
 * オブジェクトがWorldStatusEffectsの有効な構造かどうかを検証する
 * @param obj - 検証するオブジェクト
 * @returns 有効な場合true
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isWorldStatusEffects(obj: any): obj is WorldStatusEffects {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // 数値プロパティのチェック
  const numberProps = [
    'strength',
    'willpower',
    'agility',
    'fortune',
    'experienceMultiplier',
    'dropRateMultiplier',
    'criticalRateBonus',
    'dodgeRateBonus',
    'skillPowerMultiplier',
    'mpCostMultiplier',
  ];

  for (const prop of numberProps) {
    if (obj[prop] !== undefined && typeof obj[prop] !== 'number') {
      return false;
    }
  }

  return true;
}

/**
 * JSONファイルからWorldStatusを読み込む
 */
interface WorldStatusData {
  worldStatuses: WorldStatus[];
}

let worldStatusData: WorldStatusData | null = null;

function loadWorldStatusData() {
  if (!worldStatusData) {
    const dataPath = path.join(__dirname, '../../data/world-status.json');
    worldStatusData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }
  return worldStatusData;
}

/**
 * 有効なWorldStatusNameの配列を取得
 */
function getValidWorldStatusNames(): WorldStatusName[] {
  const data = loadWorldStatusData();
  if (!data) {
    return [];
  }
  return data.worldStatuses.map((status: WorldStatus) => status.name);
}

/**
 * 有効なWorldStatusTypeの配列を取得
 */
function getValidWorldStatusTypes(): WorldStatusType[] {
  const data = loadWorldStatusData();
  if (!data) {
    return [];
  }
  return Array.from(new Set(data.worldStatuses.map((status: WorldStatus) => status.type)));
}

/**
 * オブジェクトがWorldStatusの有効な構造かどうかを検証する
 * @param obj - 検証するオブジェクト
 * @returns 有効な場合true
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isWorldStatus(obj: any): obj is WorldStatus {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // 必須プロパティのチェック
  if (typeof obj.id !== 'string') return false;
  if (typeof obj.name !== 'string') return false;
  if (typeof obj.type !== 'string') return false;
  if (typeof obj.description !== 'string') return false;
  if (typeof obj.stackable !== 'boolean') return false;

  // 名前が有効なWorldStatusNameかチェック
  if (!getValidWorldStatusNames().includes(obj.name as WorldStatusName)) return false;

  // 種別が有効なWorldStatusTypeかチェック
  if (!getValidWorldStatusTypes().includes(obj.type as WorldStatusType)) return false;

  // 効果が有効な構造かチェック
  return isWorldStatusEffects(obj.effects);
}
