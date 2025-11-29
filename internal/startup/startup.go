// Package startup は初回起動時の初期化処理を担当します。
// 新規ゲーム開始時の初期コア、モジュール、エージェントの提供を行います。
// Requirements: 3.8, 17.5
package startup

import (
	"fmt"

	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/persistence"
)

// NewGameInitializer は新規ゲーム初期化を担当する構造体です。
type NewGameInitializer struct {
	// idCounter はID生成用のカウンターです。
	idCounter int
}

// NewNewGameInitializer は新しいNewGameInitializerを作成します。
func NewNewGameInitializer() *NewGameInitializer {
	return &NewGameInitializer{
		idCounter: 0,
	}
}

// generateID は一意のIDを生成します。
func (i *NewGameInitializer) generateID(prefix string) string {
	i.idCounter++
	return fmt.Sprintf("%s_%d", prefix, i.idCounter)
}

// CreateInitialCore は初期コアを作成します。
// Requirement 3.8: 初期コアの提供（レベル1、オールラウンダー）
func (i *NewGameInitializer) CreateInitialCore() *domain.CoreModel {
	// オールラウンダー特性の定義
	coreType := domain.CoreType{
		ID:   "all_rounder",
		Name: "オールラウンダー",
		StatWeights: map[string]float64{
			"STR": 1.0,
			"MAG": 1.0,
			"SPD": 1.0,
			"LUK": 1.0,
		},
		PassiveSkillID: "balanced_power",
		AllowedTags: []string{
			"physical_low", "magic_low", "heal_low", "buff_low", "debuff_low",
		},
		MinDropLevel: 1,
	}

	// パッシブスキルの定義
	passiveSkill := domain.PassiveSkill{
		ID:          "balanced_power",
		Name:        "バランスフォース",
		Description: "全ステータスがバランス良く成長",
	}

	// レベル1のコアを作成
	return domain.NewCore(
		i.generateID("core"),
		"初期コア",
		1, // レベル1
		coreType,
		passiveSkill,
	)
}

// CreateInitialModules は初期モジュールを作成します。
// Requirement 3.8: 初期モジュールの提供（各カテゴリLv1を4個）
func (i *NewGameInitializer) CreateInitialModules() []*domain.ModuleModel {
	modules := make([]*domain.ModuleModel, 4)

	// 物理攻撃Lv1
	modules[0] = domain.NewModule(
		i.generateID("module"),
		"物理打撃Lv1",
		domain.PhysicalAttack,
		1, // レベル1
		[]string{"physical_low"},
		10.0,
		"STR",
		"物理ダメージを与える基本攻撃",
	)

	// 魔法攻撃Lv1
	modules[1] = domain.NewModule(
		i.generateID("module"),
		"ファイアボールLv1",
		domain.MagicAttack,
		1, // レベル1
		[]string{"magic_low"},
		10.0,
		"MAG",
		"魔法ダメージを与える基本魔法",
	)

	// 回復Lv1
	modules[2] = domain.NewModule(
		i.generateID("module"),
		"ヒールLv1",
		domain.Heal,
		1, // レベル1
		[]string{"heal_low"},
		8.0,
		"MAG",
		"HPを回復する基本回復魔法",
	)

	// バフLv1
	modules[3] = domain.NewModule(
		i.generateID("module"),
		"攻撃バフLv1",
		domain.Buff,
		1, // レベル1
		[]string{"buff_low"},
		5.0,
		"SPD",
		"一時的に攻撃力を上昇させる",
	)

	return modules
}

// CreateInitialAgent は初期エージェントを作成します。
// Requirement 3.8: 初期エージェント自動合成と装備
func (i *NewGameInitializer) CreateInitialAgent() *domain.AgentModel {
	core := i.CreateInitialCore()
	modules := i.CreateInitialModules()

	return domain.NewAgent(
		i.generateID("agent"),
		core,
		modules,
	)
}

// InitializeNewGame は新規ゲームを初期化してセーブデータを作成します。
// Requirement 17.5: セーブデータ不在時の新規ゲーム開始
func (i *NewGameInitializer) InitializeNewGame() *persistence.SaveData {
	// 基本のセーブデータを作成
	saveData := persistence.NewSaveData()

	// 初期エージェントを作成
	initialAgent := i.CreateInitialAgent()

	// インベントリにエージェントを追加
	saveData.Inventory.Agents = []*domain.AgentModel{initialAgent}

	// コアとモジュールはエージェント合成で消費されるため、インベントリには追加しない
	// （エージェントに含まれているコアとモジュールは参照として保持される）

	// 初期エージェントを装備
	saveData.Player.EquippedAgentIDs = []string{initialAgent.ID}

	return saveData
}

// CreateNewGameWithExtraItems は追加アイテム付きで新規ゲームを初期化します。
// デバッグや特殊条件での開始用
func (i *NewGameInitializer) CreateNewGameWithExtraItems() *persistence.SaveData {
	saveData := i.InitializeNewGame()

	// 追加のコアを作成してインベントリに追加
	extraCore := i.CreateInitialCore()
	saveData.Inventory.Cores = append(saveData.Inventory.Cores, extraCore)

	// 追加のモジュールを作成してインベントリに追加
	extraModules := i.CreateInitialModules()
	saveData.Inventory.Modules = append(saveData.Inventory.Modules, extraModules...)

	return saveData
}
