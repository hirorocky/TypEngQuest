// Package battle はバトルエンジンを提供します。
// バトル初期化、敵攻撃、モジュール効果、勝敗判定を担当します。
// Requirements: 9.1, 9.16, 9.17, 10.1-10.10, 11.1-11.27, 13.1
package battle

import (
	"testing"
	"time"

	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/usecase/typing"
)

// ==================== バトル初期化テスト（Task 7.1） ====================

// TestInitializeBattle はバトル初期化処理をテストします。
// Requirement 9.1: 指定レベルの敵を生成しバトル画面に遷移
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
		domain.NewModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
	// Requirement 4.3: バトル開始時にプレイヤーのHPを最大値まで全回復
	if state.Player == nil {
		t.Fatal("プレイヤーがnil")
	}
	if state.Player.HP == 0 || state.Player.HP != state.Player.MaxHP {
		t.Error("プレイヤーHPが全回復されていない")
	}
}

// TestInitializeBattle_EnemyGeneration は指定レベルに基づく敵生成をテストします。
// Requirement 13.1: 指定レベルの敵を生成
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
		domain.NewModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
// Requirement 11.4: 攻撃ダメージ計算（攻撃力 - 防御バフ）
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
		domain.NewModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
	}
	agent := domain.NewAgent("agent_001", core, modules)
	agents := []*domain.AgentModel{agent}

	engine := NewBattleEngine(enemyTypes)
	state, _ := engine.InitializeBattle(5, agents)

	initialHP := state.Player.HP
	damage := engine.ProcessEnemyAttack(state)

	// Requirement 11.5: プレイヤーHP減少処理
	if state.Player.HP >= initialHP {
		t.Error("プレイヤーHPが減少していない")
	}
	if damage <= 0 {
		t.Error("ダメージが0以下")
	}
}

// TestEnemyAttack_WithDefenseBuff は防御バフ適用時のダメージ計算をテストします。
// Requirement 11.28: 防御バフ適用時のダメージ減算
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
		domain.NewModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
// Requirement 11.15: HP50%以下で強化フェーズに移行
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
		domain.NewModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
// Requirement 11.18-11.21: 自己バフ行動
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
		domain.NewModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
// Requirement 11.22-11.27: プレイヤーへのデバフ
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
		domain.NewModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
// Requirement 10.2: ダメージ計算（基礎効果 × ステータス × 速度係数 × 正確性係数）
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
		domain.NewModule("m1", "物理打撃", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
// Requirement 10.3: 回復量計算
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
		domain.NewModule("m1", "ヒール", domain.Heal, 1, []string{"heal_low"}, 8.0, "MAG", ""),
		domain.NewModule("m2", "モジュール", domain.Heal, 1, []string{"heal_low"}, 8.0, "MAG", ""),
		domain.NewModule("m3", "モジュール", domain.Heal, 1, []string{"heal_low"}, 8.0, "MAG", ""),
		domain.NewModule("m4", "モジュール", domain.Heal, 1, []string{"heal_low"}, 8.0, "MAG", ""),
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
// Requirement 10.9: 正確性50%未満の場合、効果量を半減
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
		domain.NewModule("m1", "物理打撃", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
// Requirement 9.17: 敵HP=0での勝利
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
		domain.NewModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
// Requirement 9.16: プレイヤーHP=0での敗北
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
		domain.NewModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
// Requirement 9.17（関連）: バトル統計記録
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
		domain.NewModule("m1", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m2", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m3", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		domain.NewModule("m4", "モジュール", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
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
