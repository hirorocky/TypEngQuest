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
  /** タイピング評価影響率 */
  typingInfluence: number;
}

/**
 * スキルクリティカル率設定
 */
export interface SkillCriticalRate {
  /** 基本クリティカル率（%） */
  baseRate: number;
  /** タイピング精度影響率（クリティカル率に対する影響） */
  typingInfluence: number;
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
  /** 効果が適用されるための条件（すべて満たす必要あり） */
  conditions?: SkillCondition[];
}

/**
 * スキル効果発動条件
 */
export type SkillCondition =
  | {
      type: 'typing_speed';
      value: import('../typing/types').SpeedRating;
      /** 既定: 'eq' */
      operator?: 'eq' | 'ne';
    }
  | {
      type: 'typing_accuracy';
      value: import('../typing/types').AccuracyRating;
      /** 既定: 'eq' */
      operator?: 'eq' | 'ne';
    }
  | {
      /** HPしきい値（%） */
      type: 'hp_threshold';
      target: 'self' | 'enemy';
      operator: 'lte' | 'gte';
      value: number; // 0-100 の割合
    }
  | {
      /** 敵が指定の状態異常IDを保持しているか */
      type: 'enemy_status';
      statusId: string;
    }
  | {
      /** 自身が指定のバフIDを保持しているか（TemporaryStatus.id） */
      type: 'self_buff';
      buffId: string;
    }
  | {
      /** 敏捷性判定（総合ステータスのagility） */
      type: 'agility_check';
      operator: 'lte' | 'gte';
      value: number;
    };

/**
 * 潜在効果（特定条件で追加適用される効果）
 */
export interface SkillPotentialEffect {
  triggerCondition: {
    typingPerfect?: boolean;
    exMode?: boolean;
  };
  effect: SkillEffect;
}

/**
 * コンボブースト定義
 */
export interface ComboBoost {
  boostType:
    | 'damage'
    | 'heal'
    | 'skill_success'
    | 'status_success'
    | 'mp_cost_reduction'
    | 'typing_difficulty'
    | 'potential';
  /** 値の意味は種類ごとに異なる（倍率や加算値） */
  value: number;
  /** デフォルト1（=次の1回のみ） */
  duration?: number;
}

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
  /** 潜在効果（条件成立時に追加） */
  potentialEffects?: SkillPotentialEffect[];
  /** このスキルが付与するコンボブースト（使用後にComboBoostManagerへ登録） */
  comboBoosts?: ComboBoost[];
}
