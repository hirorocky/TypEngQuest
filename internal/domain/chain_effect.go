// Package domain はゲームのドメインモデルを定義します。
package domain

import "fmt"

// ChainEffectType はチェイン効果の種別を表す型です。
// モジュール使用後のリキャスト期間中に発動する追加効果の種類を定義します。
type ChainEffectType string

// ChainEffectCategory はチェイン効果のカテゴリを表す型です。
type ChainEffectCategory string

const (
	// ChainEffectCategoryAttack は攻撃強化カテゴリを表します。
	ChainEffectCategoryAttack ChainEffectCategory = "attack"

	// ChainEffectCategoryDefense は防御強化カテゴリを表します。
	ChainEffectCategoryDefense ChainEffectCategory = "defense"

	// ChainEffectCategoryHeal は回復強化カテゴリを表します。
	ChainEffectCategoryHeal ChainEffectCategory = "heal"

	// ChainEffectCategoryTyping はタイピングカテゴリを表します。
	ChainEffectCategoryTyping ChainEffectCategory = "typing"

	// ChainEffectCategoryRecast はリキャストカテゴリを表します。
	ChainEffectCategoryRecast ChainEffectCategory = "recast"

	// ChainEffectCategoryEffectExtend は効果延長カテゴリを表します。
	ChainEffectCategoryEffectExtend ChainEffectCategory = "effect_extend"

	// ChainEffectCategorySpecial は特殊カテゴリを表します。
	ChainEffectCategorySpecial ChainEffectCategory = "special"
)

const (
	// ChainEffectDamageBonus は追加ダメージ効果を表します。
	// 次の攻撃のダメージにボーナスを付与します。
	ChainEffectDamageBonus ChainEffectType = "damage_bonus"

	// ChainEffectHealBonus は追加回復効果を表します。
	// 次の回復量にボーナスを付与します。
	ChainEffectHealBonus ChainEffectType = "heal_bonus"

	// ChainEffectBuffExtend はバフ延長効果を表します。
	// バフスキルの効果時間を延長します。
	ChainEffectBuffExtend ChainEffectType = "buff_extend"

	// ChainEffectDebuffExtend はデバフ延長効果を表します。
	// デバフスキルの効果時間を延長します。
	ChainEffectDebuffExtend ChainEffectType = "debuff_extend"

	// === 攻撃強化カテゴリ ===

	// ChainEffectDamageAmp はダメージアンプを表します。
	// 効果中の攻撃ダメージを増加させます。
	ChainEffectDamageAmp ChainEffectType = "damage_amp"

	// ChainEffectArmorPierce はアーマーピアスを表します。
	// 効果中の攻撃が防御バフを無視します。
	ChainEffectArmorPierce ChainEffectType = "armor_pierce"

	// ChainEffectLifeSteal はライフスティールを表します。
	// 効果中の攻撃ダメージの一部をHPとして回復します。
	ChainEffectLifeSteal ChainEffectType = "life_steal"

	// === 防御強化カテゴリ ===

	// ChainEffectDamageCut はダメージカットを表します。
	// 効果中の被ダメージを軽減します。
	ChainEffectDamageCut ChainEffectType = "damage_cut"

	// ChainEffectEvasion はイベイジョンを表します。
	// 効果中に一定確率で攻撃を回避します。
	ChainEffectEvasion ChainEffectType = "evasion"

	// ChainEffectReflect はリフレクトを表します。
	// 効果中の被ダメージを反射します。
	ChainEffectReflect ChainEffectType = "reflect"

	// ChainEffectRegen はリジェネを表します。
	// 効果中毎秒HPを回復します。
	ChainEffectRegen ChainEffectType = "regen"

	// === 回復強化カテゴリ ===

	// ChainEffectHealAmp はヒールアンプを表します。
	// 効果中の回復量を増加させます。
	ChainEffectHealAmp ChainEffectType = "heal_amp"

	// ChainEffectOverheal はオーバーヒールを表します。
	// 効果中の超過回復を一時HPに変換します。
	ChainEffectOverheal ChainEffectType = "overheal"

	// === タイピングカテゴリ ===

	// ChainEffectTimeExtend はタイムエクステンドを表します。
	// 効果中のタイピング制限時間を延長します。
	ChainEffectTimeExtend ChainEffectType = "time_extend"

	// ChainEffectAutoCorrect はオートコレクトを表します。
	// 効果中に一定回数のミスを無視します。
	ChainEffectAutoCorrect ChainEffectType = "auto_correct"

	// === リキャストカテゴリ ===

	// ChainEffectCooldownReduce はクールダウンリデュースを表します。
	// 効果中に発生した他エージェントのリキャスト時間を短縮します。
	ChainEffectCooldownReduce ChainEffectType = "cooldown_reduce"

	// === 効果延長カテゴリ ===

	// ChainEffectBuffDuration はバフデュレーションを表します。
	// 効果中のバフスキル効果時間を延長します。
	ChainEffectBuffDuration ChainEffectType = "buff_duration"

	// ChainEffectDebuffDuration はデバフデュレーションを表します。
	// 効果中のデバフスキル効果時間を延長します。
	ChainEffectDebuffDuration ChainEffectType = "debuff_duration"

	// === 特殊カテゴリ ===

	// ChainEffectDoubleCast はダブルキャストを表します。
	// 効果中に一定確率でスキルを2回発動します。
	ChainEffectDoubleCast ChainEffectType = "double_cast"
)

// GenerateDescription はチェイン効果種別と効果値から説明文を生成します。
func (t ChainEffectType) GenerateDescription(value float64) string {
	switch t {
	case ChainEffectDamageBonus:
		return fmt.Sprintf("次の攻撃のダメージ+%.0f%%", value)
	case ChainEffectHealBonus:
		return fmt.Sprintf("次の回復量+%.0f%%", value)
	case ChainEffectBuffExtend:
		return fmt.Sprintf("バフ効果時間+%.0f秒", value)
	case ChainEffectDebuffExtend:
		return fmt.Sprintf("デバフ効果時間+%.0f秒", value)
	// 攻撃強化カテゴリ
	case ChainEffectDamageAmp:
		return fmt.Sprintf("効果中の攻撃ダメージ+%.0f%%", value)
	case ChainEffectArmorPierce:
		return "効果中の攻撃が防御バフ無視"
	case ChainEffectLifeSteal:
		return fmt.Sprintf("効果中の攻撃ダメージの%.0f%%回復", value)
	// 防御強化カテゴリ
	case ChainEffectDamageCut:
		return fmt.Sprintf("効果中の被ダメージ-%.0f%%", value)
	case ChainEffectEvasion:
		return fmt.Sprintf("効果中%.0f%%で攻撃回避", value)
	case ChainEffectReflect:
		return fmt.Sprintf("効果中被ダメージの%.0f%%反射", value)
	case ChainEffectRegen:
		return fmt.Sprintf("効果中毎秒HP%.0f%%回復", value)
	// 回復強化カテゴリ
	case ChainEffectHealAmp:
		return fmt.Sprintf("効果中の回復量+%.0f%%", value)
	case ChainEffectOverheal:
		return "効果中の超過回復を一時HPに"
	// タイピングカテゴリ
	case ChainEffectTimeExtend:
		return fmt.Sprintf("効果中のタイピング制限時間+%.0f秒", value)
	case ChainEffectAutoCorrect:
		return fmt.Sprintf("効果中ミス%.0f回まで無視", value)
	// リキャストカテゴリ
	case ChainEffectCooldownReduce:
		return fmt.Sprintf("効果中発生した他エージェントのリキャスト時間%.0f%%短縮", value)
	// 効果延長カテゴリ
	case ChainEffectBuffDuration:
		return fmt.Sprintf("効果中のバフスキル効果時間+%.0f秒", value)
	case ChainEffectDebuffDuration:
		return fmt.Sprintf("効果中のデバフスキル効果時間+%.0f秒", value)
	// 特殊カテゴリ
	case ChainEffectDoubleCast:
		return fmt.Sprintf("効果中%.0f%%でスキル2回発動", value)
	default:
		return "チェイン効果"
	}
}

// ChainEffect はモジュールインスタンスに紐づくチェイン効果を表す値オブジェクトです。
// モジュール取得時にランダム決定され、変更不可のイミュータブルな構造体です。
type ChainEffect struct {
	// Type はチェイン効果の種別です。
	Type ChainEffectType

	// Value は効果量です（ダメージ/回復量の割合、または延長秒数）。
	Value float64

	// Description は効果の説明文です。
	Description string
}

// NewChainEffect は指定されたタイプと効果値から新しいChainEffectを作成します。
// Descriptionはタイプと効果値から自動生成されます。
func NewChainEffect(effectType ChainEffectType, value float64) ChainEffect {
	return ChainEffect{
		Type:        effectType,
		Value:       value,
		Description: effectType.GenerateDescription(value),
	}
}

// Equals はこのチェイン効果と別のチェイン効果が等価かを判定します。
// Type、Value、Descriptionがすべて一致する場合に等価とみなします。
func (c ChainEffect) Equals(other ChainEffect) bool {
	return c.Type == other.Type &&
		c.Value == other.Value &&
		c.Description == other.Description
}

// Category はチェイン効果タイプのカテゴリを返します。
func (t ChainEffectType) Category() ChainEffectCategory {
	switch t {
	// 攻撃強化カテゴリ
	case ChainEffectDamageBonus, ChainEffectDamageAmp, ChainEffectArmorPierce, ChainEffectLifeSteal:
		return ChainEffectCategoryAttack
	// 防御強化カテゴリ
	case ChainEffectDamageCut, ChainEffectEvasion, ChainEffectReflect, ChainEffectRegen:
		return ChainEffectCategoryDefense
	// 回復強化カテゴリ
	case ChainEffectHealBonus, ChainEffectHealAmp, ChainEffectOverheal:
		return ChainEffectCategoryHeal
	// タイピングカテゴリ
	case ChainEffectTimeExtend, ChainEffectAutoCorrect:
		return ChainEffectCategoryTyping
	// リキャストカテゴリ
	case ChainEffectCooldownReduce:
		return ChainEffectCategoryRecast
	// 効果延長カテゴリ
	case ChainEffectBuffExtend, ChainEffectDebuffExtend, ChainEffectBuffDuration, ChainEffectDebuffDuration:
		return ChainEffectCategoryEffectExtend
	// 特殊カテゴリ
	case ChainEffectDoubleCast:
		return ChainEffectCategorySpecial
	default:
		return ChainEffectCategorySpecial
	}
}

// ToEntry は ChainEffect を EffectEntry に変換します。
// agentIndex は効果を登録したエージェントのインデックスです。
func (c ChainEffect) ToEntry(agentIndex int) EffectEntry {
	idx := agentIndex
	return EffectEntry{
		SourceType:  SourceChain,
		SourceID:    string(c.Type),
		SourceIndex: idx,
		Name:        c.Description,
		EnableCondition: func(ctx *EffectContext) bool {
			// 他エージェントがモジュールを使った時に発動
			if ctx.EventType != EventOnModuleUse {
				return false
			}
			return ctx.LastModuleAgent != idx && ctx.LastModuleAgent >= 0
		},
		Values:  c.buildValues(),
		Flags:   c.buildFlags(),
		OneShot: true, // チェイン効果は一度発動したら消える
	}
}

// buildValues はチェイン効果を EffectColumn の map に変換します。
func (c ChainEffect) buildValues() map[EffectColumn]float64 {
	values := make(map[EffectColumn]float64)

	switch c.Type {
	case ChainEffectDamageBonus:
		values[ColDamageBonus] = c.Value
	case ChainEffectDamageAmp:
		values[ColDamageMultiplier] = 1.0 + c.Value/100.0
	case ChainEffectLifeSteal:
		values[ColLifeSteal] = c.Value / 100.0
	case ChainEffectDamageCut:
		values[ColDamageCut] = c.Value / 100.0
	case ChainEffectEvasion:
		values[ColEvasion] = c.Value / 100.0
	case ChainEffectReflect:
		values[ColReflect] = c.Value / 100.0
	case ChainEffectRegen:
		values[ColRegen] = c.Value
	case ChainEffectHealBonus:
		values[ColHealBonus] = c.Value
	case ChainEffectHealAmp:
		values[ColHealMultiplier] = 1.0 + c.Value/100.0
	case ChainEffectTimeExtend:
		values[ColTimeExtend] = c.Value
	case ChainEffectAutoCorrect:
		values[ColAutoCorrect] = c.Value
	case ChainEffectCooldownReduce:
		values[ColCooldownReduce] = c.Value / 100.0
	case ChainEffectBuffExtend, ChainEffectBuffDuration:
		values[ColBuffExtend] = c.Value
	case ChainEffectDebuffExtend, ChainEffectDebuffDuration:
		values[ColDebuffExtend] = c.Value
	case ChainEffectDoubleCast:
		values[ColDoubleCast] = c.Value / 100.0
	}

	return values
}

// buildFlags はbool型効果を EffectColumn の map に変換します。
func (c ChainEffect) buildFlags() map[EffectColumn]bool {
	flags := make(map[EffectColumn]bool)

	switch c.Type {
	case ChainEffectArmorPierce:
		flags[ColArmorPierce] = true
	case ChainEffectOverheal:
		flags[ColOverheal] = true
	}

	return flags
}
