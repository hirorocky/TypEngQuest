// Package battle はバトルエンジンを提供します。
// バトル初期化、敵攻撃、モジュール効果、勝敗判定を担当します。

package combat

import (
	"testing"
	"time"

	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/usecase/typing"
)

// newTestModule はテスト用モジュールを作成するヘルパー関数です。
func newTestModule(id, name string, category domain.ModuleCategory, level int, tags []string, baseEffect float64, statRef, description string) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:          id,
		Name:        name,
		Category:    category,
		Level:       level,
		Tags:        tags,
		BaseEffect:  baseEffect,
		StatRef:     statRef,
		Description: description,
	}, nil)
}

// ==================== バトル初期化テスト（Task 7.1） ====================

// TestInitializeBattle はバトル初期化処理をテストします。

func TestInitializeBattle(t *testing.T) {
	// エージェントを準備
	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	initialHP := state.Player.HP
	damage := engine.ProcessEnemyAttack(state)

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
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// 防御バフを追加（30%ダメージ軽減）
	duration := 10.0
	state.Player.EffectTable.AddRow(domain.EffectRow{
		ID:         "defense_buff_001",
		SourceType: domain.SourceBuff,
		Name:       "防御バフ",
		Duration:   &duration,
		Modifiers: domain.StatModifiers{
			DamageReduction: 0.3, // 30%軽減
		},
	})

	damageWithBuff := engine.ProcessEnemyAttack(state)

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
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// 敵に自己バフを付与
	engine.ApplyEnemySelfBuff(state, EnemyBuffAttackUp)

	// バフが適用されていることを確認
	buffs := state.Enemy.EffectTable.GetRowsBySource(domain.SourceBuff)
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
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// プレイヤーにデバフを付与
	engine.ApplyPlayerDebuff(state, PlayerDebuffCooldownExtend)

	// デバフが適用されていることを確認
	debuffs := state.Player.EffectTable.GetRowsBySource(domain.SourceDebuff)
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
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestModule("m1", "物理打撃", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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

	damage := engine.CalculateModuleEffect(agent, module, typingResult)

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
		StatWeights: map[string]float64{"STR": 0.5, "MAG": 1.5, "SPD": 0.8, "LUK": 1.2},
		AllowedTags: []string{"heal_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "ヒーラーコア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestModule("m1", "ヒール", domain.Heal, 1, []string{"heal_low"}, 8.0, "MAG", ""),
		newTestModule("m2", "モジュール", domain.Heal, 1, []string{"heal_low"}, 8.0, "MAG", ""),
		newTestModule("m3", "モジュール", domain.Heal, 1, []string{"heal_low"}, 8.0, "MAG", ""),
		newTestModule("m4", "モジュール", domain.Heal, 1, []string{"heal_low"}, 8.0, "MAG", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)

	typingResult := &typing.TypingResult{
		Completed:      true,
		SpeedFactor:    1.2,
		AccuracyFactor: 1.0,
	}

	module := modules[0]
	healAmount := engine.CalculateModuleEffect(agent, module, typingResult)

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
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestModule("m1", "物理打撃", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)

	// 正確性100%
	normalResult := &typing.TypingResult{
		Completed:      true,
		SpeedFactor:    1.0,
		AccuracyFactor: 1.0,
	}
	normalDamage := engine.CalculateModuleEffect(agent, modules[0], normalResult)

	// 正確性40%（50%未満）
	lowAccuracyResult := &typing.TypingResult{
		Completed:      true,
		SpeedFactor:    1.0,
		AccuracyFactor: 0.4,
	}
	penalizedDamage := engine.CalculateModuleEffect(agent, modules[0], lowAccuracyResult)

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
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト"}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_buff_extender",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_buff_extender",
		Name:        "バフエクステンダー",
		Description: "バフ効果時間+50%",
		BaseModifiers: domain.StatModifiers{
			CDReduction: 0.15, // テスト用にCDReductionを設定
		},
		ScalePerLevel: 0.1,
	}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	// TypeIDを設定
	core.TypeID = "buff_master"
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// パッシブスキルを登録
	engine.RegisterPassiveSkills(state, agents)

	// パッシブスキルが永続効果として登録されていることを確認
	coreEffects := state.Player.EffectTable.GetRowsBySource(domain.SourceCore)
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
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_buff_extender",
	}
	passiveSkill1 := domain.PassiveSkill{
		ID:          "ps_buff_extender",
		Name:        "バフエクステンダー",
		Description: "バフ効果時間+50%",
		BaseModifiers: domain.StatModifiers{
			CDReduction: 0.15,
		},
		ScalePerLevel: 0.1,
	}
	core1 := domain.NewCore("core_001", "コア1", 5, coreType1, passiveSkill1)
	core1.TypeID = "buff_master"

	coreType2 := domain.CoreType{
		ID:             "attacker",
		Name:           "アタッカー",
		StatWeights:    map[string]float64{"STR": 1.5, "MAG": 0.5, "SPD": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_damage_boost",
	}
	passiveSkill2 := domain.PassiveSkill{
		ID:          "ps_damage_boost",
		Name:        "ダメージブースト",
		Description: "攻撃ダメージ+20%",
		BaseModifiers: domain.StatModifiers{
			STR_Mult: 1.2,
		},
		ScalePerLevel: 0.05,
	}
	core2 := domain.NewCore("core_002", "コア2", 3, coreType2, passiveSkill2)
	core2.TypeID = "attacker"

	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
	}

	agent1 := domain.NewAgent("agent_001", core1, modules)
	agent2 := domain.NewAgent("agent_002", core2, modules)
	agents := []*domain.AgentModel{agent1, agent2}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// パッシブスキルを登録
	engine.RegisterPassiveSkills(state, agents)

	// 両方のパッシブスキルが登録されていることを確認
	coreEffects := state.Player.EffectTable.GetRowsBySource(domain.SourceCore)
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
		StatWeights:    map[string]float64{"STR": 0.8, "MAG": 0.5, "SPD": 0.7, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_damage_reduction",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_damage_reduction",
		Name:        "ダメージリダクション",
		Description: "被ダメージ軽減",
		BaseModifiers: domain.StatModifiers{
			DamageReduction: 0.1, // レベル1で10%軽減
		},
		ScalePerLevel: 0.05, // レベルごとに5%増加
	}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	core.TypeID = "tank"

	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// パッシブスキルを登録
	engine.RegisterPassiveSkills(state, agents)

	// 効果量がレベルスケーリングされていることを確認
	// レベル10: 0.1 × (1 + 0.05 × 9) = 0.1 × 1.45 = 0.145
	coreEffects := state.Player.EffectTable.GetRowsBySource(domain.SourceCore)
	if len(coreEffects) == 0 {
		t.Fatal("パッシブスキルが登録されていない")
	}

	expectedReduction := 0.1 * (1 + 0.05*9) // 0.145
	actualReduction := coreEffects[0].Modifiers.DamageReduction

	// 浮動小数点の比較は許容誤差を使用
	tolerance := 0.001
	if actualReduction < expectedReduction-tolerance || actualReduction > expectedReduction+tolerance {
		t.Errorf("効果量のスケーリングが不正: 期待 %.3f, 実際 %.3f", expectedReduction, actualReduction)
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
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
		// PassiveSkillIDは空
	}
	passiveSkill := domain.PassiveSkill{
		// IDが空
		Name: "",
	}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// パッシブスキルを登録
	engine.RegisterPassiveSkills(state, agents)

	// 空のパッシブスキルは登録されないことを確認
	coreEffects := state.Player.EffectTable.GetRowsBySource(domain.SourceCore)
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
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_damage_reduction",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_damage_reduction",
		Name:        "ダメージリダクション",
		Description: "被ダメージ20%軽減",
		BaseModifiers: domain.StatModifiers{
			DamageReduction: 0.2, // 20%軽減
		},
		ScalePerLevel: 0.0, // スケーリングなし
	}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	core.TypeID = "tank"
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// パッシブスキルを登録
	engine.RegisterPassiveSkills(state, agents)

	// 敵の攻撃を処理
	initialHP := state.Player.HP
	damage := engine.ProcessEnemyAttack(state)

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
func TestPassiveSkillSTRMultiplier(t *testing.T) {
	engine := NewBattleEngine(nil)

	// STR乗算パッシブスキルを持つエージェント
	coreType := domain.CoreType{
		ID:             "attacker",
		Name:           "アタッカー",
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_power_boost",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_power_boost",
		Name:        "パワーブースト",
		Description: "攻撃力+20%",
		BaseModifiers: domain.StatModifiers{
			STR_Mult: 1.2, // 20%増加
		},
		ScalePerLevel: 0.0,
	}
	core := domain.NewCore("core_001", "コア", 10, coreType, passiveSkill)
	core.TypeID = "attacker"
	modules := []*domain.ModuleModel{
		newTestModule("m1", "物理打撃", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)

	// タイピング結果
	typingResult := &typing.TypingResult{
		Completed:      true,
		SpeedFactor:    1.0,
		AccuracyFactor: 1.0,
	}

	// パッシブスキルなしの場合のダメージ
	damageWithoutPassive := engine.CalculateModuleEffect(agent, modules[0], typingResult)

	// パッシブスキルありの場合のダメージ
	damageWithPassive := engine.CalculateModuleEffectWithPassive(agent, modules[0], typingResult)

	// 20%増加していることを確認
	expectedDamageWithPassive := int(float64(damageWithoutPassive) * 1.2)
	tolerance := 1 // 整数丸めの許容誤差
	if damageWithPassive < expectedDamageWithPassive-tolerance || damageWithPassive > expectedDamageWithPassive+tolerance {
		t.Errorf("パッシブスキルによるSTR乗算が適用されていない: 期待 %d, 実際 %d (元 %d)",
			expectedDamageWithPassive, damageWithPassive, damageWithoutPassive)
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
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_damage_reduction",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_damage_reduction",
		Name:        "ダメージリダクション",
		Description: "被ダメージ30%軽減",
		BaseModifiers: domain.StatModifiers{
			DamageReduction: 0.3, // 30%軽減
		},
		ScalePerLevel: 0.0,
	}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	core.TypeID = "tank"
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	// パッシブスキルを登録
	engine.RegisterPassiveSkills(state, agents)

	// 1回目の攻撃
	damage1 := engine.ProcessEnemyAttack(state)

	// エフェクトの時間を経過させる（リキャスト中をシミュレート）
	engine.UpdateEffects(state, 5.0) // 5秒経過

	// 2回目の攻撃（リキャスト中でもパッシブスキルは有効）
	state.NextAttackTime = time.Now().Add(-1 * time.Second) // 攻撃可能に
	damage2 := engine.ProcessEnemyAttack(state)

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
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_all_stats",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_all_stats",
		Name:        "オールステータスアップ",
		Description: "全ステータス+10",
		BaseModifiers: domain.StatModifiers{
			STR_Add:         10,
			MAG_Add:         10,
			SPD_Add:         10,
			LUK_Add:         10,
			DamageReduction: 0.1,
		},
		ScalePerLevel: 0.0,
	}
	core := domain.NewCore("core_001", "コア", 5, coreType, passiveSkill)
	core.TypeID = "all_stats"
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
	if finalStats.STR != 10 { // 基礎0 + 10
		t.Errorf("STRにパッシブスキル効果が適用されていない: 期待 10, 実際 %d", finalStats.STR)
	}
	if finalStats.DamageReduction != 0.1 {
		t.Errorf("DamageReductionにパッシブスキル効果が適用されていない: 期待 0.1, 実際 %.2f", finalStats.DamageReduction)
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
		StatWeights:    map[string]float64{"STR": 0.8, "MAG": 0.6, "SPD": 0.7, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_damage_reduction",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_damage_reduction",
		Name:        "ダメージリダクション",
		Description: "被ダメージ20%軽減",
		BaseModifiers: domain.StatModifiers{
			DamageReduction: 0.2,
		},
		ScalePerLevel: 0.0,
	}
	core := domain.NewCore("core_001", "タンクコア", 5, coreType, passiveSkill)
	core.TypeID = "tank"
	modules := []*domain.ModuleModel{
		newTestModule("m1", "物理攻撃", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "回復", domain.Heal, 1, []string{"physical_low"}, 8.0, "MAG", ""),
		newTestModule("m3", "バフ", domain.Buff, 1, []string{"physical_low"}, 5.0, "SPD", ""),
		newTestModule("m4", "デバフ", domain.Debuff, 1, []string{"physical_low"}, 5.0, "LUK", ""),
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
	coreEffects := state.Player.EffectTable.GetRowsBySource(domain.SourceCore)
	if len(coreEffects) != 1 {
		t.Errorf("パッシブスキルの登録数が不正: 期待 1, 実際 %d", len(coreEffects))
	}

	// Step 4: ステータス計算
	finalStats := engine.GetPlayerFinalStats(state)
	if finalStats.DamageReduction != 0.2 {
		t.Errorf("DamageReductionが不正: 期待 0.2, 実際 %.2f", finalStats.DamageReduction)
	}

	// Step 5: 実際のダメージ計算に適用されていることを確認
	damage := engine.ProcessEnemyAttack(state)
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
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_damage_reduction",
	}
	passiveSkill1 := domain.PassiveSkill{
		ID:          "ps_damage_reduction",
		Name:        "ダメージリダクション",
		Description: "被ダメージ15%軽減",
		BaseModifiers: domain.StatModifiers{
			DamageReduction: 0.15,
		},
		ScalePerLevel: 0.0,
	}
	core1 := domain.NewCore("core_001", "タンクコア", 5, coreType1, passiveSkill1)
	core1.TypeID = "tank"

	// エージェント2: クールダウン短縮パッシブ
	coreType2 := domain.CoreType{
		ID:             "speeder",
		Name:           "スピーダー",
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.5, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_cd_reduction",
	}
	passiveSkill2 := domain.PassiveSkill{
		ID:          "ps_cd_reduction",
		Name:        "クールダウンリダクション",
		Description: "クールダウン10%短縮",
		BaseModifiers: domain.StatModifiers{
			CDReduction: 0.1,
		},
		ScalePerLevel: 0.0,
	}
	core2 := domain.NewCore("core_002", "スピーダーコア", 5, coreType2, passiveSkill2)
	core2.TypeID = "speeder"

	// エージェント3: STRアップパッシブ
	coreType3 := domain.CoreType{
		ID:             "attacker",
		Name:           "アタッカー",
		StatWeights:    map[string]float64{"STR": 1.5, "MAG": 0.8, "SPD": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_str_up",
	}
	passiveSkill3 := domain.PassiveSkill{
		ID:          "ps_str_up",
		Name:        "パワーアップ",
		Description: "STR+20",
		BaseModifiers: domain.StatModifiers{
			STR_Add: 20,
		},
		ScalePerLevel: 0.0,
	}
	core3 := domain.NewCore("core_003", "アタッカーコア", 5, coreType3, passiveSkill3)
	core3.TypeID = "attacker"

	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール1", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール2", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール3", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール4", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
	coreEffects := state.Player.EffectTable.GetRowsBySource(domain.SourceCore)
	if len(coreEffects) != 3 {
		t.Errorf("パッシブスキルの登録数が不正: 期待 3, 実際 %d", len(coreEffects))
	}

	// 各パッシブ効果が正しく適用されていることを確認
	finalStats := engine.GetPlayerFinalStats(state)

	// ダメージ軽減: 0.15
	if finalStats.DamageReduction != 0.15 {
		t.Errorf("DamageReductionが不正: 期待 0.15, 実際 %.2f", finalStats.DamageReduction)
	}

	// クールダウン短縮: 0.1
	if finalStats.CDReduction != 0.1 {
		t.Errorf("CDReductionが不正: 期待 0.1, 実際 %.2f", finalStats.CDReduction)
	}

	// STRアップ: 20
	if finalStats.STR != 20 {
		t.Errorf("STRが不正: 期待 20, 実際 %d", finalStats.STR)
	}

	// 実際のダメージ計算で複数のパッシブ効果が適用されていることを確認
	damage := engine.ProcessEnemyAttack(state)
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
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_damage_reduction",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_damage_reduction",
		Name:        "ダメージリダクション",
		Description: "被ダメージ25%軽減",
		BaseModifiers: domain.StatModifiers{
			DamageReduction: 0.25,
		},
		ScalePerLevel: 0.0,
	}
	core := domain.NewCore("core_001", "タンクコア", 5, coreType, passiveSkill)
	core.TypeID = "tank"
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)
	engine.RegisterPassiveSkills(state, agents)

	// 初期ダメージを記録
	initialDamage := engine.ProcessEnemyAttack(state)
	expectedDamage := int(float64(state.Enemy.AttackPower) * 0.75)
	if initialDamage != expectedDamage {
		t.Errorf("初期ダメージが不正: 期待 %d, 実際 %d", expectedDamage, initialDamage)
	}

	// 時限バフを追加（これはリキャスト中に切れる想定）
	duration := 3.0
	state.Player.EffectTable.AddRow(domain.EffectRow{
		ID:         "temp_buff",
		SourceType: domain.SourceBuff,
		Name:       "一時バフ",
		Duration:   &duration,
		Modifiers: domain.StatModifiers{
			DamageReduction: 0.1, // 追加で10%軽減
		},
	})

	// バフ適用中のダメージ（25% + 10% = 35%軽減）
	state.NextAttackTime = time.Now().Add(-1 * time.Second)
	buffedDamage := engine.ProcessEnemyAttack(state)
	expectedBuffedDamage := int(float64(state.Enemy.AttackPower) * 0.65)
	if buffedDamage != expectedBuffedDamage {
		t.Errorf("バフ適用中ダメージが不正: 期待 %d, 実際 %d", expectedBuffedDamage, buffedDamage)
	}

	// 時間を経過させてバフを切れさせる（パッシブスキルは永続なので残る）
	engine.UpdateEffects(state, 5.0) // 5秒経過

	// バフ切れ後のダメージ（パッシブスキルの25%軽減のみ）
	state.NextAttackTime = time.Now().Add(-1 * time.Second)
	afterBuffExpiredDamage := engine.ProcessEnemyAttack(state)
	if afterBuffExpiredDamage != expectedDamage {
		t.Errorf("バフ切れ後ダメージが不正: 期待 %d, 実際 %d (パッシブスキル効果が消えている可能性)", expectedDamage, afterBuffExpiredDamage)
	}

	// パッシブスキルが残っていることを確認
	coreEffects := state.Player.EffectTable.GetRowsBySource(domain.SourceCore)
	if len(coreEffects) != 1 {
		t.Errorf("パッシブスキルが消えている: %d件", len(coreEffects))
	}

	// 時限バフが消えていることを確認
	buffEffects := state.Player.EffectTable.GetRowsBySource(domain.SourceBuff)
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

	// STRアップ乗算パッシブを持つエージェント
	coreType := domain.CoreType{
		ID:             "attacker",
		Name:           "アタッカー",
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags:    []string{"physical_low"},
		PassiveSkillID: "ps_str_mult",
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_str_mult",
		Name:        "パワーマルチプライヤー",
		Description: "STR+50%",
		BaseModifiers: domain.StatModifiers{
			STR_Mult: 1.5, // 50%増加
		},
		ScalePerLevel: 0.0,
	}
	core := domain.NewCore("core_001", "アタッカーコア", 10, coreType, passiveSkill)
	core.TypeID = "attacker"
	modules := []*domain.ModuleModel{
		newTestModule("m1", "物理攻撃", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)
	engine.RegisterPassiveSkills(state, agents)

	// パッシブスキル効果を確認
	finalStats := engine.GetPlayerFinalStats(state)

	// パッシブスキルによるSTR乗算が適用されていることを確認
	// 基礎STR 0 × 1.5 = 0 (基礎が0なので効果なし)
	// STR_Addを確認する場合は別のテストが必要

	// STRバフを追加
	duration := 10.0
	state.Player.EffectTable.AddRow(domain.EffectRow{
		ID:         "str_buff",
		SourceType: domain.SourceBuff,
		Name:       "STRバフ",
		Duration:   &duration,
		Modifiers: domain.StatModifiers{
			STR_Add: 100, // +100 STR
		},
	})

	// 組み合わせ効果を確認
	combinedStats := engine.GetPlayerFinalStats(state)
	// (0 + 100) × 1.5 = 150
	expectedSTR := int(float64(100) * 1.5)
	if combinedStats.STR != expectedSTR {
		t.Errorf("組み合わせ効果が不正: 期待STR %d, 実際 %d", expectedSTR, combinedStats.STR)
	}

	t.Logf("パッシブスキル適用後STR: %d", finalStats.STR)
	t.Logf("バフ追加後STR: %d", combinedStats.STR)
}
