package session

import (
	"log/slog"

	"hirorocky/type-battle/internal/domain"
)

// InventoryManager はゲーム全体のインベントリを統合管理する構造体です。
// コアとモジュールの管理を担当します。
// エージェントの管理はAgentManagerが一元的に行います。
type InventoryManager struct {
	// cores はコアインベントリです。
	cores *domain.CoreInventory

	// modules はモジュールインベントリです。
	modules *domain.ModuleInventory
}

// NewInventoryManager は新しいInventoryManagerを作成します。
func NewInventoryManager() *InventoryManager {
	return &InventoryManager{
		cores:   domain.NewCoreInventory(100),
		modules: domain.NewModuleInventory(200),
	}
}

// Cores はコアインベントリを返します。
func (m *InventoryManager) Cores() *domain.CoreInventory {
	return m.cores
}

// Modules はモジュールインベントリを返します。
func (m *InventoryManager) Modules() *domain.ModuleInventory {
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
// 指定されたTypeIDを持つ最初のモジュールを削除します。
func (m *InventoryManager) RemoveModule(typeID string) error {
	m.modules.RemoveByTypeID(typeID)
	return nil
}

// SetMaxCoreSlots はコアの最大スロット数を設定します。
func (m *InventoryManager) SetMaxCoreSlots(slots int) {
	m.cores = domain.NewCoreInventory(slots)
}

// SetMaxModuleSlots はモジュールの最大スロット数を設定します。
func (m *InventoryManager) SetMaxModuleSlots(slots int) {
	m.modules = domain.NewModuleInventory(slots)
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
	if err := m.cores.Add(core); err != nil {
		slog.Error("初期コア追加に失敗",
			slog.String("core_id", core.ID),
			slog.String("core_name", core.Name),
			slog.Any("error", err),
		)
	}

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
	if err := m.cores.Add(core2); err != nil {
		slog.Error("初期コア追加に失敗",
			slog.String("core_id", core2.ID),
			slog.String("core_name", core2.Name),
			slog.Any("error", err),
		)
	}

	// 初期モジュールを追加
	physicalMod := domain.NewModuleFromType(domain.ModuleType{
		ID: "mod_001", Name: "斬撃", Category: domain.PhysicalAttack, Level: 1,
		Tags: []string{"physical_low"}, BaseEffect: 10.0, StatRef: "STR", Description: "基本的な物理攻撃",
	}, nil)
	if err := m.modules.Add(physicalMod); err != nil {
		slog.Error("初期モジュール追加に失敗",
			slog.String("module_type_id", physicalMod.TypeID),
			slog.String("module_name", physicalMod.Name()),
			slog.Any("error", err),
		)
	}

	magicMod := domain.NewModuleFromType(domain.ModuleType{
		ID: "mod_002", Name: "火球", Category: domain.MagicAttack, Level: 1,
		Tags: []string{"magic_low", "fire"}, BaseEffect: 12.0, StatRef: "MAG", Description: "火属性の魔法攻撃",
	}, nil)
	if err := m.modules.Add(magicMod); err != nil {
		slog.Error("初期モジュール追加に失敗",
			slog.String("module_type_id", magicMod.TypeID),
			slog.String("module_name", magicMod.Name()),
			slog.Any("error", err),
		)
	}

	healMod := domain.NewModuleFromType(domain.ModuleType{
		ID: "mod_003", Name: "ヒール", Category: domain.Heal, Level: 1,
		Tags: []string{"heal_low"}, BaseEffect: 15.0, StatRef: "MAG", Description: "基本的な回復魔法",
	}, nil)
	if err := m.modules.Add(healMod); err != nil {
		slog.Error("初期モジュール追加に失敗",
			slog.String("module_type_id", healMod.TypeID),
			slog.String("module_name", healMod.Name()),
			slog.Any("error", err),
		)
	}

	buffMod := domain.NewModuleFromType(domain.ModuleType{
		ID: "mod_004", Name: "攻撃力アップ", Category: domain.Buff, Level: 1,
		Tags: []string{"buff_low"}, BaseEffect: 5.0, StatRef: "LUK", Description: "攻撃力を上昇させる",
	}, nil)
	if err := m.modules.Add(buffMod); err != nil {
		slog.Error("初期モジュール追加に失敗",
			slog.String("module_type_id", buffMod.TypeID),
			slog.String("module_name", buffMod.Name()),
			slog.Any("error", err),
		)
	}

	// 追加の初期モジュール
	extraMod1 := domain.NewModuleFromType(domain.ModuleType{
		ID: "mod_005", Name: "突き", Category: domain.PhysicalAttack, Level: 1,
		Tags: []string{"physical_low"}, BaseEffect: 8.0, StatRef: "STR", Description: "素早い物理攻撃",
	}, nil)
	if err := m.modules.Add(extraMod1); err != nil {
		slog.Error("初期モジュール追加に失敗",
			slog.String("module_type_id", extraMod1.TypeID),
			slog.String("module_name", extraMod1.Name()),
			slog.Any("error", err),
		)
	}

	extraMod2 := domain.NewModuleFromType(domain.ModuleType{
		ID: "mod_006", Name: "氷結", Category: domain.MagicAttack, Level: 1,
		Tags: []string{"magic_low", "ice"}, BaseEffect: 11.0, StatRef: "MAG", Description: "氷属性の魔法攻撃",
	}, nil)
	if err := m.modules.Add(extraMod2); err != nil {
		slog.Error("初期モジュール追加に失敗",
			slog.String("module_type_id", extraMod2.TypeID),
			slog.String("module_name", extraMod2.Name()),
			slog.Any("error", err),
		)
	}

	extraMod3 := domain.NewModuleFromType(domain.ModuleType{
		ID: "mod_007", Name: "防御アップ", Category: domain.Buff, Level: 1,
		Tags: []string{"buff_low"}, BaseEffect: 4.0, StatRef: "LUK", Description: "防御力を上昇させる",
	}, nil)
	if err := m.modules.Add(extraMod3); err != nil {
		slog.Error("初期モジュール追加に失敗",
			slog.String("module_type_id", extraMod3.TypeID),
			slog.String("module_name", extraMod3.Name()),
			slog.Any("error", err),
		)
	}
}
