/**
 * 技のターゲット種別
 */
export type SkillTarget = 'self' | 'enemy' | 'all';

/**
 * 技の効果種別
 */
export type SkillEffectType = 'damage' | 'hp_heal' | 'add_status' | 'remove_status';

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
  statusId: number; // 一時ステータスID
};

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
  /** 成功率[%] */
  successRate: number;
  /** ターゲット */
  target: SkillTarget;
  /** タイピング難易度 (1-5) */
  typingDifficulty: number;
  /** 効果 */
  effects: (DamageSkillEffect | HealSkillEffect | StatusSkillEffect)[];
}
