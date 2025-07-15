/**
 * 一時ステータスの種別
 */
export type TemporaryStatusType = 'buff' | 'debuff' | 'status_ailment';

/**
 * 一時ステータスの名前
 */
export type TemporaryStatusName =
  // Buffs
  | 'Attack Up'
  | 'Defense Up'
  | 'Speed Up'
  | 'Accuracy Up'
  | 'Fortune Up'
  | 'All Stats Up'
  | 'Regeneration'
  // Debuffs
  | 'Attack Down'
  | 'Defense Down'
  | 'Speed Down'
  | 'Accuracy Down'
  | 'Fortune Down'
  | 'All Stats Down'
  // Status Ailments
  | 'Poison'
  | 'Paralysis'
  | 'Sleep'
  | 'Confusion'
  | 'Burn'
  | 'Freeze';

/**
 * 一時ステータスの効果
 */
export interface TemporaryStatusEffects {
  /** 攻撃力増減値 */
  attack?: number;
  /** 防御力増減値 */
  defense?: number;
  /** 速度増減値 */
  speed?: number;
  /** 命中率増減値 */
  accuracy?: number;
  /** 幸運増減値 */
  fortune?: number;
  /** 毎ターンのHP増減（毒などで使用） */
  hpPerTurn?: number;
  /** 毎ターンのMP増減 */
  mpPerTurn?: number;
  /** 行動不能（麻痺、睡眠） */
  cannotAct?: boolean;
  /** 逃走不可 */
  cannotRun?: boolean;
}

/**
 * 一時ステータス
 * バフ、デバフ、状態異常を統一的に管理するためのインターフェース
 */
export interface TemporaryStatus {
  /** 一意識別子 */
  id: string;
  /** 名前（例: "Attack Up", "Poison"） */
  name: TemporaryStatusName;
  /** 種別 */
  type: TemporaryStatusType;
  /** ステータスへの影響 */
  effects: TemporaryStatusEffects;
  /** 残り継続期間（ターン数、-1で永続） */
  duration: number;
  /** 同じ効果を重ねがけ可能か */
  stackable: boolean;
}

/**
 * オブジェクトがTemporaryStatusEffectsの有効な構造かどうかを検証する
 * @param obj - 検証するオブジェクト
 * @returns 有効な場合true
 */
export function isTemporaryStatusEffects(obj: any): obj is TemporaryStatusEffects {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // 数値プロパティのチェック
  const numberProps = [
    'attack',
    'defense',
    'speed',
    'accuracy',
    'fortune',
    'hpPerTurn',
    'mpPerTurn',
  ];
  for (const prop of numberProps) {
    if (obj[prop] !== undefined && typeof obj[prop] !== 'number') {
      return false;
    }
  }

  // 真偽値プロパティのチェック
  const booleanProps = ['cannotAct', 'cannotRun'];
  for (const prop of booleanProps) {
    if (obj[prop] !== undefined && typeof obj[prop] !== 'boolean') {
      return false;
    }
  }

  return true;
}

/**
 * 有効なTemporaryStatusNameの定数配列
 */
const VALID_TEMPORARY_STATUS_NAMES: TemporaryStatusName[] = [
  'Attack Up',
  'Defense Up',
  'Speed Up',
  'Accuracy Up',
  'Fortune Up',
  'All Stats Up',
  'Regeneration',
  'Attack Down',
  'Defense Down',
  'Speed Down',
  'Accuracy Down',
  'Fortune Down',
  'All Stats Down',
  'Poison',
  'Paralysis',
  'Sleep',
  'Confusion',
  'Burn',
  'Freeze',
];

/**
 * 有効なTemporaryStatusTypeの定数配列
 */
const VALID_TEMPORARY_STATUS_TYPES: TemporaryStatusType[] = ['buff', 'debuff', 'status_ailment'];

/**
 * オブジェクトがTemporaryStatusの有効な構造かどうかを検証する
 * @param obj - 検証するオブジェクト
 * @returns 有効な場合true
 */
export function isTemporaryStatus(obj: any): obj is TemporaryStatus {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // 必須プロパティのチェック
  if (typeof obj.id !== 'string') return false;
  if (typeof obj.name !== 'string') return false;
  if (typeof obj.type !== 'string') return false;
  if (typeof obj.duration !== 'number') return false;
  if (typeof obj.stackable !== 'boolean') return false;

  // 名前が有効なTemporaryStatusNameかチェック
  if (!VALID_TEMPORARY_STATUS_NAMES.includes(obj.name as TemporaryStatusName)) return false;

  // 種別が有効なTemporaryStatusTypeかチェック
  if (!VALID_TEMPORARY_STATUS_TYPES.includes(obj.type as TemporaryStatusType)) return false;

  // 効果が有効な構造かチェック
  return isTemporaryStatusEffects(obj.effects);
}
