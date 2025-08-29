/**
 * 技の種別（物理/魔法）
 */
export type SkillType = 'physical' | 'magical';

/**
 * 技のターゲット種別
 */
export type SkillTarget = 'self' | 'enemy' | 'all';

/**
 * ステータス影響設定
 */
export interface StatInfluence {
  /** 影響を与えるステータス */
  stat: 'strength' | 'willpower' | 'agility' | 'fortune';
  /** 影響率（パーセント単位） */
  rate: number;
}

/**
 * スキル成功率設定
 */
export interface SkillSuccessRate {
  /** 基本成功率（%） */
  baseRate: number;
  /** agility影響率 */
  agilityInfluence: number;
  /** タイピング評価影響率 */
  typingInfluence: number;
}

/**
 * スキルクリティカル率設定
 */
export interface SkillCriticalRate {
  /** 基本クリティカル率（%） */
  baseRate: number;
  /** fortune影響率 */
  fortuneInfluence: number;
}

/**
 * 技の効果種別
 */
export type SkillEffectType = 'damage' | 'hp_heal' | 'add_status' | 'remove_status';

/**
 * 統一されたスキル効果インターフェース
 */
export interface SkillEffect {
  /** 効果タイプ */
  type: SkillEffectType;
  /** ターゲット */
  target: SkillTarget;
  /** 基本威力 */
  basePower: number;
  /** ステータス影響設定（オプション） */
  powerInfluence?: StatInfluence;
  /** 効果の成功率（%） */
  successRate: number;
  /** 状態異常ID（add_status/remove_status用） */
  statusId?: string;
}

// 後方互換性のための型定義
export type DamageSkillEffect = {
  type: 'damage';
  power: number; // 威力倍率
  target: SkillTarget; // ターゲット
};

export type HealSkillEffect = {
  type: 'hp_heal';
  power: number; // HP回復量
  target: SkillTarget; // ターゲット
};

export type StatusSkillEffect = {
  type: 'add_status' | 'remove_status';
  statusId: string; // 一時ステータスID
};

/**
 * 技のインターフェース（新仕様）
 */
export interface Skill {
  /** 技ID */
  id: string;
  /** 技名 */
  name: string;
  /** 技の説明 */
  description: string;
  /** スキル種別（物理/魔法） */
  skillType: SkillType;
  /** 消費MP */
  mpCost: number;
  /** MP回復量 */
  mpCharge: number;
  /** 行動コスト */
  actionCost: number;
  /** ターゲット */
  target: SkillTarget;
  /** タイピング難易度 (1-5) */
  typingDifficulty: number;
  /** スキル全体の成功率設定 */
  skillSuccessRate: SkillSuccessRate;
  /** クリティカル率設定 */
  criticalRate: SkillCriticalRate;
  /** 効果リスト */
  effects: SkillEffect[];

  // 後方互換性のための非推奨プロパティ
  /** @deprecated 新仕様ではskillSuccessRate.baseRateを使用 */
  successRate?: number;
}
