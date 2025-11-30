// Package app は TypEngQuest TUIゲームのインベントリマネージャーを提供します。
package app

import (
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/inventory"
)

// InventoryManager はゲーム全体のインベントリを統合管理する構造体です。
// コアとモジュールの管理を担当します。
// エージェントの管理はAgentManagerが一元的に行います。
type InventoryManager struct {
	// cores はコアインベントリです。
	cores *inventory.CoreInventory

	// modules はモジュールインベントリです。
	modules *inventory.ModuleInventory
}

// NewInventoryManager は新しいInventoryManagerを作成します。
func NewInventoryManager() *InventoryManager {
	return &InventoryManager{
		cores:   inventory.NewCoreInventory(100),
		modules: inventory.NewModuleInventory(200),
	}
}

// Cores はコアインベントリを返します。
func (m *InventoryManager) Cores() *inventory.CoreInventory {
	return m.cores
}

// Modules はモジュールインベントリを返します。
func (m *InventoryManager) Modules() *inventory.ModuleInventory {
	return m.modules
}

// AddCore はコアをインベントリに追加します。
func (m *InventoryManager) AddCore(core *domain.CoreModel) error {
	return m.cores.Add(core)
}

// AddModule はモジュールをインベントリに追加します。
func (m *InventoryManager) AddModule(module *domain.ModuleModel) error {
	return m.modules.Add(module)
}

// GetCores はコア一覧を返します。
func (m *InventoryManager) GetCores() []*domain.CoreModel {
	return m.cores.List()
}

// GetModules はモジュール一覧を返します。
func (m *InventoryManager) GetModules() []*domain.ModuleModel {
	return m.modules.List()
}

// RemoveCore はコアをインベントリから削除します。
func (m *InventoryManager) RemoveCore(id string) error {
	m.cores.Remove(id)
	return nil
}

// RemoveModule はモジュールをインベントリから削除します。
func (m *InventoryManager) RemoveModule(id string) error {
	m.modules.Remove(id)
	return nil
}

// InitializeWithDefaults は初期データでインベントリを初期化します。
// コアとモジュールの初期データを追加します。
// エージェントの初期化はAgentManagerで行います。
func (m *InventoryManager) InitializeWithDefaults() {
	// 初期コアを追加
	allRounderType := domain.CoreType{
		ID:             "all_rounder",
		Name:           "オールラウンダー",
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		PassiveSkillID: "balance_mastery",
		AllowedTags:    []string{"physical_low", "magic_low", "heal_low", "buff_low", "debuff_low"},
		MinDropLevel:   1,
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "balance_mastery",
		Name:        "バランスマスタリー",
		Description: "全ステータスにバランスボーナスを得る",
	}
	core := domain.NewCore("core_001", "初期コア", 1, allRounderType, passiveSkill)
	m.cores.Add(core)

	attackerType := domain.CoreType{
		ID:             "attacker",
		Name:           "攻撃バランス",
		StatWeights:    map[string]float64{"STR": 1.2, "MAG": 1.2, "SPD": 0.8, "LUK": 0.8},
		PassiveSkillID: "attack_boost",
		AllowedTags:    []string{"physical_low", "physical_mid", "magic_low", "magic_mid"},
		MinDropLevel:   1,
	}
	attackerSkill := domain.PassiveSkill{
		ID:          "attack_boost",
		Name:        "攻撃ブースト",
		Description: "攻撃力にボーナスを得る",
	}
	core2 := domain.NewCore("core_002", "アタッカーコア", 1, attackerType, attackerSkill)
	m.cores.Add(core2)

	// 初期モジュールを追加
	physicalMod := domain.NewModule(
		"mod_001", "斬撃", domain.PhysicalAttack, 1,
		[]string{"physical_low"}, 10.0, "STR", "基本的な物理攻撃",
	)
	m.modules.Add(physicalMod)

	magicMod := domain.NewModule(
		"mod_002", "火球", domain.MagicAttack, 1,
		[]string{"magic_low", "fire"}, 12.0, "MAG", "火属性の魔法攻撃",
	)
	m.modules.Add(magicMod)

	healMod := domain.NewModule(
		"mod_003", "ヒール", domain.Heal, 1,
		[]string{"heal_low"}, 15.0, "MAG", "基本的な回復魔法",
	)
	m.modules.Add(healMod)

	buffMod := domain.NewModule(
		"mod_004", "攻撃力アップ", domain.Buff, 1,
		[]string{"buff_low"}, 5.0, "LUK", "攻撃力を上昇させる",
	)
	m.modules.Add(buffMod)

	// 追加の初期モジュール（合成後も所持できるように）
	extraMod1 := domain.NewModule(
		"mod_005", "突き", domain.PhysicalAttack, 1,
		[]string{"physical_low"}, 8.0, "STR", "素早い物理攻撃",
	)
	m.modules.Add(extraMod1)

	extraMod2 := domain.NewModule(
		"mod_006", "氷結", domain.MagicAttack, 1,
		[]string{"magic_low", "ice"}, 11.0, "MAG", "氷属性の魔法攻撃",
	)
	m.modules.Add(extraMod2)

	extraMod3 := domain.NewModule(
		"mod_007", "防御アップ", domain.Buff, 1,
		[]string{"buff_low"}, 4.0, "LUK", "防御力を上昇させる",
	)
	m.modules.Add(extraMod3)
}
