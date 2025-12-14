// Package domain はゲームのドメインモデルを定義します。
package domain

import "fmt"

// ChainEffectType はチェイン効果の種別を表す型です。
// モジュール使用後のリキャスト期間中に発動する追加効果の種類を定義します。
type ChainEffectType string

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
