/**
 * フェーズ間のインターフェース定義
 */

/**
 * BattleTypingPhaseの結果
 * 複数スキルの実行結果をまとめて返す
 */
export interface BattleTypingResult {
  /** 完了したスキル数 */
  completedSkills: number;
  /** 総スキル数 */
  totalSkills: number;
  /** 戦闘結果のサマリー */
  summary: {
    /** 与えた総ダメージ */
    totalDamageDealt: number;
    /** 回復した総HP */
    totalHealing: number;
    /** 回復した総MP */
    totalMpRestored: number;
    /** 適用した状態効果 */
    statusEffectsApplied: string[];
    /** クリティカルヒット数 */
    criticalHits: number;
    /** ミス数 */
    misses: number;
  };
  /** HP0による戦闘終了フラグ */
  battleEnded: boolean;
}

/**
 * 各フェーズが返すべき結果
 * フェーズ間の統一的なインターフェース
 */
export interface PhaseResult<T = unknown> {
  /** 結果のタイプ */
  type: 'complete' | 'cancel';
  /** フェーズ固有のデータ */
  data?: T;
}

/**
 * スキル選択フェーズの結果
 */
export interface SkillSelectionResult {
  selectedSkills: import('../battle/Skill').Skill[];
}

/**
 * アイテム使用フェーズの結果
 */
export interface ItemUsageResult {
  itemUsed?: import('../items/ConsumableItem').ConsumableItem;
}

/**
 * 逃走チャレンジの結果
 */
export interface EscapeResult {
  escaped: boolean;
}
