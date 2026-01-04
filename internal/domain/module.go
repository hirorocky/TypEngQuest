// Package domain はゲームのドメインモデルを定義します。
package domain

// defaultModuleIcon はモジュールのデフォルトアイコンを返します。
const defaultModuleIcon = "•"

// ModuleType はモジュールの種別（タイプ）を定義する構造体です。
// 外部データファイル（modules.json）から読み込まれ、ゲーム内のモジュール種別を定義します。
// 各モジュールは複数の効果（Effects）を持ち、使用時に各効果が確率で発動します。
type ModuleType struct {
	// ID はモジュール種別の一意識別子です。
	ID string

	// Name はモジュールの表示名です（日本語）。
	Name string

	// Icon はモジュールのアイコン（絵文字）です。
	Icon string

	// Tags はモジュールのタグリストです。
	// コア特性との互換性チェックに使用されます。
	Tags []string

	// Description はモジュールの効果説明です。
	Description string

	// CooldownSeconds はモジュールのクールダウン時間（秒）です。
	CooldownSeconds float64

	// Difficulty はタイピングの難易度レベルです。
	Difficulty int

	// MinDropLevel はこのモジュールがドロップする最低敵レベルです。
	MinDropLevel int

	// Effects はこのモジュールが持つ効果のリストです。
	// 使用時に各効果が確率（Probability + LUK補正）で発動します。
	Effects []ModuleEffect
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

// Tags はモジュールのタグリストを返します。
func (m *ModuleModel) Tags() []string {
	return m.Type.Tags
}

// Description はモジュールの効果説明を返します。
func (m *ModuleModel) Description() string {
	return m.Type.Description
}

// Icon はモジュールのアイコンを返します。
func (m *ModuleModel) Icon() string {
	if m.Type.Icon != "" {
		return m.Type.Icon
	}
	return defaultModuleIcon
}

// Effects はモジュールの効果リストを返します。
func (m *ModuleModel) Effects() []ModuleEffect {
	return m.Type.Effects
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
