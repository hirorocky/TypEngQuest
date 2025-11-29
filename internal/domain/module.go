// Package domain はゲームのドメインモデルを定義します。
package domain

import "fmt"

// ModuleCategory はモジュールのカテゴリを表す型です。
// カテゴリによって効果の種類と参照するステータスが決まります。
type ModuleCategory string

const (
	// PhysicalAttack は物理攻撃カテゴリを表します。
	// STR参照、敵に物理ダメージを与えます。
	PhysicalAttack ModuleCategory = "physical_attack"

	// MagicAttack は魔法攻撃カテゴリを表します。
	// MAG参照、敵に魔法ダメージを与えます。
	MagicAttack ModuleCategory = "magic_attack"

	// Heal は回復カテゴリを表します。
	// MAG参照、プレイヤーのHPを回復します。
	Heal ModuleCategory = "heal"

	// Buff はバフカテゴリを表します。
	// SPD参照、プレイヤーに有利な効果を付与します。
	Buff ModuleCategory = "buff"

	// Debuff はデバフカテゴリを表します。
	// SPD参照、敵に不利な効果を付与します。
	Debuff ModuleCategory = "debuff"
)

// String はModuleCategoryの日本語表示名を返します。
func (c ModuleCategory) String() string {
	switch c {
	case PhysicalAttack:
		return "物理攻撃"
	case MagicAttack:
		return "魔法攻撃"
	case Heal:
		return "回復"
	case Buff:
		return "バフ"
	case Debuff:
		return "デバフ"
	default:
		return "不明"
	}
}

// DefaultStatRef はカテゴリのデフォルト参照ステータスを返します。
// Requirements 6.12-6.16に基づいて各カテゴリの参照ステータスを定義します。
func (c ModuleCategory) DefaultStatRef() string {
	switch c {
	case PhysicalAttack:
		return "STR" // 6.12: 物理攻撃はSTR参照
	case MagicAttack:
		return "MAG" // 6.13: 魔法攻撃はMAG参照
	case Heal:
		return "MAG" // 6.14: 回復はMAG参照
	case Buff:
		return "SPD" // 6.15: バフはSPD参照（効果時間に影響）
	case Debuff:
		return "SPD" // 6.16: デバフはSPD参照（効果時間に影響）
	default:
		return "STR"
	}
}

// IsAttack はこのカテゴリが攻撃系かどうかを返します。
func (c ModuleCategory) IsAttack() bool {
	return c == PhysicalAttack || c == MagicAttack
}

// IsSupport はこのカテゴリがサポート系（回復、バフ、デバフ）かどうかを返します。
func (c ModuleCategory) IsSupport() bool {
	return c == Heal || c == Buff || c == Debuff
}

// TargetsEnemy はこのカテゴリが敵をターゲットにするかどうかを返します。
func (c ModuleCategory) TargetsEnemy() bool {
	return c == PhysicalAttack || c == MagicAttack || c == Debuff
}

// TargetsPlayer はこのカテゴリがプレイヤーをターゲットにするかどうかを返します。
func (c ModuleCategory) TargetsPlayer() bool {
	return c == Heal || c == Buff
}

// GetLevelSuffix はレベルに応じた接尾辞（low, mid, high）を返します。
// レベル1はlow、レベル2はmid、レベル3以上はhighです。
func GetLevelSuffix(level int) string {
	if level <= 1 {
		return "low"
	} else if level == 2 {
		return "mid"
	}
	return "high"
}

// ModuleModel はゲーム内のモジュール（スキル）エンティティを表す構造体です。
// モジュールはエージェント合成時にコアに装備され、バトル中に使用可能なスキルになります。
// Requirements 6.3, 6.4, 6.8-6.16に基づいて設計されています。
type ModuleModel struct {
	// ID はモジュールインスタンスの一意識別子です。
	ID string

	// Name はモジュールの表示名です（日本語）。
	Name string

	// Category はモジュールのカテゴリです。
	// 物理攻撃、魔法攻撃、回復、バフ、デバフのいずれかです。
	// Requirement 6.8: 各モジュールにカテゴリタグを付与
	Category ModuleCategory

	// Level はモジュールのレベルです。
	// Requirement 6.9: 各モジュールにレベルタグを付与（Lv1, Lv2, Lv3など）
	// Requirement 6.10: モジュールの種類ごとにレベルを固定
	Level int

	// Tags はモジュールのタグリストです。
	// コア特性との互換性チェックに使用されます。
	// 例: ["physical_low"], ["magic_mid", "fire"]
	Tags []string

	// BaseEffect はモジュールの基礎効果値です。
	// Requirement 6.11: 同じ種類のモジュールは全て同じ効果を持つ
	BaseEffect float64

	// StatRef は効果計算時に参照するステータスです（STR, MAG, SPD, LUK）。
	// Requirement 6.4: 各モジュールの参照するエージェントステータスを表示
	StatRef string

	// Description はモジュールの効果説明です。
	// Requirement 6.4: 各モジュールの効果説明を表示
	Description string
}

// NewModule は新しいModuleModelを作成します。
// Tagsはコピーされ、元のスライスとの参照共有を避けます。
func NewModule(id, name string, category ModuleCategory, level int, tags []string, baseEffect float64, statRef, description string) *ModuleModel {
	// Tagsをコピー（スライスの参照共有を避ける）
	tagsCopy := make([]string, len(tags))
	copy(tagsCopy, tags)

	return &ModuleModel{
		ID:          id,
		Name:        name,
		Category:    category,
		Level:       level,
		Tags:        tagsCopy,
		BaseEffect:  baseEffect,
		StatRef:     statRef,
		Description: description,
	}
}

// HasTag は指定されたタグがこのモジュールに含まれているかを返します。
func (m *ModuleModel) HasTag(tag string) bool {
	for _, t := range m.Tags {
		if t == tag {
			return true
		}
	}
	return false
}

// IsCompatibleWithCore はこのモジュールが指定されたコアに装備可能かを判定します。
// モジュールのタグのうち1つでもコアの許可タグに含まれていれば互換性ありとみなします。
// Requirements 5.11, 5.12に基づく互換性チェック
func (m *ModuleModel) IsCompatibleWithCore(core *CoreModel) bool {
	for _, tag := range m.Tags {
		if core.IsTagAllowed(tag) {
			return true
		}
	}
	return false
}

// GetCategoryTag はモジュールのカテゴリとレベルに基づいたタグを返します。
// 例: physical_low, magic_mid, heal_high
func (m *ModuleModel) GetCategoryTag() string {
	prefix := ""
	switch m.Category {
	case PhysicalAttack:
		prefix = "physical"
	case MagicAttack:
		prefix = "magic"
	case Heal:
		prefix = "heal"
	case Buff:
		prefix = "buff"
	case Debuff:
		prefix = "debuff"
	}

	suffix := GetLevelSuffix(m.Level)
	return fmt.Sprintf("%s_%s", prefix, suffix)
}
