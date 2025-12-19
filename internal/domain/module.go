// Package domain はゲームのドメインモデルを定義します。
package domain

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

// Icon はモジュールカテゴリのアイコンを返します。
func (c ModuleCategory) Icon() string {
	switch c {
	case PhysicalAttack:
		return "⚔"
	case MagicAttack:
		return "✦"
	case Heal:
		return "♥"
	case Buff:
		return "▲"
	case Debuff:
		return "▼"
	default:
		return "•"
	}
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

// ModuleType はモジュールの種別（タイプ）を定義する構造体です。
// 外部データファイル（modules.json）から読み込まれ、ゲーム内のモジュール種別を定義します。
type ModuleType struct {
	// ID はモジュール種別の一意識別子です。
	ID string

	// Name はモジュールの表示名です（日本語）。
	Name string

	// Category はモジュールのカテゴリです（物理攻撃、魔法攻撃、回復、バフ、デバフ）。
	Category ModuleCategory

	// Level はモジュールのレベルです。
	Level int

	// Tags はモジュールのタグリストです。
	// コア特性との互換性チェックに使用されます。
	Tags []string

	// BaseEffect はモジュールの基礎効果値です。
	BaseEffect float64

	// StatRef は効果計算時に参照するステータスです（STR, MAG, SPD, LUK）。
	StatRef string

	// Description はモジュールの効果説明です。
	Description string

	// CooldownSeconds はモジュールのクールダウン時間（秒）です。
	CooldownSeconds float64

	// Difficulty はタイピングの難易度レベルです。
	Difficulty int

	// MinDropLevel はこのモジュールがドロップする最低敵レベルです。
	MinDropLevel int
}

// HasTag は指定されたタグがこのモジュールタイプに含まれているかを返します。
func (t ModuleType) HasTag(tag string) bool {
	for _, myTag := range t.Tags {
		if myTag == tag {
			return true
		}
	}
	return false
}

// ModuleModel はゲーム内のモジュール（スキル）エンティティを表す構造体です。
// モジュールはエージェント合成時にコアに装備され、バトル中に使用可能なスキルになります。
// TypeIDとChainEffectの組み合わせでインスタンスを識別します。
type ModuleModel struct {
	// TypeID はモジュール種別ID（マスタデータ参照用）です。
	// セーブデータにはTypeIDとChainEffectが保存されます。
	TypeID string

	// Type はモジュールの種別（タイプ）です。
	// TypeIDからマスタデータを参照して取得されます。
	Type ModuleType

	// ChainEffect はこのモジュールインスタンスのチェイン効果です。
	// nilの場合はチェイン効果を持たないモジュールです。
	ChainEffect *ChainEffect
}

// Name はモジュールの表示名を返します。
func (m *ModuleModel) Name() string {
	return m.Type.Name
}

// Category はモジュールのカテゴリを返します。
func (m *ModuleModel) Category() ModuleCategory {
	return m.Type.Category
}

// Level はモジュールのレベルを返します。
func (m *ModuleModel) Level() int {
	return m.Type.Level
}

// Tags はモジュールのタグリストを返します。
func (m *ModuleModel) Tags() []string {
	return m.Type.Tags
}

// BaseEffect はモジュールの基礎効果値を返します。
func (m *ModuleModel) BaseEffect() float64 {
	return m.Type.BaseEffect
}

// StatRef は効果計算時に参照するステータスを返します。
func (m *ModuleModel) StatRef() string {
	return m.Type.StatRef
}

// Description はモジュールの効果説明を返します。
func (m *ModuleModel) Description() string {
	return m.Type.Description
}

// CooldownSeconds はモジュールのクールダウン時間を返します。
func (m *ModuleModel) CooldownSeconds() float64 {
	return m.Type.CooldownSeconds
}

// Difficulty はタイピングの難易度レベルを返します。
func (m *ModuleModel) Difficulty() int {
	return m.Type.Difficulty
}

// HasTag は指定されたタグがこのモジュールに含まれているかを返します。
func (m *ModuleModel) HasTag(tag string) bool {
	return m.Type.HasTag(tag)
}

// IsCompatibleWithCore はこのモジュールが指定されたコアに装備可能かを判定します。
// モジュールのタグのうち1つでもコアの許可タグに含まれていれば互換性ありとみなします。
func (m *ModuleModel) IsCompatibleWithCore(core *CoreModel) bool {
	for _, tag := range m.Type.Tags {
		if core.IsTagAllowed(tag) {
			return true
		}
	}
	return false
}

// HasChainEffect はこのモジュールがチェイン効果を持っているかを返します。
func (m *ModuleModel) HasChainEffect() bool {
	return m.ChainEffect != nil
}

// NewModuleFromType はModuleTypeからModuleModelを作成します。
// chainEffectはnilを許容します。
func NewModuleFromType(moduleType ModuleType, chainEffect *ChainEffect) *ModuleModel {
	return &ModuleModel{
		TypeID:      moduleType.ID,
		Type:        moduleType,
		ChainEffect: chainEffect,
	}
}
