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
 * 一時ステータスのJSONデータ構造
 * TemporaryStatusと同じ構造だが、JSONシリアライゼーション用に明示的に定義
 */
export interface TemporaryStatusData {
  id: string;
  name: TemporaryStatusName;
  type: TemporaryStatusType;
  effects: TemporaryStatusEffects;
  duration: number;
  stackable: boolean;
}
