// Package domain はゲームのドメインモデルを定義します。
// コア、モジュール、エージェント、敵、プレイヤーなどのエンティティとそのビジネスルールを含みます。
package domain

// BaseStatValue はステータス計算で使用する基礎値です。
// ステータス = 基礎値 × レベル × 重み
const BaseStatValue = 10

// Stats はゲーム内のステータス値を表す構造体です。
// 各ステータスはコアのレベルと特性の重みによって計算されます。
type Stats struct {
	// STR は物理攻撃力を表します。
	// 物理攻撃モジュールのダメージ計算に使用されます。
	STR int

	// MAG は魔法攻撃力を表します。
	// 魔法攻撃モジュールと回復モジュールの効果計算に使用されます。
	MAG int

	// SPD は速度を表します。
	// 行動間隔やクールダウンに影響します。
	SPD int

	// LUK は運を表します。
	// クリティカル率や回避に影響します。
	LUK int
}

// Total はステータスの合計値を返します。
func (s Stats) Total() int {
	return s.STR + s.MAG + s.SPD + s.LUK
}

// PassiveSkill はコア特性に紐づくパッシブスキルを表す構造体です。
// 各コア特性は1つの固有パッシブスキルを持ちます。
type PassiveSkill struct {
	// ID はパッシブスキルの一意識別子です。
	ID string

	// Name はパッシブスキルの表示名です。
	Name string

	// Description はパッシブスキルの効果説明です。
	Description string
}

// CoreType はコアの特性（タイプ）を定義する構造体です。
// 外部データファイル（cores.json）から読み込まれ、ゲーム内のコア特性を定義します。
// 例: 攻撃バランス、パラディン、オールラウンダー、ヒーラー
type CoreType struct {
	// ID はコア特性の一意識別子です。
	ID string

	// Name はコア特性の表示名です（日本語）。
	Name string

	// StatWeights はステータス計算に使用する重みのマップです。
	// キーは "STR", "MAG", "SPD", "LUK" で、値は重み係数（例: 1.2）です。
	StatWeights map[string]float64

	// PassiveSkillID はこのコア特性に紐づくパッシブスキルのIDです。
	PassiveSkillID string

	// AllowedTags はこのコア特性に装備可能なモジュールタグのリストです。
	// 例: ["physical_low", "magic_low"]
	AllowedTags []string

	// MinDropLevel はこのコア特性がドロップする最低敵レベルです。
	// このレベル未満の敵からはこの特性のコアはドロップしません。
	MinDropLevel int
}

// CoreModel はゲーム内のコアエンティティを表す構造体です。
// コアはエージェント合成時の中核となる素材で、レベルとステータスを持ちます。
// コアのレベルはドロップ時に固定され、成長/アップグレードはできません。
type CoreModel struct {
	// ID はコアインスタンスの一意識別子です。
	ID string

	// Name はコアの表示名です。
	Name string

	// Level はコアのレベルです（ドロップ時に決定、変更不可）。
	// エージェントのレベル = コアのレベルとなります。
	Level int

	// Type はコアの特性（タイプ）です。
	Type CoreType

	// Stats はコアのステータス値です。
	// レベルと特性の重みから計算されます。
	Stats Stats

	// PassiveSkill はこのコアに紐づくパッシブスキルです。
	PassiveSkill PassiveSkill

	// AllowedTags はこのコアに装備可能なモジュールタグのリストです。
	// 通常はType.AllowedTagsと同じですが、直接参照用にコピーされます。
	AllowedTags []string
}

// CalculateStats はコアレベルとコア特性からステータス値を計算します。
// 計算式: 基礎値(10) × レベル × ステータス重み
// 結果は整数に切り捨てられます。
func CalculateStats(level int, coreType CoreType) Stats {
	// 各ステータスの重みを取得（未設定の場合はデフォルト1.0）
	strWeight := coreType.StatWeights["STR"]
	magWeight := coreType.StatWeights["MAG"]
	spdWeight := coreType.StatWeights["SPD"]
	lukWeight := coreType.StatWeights["LUK"]

	// 計算式: 基礎値 × レベル × 重み
	baseValue := float64(BaseStatValue * level)

	return Stats{
		STR: int(baseValue * strWeight),
		MAG: int(baseValue * magWeight),
		SPD: int(baseValue * spdWeight),
		LUK: int(baseValue * lukWeight),
	}
}

// NewCore は指定されたパラメータからCoreModelを作成します。
// ステータスはレベルと特性から自動計算されます。
// AllowedTagsはCoreTypeからコピーされます。
func NewCore(id, name string, level int, coreType CoreType, passiveSkill PassiveSkill) *CoreModel {
	// ステータスを自動計算
	stats := CalculateStats(level, coreType)

	// AllowedTagsをコピー（スライスの参照共有を避ける）
	allowedTags := make([]string, len(coreType.AllowedTags))
	copy(allowedTags, coreType.AllowedTags)

	return &CoreModel{
		ID:           id,
		Name:         name,
		Level:        level,
		Type:         coreType,
		Stats:        stats,
		PassiveSkill: passiveSkill,
		AllowedTags:  allowedTags,
	}
}

// IsTagAllowed は指定されたタグがこのコアに許可されているかを判定します。
// モジュール装備時の互換性チェックに使用されます。
func (c *CoreModel) IsTagAllowed(tag string) bool {
	for _, allowedTag := range c.AllowedTags {
		if allowedTag == tag {
			return true
		}
	}
	return false
}
