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
