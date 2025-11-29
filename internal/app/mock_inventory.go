// Package app は TypeBattle TUIゲームのモックインベントリを提供します。
package app

import (
	"hirorocky/type-battle/internal/domain"
)

// MockInventory はテスト・初期化用のモックインベントリです。
type MockInventory struct {
	cores          []*domain.CoreModel
	modules        []*domain.ModuleModel
	agents         []*domain.AgentModel
	equippedAgents []*domain.AgentModel
}

// NewMockInventory は新しいモックインベントリを作成します。
func NewMockInventory() *MockInventory {
	inv := &MockInventory{
		cores:          make([]*domain.CoreModel, 0),
		modules:        make([]*domain.ModuleModel, 0),
		agents:         make([]*domain.AgentModel, 0),
		equippedAgents: make([]*domain.AgentModel, 0),
	}

	// 初期コアを追加
	inv.addInitialCores()
	// 初期モジュールを追加
	inv.addInitialModules()
	// 初期エージェントを追加
	inv.addInitialAgents()

	return inv
}

// GetDefaultCoreType はデフォルトのコア特性を返します。
func GetDefaultCoreType() domain.CoreType {
	return domain.CoreType{
		ID:   "all_rounder",
		Name: "オールラウンダー",
		StatWeights: map[string]float64{
			"STR": 1.0,
			"MAG": 1.0,
			"SPD": 1.0,
			"LUK": 1.0,
		},
		PassiveSkillID: "balance_mastery",
		AllowedTags:    []string{"physical_low", "magic_low", "heal_low", "buff_low", "debuff_low"},
		MinDropLevel:   1,
	}
}

// GetAttackerCoreType はアタッカーのコア特性を返します。
func GetAttackerCoreType() domain.CoreType {
	return domain.CoreType{
		ID:   "attacker",
		Name: "攻撃バランス",
		StatWeights: map[string]float64{
			"STR": 1.2,
			"MAG": 1.2,
			"SPD": 0.8,
			"LUK": 0.8,
		},
		PassiveSkillID: "attack_boost",
		AllowedTags:    []string{"physical_low", "physical_mid", "magic_low", "magic_mid"},
		MinDropLevel:   1,
	}
}

// GetDefaultPassiveSkill はデフォルトのパッシブスキルを返します。
func GetDefaultPassiveSkill() domain.PassiveSkill {
	return domain.PassiveSkill{
		ID:          "balance_mastery",
		Name:        "バランスマスタリー",
		Description: "全ステータスにバランスボーナスを得る",
	}
}

// addInitialCores は初期コアを追加します。
func (m *MockInventory) addInitialCores() {
	allRounderType := GetDefaultCoreType()
	passiveSkill := GetDefaultPassiveSkill()

	core := domain.NewCore("core_001", "初期コア", 1, allRounderType, passiveSkill)
	m.cores = append(m.cores, core)

	attackerType := GetAttackerCoreType()
	attackerSkill := domain.PassiveSkill{
		ID:          "attack_boost",
		Name:        "攻撃ブースト",
		Description: "攻撃力にボーナスを得る",
	}
	core2 := domain.NewCore("core_002", "アタッカーコア", 1, attackerType, attackerSkill)
	m.cores = append(m.cores, core2)
}

// addInitialModules は初期モジュールを追加します。
func (m *MockInventory) addInitialModules() {
	// 物理攻撃モジュール
	physicalMod := domain.NewModule(
		"mod_001",
		"斬撃",
		domain.PhysicalAttack,
		1,
		[]string{"physical_low"},
		10.0,
		"STR",
		"基本的な物理攻撃",
	)
	m.modules = append(m.modules, physicalMod)

	// 魔法攻撃モジュール
	magicMod := domain.NewModule(
		"mod_002",
		"火球",
		domain.MagicAttack,
		1,
		[]string{"magic_low", "fire"},
		12.0,
		"MAG",
		"火属性の魔法攻撃",
	)
	m.modules = append(m.modules, magicMod)

	// 回復モジュール
	healMod := domain.NewModule(
		"mod_003",
		"ヒール",
		domain.Heal,
		1,
		[]string{"heal_low"},
		15.0,
		"MAG",
		"基本的な回復魔法",
	)
	m.modules = append(m.modules, healMod)

	// バフモジュール
	buffMod := domain.NewModule(
		"mod_004",
		"攻撃力アップ",
		domain.Buff,
		1,
		[]string{"buff_low"},
		5.0,
		"LUK",
		"攻撃力を上昇させる",
	)
	m.modules = append(m.modules, buffMod)
}

// addInitialAgents は初期エージェントを追加します。
func (m *MockInventory) addInitialAgents() {
	allRounderType := GetDefaultCoreType()
	passiveSkill := GetDefaultPassiveSkill()

	core := domain.NewCore("agent_core_001", "初心者コア", 1, allRounderType, passiveSkill)
	modules := []*domain.ModuleModel{
		domain.NewModule("agent_mod_001", "パンチ", domain.PhysicalAttack, 1, []string{"physical_low"}, 8.0, "STR", "基本的な物理攻撃"),
		domain.NewModule("agent_mod_002", "ファイア", domain.MagicAttack, 1, []string{"magic_low", "fire"}, 10.0, "MAG", "火属性の魔法攻撃"),
		domain.NewModule("agent_mod_003", "リジェネ", domain.Heal, 1, []string{"heal_low"}, 5.0, "MAG", "回復魔法"),
		domain.NewModule("agent_mod_004", "パワーアップ", domain.Buff, 1, []string{"buff_low"}, 3.0, "LUK", "攻撃力上昇"),
	}

	agent := domain.NewAgent("agent_001", core, modules)
	m.agents = append(m.agents, agent)
	m.equippedAgents = append(m.equippedAgents, agent)
}

// GetCores はコア一覧を返します。
func (m *MockInventory) GetCores() []*domain.CoreModel {
	return m.cores
}

// GetModules はモジュール一覧を返します。
func (m *MockInventory) GetModules() []*domain.ModuleModel {
	return m.modules
}

// GetAgents はエージェント一覧を返します。
func (m *MockInventory) GetAgents() []*domain.AgentModel {
	return m.agents
}

// GetEquippedAgents は装備中エージェント一覧を返します。
func (m *MockInventory) GetEquippedAgents() []*domain.AgentModel {
	return m.equippedAgents
}

// AddAgent はエージェントを追加します。
func (m *MockInventory) AddAgent(agent *domain.AgentModel) error {
	m.agents = append(m.agents, agent)
	return nil
}

// RemoveCore はコアを削除します。
func (m *MockInventory) RemoveCore(id string) error {
	for i, core := range m.cores {
		if core.ID == id {
			m.cores = append(m.cores[:i], m.cores[i+1:]...)
			return nil
		}
	}
	return nil
}

// RemoveModule はモジュールを削除します。
func (m *MockInventory) RemoveModule(id string) error {
	for i, mod := range m.modules {
		if mod.ID == id {
			m.modules = append(m.modules[:i], m.modules[i+1:]...)
			return nil
		}
	}
	return nil
}

// EquipAgent はエージェントを装備します。
func (m *MockInventory) EquipAgent(slot int, agent *domain.AgentModel) error {
	if slot < 0 || slot > 2 {
		return nil
	}

	// スロットを拡張
	for len(m.equippedAgents) <= slot {
		m.equippedAgents = append(m.equippedAgents, nil)
	}

	m.equippedAgents[slot] = agent
	return nil
}

// UnequipAgent はエージェントの装備を解除します。
func (m *MockInventory) UnequipAgent(slot int) error {
	if slot >= 0 && slot < len(m.equippedAgents) {
		m.equippedAgents[slot] = nil
	}
	return nil
}

// GenerateEnemy は指定したレベルの敵を生成します。
func GenerateEnemy(level int) *domain.EnemyModel {
	enemyType := domain.EnemyType{
		ID:                 "goblin",
		Name:               "ゴブリン",
		BaseHP:             100,
		BaseAttackPower:    10,
		BaseAttackInterval: 3000000000, // 3秒
		AttackType:         "physical",
		ASCIIArt:           "  /\\oo/\\ \n { @  @ }\n  \\ -- /\n   |  |\n  /|  |\\\n",
	}

	// レベルに応じてステータスを計算
	hp := enemyType.BaseHP + level*50
	attackPower := enemyType.BaseAttackPower + level*2

	return domain.NewEnemy(
		"enemy_001",
		enemyType.Name,
		level,
		hp,
		attackPower,
		enemyType.BaseAttackInterval,
		enemyType,
	)
}

// GetAllCoreTypes は全てのコア特性を返します。
func GetAllCoreTypes() []domain.CoreType {
	return []domain.CoreType{
		GetDefaultCoreType(),
		GetAttackerCoreType(),
		{
			ID:   "healer",
			Name: "ヒーラー",
			StatWeights: map[string]float64{
				"STR": 0.8,
				"MAG": 1.4,
				"SPD": 0.9,
				"LUK": 0.9,
			},
			PassiveSkillID: "heal_boost",
			AllowedTags:    []string{"heal_low", "heal_mid", "magic_low", "buff_low"},
			MinDropLevel:   5,
		},
		{
			ID:   "tank",
			Name: "タンク",
			StatWeights: map[string]float64{
				"STR": 1.1,
				"MAG": 0.7,
				"SPD": 0.7,
				"LUK": 1.5,
			},
			PassiveSkillID: "defense_boost",
			AllowedTags:    []string{"physical_low", "buff_low", "buff_mid"},
			MinDropLevel:   3,
		},
	}
}

// GetAllEnemyTypes は全ての敵タイプを返します。
func GetAllEnemyTypes() []domain.EnemyType {
	return []domain.EnemyType{
		{
			ID:                 "goblin",
			Name:               "ゴブリン",
			BaseHP:             100,
			BaseAttackPower:    10,
			BaseAttackInterval: 3000000000,
			AttackType:         "physical",
		},
		{
			ID:                 "orc",
			Name:               "オーク",
			BaseHP:             200,
			BaseAttackPower:    15,
			BaseAttackInterval: 4000000000,
			AttackType:         "physical",
		},
		{
			ID:                 "dragon",
			Name:               "ドラゴン",
			BaseHP:             500,
			BaseAttackPower:    30,
			BaseAttackInterval: 5000000000,
			AttackType:         "magic",
		},
	}
}
