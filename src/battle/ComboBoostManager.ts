import { ComboBoost, Skill, SkillEffect } from './Skill';

/**
 * ComboBoostManager
 * - 次回以降のスキルに一時的な強化を適用し、使用時に消費する
 */
export class ComboBoostManager {
  private boosts: ComboBoost[] = [];

  register(boosts: ComboBoost[] | undefined): void {
    if (!boosts || boosts.length === 0) return;
    for (const b of boosts) {
      this.boosts.push({ ...b, duration: b.duration ?? 1 });
    }
  }

  /**
   * スキルへ適用されたブーストの種類を返しつつ、適用結果のスキルを生成
   * 実際の消費は {@link consumeOnce} を呼び出すこと
   */
  applyToSkill(skill: Skill): { modified: Skill; applied: ComboBoost[] } {
    if (this.boosts.length === 0) return { modified: skill, applied: [] };

    // 深い変更を避けてシャローコピー + effects配列のコピー
    const modified: Skill = {
      ...skill,
      mpCost: skill.mpCost,
      effects: skill.effects.map(e => ({ ...e }) as SkillEffect),
    };

    const applied: ComboBoost[] = [];

    for (const boost of this.boosts) {
      applied.push(boost);
      switch (boost.boostType) {
        case 'mp_cost_reduction': {
          const reduced = Math.max(0, Math.floor(modified.mpCost - boost.value));
          modified.mpCost = reduced;
          break;
        }
        case 'skill_success': {
          // baseRate を加算（上限はBattleCalculator側でクリップ想定）
          modified.skillSuccessRate = {
            ...modified.skillSuccessRate,
            baseRate: modified.skillSuccessRate.baseRate + boost.value,
          };
          break;
        }
        case 'status_success': {
          modified.effects = modified.effects.map(e =>
            e.type === 'add_status' || e.type === 'remove_status'
              ? { ...e, successRate: e.successRate + boost.value }
              : e
          );
          break;
        }
        case 'damage': {
          modified.effects = modified.effects.map(e =>
            e.type === 'damage'
              ? { ...e, basePower: Math.floor(e.basePower * (1 + boost.value)) }
              : e
          );
          break;
        }
        case 'heal': {
          modified.effects = modified.effects.map(e =>
            e.type === 'hp_heal'
              ? { ...e, basePower: Math.floor(e.basePower * (1 + boost.value)) }
              : e
          );
          break;
        }
        case 'typing_difficulty': {
          const newDiff = Math.max(1, modified.typingDifficulty - Math.floor(boost.value));
          modified.typingDifficulty = newDiff as typeof modified.typingDifficulty;
          break;
        }
        case 'potential': {
          // potential は判定時に影響（ここでは何もしない）
          break;
        }
        default:
          // never
          break;
      }
    }

    return { modified, applied };
  }

  /**
   * 1回分消費（durationを1減らし、0は除去）
   */
  consumeOnce(): void {
    if (this.boosts.length === 0) return;
    this.boosts = this.boosts
      .map(b => ({ ...b, duration: (b.duration ?? 1) - 1 }))
      .filter(b => (b.duration ?? 0) > 0);
  }

  clear(): void {
    this.boosts = [];
  }
}
