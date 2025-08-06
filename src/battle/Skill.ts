/**
 * 技のターゲット種別
 */
export type SkillTarget = 'self' | 'enemy' | 'all';

/**
 * 技の効果種別
 */
export type SkillEffectType = 'damage' | 'heal' | 'buff' | 'debuff' | 'status';

/**
 * 技のインターフェース
 */
export interface Skill {
  /** 技ID */
  id: string;
  /** 技名 */
  name: string;
  /** 技の説明 */
  description: string;
  /** 消費MP */
  mpCost: number;
  /** MP回復量 */
  mpCharge: number;
  /** 行動コスト */
  actionCost: number;
  /** 威力倍率 */
  power: number;
  /** 基本命中率 */
  accuracy: number;
  /** ターゲット */
  target: SkillTarget;
  /** タイピング難易度 (1-5) */
  typingDifficulty: number;
  /** 追加効果 (オプション) */
  additionalEffect?: {
    type: SkillEffectType;
    value: number;
    duration?: number;
    chance?: number;
  };
}
