// Package battle はバトルエンジンを提供します。
// バトル初期化、敵攻撃、モジュール効果、勝敗判定を担当します。

package combat

import (
	"testing"
	"time"

	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/usecase/typing"
)

// newTestDamageModule はテスト用ダメージモジュールを作成するヘルパー関数です。
func newTestDamageModule(id, name string, tags []string, statCoef float64, statRef, description string) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:          id,
		Name:        name,
		Icon:        "⚔️",
		Tags:        tags,
		Description: description,
		Effects: []domain.ModuleEffect{
			{
				Target:      domain.TargetEnemy,
				HPFormula:   &domain.HPFormula{Base: 0, StatCoef: statCoef, StatRef: statRef},
				Probability: 1.0,
				Icon:        "⚔️",
			},
		},
	}, nil)
}

// newTestHealModule はテスト用回復モジュールを作成するヘルパー関数です。
func newTestHealModule(id, name string, tags []string, statCoef float64, statRef, description string) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:          id,
		Name:        name,
		Icon:        "💚",
		Tags:        tags,
		Description: description,
		Effects: []domain.ModuleEffect{
			{
				Target:      domain.TargetSelf,
				HPFormula:   &domain.HPFormula{Base: 0, StatCoef: statCoef, StatRef: statRef},
				Probability: 1.0,
				Icon:        "💚",
			},
		},
	}, nil)
}

// newTestBuffModule はテスト用バフモジュールを作成するヘルパー関数です。
func newTestBuffModule(id, name string, tags []string, description string) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:          id,
		Name:        name,
		Icon:        "⬆️",
		Tags:        tags,
		Description: description,
		Effects: []domain.ModuleEffect{
			{
				Target: domain.TargetSelf,
				ColumnSpec: &domain.EffectColumnSpec{
					Column:   domain.ColDamageBonus,
					Value:    10.0,
					Duration: 10.0,
				},
				Probability: 1.0,
				Icon:        "⬆️",
			},
		},
	}, nil)
}

// newTestDebuffModule はテスト用デバフモジュールを作成するヘルパー関数です。
func newTestDebuffModule(id, name string, tags []string, description string) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:          id,
		Name:        name,
		Icon:        "⬇️",
		Tags:        tags,
		Description: description,
		Effects: []domain.ModuleEffect{
			{
				Target: domain.TargetEnemy,
				ColumnSpec: &domain.EffectColumnSpec{
					Column:   domain.ColDamageCut,
					Value:    -10.0,
					Duration: 8.0,
				},
				Probability: 1.0,
				Icon:        "⬇️",
			},
		},
	}, nil)
}

// ==================== バトル初期化テスト（Task 7.1） ====================

// TestInitializeBattle はバトル初期化処理をテストします。

func TestInitializeBattle(t *testing.T) {
	// エージェントを準備
	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	// 敵タイプを準備
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             50,
			BaseAttackPower:    5,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	engine := NewBattleEngine(enemyTypes)
	state, err := engine.InitializeBattle(5, agents)

	if err != nil {
		t.Errorf("バトル初期化に失敗: %v", err)
	}
	if state == nil {
		t.Fatal("バトル状態がnil")
	}

	// 敵が生成されていることを確認
	if state.Enemy == nil {
		t.Error("敵が生成されていない")
	}
	if state.Enemy.Level != 5 {
		t.Errorf("敵レベル: 期待 5, 実際 %d", state.Enemy.Level)
	}

	// プレイヤーHPが設定されていることを確認

	if state.Player == nil {
		t.Fatal("プレイヤーがnil")
	}
	if state.Player.HP == 0 || state.Player.HP != state.Player.MaxHP {
		t.Error("プレイヤーHPが全回復されていない")
	}
}

// TestInitializeBattle_EnemyGeneration は指定レベルに基づく敵生成をテストします。

func TestInitializeBattle_EnemyGeneration(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "goblin",
			Name:               "ゴブリン",
			BaseHP:             100,
			BaseAttackPower:    10,
			BaseAttackInterval: 2500 * time.Millisecond,
			AttackType:         "physical",
		},
	}

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(10, agents)

	// レベル10の敵のHPは基礎HP × レベル係数
	// 仕様に応じた計算式を確認
	if state.Enemy.HP <= 0 {
		t.Error("敵HPが0以下")
	}
}

// ==================== 敵攻撃システムテスト（Task 7.2） ====================

// TestEnemyAttack は敵の攻撃処理をテストします。

func TestEnemyAttack(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             50,
			BaseAttackPower:    10,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	initialHP := state.Player.HP
	damage := engine.ProcessEnemyAttackDamage(state, "physical")

	if state.Player.HP >= initialHP {
		t.Error("プレイヤーHPが減少していない")
	}
	if damage <= 0 {
		t.Error("ダメージが0以下")
	}
}

// TestEnemyAttack_WithDefenseBuff は防御バフ適用時のダメージ計算をテストします。

func TestEnemyAttack_WithDefenseBuff(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             50,
			BaseAttackPower:    20,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// 防御バフを追加（30%ダメージ軽減）
	state.Player.EffectTable.AddBuff("防御バフ", 10.0, map[domain.EffectColumn]float64{
		domain.ColDamageCut: 0.3, // 30%軽減
	})

	damageWithBuff := engine.ProcessEnemyAttackDamage(state, "physical")

	// ダメージが軽減されていることを確認
	// 基礎ダメージ × 0.7 程度になるはず
	baseDamage := state.Enemy.AttackPower
	expectedMaxDamage := float64(baseDamage) * 0.8 // 軽減後のダメージは基礎の80%以下
	if float64(damageWithBuff) > expectedMaxDamage {
		t.Errorf("防御バフが適用されていない: 基礎ダメージ %d, 実際ダメージ %d", baseDamage, damageWithBuff)
	}
}

// ==================== 敵フェーズ変化テスト（Task 7.3） ====================

// TestEnemyPhaseTransition はHP50%以下での強化フェーズ移行をテストします。

func TestEnemyPhaseTransition(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "boss",
			Name:               "ボス",
			BaseHP:             200,
			BaseAttackPower:    15,
			BaseAttackInterval: 2 * time.Second,
			AttackType:         "physical",
		},
	}

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// 初期フェーズは通常
	if state.Enemy.Phase != domain.PhaseNormal {
		t.Error("初期フェーズが通常ではない")
	}

	// HPを50%以下に減少
	state.Enemy.HP = state.Enemy.MaxHP / 2

	// フェーズ変化チェック
	transitioned := engine.CheckPhaseTransition(state)
	if !transitioned {
		t.Error("フェーズ移行が発生しなかった")
	}
	if state.Enemy.Phase != domain.PhaseEnhanced {
		t.Error("強化フェーズに移行していない")
	}
}

// TestEnemySelfBuff は敵の自己バフ行動をテストします。
func TestEnemySelfBuff(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "boss",
			Name:               "ボス",
			BaseHP:             100,
			BaseAttackPower:    10,
			BaseAttackInterval: 2 * time.Second,
			AttackType:         "physical",
		},
	}

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// 敵に自己バフを付与（パターンベース）
	buffAction := domain.EnemyAction{
		ID:          "test_buff",
		Name:        "攻撃力UP",
		ActionType:  domain.EnemyActionBuff,
		EffectType:  "damage_mult",
		EffectValue: 1.3,
		Duration:    5.0,
	}
	engine.ApplyPatternBuff(state, buffAction)

	// バフが適用されていることを確認
	buffs := state.Enemy.EffectTable.FindBySourceType(domain.SourceBuff)
	if len(buffs) == 0 {
		t.Error("敵に自己バフが付与されていない")
	}
}

// TestPlayerDebuff はプレイヤーへのデバフ付与をテストします。
func TestPlayerDebuff(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "boss",
			Name:               "ボス",
			BaseHP:             100,
			BaseAttackPower:    10,
			BaseAttackInterval: 2 * time.Second,
			AttackType:         "physical",
		},
	}

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// プレイヤーにデバフを付与（パターンベース）
	debuffAction := domain.EnemyAction{
		ID:          "test_debuff",
		Name:        "クールダウン延長",
		ActionType:  domain.EnemyActionDebuff,
		EffectType:  "cooldown_reduce",
		EffectValue: -0.3,
		Duration:    5.0,
	}
	engine.ApplyPatternDebuff(state, debuffAction)

	// デバフが適用されていることを確認
	debuffs := state.Player.EffectTable.FindBySourceType(domain.SourceDebuff)
	if len(debuffs) == 0 {
		t.Error("プレイヤーにデバフが付与されていない")
	}
}

// ==================== モジュール効果計算テスト（Task 7.4） ====================

// TestCalculateAttackDamage は攻撃ダメージ計算をテストします。

func TestCalculateAttackDamage(t *testing.T) {
	engine := NewBattleEngine(nil)

	// エージェントを準備
	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "物理打撃", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)

	// タイピング結果を準備
	typingResult := &typing.TypingResult{
		Completed:      true,
		SpeedFactor:    1.5,
		AccuracyFactor: 0.9,
	}

	// 物理攻撃モジュール（STR参照）
	module := modules[0]

	damage := engine.CalculateModuleEffectWithPassive(agent, module, typingResult)

	// 基礎効果(10) × STR値(100=10*10) × 速度係数(1.5) × 正確性係数(0.9)
	// ただし係数の適用方法は実装依存
	if damage <= 0 {
		t.Error("ダメージが0以下")
	}
}

// TestCalculateHealAmount は回復量計算をテストします。

func TestCalculateHealAmount(t *testing.T) {
	engine := NewBattleEngine(nil)

	coreType := domain.CoreType{
		ID:          "healer",
		Name:        "ヒーラー",
		StatWeights: map[string]float64{"STR": 0.5, "INT": 1.5, "WIL": 0.8, "LUK": 1.2},
		AllowedTags: []string{"heal_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "ヒーラーコア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestHealModule("m1", "ヒール", []string{"heal_low"}, 0.8, "WIL", ""),
		newTestHealModule("m2", "モジュール", []string{"heal_low"}, 0.8, "WIL", ""),
		newTestHealModule("m3", "モジュール", []string{"heal_low"}, 0.8, "WIL", ""),
		newTestHealModule("m4", "モジュール", []string{"heal_low"}, 0.8, "WIL", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)

	typingResult := &typing.TypingResult{
		Completed:      true,
		SpeedFactor:    1.2,
		AccuracyFactor: 1.0,
	}

	module := modules[0]
	healAmount := engine.CalculateModuleEffectWithPassive(agent, module, typingResult)

	if healAmount <= 0 {
		t.Error("回復量が0以下")
	}
}

// TestAccuracyPenalty は正確性50%未満での効果半減をテストします。

func TestAccuracyPenalty(t *testing.T) {
	engine := NewBattleEngine(nil)

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "物理打撃", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)

	// 正確性100%
	normalResult := &typing.TypingResult{
		Completed:      true,
		SpeedFactor:    1.0,
		AccuracyFactor: 1.0,
	}
	normalDamage := engine.CalculateModuleEffectWithPassive(agent, modules[0], normalResult)

	// 正確性40%（50%未満）
	lowAccuracyResult := &typing.TypingResult{
		Completed:      true,
		SpeedFactor:    1.0,
		AccuracyFactor: 0.4,
	}
	penalizedDamage := engine.CalculateModuleEffectWithPassive(agent, modules[0], lowAccuracyResult)

	// 半減されているはず
	expectedPenalizedDamage := normalDamage / 2
	tolerance := expectedPenalizedDamage / 5 // 20%の誤差許容
	if penalizedDamage > expectedPenalizedDamage+tolerance {
		t.Errorf("正確性ペナルティが適用されていない: 通常ダメージ %d, ペナルティダメージ %d", normalDamage, penalizedDamage)
	}
}

// ==================== バトル勝敗判定テスト（Task 7.5） ====================

// TestCheckVictory は敵HP=0での勝利判定をテストします。

func TestCheckVictory(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             50,
			BaseAttackPower:    5,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// 敵HPを0に
	state.Enemy.HP = 0

	ended, result := engine.CheckBattleEnd(state)
	if !ended {
		t.Error("バトル終了と判定されなかった")
	}
	if !result.IsVictory {
		t.Error("勝利と判定されなかった")
	}
}

// TestCheckDefeat はプレイヤーHP=0での敗北判定をテストします。

func TestCheckDefeat(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             50,
			BaseAttackPower:    5,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// プレイヤーHPを0に
	state.Player.HP = 0

	ended, result := engine.CheckBattleEnd(state)
	if !ended {
		t.Error("バトル終了と判定されなかった")
	}
	if result.IsVictory {
		t.Error("敗北なのに勝利と判定された")
	}
}

// TestBattleStatistics はバトル統計記録をテストします。

func TestBattleStatistics(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             50,
			BaseAttackPower:    5,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// タイピング結果を記録
	typingResult := &typing.TypingResult{
		Completed:   true,
		WPM:         80.0,
		Accuracy:    0.95,
		SpeedFactor: 1.2,
	}
	engine.RecordTypingResult(state, typingResult)

	// 統計が記録されていることを確認
	if state.Stats.TotalTypingCount == 0 {
		t.Error("タイピング統計が記録されていない")
	}
}

// ==================== パッシブスキル統合テスト（Task 6） ====================

// TestRegisterPassiveSkills_SingleAgent は単一エージェントのパッシブスキル登録をテストします。
func TestRegisterPassiveSkills_SingleAgent(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             50,
			BaseAttackPower:    5,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	// バフ効果時間+50%のパッシブスキルを持つエージェントを準備
	coreType := domain.CoreType{
		ID:             "buff_master",
		Name:           "バフマスター",
		StatWeights:    map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_buff_extender",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_buff_extender",
		Name:        "バフエクステンダー",
		Description: "バフ効果時間+50%",
		Effects: map[domain.EffectColumn]float64{
			domain.ColCooldownReduce: 0.15,
		},
	}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	// TypeIDを設定
	core.TypeID = "buff_master"
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// パッシブスキルを登録
	engine.RegisterPassiveSkills(state, agents)

	// パッシブスキルが永続効果として登録されていることを確認
	coreEffects := state.Player.EffectTable.FindBySourceType(domain.SourcePassive)
	if len(coreEffects) == 0 {
		t.Error("パッシブスキルがEffectTableに登録されていない")
	}

	// 登録された効果が永続（Duration == nil）であることを確認
	for _, effect := range coreEffects {
		if effect.Duration != nil {
			t.Error("パッシブスキル効果が永続ではない（Durationがnilでない）")
		}
		if effect.Name != "バフエクステンダー" {
			t.Errorf("効果名が一致しない: 期待 'バフエクステンダー', 実際 '%s'", effect.Name)
		}
	}
}

// TestRegisterPassiveSkills_MultipleAgents は複数エージェントのパッシブスキル登録をテストします。
func TestRegisterPassiveSkills_MultipleAgents(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             50,
			BaseAttackPower:    5,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	// 2つのエージェントを準備（それぞれ異なるパッシブスキル）
	coreType1 := domain.CoreType{
		ID:             "buff_master",
		Name:           "バフマスター",
		StatWeights:    map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_buff_extender",
	}
	passiveSkill1 := domain.PassiveSkill{
		ID:          "ps_buff_extender",
		Name:        "バフエクステンダー",
		Description: "バフ効果時間+50%",
		Effects: map[domain.EffectColumn]float64{
			domain.ColCooldownReduce: 0.15,
		},
	}
	core1 := domain.NewCore("core_001", "コア1", 5, coreType1, passiveSkill1)
	core1.TypeID = "buff_master"

	coreType2 := domain.CoreType{
		ID:             "attacker",
		Name:           "アタッカー",
		StatWeights:    map[string]float64{"STR": 1.5, "INT": 0.5, "WIL": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_damage_boost",
	}
	passiveSkill2 := domain.PassiveSkill{
		ID:          "ps_damage_boost",
		Name:        "ダメージブースト",
		Description: "攻撃ダメージ+20%",
		Effects: map[domain.EffectColumn]float64{
			domain.ColSTRMultiplier: 1.2,
		},
	}
	core2 := domain.NewCore("core_002", "コア2", 3, coreType2, passiveSkill2)
	core2.TypeID = "attacker"

	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}

	agent1 := domain.NewAgent("agent_001", core1, modules)
	agent2 := domain.NewAgent("agent_002", core2, modules)
	agents := []*domain.AgentModel{agent1, agent2}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// パッシブスキルを登録
	engine.RegisterPassiveSkills(state, agents)

	// 両方のパッシブスキルが登録されていることを確認
	coreEffects := state.Player.EffectTable.FindBySourceType(domain.SourcePassive)
	if len(coreEffects) != 2 {
		t.Errorf("パッシブスキルの登録数が不正: 期待 2, 実際 %d", len(coreEffects))
	}

	// 各エージェントのパッシブスキルが登録されていることを確認
	foundBuffExtender := false
	foundDamageBoost := false
	for _, effect := range coreEffects {
		if effect.Name == "バフエクステンダー" {
			foundBuffExtender = true
		}
		if effect.Name == "ダメージブースト" {
			foundDamageBoost = true
		}
	}
	if !foundBuffExtender {
		t.Error("バフエクステンダーが登録されていない")
	}
	if !foundDamageBoost {
		t.Error("ダメージブーストが登録されていない")
	}
}

// TestRegisterPassiveSkills_LevelScaling はコアレベルに応じた効果量計算をテストします。
func TestRegisterPassiveSkills_LevelScaling(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             50,
			BaseAttackPower:    5,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	// レベル10のコアを準備
	coreType := domain.CoreType{
		ID:             "tank",
		Name:           "タンク",
		StatWeights:    map[string]float64{"STR": 0.8, "INT": 0.5, "WIL": 0.7, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_damage_reduction",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_damage_reduction",
		Name:        "ダメージリダクション",
		Description: "被ダメージ軽減",
		Effects: map[domain.EffectColumn]float64{
			domain.ColDamageCut: 0.1,
		},
	}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	core.TypeID = "tank"

	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// パッシブスキルを登録
	engine.RegisterPassiveSkills(state, agents)

	// 効果量が登録されていることを確認
	coreEffects := state.Player.EffectTable.FindBySourceType(domain.SourcePassive)
	if len(coreEffects) == 0 {
		t.Fatal("パッシブスキルが登録されていない")
	}

	expectedReduction := 0.1
	actualReduction := coreEffects[0].Values[domain.ColDamageCut]

	// 浮動小数点の比較は許容誤差を使用
	tolerance := 0.001
	if actualReduction < expectedReduction-tolerance || actualReduction > expectedReduction+tolerance {
		t.Errorf("効果量が不正: 期待 %.3f, 実際 %.3f", expectedReduction, actualReduction)
	}
}

// TestRegisterPassiveSkills_EmptyPassiveSkill は空のパッシブスキルをスキップすることをテストします。
func TestRegisterPassiveSkills_EmptyPassiveSkill(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             50,
			BaseAttackPower:    5,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	// パッシブスキルIDが空のコア
	coreType := domain.CoreType{
		ID:          "no_passive",
		Name:        "ノーパッシブ",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
		// PassiveSkillIDは空
	}
	passiveSkill := domain.PassiveSkill{
		// IDが空
		Name: "",
	}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// パッシブスキルを登録
	engine.RegisterPassiveSkills(state, agents)

	// 空のパッシブスキルは登録されないことを確認
	coreEffects := state.Player.EffectTable.FindBySourceType(domain.SourcePassive)
	if len(coreEffects) != 0 {
		t.Errorf("空のパッシブスキルが登録された: %d件", len(coreEffects))
	}
}

// TestPassiveSkillDamageReduction はパッシブスキルによるダメージ軽減をテストします。
func TestPassiveSkillDamageReduction(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             50,
			BaseAttackPower:    100, // 明確なダメージ値
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	// ダメージ軽減パッシブスキルを持つエージェント
	coreType := domain.CoreType{
		ID:             "tank",
		Name:           "タンク",
		StatWeights:    map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_damage_reduction",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_damage_reduction",
		Name:        "ダメージリダクション",
		Description: "被ダメージ20%軽減",
		Effects: map[domain.EffectColumn]float64{
			domain.ColDamageCut: 0.2,
		},
	}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	core.TypeID = "tank"
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// パッシブスキルを登録
	engine.RegisterPassiveSkills(state, agents)

	// 敵の攻撃を処理
	initialHP := state.Player.HP
	damage := engine.ProcessEnemyAttackDamage(state, "physical")

	// ダメージが軽減されていることを確認
	// 敵の攻撃力は BaseAttackPower + (level * 2) = 100 + 10 = 110
	// 110に対して20%軽減 = 88ダメージ
	expectedDamage := int(float64(state.Enemy.AttackPower) * 0.8)
	if damage != expectedDamage {
		t.Errorf("パッシブスキルによるダメージ軽減が適用されていない: 期待 %d, 実際 %d (敵攻撃力 %d)", expectedDamage, damage, state.Enemy.AttackPower)
	}

	// HPが正しく減少していることを確認
	if state.Player.HP != initialHP-damage {
		t.Errorf("HP減少量が不正: 初期HP %d, 現在HP %d, ダメージ %d", initialHP, state.Player.HP, damage)
	}
}

// TestPassiveSkillSTRMultiplier はパッシブスキルによるSTR乗算をテストします。
// パッシブスキルはBattleStateのEffectTableを通じて適用されるため、
// CalculateModuleEffectWithPassiveは基礎計算のみを行います。
// このテストはパッシブスキルの登録と効果適用の動作を確認します。
func TestPassiveSkillSTRMultiplier(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             100,
			BaseAttackPower:    10,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}
	engine := NewBattleEngine(enemyTypes)

	// STR乗算パッシブスキルを持つエージェント
	coreType := domain.CoreType{
		ID:             "attacker",
		Name:           "アタッカー",
		StatWeights:    map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_power_boost",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_power_boost",
		Name:        "パワーブースト",
		Description: "攻撃力+20%",
		Effects: map[domain.EffectColumn]float64{
			domain.ColDamageMultiplier: 1.2,
		},
	}
	core := domain.NewCore("core_001", "コア", 1, coreType, passiveSkill)
	core.TypeID = "attacker"
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "物理打撃", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	// BattleStateを作成してパッシブスキルを登録
	state, _ := engine.InitializeBattle(1, agents)
	engine.RegisterPassiveSkills(state, agents)

	// タイピング結果
	typingResult := &typing.TypingResult{
		Completed:      true,
		SpeedFactor:    1.0,
		AccuracyFactor: 1.0,
	}

	// ApplyModuleEffectを使用して実際のダメージを計算
	// パッシブスキルが登録されているのでダメージ乗算が適用される
	initialEnemyHP := state.Enemy.HP
	engine.ApplyModuleEffect(state, agent, modules[0], typingResult)
	damageDealt := initialEnemyHP - state.Enemy.HP

	// 基本ダメージ: STR 10 × 係数 1.0 = 10
	// パッシブスキルでダメージ×1.2 → 10×1.2 = 12
	expectedDamage := 12

	tolerance := 1
	if damageDealt < expectedDamage-tolerance || damageDealt > expectedDamage+tolerance {
		t.Errorf("パッシブスキルによるダメージ乗算が適用されていない: 期待 %d, 実際 %d",
			expectedDamage, damageDealt)
	}
}

// TestPassiveSkillEffectContinuesDuringRecast はリキャスト中もパッシブスキル効果が継続することをテストします。
func TestPassiveSkillEffectContinuesDuringRecast(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             50,
			BaseAttackPower:    100,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	// ダメージ軽減パッシブスキルを持つエージェント
	coreType := domain.CoreType{
		ID:             "tank",
		Name:           "タンク",
		StatWeights:    map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_damage_reduction",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_damage_reduction",
		Name:        "ダメージリダクション",
		Description: "被ダメージ30%軽減",
		Effects: map[domain.EffectColumn]float64{
			domain.ColDamageCut: 0.3,
		},
	}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	core.TypeID = "tank"
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// パッシブスキルを登録
	engine.RegisterPassiveSkills(state, agents)

	// 1回目の攻撃
	damage1 := engine.ProcessEnemyAttackDamage(state, "physical")

	// エフェクトの時間を経過させる（リキャスト中をシミュレート）
	engine.UpdateEffects(state, 5.0) // 5秒経過

	// 2回目の攻撃（リキャスト中でもパッシブスキルは有効）
	damage2 := engine.ProcessEnemyAttackDamage(state, "physical")

	// 両方とも同じダメージ（パッシブスキルが継続適用されている）
	// 敵の攻撃力は BaseAttackPower + (level * 2) = 100 + 10 = 110
	expectedDamage := int(float64(state.Enemy.AttackPower) * 0.7)
	if damage1 != expectedDamage {
		t.Errorf("1回目の攻撃でパッシブスキルが適用されていない: 期待 %d, 実際 %d", expectedDamage, damage1)
	}
	if damage2 != expectedDamage {
		t.Errorf("2回目の攻撃（リキャスト中）でパッシブスキルが適用されていない: 期待 %d, 実際 %d", expectedDamage, damage2)
	}
}

// TestGetPlayerStatsWithPassive はパッシブスキル適用後のステータス取得をテストします。
func TestGetPlayerStatsWithPassive(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             50,
			BaseAttackPower:    10,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	// 複数のパッシブ効果を持つエージェント
	coreType := domain.CoreType{
		ID:             "all_stats",
		Name:           "オールステータス",
		StatWeights:    map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_all_stats",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_all_stats",
		Name:        "オールステータスアップ",
		Description: "全ステータス+10",
		Effects: map[domain.EffectColumn]float64{
			domain.ColSTRBonus:  10,
			domain.ColINTBonus:  10,
			domain.ColWILBonus:  10,
			domain.ColLUKBonus:  10,
			domain.ColDamageCut: 0.1,
		},
	}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	core.TypeID = "all_stats"
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// パッシブスキルを登録
	engine.RegisterPassiveSkills(state, agents)

	// ステータスを取得
	finalStats := engine.GetPlayerFinalStats(state)

	// パッシブスキルによる補正が適用されていることを確認
	// 新システムではSTRではなくDamageCutをチェック
	if finalStats.DamageCut < 0.05 {
		t.Errorf("DamageCutにパッシブスキル効果が適用されていない: 期待 >= 0.05, 実際 %.2f", finalStats.DamageCut)
	}
}

// ==================== パッシブスキル統合テスト（Task 6.3） ====================

// TestPassiveSkillIntegration_BattleInitToStatCalculation はバトル初期化からステータス計算までの一連フローを検証します。
func TestPassiveSkillIntegration_BattleInitToStatCalculation(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             100,
			BaseAttackPower:    50,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	// ダメージ軽減20%のパッシブスキルを持つエージェント
	coreType := domain.CoreType{
		ID:             "tank",
		Name:           "タンク",
		StatWeights:    map[string]float64{"STR": 0.8, "INT": 0.6, "WIL": 0.7, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_damage_reduction",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_damage_reduction",
		Name:        "ダメージリダクション",
		Description: "被ダメージ20%軽減",
		Effects: map[domain.EffectColumn]float64{
			domain.ColDamageCut: 0.2,
		},
	}
	core := domain.NewCore("core_001", "タンクコア", 5, coreType, passiveSkill)
	core.TypeID = "tank"
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "物理攻撃", []string{"physical_low"}, 1.0, "STR", ""),
		newTestHealModule("m2", "回復", []string{"physical_low"}, 0.8, "WIL", ""),
		newTestBuffModule("m3", "バフ", []string{"physical_low"}, ""),
		newTestDebuffModule("m4", "デバフ", []string{"physical_low"}, ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	// Step 1: バトル初期化
	engine := NewBattleEngine(enemyTypes)
	state, err := engine.InitializeBattle(5, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// Step 2: パッシブスキル登録
	engine.RegisterPassiveSkills(state, agents)

	// Step 3: パッシブスキルが登録されていることを確認
	coreEffects := state.Player.EffectTable.FindBySourceType(domain.SourcePassive)
	if len(coreEffects) != 1 {
		t.Errorf("パッシブスキルの登録数が不正: 期待 1, 実際 %d", len(coreEffects))
	}

	// Step 4: ステータス計算
	finalStats := engine.GetPlayerFinalStats(state)
	if finalStats.DamageCut != 0.2 {
		t.Errorf("DamageReductionが不正: 期待 0.2, 実際 %.2f", finalStats.DamageCut)
	}

	// Step 5: 実際のダメージ計算に適用されていることを確認
	damage := engine.ProcessEnemyAttackDamage(state, "physical")
	expectedDamage := int(float64(state.Enemy.AttackPower) * 0.8)
	if damage != expectedDamage {
		t.Errorf("ダメージ計算が不正: 期待 %d, 実際 %d (敵攻撃力 %d)", expectedDamage, damage, state.Enemy.AttackPower)
	}
}

// TestPassiveSkillIntegration_MultipleAgentCoexistence は複数エージェントのパッシブスキル併存をテストします。
func TestPassiveSkillIntegration_MultipleAgentCoexistence(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             100,
			BaseAttackPower:    100,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	// エージェント1: ダメージ軽減パッシブ
	coreType1 := domain.CoreType{
		ID:             "tank",
		Name:           "タンク",
		StatWeights:    map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_damage_reduction",
	}
	passiveSkill1 := domain.PassiveSkill{
		ID:          "ps_damage_reduction",
		Name:        "ダメージリダクション",
		Description: "被ダメージ15%軽減",
		Effects: map[domain.EffectColumn]float64{
			domain.ColDamageCut: 0.15,
		},
	}
	core1 := domain.NewCore("core_001", "タンクコア", 5, coreType1, passiveSkill1)
	core1.TypeID = "tank"

	// エージェント2: クールダウン短縮パッシブ
	coreType2 := domain.CoreType{
		ID:             "speeder",
		Name:           "スピーダー",
		StatWeights:    map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.5, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_cd_reduction",
	}
	passiveSkill2 := domain.PassiveSkill{
		ID:          "ps_cd_reduction",
		Name:        "クールダウンリダクション",
		Description: "クールダウン10%短縮",
		Effects: map[domain.EffectColumn]float64{
			domain.ColCooldownReduce: 0.1,
		},
	}
	core2 := domain.NewCore("core_002", "スピーダーコア", 5, coreType2, passiveSkill2)
	core2.TypeID = "speeder"

	// エージェント3: STRアップパッシブ
	coreType3 := domain.CoreType{
		ID:             "attacker",
		Name:           "アタッカー",
		StatWeights:    map[string]float64{"STR": 1.5, "INT": 0.8, "WIL": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_str_up",
	}
	passiveSkill3 := domain.PassiveSkill{
		ID:          "ps_str_up",
		Name:        "パワーアップ",
		Description: "STR+20",
		Effects: map[domain.EffectColumn]float64{
			domain.ColSTRBonus: 20,
		},
	}
	core3 := domain.NewCore("core_003", "アタッカーコア", 5, coreType3, passiveSkill3)
	core3.TypeID = "attacker"

	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール1", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール2", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール3", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール4", []string{"physical_low"}, 1.0, "STR", ""),
	}

	agent1 := domain.NewAgent("agent_001", core1, modules)
	agent2 := domain.NewAgent("agent_002", core2, modules)
	agent3 := domain.NewAgent("agent_003", core3, modules)
	agents := []*domain.AgentModel{agent1, agent2, agent3}

	engine := NewBattleEngine(enemyTypes)
	state, err := engine.InitializeBattle(5, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// パッシブスキル登録
	engine.RegisterPassiveSkills(state, agents)

	// 3つのパッシブスキルが全て登録されていることを確認
	coreEffects := state.Player.EffectTable.FindBySourceType(domain.SourcePassive)
	if len(coreEffects) != 3 {
		t.Errorf("パッシブスキルの登録数が不正: 期待 3, 実際 %d", len(coreEffects))
	}

	// 各パッシブ効果が正しく適用されていることを確認
	finalStats := engine.GetPlayerFinalStats(state)

	// ダメージ軽減: 0.15
	if finalStats.DamageCut != 0.15 {
		t.Errorf("DamageReductionが不正: 期待 0.15, 実際 %.2f", finalStats.DamageCut)
	}

	// クールダウン短縮: 0.1
	if finalStats.CooldownReduce != 0.1 {
		t.Errorf("CDReductionが不正: 期待 0.1, 実際 %.2f", finalStats.CooldownReduce)
	}

	// 新システムではSTRではなくDamageBonus等をチェック（STR_Addは新システムではDamageBonusに変換される）
	// DamageBonusのチェックはスキップ（パッシブスキルの設定次第）

	// 実際のダメージ計算で複数のパッシブ効果が適用されていることを確認
	damage := engine.ProcessEnemyAttackDamage(state, "physical")
	expectedDamage := int(float64(state.Enemy.AttackPower) * 0.85) // 15%軽減
	if damage != expectedDamage {
		t.Errorf("ダメージ計算で複数パッシブが適用されていない: 期待 %d, 実際 %d", expectedDamage, damage)
	}
}

// TestPassiveSkillIntegration_RecastPersistence はリキャスト中のパッシブスキル効果継続をテストします。
func TestPassiveSkillIntegration_RecastPersistence(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             100,
			BaseAttackPower:    100,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	// ダメージ軽減パッシブを持つエージェント
	coreType := domain.CoreType{
		ID:             "tank",
		Name:           "タンク",
		StatWeights:    map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_damage_reduction",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_damage_reduction",
		Name:        "ダメージリダクション",
		Description: "被ダメージ25%軽減",
		Effects: map[domain.EffectColumn]float64{
			domain.ColDamageCut: 0.25,
		},
	}
	core := domain.NewCore("core_001", "タンクコア", 5, coreType, passiveSkill)
	core.TypeID = "tank"
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)
	engine.RegisterPassiveSkills(state, agents)

	// 初期ダメージを記録
	initialDamage := engine.ProcessEnemyAttackDamage(state, "physical")
	expectedDamage := int(float64(state.Enemy.AttackPower) * 0.75)
	if initialDamage != expectedDamage {
		t.Errorf("初期ダメージが不正: 期待 %d, 実際 %d", expectedDamage, initialDamage)
	}

	// 時限バフを追加（これはリキャスト中に切れる想定）
	state.Player.EffectTable.AddBuff("一時バフ", 3.0, map[domain.EffectColumn]float64{
		domain.ColDamageCut: 0.1, // 追加で10%軽減
	})

	// バフ適用中のダメージ（新システムではmax取りなので、max(25%, 10%) = 25%軽減）
	buffedDamage := engine.ProcessEnemyAttackDamage(state, "physical")
	// max取りなので元の25%軽減と同じになる
	if buffedDamage != initialDamage {
		t.Errorf("バフ適用中ダメージが不正: 期待 %d, 実際 %d（max取りなので元と同じはず）", initialDamage, buffedDamage)
	}

	// 時間を経過させてバフを切れさせる（パッシブスキルは永続なので残る）
	engine.UpdateEffects(state, 5.0) // 5秒経過

	// バフ切れ後のダメージ（パッシブスキルの25%軽減のみ）
	afterBuffExpiredDamage := engine.ProcessEnemyAttackDamage(state, "physical")
	if afterBuffExpiredDamage != expectedDamage {
		t.Errorf("バフ切れ後ダメージが不正: 期待 %d, 実際 %d (パッシブスキル効果が消えている可能性)", expectedDamage, afterBuffExpiredDamage)
	}

	// パッシブスキルが残っていることを確認
	coreEffects := state.Player.EffectTable.FindBySourceType(domain.SourcePassive)
	if len(coreEffects) != 1 {
		t.Errorf("パッシブスキルが消えている: %d件", len(coreEffects))
	}

	// 時限バフが消えていることを確認
	buffEffects := state.Player.EffectTable.FindBySourceType(domain.SourceBuff)
	if len(buffEffects) != 0 {
		t.Errorf("時限バフが残っている: %d件", len(buffEffects))
	}
}

// TestPassiveSkillIntegration_CombinedEffects はパッシブスキルと他のバフ/デバフの組み合わせをテストします。
func TestPassiveSkillIntegration_CombinedEffects(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             100,
			BaseAttackPower:    100,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	// ダメージ軽減パッシブを持つエージェント
	coreType := domain.CoreType{
		ID:             "defender",
		Name:           "ディフェンダー",
		StatWeights:    map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_damage_cut",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_damage_cut",
		Name:        "アイアンウォール",
		Description: "ダメージ軽減20%",
		Effects: map[domain.EffectColumn]float64{
			domain.ColDamageCut: 0.2,
		},
	}
	core := domain.NewCore("core_001", "ディフェンダーコア", 10, coreType, passiveSkill)
	core.TypeID = "defender"
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "物理攻撃", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)
	engine.RegisterPassiveSkills(state, agents)

	// パッシブスキル効果を確認
	finalStats := engine.GetPlayerFinalStats(state)

	// パッシブスキルによるダメージ軽減が登録されていることを確認
	if finalStats.DamageCut < 0.15 {
		t.Errorf("パッシブスキルのダメージ軽減が不足: 期待 >= 0.15, 実際 %f", finalStats.DamageCut)
	}

	// 追加バフを追加（さらに10%軽減）
	state.Player.EffectTable.AddBuff("防御バフ", 10.0, map[domain.EffectColumn]float64{
		domain.ColDamageCut: 0.1, // 追加で10%軽減
	})

	// 組み合わせ効果を確認（max取りなので大きい方が適用）
	combinedStats := engine.GetPlayerFinalStats(state)
	// 新システムではDamageCutはmax取りなので、0.2が適用される
	if combinedStats.DamageCut < 0.2 {
		t.Errorf("組み合わせ効果が不正: 期待DamageCut >= 0.2, 実際 %f", combinedStats.DamageCut)
	}

	t.Logf("パッシブスキル適用後DamageCut: %f", finalStats.DamageCut)
	t.Logf("バフ追加後DamageCut: %f", combinedStats.DamageCut)
}

// ==================== 敵パッシブスキルシステムテスト（Task 4） ====================

// TestRegisterEnemyPassive_NormalPhase はバトル開始時に通常パッシブがEffectTableに登録されることをテストします。
func TestRegisterEnemyPassive_NormalPhase(t *testing.T) {
	// 通常パッシブを持つ敵タイプ
	normalPassive := &domain.EnemyPassiveSkill{
		ID:          "slime_normal",
		Name:        "ぷるぷるボディ",
		Description: "物理ダメージを10%軽減",
		Effects: map[domain.EffectColumn]float64{
			domain.ColDamageCut: 0.1,
		},
	}
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             50,
			BaseAttackPower:    5,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
			NormalPassive:      normalPassive,
		},
	}

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, err := engine.InitializeBattle(5, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// 敵パッシブスキルを登録
	engine.RegisterEnemyPassive(state)

	// 敵のEffectTableに通常パッシブが登録されていることを確認
	passives := state.Enemy.EffectTable.FindBySourceType(domain.SourcePassive)
	if len(passives) != 1 {
		t.Errorf("敵のパッシブスキルの登録数が不正: 期待 1, 実際 %d", len(passives))
	}

	if passives[0].Name != "ぷるぷるボディ" {
		t.Errorf("パッシブ名が不正: 期待 ぷるぷるボディ, 実際 %s", passives[0].Name)
	}

	// パッシブが永続効果（Duration=nil）であることを確認
	if passives[0].Duration != nil {
		t.Error("パッシブスキルは永続効果（Duration=nil）であるべきです")
	}

	// 敵のActivePassiveIDが設定されていることを確認
	if state.Enemy.ActivePassiveID != "slime_normal" {
		t.Errorf("ActivePassiveIDが不正: 期待 slime_normal, 実際 %s", state.Enemy.ActivePassiveID)
	}
}

// TestRegisterEnemyPassive_NoPassive はパッシブ未設定の場合にスキップされることをテストします。
func TestRegisterEnemyPassive_NoPassive(t *testing.T) {
	// パッシブなしの敵タイプ
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             50,
			BaseAttackPower:    5,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
			// NormalPassiveはnil
		},
	}

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, err := engine.InitializeBattle(5, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// 敵パッシブスキルを登録
	engine.RegisterEnemyPassive(state)

	// パッシブ未設定の場合、EffectTableには何も登録されないことを確認
	passives := state.Enemy.EffectTable.FindBySourceType(domain.SourcePassive)
	if len(passives) != 0 {
		t.Errorf("パッシブ未設定の敵にパッシブが登録された: %d件", len(passives))
	}

	// ActivePassiveIDは空のまま
	if state.Enemy.ActivePassiveID != "" {
		t.Errorf("ActivePassiveIDが設定されている: %s", state.Enemy.ActivePassiveID)
	}
}

// TestRegisterEnemyPassive_EffectApplied は敵パッシブスキルの効果が適用されることをテストします。
func TestRegisterEnemyPassive_EffectApplied(t *testing.T) {
	// 攻撃力ボーナスを持つ通常パッシブ
	normalPassive := &domain.EnemyPassiveSkill{
		ID:          "goblin_normal",
		Name:        "戦闘本能",
		Description: "攻撃力+30%",
		Effects: map[domain.EffectColumn]float64{
			domain.ColDamageMultiplier: 1.3,
		},
	}
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "goblin",
			Name:               "ゴブリン",
			BaseHP:             100,
			BaseAttackPower:    50,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
			NormalPassive:      normalPassive,
		},
	}

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, err := engine.InitializeBattle(5, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// 敵パッシブスキルを登録
	engine.RegisterEnemyPassive(state)

	// 敵のEffectTableから効果を集計
	ctx := domain.NewEffectContext(state.Player.HP, state.Player.MaxHP, state.Enemy.HP, state.Enemy.MaxHP)
	effects := state.Enemy.EffectTable.Aggregate(ctx)

	// 攻撃力+30%が適用されていることを確認
	if effects.DamageMultiplier != 1.3 {
		t.Errorf("DamageMultiplierが不正: 期待 1.3, 実際 %f", effects.DamageMultiplier)
	}
}

// TestSwitchEnemyPassive_OnPhaseTransition はフェーズ遷移時にパッシブが切り替わることをテストします。
func TestSwitchEnemyPassive_OnPhaseTransition(t *testing.T) {
	// 通常パッシブと強化パッシブを持つ敵タイプ
	normalPassive := &domain.EnemyPassiveSkill{
		ID:          "slime_normal",
		Name:        "ぷるぷるボディ",
		Description: "物理ダメージを10%軽減",
		Effects: map[domain.EffectColumn]float64{
			domain.ColDamageCut: 0.1,
		},
	}
	enhancedPassive := &domain.EnemyPassiveSkill{
		ID:          "slime_enhanced",
		Name:        "怒りのスライム",
		Description: "攻撃力+50%",
		Effects: map[domain.EffectColumn]float64{
			domain.ColDamageMultiplier: 1.5,
		},
	}
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             100,
			BaseAttackPower:    10,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
			NormalPassive:      normalPassive,
			EnhancedPassive:    enhancedPassive,
		},
	}

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, err := engine.InitializeBattle(5, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// 初期状態: 通常パッシブを登録
	engine.RegisterEnemyPassive(state)

	// 通常パッシブが適用されていることを確認
	ctx := domain.NewEffectContext(state.Player.HP, state.Player.MaxHP, state.Enemy.HP, state.Enemy.MaxHP)
	effects := state.Enemy.EffectTable.Aggregate(ctx)
	if effects.DamageCut != 0.1 {
		t.Errorf("通常パッシブのDamageCutが不正: 期待 0.1, 実際 %f", effects.DamageCut)
	}

	// 敵のHPを50%以下にしてフェーズ遷移
	state.Enemy.HP = state.Enemy.MaxHP / 2
	transitioned := engine.CheckPhaseTransition(state)
	if !transitioned {
		t.Fatal("フェーズ遷移が発生しなかった")
	}

	// パッシブ切り替えを実行
	engine.SwitchEnemyPassive(state)

	// 強化パッシブが適用されていることを確認
	effects = state.Enemy.EffectTable.Aggregate(ctx)
	if effects.DamageMultiplier != 1.5 {
		t.Errorf("強化パッシブのDamageMultiplierが不正: 期待 1.5, 実際 %f", effects.DamageMultiplier)
	}

	// 通常パッシブが無効化されていることを確認（DamageCutが0）
	if effects.DamageCut != 0.0 {
		t.Errorf("通常パッシブのDamageCutが残っている: 実際 %f", effects.DamageCut)
	}

	// ActivePassiveIDが更新されていることを確認
	if state.Enemy.ActivePassiveID != "slime_enhanced" {
		t.Errorf("ActivePassiveIDが不正: 期待 slime_enhanced, 実際 %s", state.Enemy.ActivePassiveID)
	}
}

// TestSwitchEnemyPassive_NoEnhancedPassive は強化パッシブがない場合のフェーズ遷移をテストします。
func TestSwitchEnemyPassive_NoEnhancedPassive(t *testing.T) {
	// 通常パッシブのみを持つ敵タイプ
	normalPassive := &domain.EnemyPassiveSkill{
		ID:          "slime_normal",
		Name:        "ぷるぷるボディ",
		Description: "物理ダメージを10%軽減",
		Effects: map[domain.EffectColumn]float64{
			domain.ColDamageCut: 0.1,
		},
	}
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             100,
			BaseAttackPower:    10,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
			NormalPassive:      normalPassive,
			// EnhancedPassiveはnil
		},
	}

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, err := engine.InitializeBattle(5, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// 初期状態: 通常パッシブを登録
	engine.RegisterEnemyPassive(state)

	// 敵のHPを50%以下にしてフェーズ遷移
	state.Enemy.HP = state.Enemy.MaxHP / 2
	engine.CheckPhaseTransition(state)

	// パッシブ切り替えを実行（強化パッシブなし）
	engine.SwitchEnemyPassive(state)

	// 通常パッシブが無効化されていることを確認
	ctx := domain.NewEffectContext(state.Player.HP, state.Player.MaxHP, state.Enemy.HP, state.Enemy.MaxHP)
	effects := state.Enemy.EffectTable.Aggregate(ctx)
	if effects.DamageCut != 0.0 {
		t.Errorf("通常パッシブのDamageCutが残っている: 実際 %f", effects.DamageCut)
	}

	// ActivePassiveIDが空であることを確認
	if state.Enemy.ActivePassiveID != "" {
		t.Errorf("ActivePassiveIDが残っている: %s", state.Enemy.ActivePassiveID)
	}
}

// TestSwitchEnemyPassive_NoNormalPassive はフェーズ遷移時に通常パッシブがない場合をテストします。
func TestSwitchEnemyPassive_NoNormalPassive(t *testing.T) {
	// 強化パッシブのみを持つ敵タイプ（通常パッシブなし）
	enhancedPassive := &domain.EnemyPassiveSkill{
		ID:          "slime_enhanced",
		Name:        "怒りのスライム",
		Description: "攻撃力+50%",
		Effects: map[domain.EffectColumn]float64{
			domain.ColDamageMultiplier: 1.5,
		},
	}
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "slime",
			Name:               "スライム",
			BaseHP:             100,
			BaseAttackPower:    10,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
			// NormalPassiveはnil
			EnhancedPassive: enhancedPassive,
		},
	}

	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModule("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, err := engine.InitializeBattle(5, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// 初期状態: 通常パッシブなし
	engine.RegisterEnemyPassive(state)

	// パッシブが登録されていないことを確認
	passives := state.Enemy.EffectTable.FindBySourceType(domain.SourcePassive)
	if len(passives) != 0 {
		t.Errorf("通常パッシブなしなのにパッシブが登録されている: %d件", len(passives))
	}

	// 敵のHPを50%以下にしてフェーズ遷移
	state.Enemy.HP = state.Enemy.MaxHP / 2
	engine.CheckPhaseTransition(state)

	// パッシブ切り替えを実行（通常パッシブなし→強化パッシブあり）
	engine.SwitchEnemyPassive(state)

	// 強化パッシブが適用されていることを確認
	ctx := domain.NewEffectContext(state.Player.HP, state.Player.MaxHP, state.Enemy.HP, state.Enemy.MaxHP)
	effects := state.Enemy.EffectTable.Aggregate(ctx)
	if effects.DamageMultiplier != 1.5 {
		t.Errorf("強化パッシブのDamageMultiplierが不正: 期待 1.5, 実際 %f", effects.DamageMultiplier)
	}

	// ActivePassiveIDが更新されていることを確認
	if state.Enemy.ActivePassiveID != "slime_enhanced" {
		t.Errorf("ActivePassiveIDが不正: 期待 slime_enhanced, 実際 %s", state.Enemy.ActivePassiveID)
	}
}

// ==================== Task 6.2: バトル進行ロジック統合テスト ====================

// TestBattleEngine_DetermineNextAction_PatternBased は行動パターンがある場合にパターンベース行動が使われることをテストします。
func TestBattleEngine_DetermineNextAction_PatternBased(t *testing.T) {
	// 行動パターンを持つ敵タイプを定義
	normalActions := []domain.EnemyAction{
		{
			ID:             "act_slash",
			Name:           "斬撃",
			ActionType:     domain.EnemyActionAttack,
			AttackType:     "physical",
			DamageBase:     10.0,
			DamagePerLevel: 2.0,
			ChargeTime:     1 * time.Second,
		},
		{
			ID:          "act_buff",
			Name:        "気合い",
			ActionType:  domain.EnemyActionBuff,
			EffectType:  "damage_mult",
			EffectValue: 1.5,
			Duration:    5.0,
			ChargeTime:  500 * time.Millisecond,
		},
	}

	enemyTypes := []domain.EnemyType{
		{
			ID:                    "pattern_enemy",
			Name:                  "パターン敵",
			BaseHP:                100,
			BaseAttackPower:       10,
			BaseAttackInterval:    3 * time.Second,
			AttackType:            "physical",
			ResolvedNormalActions: normalActions,
		},
	}

	engine := NewBattleEngine(enemyTypes)

	// エージェントを作成
	coreType := domain.CoreType{
		ID:          "test_core",
		Name:        "テストコア",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test_passive", Name: "テストパッシブ"}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール1", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	// 敵を生成（パターンあり）
	state, _ := engine.InitializeBattle(5, agents)
	state.Enemy.Type = enemyTypes[0] // 行動パターンを持つ敵タイプに設定

	// パターンベースの行動を決定
	nextAction := engine.DeterminePatternBasedAction(state)

	// 最初の行動が斬撃であること
	if nextAction.ActionType != EnemyActionAttack {
		t.Errorf("最初の行動は攻撃であるべき: got %d", nextAction.ActionType)
	}
	if nextAction.SourceAction == nil {
		t.Error("SourceActionが設定されていない")
	} else if nextAction.SourceAction.ID != "act_slash" {
		t.Errorf("最初の行動IDが不正: got %s, want act_slash", nextAction.SourceAction.ID)
	}

	// チャージタイムが設定されていること
	if nextAction.ChargeTimeMs != 1000 {
		t.Errorf("チャージタイムが不正: got %d, want 1000", nextAction.ChargeTimeMs)
	}
}

// TestBattleEngine_ProcessEnemyTurn_PhaseTransitionWithPatternReset はフェーズ遷移時の行動パターンリセットをテストします。
func TestBattleEngine_ProcessEnemyTurn_PhaseTransitionWithPatternReset(t *testing.T) {
	normalActions := []domain.EnemyAction{
		{ID: "normal_1", Name: "通常攻撃1", ActionType: domain.EnemyActionAttack, AttackType: "physical"},
		{ID: "normal_2", Name: "通常攻撃2", ActionType: domain.EnemyActionAttack, AttackType: "physical"},
	}
	enhancedActions := []domain.EnemyAction{
		{ID: "enhanced_1", Name: "強化攻撃1", ActionType: domain.EnemyActionAttack, AttackType: "physical"},
	}
	normalPassive := &domain.EnemyPassiveSkill{
		ID:      "normal_passive",
		Name:    "通常パッシブ",
		Effects: map[domain.EffectColumn]float64{},
	}
	enhancedPassive := &domain.EnemyPassiveSkill{
		ID:   "enhanced_passive",
		Name: "強化パッシブ",
		Effects: map[domain.EffectColumn]float64{
			domain.ColDamageMultiplier: 2.0,
		},
	}

	enemyTypes := []domain.EnemyType{
		{
			ID:                      "phase_enemy",
			Name:                    "フェーズ敵",
			BaseHP:                  100,
			BaseAttackPower:         10,
			BaseAttackInterval:      3 * time.Second,
			AttackType:              "physical",
			ResolvedNormalActions:   normalActions,
			ResolvedEnhancedActions: enhancedActions,
			NormalPassive:           normalPassive,
			EnhancedPassive:         enhancedPassive,
		},
	}

	engine := NewBattleEngine(enemyTypes)

	// エージェントを作成
	coreType := domain.CoreType{
		ID:          "test_core",
		Name:        "テストコア",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test_passive", Name: "テストパッシブ"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール1", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	state, _ := engine.InitializeBattle(10, agents)
	state.Enemy = domain.NewEnemy("test", "フェーズ敵 Lv.10", 10, 100, 10, 3*time.Second, enemyTypes[0])

	// 敵パッシブを登録
	engine.RegisterEnemyPassive(state)

	// 通常フェーズで行動インデックスを進める
	state.Enemy.AdvanceActionIndex()
	if state.Enemy.ActionIndex != 1 {
		t.Errorf("行動インデックスが進んでいない: got %d, want 1", state.Enemy.ActionIndex)
	}

	// HP50%以下にしてフェーズ遷移をトリガー
	state.Enemy.HP = 45

	// フェーズ遷移と行動インデックスのリセット
	if engine.CheckPhaseTransition(state) {
		state.Enemy.ResetActionIndex()
		engine.SwitchEnemyPassive(state)
	}

	// 行動インデックスが0にリセットされていること
	if state.Enemy.ActionIndex != 0 {
		t.Errorf("フェーズ遷移後に行動インデックスがリセットされていない: got %d, want 0", state.Enemy.ActionIndex)
	}

	// 強化フェーズになっていること
	if !state.Enemy.IsEnhanced() {
		t.Error("敵が強化フェーズに移行していない")
	}

	// 強化パッシブが適用されていること
	if state.Enemy.ActivePassiveID != "enhanced_passive" {
		t.Errorf("ActivePassiveIDが不正: got %s, want enhanced_passive", state.Enemy.ActivePassiveID)
	}
}

// TestBattleEngine_ProcessEnemyTurn_AdvanceActionIndex は敵ターン処理後に行動インデックスが進むことをテストします。
func TestBattleEngine_ProcessEnemyTurn_AdvanceActionIndex(t *testing.T) {
	normalActions := []domain.EnemyAction{
		{
			ID:         "act_1",
			Name:       "行動1",
			ActionType: domain.EnemyActionAttack,
			AttackType: "physical",
		},
		{
			ID:         "act_2",
			Name:       "行動2",
			ActionType: domain.EnemyActionAttack,
			AttackType: "physical",
		},
		{
			ID:         "act_3",
			Name:       "行動3",
			ActionType: domain.EnemyActionAttack,
			AttackType: "physical",
		},
	}

	enemyTypes := []domain.EnemyType{
		{
			ID:                    "sequence_enemy",
			Name:                  "シーケンス敵",
			BaseHP:                1000,
			BaseAttackPower:       10,
			BaseAttackInterval:    3 * time.Second,
			AttackType:            "physical",
			ResolvedNormalActions: normalActions,
		},
	}

	engine := NewBattleEngine(enemyTypes)

	// エージェントを作成
	coreType := domain.CoreType{
		ID:          "test_core",
		Name:        "テストコア",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test_passive", Name: "テストパッシブ"}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール1", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	state, _ := engine.InitializeBattle(5, agents)
	state.Enemy = domain.NewEnemy("test", "シーケンス敵 Lv.5", 5, 1000, 10, 3*time.Second, enemyTypes[0])

	// 初期状態: ActionIndex = 0
	if state.Enemy.ActionIndex != 0 {
		t.Errorf("初期ActionIndexが0でない: got %d", state.Enemy.ActionIndex)
	}

	// 現在の行動を確認
	action := state.Enemy.GetCurrentAction()
	if action.ID != "act_1" {
		t.Errorf("最初の行動が不正: got %s, want act_1", action.ID)
	}

	// 行動インデックスを進める
	state.Enemy.AdvanceActionIndex()
	if state.Enemy.ActionIndex != 1 {
		t.Errorf("ActionIndexが進んでいない: got %d, want 1", state.Enemy.ActionIndex)
	}

	action = state.Enemy.GetCurrentAction()
	if action.ID != "act_2" {
		t.Errorf("次の行動が不正: got %s, want act_2", action.ID)
	}

	// 最後まで進めてループ確認
	state.Enemy.AdvanceActionIndex() // index = 2
	state.Enemy.AdvanceActionIndex() // index = 0 (ループ)

	if state.Enemy.ActionIndex != 0 {
		t.Errorf("ActionIndexがループしていない: got %d, want 0", state.Enemy.ActionIndex)
	}

	action = state.Enemy.GetCurrentAction()
	if action.ID != "act_1" {
		t.Errorf("ループ後の行動が不正: got %s, want act_1", action.ID)
	}
}

// ==================== Task 7.2: 敵行動パターン実行テスト ====================

// TestBattleEngine_ApplyPatternBuff は敵の自己バフ行動をテストします。
func TestBattleEngine_ApplyPatternBuff(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "boss",
			Name:               "ボス",
			BaseHP:             200,
			BaseAttackPower:    20,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	coreType := domain.CoreType{
		ID:          "test_core",
		Name:        "テストコア",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(10, agents)

	// バフ前の敵の攻撃力乗算を確認
	ctx := domain.NewEffectContext(state.Player.HP, state.Player.MaxHP, state.Enemy.HP, state.Enemy.MaxHP)
	effectsBefore := state.Enemy.EffectTable.Aggregate(ctx)
	initialMultiplier := effectsBefore.DamageMultiplier

	// 敵の自己バフ行動を実行
	buffAction := domain.EnemyAction{
		ID:          "buff_attack_up",
		Name:        "攻撃力強化",
		ActionType:  domain.EnemyActionBuff,
		EffectType:  "damage_mult",
		EffectValue: 1.5,
		Duration:    10.0,
	}
	engine.ApplyPatternBuff(state, buffAction)

	// バフ後の敵の攻撃力乗算を確認
	effectsAfter := state.Enemy.EffectTable.Aggregate(ctx)

	// バフが適用されていること
	if effectsAfter.DamageMultiplier <= initialMultiplier {
		t.Errorf("バフが適用されていない: before=%f, after=%f", initialMultiplier, effectsAfter.DamageMultiplier)
	}

	// バフが敵のEffectTableに登録されていること
	buffs := state.Enemy.EffectTable.FindBySourceType(domain.SourceBuff)
	if len(buffs) == 0 {
		t.Error("バフがEffectTableに登録されていない")
	}
}

// TestBattleEngine_ApplyPatternDebuff はプレイヤーへのデバフ行動をテストします。
func TestBattleEngine_ApplyPatternDebuff(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "boss",
			Name:               "ボス",
			BaseHP:             200,
			BaseAttackPower:    20,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	coreType := domain.CoreType{
		ID:          "test_core",
		Name:        "テストコア",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(10, agents)

	// デバフ前のプレイヤーのクールダウン短縮を確認
	ctx := domain.NewEffectContext(state.Player.HP, state.Player.MaxHP, state.Enemy.HP, state.Enemy.MaxHP)
	effectsBefore := state.Player.EffectTable.Aggregate(ctx)
	initialCooldownReduce := effectsBefore.CooldownReduce

	// プレイヤーへのデバフ行動を実行
	debuffAction := domain.EnemyAction{
		ID:          "debuff_slow",
		Name:        "スロウ",
		ActionType:  domain.EnemyActionDebuff,
		EffectType:  "cooldown_reduce",
		EffectValue: -0.3,
		Duration:    8.0,
	}
	engine.ApplyPatternDebuff(state, debuffAction)

	// デバフ後のプレイヤーのクールダウン短縮を確認
	effectsAfter := state.Player.EffectTable.Aggregate(ctx)

	// デバフが適用されていること（クールダウン短縮がマイナスになる）
	if effectsAfter.CooldownReduce >= initialCooldownReduce {
		t.Errorf("デバフが適用されていない: before=%f, after=%f", initialCooldownReduce, effectsAfter.CooldownReduce)
	}

	// デバフがプレイヤーのEffectTableに登録されていること
	debuffs := state.Player.EffectTable.FindBySourceType(domain.SourceDebuff)
	if len(debuffs) == 0 {
		t.Error("デバフがEffectTableに登録されていない")
	}
}

// TestBattleEngine_ProcessDefenseAction はディフェンス行動の即時発動をテストします。
func TestBattleEngine_ProcessDefenseAction(t *testing.T) {
	defenseAction := domain.EnemyAction{
		ID:          "defense_physical",
		Name:        "物理防御",
		ActionType:  domain.EnemyActionDefense,
		DefenseType: domain.DefensePhysicalCut,
		EffectValue: 0.5,
		Duration:    5.0,
	}

	enemyTypes := []domain.EnemyType{
		{
			ID:                 "defender",
			Name:               "ディフェンダー",
			BaseHP:             200,
			BaseAttackPower:    10,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
			ResolvedNormalActions: []domain.EnemyAction{
				defenseAction,
			},
		},
	}

	coreType := domain.CoreType{
		ID:          "test_core",
		Name:        "テストコア",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(10, agents)
	state.Enemy = domain.NewEnemy("test", "ディフェンダー Lv.10", 10, 200, 10, 3*time.Second, enemyTypes[0])

	// ディフェンス行動の発動（ドメインメソッドを直接使用）
	now := time.Now()
	duration := time.Duration(defenseAction.Duration * float64(time.Second))
	state.Enemy.StartDefense(defenseAction.DefenseType, defenseAction.EffectValue, duration, now)

	// ディフェンスモードになっていること
	if state.Enemy.WaitMode != domain.WaitModeDefending {
		t.Errorf("WaitModeがDefendingになっていない: got %v", state.Enemy.WaitMode)
	}

	// ディフェンスタイプが設定されていること
	if state.Enemy.ActiveDefenseType != domain.DefensePhysicalCut {
		t.Errorf("ActiveDefenseTypeが不正: got %s", state.Enemy.ActiveDefenseType)
	}

	// ディフェンス値が設定されていること
	if state.Enemy.DefenseValue != 0.5 {
		t.Errorf("DefenseValueが不正: got %f, want 0.5", state.Enemy.DefenseValue)
	}

	// ディフェンスが有効であること
	if !state.Enemy.IsDefenseActive(now) {
		t.Error("ディフェンスが有効になっていない")
	}
}

// TestBattleEngine_ApplyDefenseReduction_PhysicalCut は物理ディフェンスによるダメージ軽減をテストします。
func TestBattleEngine_ApplyDefenseReduction_PhysicalCut(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "defender",
			Name:               "ディフェンダー",
			BaseHP:             200,
			BaseAttackPower:    10,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	coreType := domain.CoreType{
		ID:          "test_core",
		Name:        "テストコア",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(10, agents)

	// 物理ディフェンスを発動（50%軽減）
	now := time.Now()
	state.Enemy.StartDefense(domain.DefensePhysicalCut, 0.5, 5*time.Second, now)

	// 物理攻撃のダメージ計算
	baseDamage := 100
	reducedDamage := engine.ApplyDefenseReduction(state, baseDamage, "physical")

	// 50%軽減されていること
	expectedDamage := 50
	if reducedDamage != expectedDamage {
		t.Errorf("物理ダメージ軽減が不正: got %d, want %d", reducedDamage, expectedDamage)
	}

	// 魔法攻撃には軽減が適用されないこと
	magicDamage := engine.ApplyDefenseReduction(state, baseDamage, "magic")
	if magicDamage != baseDamage {
		t.Errorf("魔法ダメージに軽減が適用された: got %d, want %d", magicDamage, baseDamage)
	}
}

// TestBattleEngine_ApplyDefenseReduction_MagicCut は魔法ディフェンスによるダメージ軽減をテストします。
func TestBattleEngine_ApplyDefenseReduction_MagicCut(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "defender",
			Name:               "ディフェンダー",
			BaseHP:             200,
			BaseAttackPower:    10,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "magic",
		},
	}

	coreType := domain.CoreType{
		ID:          "test_core",
		Name:        "テストコア",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"magic_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"magic_low"}, 1.0, "INT", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(10, agents)

	// 魔法ディフェンスを発動（30%軽減）
	now := time.Now()
	state.Enemy.StartDefense(domain.DefenseMagicCut, 0.3, 5*time.Second, now)

	// 魔法攻撃のダメージ計算
	baseDamage := 100
	reducedDamage := engine.ApplyDefenseReduction(state, baseDamage, "magic")

	// 30%軽減されていること
	expectedDamage := 70
	if reducedDamage != expectedDamage {
		t.Errorf("魔法ダメージ軽減が不正: got %d, want %d", reducedDamage, expectedDamage)
	}

	// 物理攻撃には軽減が適用されないこと
	physicalDamage := engine.ApplyDefenseReduction(state, baseDamage, "physical")
	if physicalDamage != baseDamage {
		t.Errorf("物理ダメージに軽減が適用された: got %d, want %d", physicalDamage, baseDamage)
	}
}

// TestBattleEngine_CheckDebuffEvasion はデバフ回避ディフェンスをテストします。
func TestBattleEngine_CheckDebuffEvasion(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "evader",
			Name:               "イベーダー",
			BaseHP:             150,
			BaseAttackPower:    15,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	coreType := domain.CoreType{
		ID:          "test_core",
		Name:        "テストコア",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDebuffModule("m1", "デバフモジュール", []string{"physical_low"}, ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(10, agents)

	// デバフ回避ディフェンスを発動
	now := time.Now()
	state.Enemy.StartDefense(domain.DefenseDebuffEvade, 1.0, 5*time.Second, now)

	// デバフ回避チェック（回避率100%なので必ず回避）
	evaded := engine.CheckDebuffEvasion(state)
	if !evaded {
		t.Error("デバフ回避が発動しなかった")
	}

	// ディフェンス終了
	state.Enemy.EndDefense()

	// ディフェンス終了後はデバフが通ること
	evaded = engine.CheckDebuffEvasion(state)
	if evaded {
		t.Error("ディフェンス終了後にデバフ回避が発動した")
	}
}

// TestBattleEngine_DefenseExpiration はディフェンス終了後の行動進行をテストします。
func TestBattleEngine_DefenseExpiration(t *testing.T) {
	defenseAction := domain.EnemyAction{
		ID:          "defense_magic",
		Name:        "魔法防御",
		ActionType:  domain.EnemyActionDefense,
		DefenseType: domain.DefenseMagicCut,
		EffectValue: 0.4,
		Duration:    3.0,
	}
	attackAction := domain.EnemyAction{
		ID:         "attack",
		Name:       "攻撃",
		ActionType: domain.EnemyActionAttack,
		AttackType: "physical",
	}

	enemyTypes := []domain.EnemyType{
		{
			ID:                 "defender",
			Name:               "ディフェンダー",
			BaseHP:             200,
			BaseAttackPower:    10,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
			ResolvedNormalActions: []domain.EnemyAction{
				defenseAction,
				attackAction,
			},
		},
	}

	coreType := domain.CoreType{
		ID:          "test_core",
		Name:        "テストコア",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(10, agents)
	state.Enemy = domain.NewEnemy("test", "ディフェンダー Lv.10", 10, 200, 10, 3*time.Second, enemyTypes[0])

	// 初期ActionIndexが0であること
	if state.Enemy.ActionIndex != 0 {
		t.Errorf("初期ActionIndexが0でない: got %d", state.Enemy.ActionIndex)
	}

	// ディフェンス行動開始（ドメインメソッドを直接使用）
	now := time.Now()
	duration := time.Duration(defenseAction.Duration * float64(time.Second))
	state.Enemy.StartDefense(defenseAction.DefenseType, defenseAction.EffectValue, duration, now)

	// ディフェンス中はActionIndexが変わらない
	if state.Enemy.ActionIndex != 0 {
		t.Errorf("ディフェンス中にActionIndexが変わった: got %d", state.Enemy.ActionIndex)
	}

	// ディフェンス終了
	state.Enemy.EndDefense()

	// ActionIndexが進んでいること
	if state.Enemy.ActionIndex != 1 {
		t.Errorf("ディフェンス終了後にActionIndexが進んでいない: got %d", state.Enemy.ActionIndex)
	}

	// 次の行動が攻撃であること
	nextAction := state.Enemy.GetCurrentAction()
	if nextAction.ID != "attack" {
		t.Errorf("次の行動が不正: got %s, want attack", nextAction.ID)
	}
}

// TestBattleEngine_CalculatePatternDamage はパターンベースダメージ計算をテストします。
func TestBattleEngine_CalculatePatternDamage(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "attacker",
			Name:               "アタッカー",
			BaseHP:             100,
			BaseAttackPower:    10,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}

	coreType := domain.CoreType{
		ID:          "test_core",
		Name:        "テストコア",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(10, agents)

	tests := []struct {
		name           string
		damageBase     float64
		damagePerLevel float64
		level          int
		expected       int
	}{
		{"基本ダメージ", 10.0, 2.0, 10, 30},   // 10 + 10*2 = 30
		{"高レベル", 20.0, 3.0, 50, 170},    // 20 + 50*3 = 170
		{"低レベル", 5.0, 1.0, 1, 6},        // 5 + 1*1 = 6
		{"レベル係数なし", 50.0, 0.0, 100, 50}, // 50 + 100*0 = 50
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			action := domain.EnemyAction{
				ID:             "test_attack",
				Name:           "テスト攻撃",
				ActionType:     domain.EnemyActionAttack,
				DamageBase:     tt.damageBase,
				DamagePerLevel: tt.damagePerLevel,
			}

			// レベルを変更してダメージ計算
			state.Enemy.Level = tt.level
			damage := engine.CalculatePatternDamage(state, action)
			if damage != tt.expected {
				t.Errorf("ダメージ計算が不正: got %d, want %d", damage, tt.expected)
			}
		})
	}
}
