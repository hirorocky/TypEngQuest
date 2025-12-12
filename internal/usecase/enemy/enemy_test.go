// Package enemy は敵生成システムのテストを提供します。
// Requirements: 13.2, 13.4-13.8, 20.2-20.4, 20.8
package enemy

import (
	"testing"
	"time"

	"hirorocky/type-battle/internal/infra/masterdata"
)

// ==================== Task 9.1: 敵ステータス計算 ====================

// TestEnemyStats_HPCalculation はレベルに応じたHP計算をテストします。
// Requirement 13.2: レベルに応じたHP計算
func TestEnemyStats_HPCalculation(t *testing.T) {
	enemyTypes := []masterdata.EnemyTypeData{
		{ID: "slime", Name: "スライム", BaseHP: 50, BaseAttackPower: 5,
			BaseAttackIntervalMS: 3000, AttackType: "physical"},
	}
	generator := NewEnemyGenerator(enemyTypes)

	// レベル1
	enemy1 := generator.Generate(1)
	if enemy1 == nil {
		t.Fatal("敵の生成に失敗")
	}

	// レベル10
	enemy10 := generator.Generate(10)
	if enemy10 == nil {
		t.Fatal("敵の生成に失敗")
	}

	// レベルが高いほどHPが高い
	if enemy10.MaxHP <= enemy1.MaxHP {
		t.Errorf("レベル10の敵はレベル1より高いHPを持つべき: Lv1=%d, Lv10=%d", enemy1.MaxHP, enemy10.MaxHP)
	}

	// HP計算式: BaseHP * level
	expectedHP1 := 50 * 1
	if enemy1.MaxHP != expectedHP1 {
		t.Errorf("レベル1のHP計算が不正: got %d, want %d", enemy1.MaxHP, expectedHP1)
	}

	expectedHP10 := 50 * 10
	if enemy10.MaxHP != expectedHP10 {
		t.Errorf("レベル10のHP計算が不正: got %d, want %d", enemy10.MaxHP, expectedHP10)
	}
}

// TestEnemyStats_AttackPowerCalculation はレベルに応じた攻撃力計算をテストします。
// Requirement 20.2: レベルに応じた攻撃力計算
func TestEnemyStats_AttackPowerCalculation(t *testing.T) {
	enemyTypes := []masterdata.EnemyTypeData{
		{ID: "slime", Name: "スライム", BaseHP: 50, BaseAttackPower: 5,
			BaseAttackIntervalMS: 3000, AttackType: "physical"},
	}
	generator := NewEnemyGenerator(enemyTypes)

	// レベル1
	enemy1 := generator.Generate(1)

	// レベル20
	enemy20 := generator.Generate(20)

	// レベルが高いほど攻撃力が高い
	if enemy20.AttackPower <= enemy1.AttackPower {
		t.Errorf("レベル20の敵はレベル1より高い攻撃力を持つべき: Lv1=%d, Lv20=%d",
			enemy1.AttackPower, enemy20.AttackPower)
	}

	// 攻撃力計算式: BaseAttackPower + (level * 2)
	expectedAttack1 := 5 + (1 * 2)
	if enemy1.AttackPower != expectedAttack1 {
		t.Errorf("レベル1の攻撃力計算が不正: got %d, want %d", enemy1.AttackPower, expectedAttack1)
	}

	expectedAttack20 := 5 + (20 * 2)
	if enemy20.AttackPower != expectedAttack20 {
		t.Errorf("レベル20の攻撃力計算が不正: got %d, want %d", enemy20.AttackPower, expectedAttack20)
	}
}

// TestEnemyStats_AttackIntervalCalculation はレベルに応じた攻撃間隔計算をテストします。
// Requirement 20.3, 20.4: 高レベルほど短い攻撃間隔
func TestEnemyStats_AttackIntervalCalculation(t *testing.T) {
	enemyTypes := []masterdata.EnemyTypeData{
		{ID: "slime", Name: "スライム", BaseHP: 50, BaseAttackPower: 5,
			BaseAttackIntervalMS: 3000, AttackType: "physical"},
	}
	generator := NewEnemyGenerator(enemyTypes)

	// BaseAttackIntervalを設定
	for i := range enemyTypes {
		enemyTypes[i].BaseAttackInterval = time.Duration(enemyTypes[i].BaseAttackIntervalMS) * time.Millisecond
	}
	generator = NewEnemyGenerator(enemyTypes)

	// レベル1
	enemy1 := generator.Generate(1)

	// レベル30
	enemy30 := generator.Generate(30)

	// レベルが高いほど攻撃間隔が短い
	if enemy30.AttackInterval >= enemy1.AttackInterval {
		t.Errorf("レベル30の敵はレベル1より短い攻撃間隔を持つべき: Lv1=%v, Lv30=%v",
			enemy1.AttackInterval, enemy30.AttackInterval)
	}

	// 最低攻撃間隔は500ms
	enemy100 := generator.Generate(100)
	if enemy100.AttackInterval < 500*time.Millisecond {
		t.Errorf("攻撃間隔が最低値を下回っている: got %v, min 500ms", enemy100.AttackInterval)
	}
}

// TestEnemyStats_AttackIntervalMinimum は攻撃間隔の最低値をテストします。
// Requirement 20.4: 最低攻撃間隔の保証
func TestEnemyStats_AttackIntervalMinimum(t *testing.T) {
	enemyTypes := []masterdata.EnemyTypeData{
		{ID: "fast_enemy", Name: "高速敵", BaseHP: 50, BaseAttackPower: 5,
			BaseAttackIntervalMS: 3000, AttackType: "physical"},
	}
	for i := range enemyTypes {
		enemyTypes[i].BaseAttackInterval = time.Duration(enemyTypes[i].BaseAttackIntervalMS) * time.Millisecond
	}
	generator := NewEnemyGenerator(enemyTypes)

	// 非常に高いレベルでも最低値を保証
	for level := 50; level <= 100; level += 10 {
		enemy := generator.Generate(level)
		if enemy.AttackInterval < MinAttackInterval {
			t.Errorf("レベル%dで攻撃間隔が最低値を下回っている: got %v, min %v",
				level, enemy.AttackInterval, MinAttackInterval)
		}
	}
}

// ==================== Task 9.2: 敵バリエーションとレベル上限 ====================

// TestEnemyVariation_RandomSelection は敵タイプからのランダム選択をテストします。
// Requirement 13.4, 13.5: 敵タイプのランダム選択
func TestEnemyVariation_RandomSelection(t *testing.T) {
	enemyTypes := []masterdata.EnemyTypeData{
		{ID: "slime", Name: "スライム", BaseHP: 50, BaseAttackPower: 5,
			BaseAttackIntervalMS: 3000, AttackType: "physical"},
		{ID: "goblin", Name: "ゴブリン", BaseHP: 80, BaseAttackPower: 8,
			BaseAttackIntervalMS: 2500, AttackType: "physical"},
		{ID: "skeleton", Name: "スケルトン", BaseHP: 70, BaseAttackPower: 10,
			BaseAttackIntervalMS: 2800, AttackType: "physical"},
	}
	for i := range enemyTypes {
		enemyTypes[i].BaseAttackInterval = time.Duration(enemyTypes[i].BaseAttackIntervalMS) * time.Millisecond
	}
	generator := NewEnemyGenerator(enemyTypes)

	// 複数回生成して異なるタイプが出ることを確認
	typeOccurrences := make(map[string]int)
	for i := 0; i < 100; i++ {
		enemy := generator.Generate(10)
		typeOccurrences[enemy.Type.ID]++
	}

	// 3種類の敵タイプがあるので、100回生成すれば全種類が出現するはず（確率的）
	if len(typeOccurrences) < 2 {
		t.Errorf("ランダム選択が機能していない可能性: 出現タイプ数=%d", len(typeOccurrences))
	}
}

// TestEnemyVariation_SameLevelMultipleTypes は同レベルでの複数バリエーション対応をテストします。
// Requirement 13.5: 同レベルでも複数の敵バリエーションからランダム選択
func TestEnemyVariation_SameLevelMultipleTypes(t *testing.T) {
	enemyTypes := []masterdata.EnemyTypeData{
		{ID: "slime", Name: "スライム", BaseHP: 50, BaseAttackPower: 5,
			BaseAttackIntervalMS: 3000, AttackType: "physical"},
		{ID: "goblin", Name: "ゴブリン", BaseHP: 80, BaseAttackPower: 8,
			BaseAttackIntervalMS: 2500, AttackType: "physical"},
	}
	for i := range enemyTypes {
		enemyTypes[i].BaseAttackInterval = time.Duration(enemyTypes[i].BaseAttackIntervalMS) * time.Millisecond
	}
	generator := NewEnemyGenerator(enemyTypes)

	// 同じレベルでも異なるタイプが出ることを確認
	level := 5
	seenSlime := false
	seenGoblin := false

	for i := 0; i < 50; i++ {
		enemy := generator.Generate(level)
		if enemy.Type.ID == "slime" {
			seenSlime = true
		}
		if enemy.Type.ID == "goblin" {
			seenGoblin = true
		}
		if seenSlime && seenGoblin {
			break
		}
	}

	if !seenSlime || !seenGoblin {
		t.Error("同レベルで複数のバリエーションが出現すべき")
	}
}

// TestEnemyLevel_Maximum はレベル上限をテストします。
// Requirement 13.7, 20.8: レベル上限（100）の設定
func TestEnemyLevel_Maximum(t *testing.T) {
	if MaxEnemyLevel != 100 {
		t.Errorf("レベル上限が100であるべき: got %d", MaxEnemyLevel)
	}

	enemyTypes := []masterdata.EnemyTypeData{
		{ID: "slime", Name: "スライム", BaseHP: 50, BaseAttackPower: 5,
			BaseAttackIntervalMS: 3000, AttackType: "physical"},
	}
	for i := range enemyTypes {
		enemyTypes[i].BaseAttackInterval = time.Duration(enemyTypes[i].BaseAttackIntervalMS) * time.Millisecond
	}
	generator := NewEnemyGenerator(enemyTypes)

	// レベル上限を超えた値を指定しても上限でクランプされる
	enemy := generator.Generate(150)
	if enemy.Level > MaxEnemyLevel {
		t.Errorf("レベルが上限を超えている: got %d, max %d", enemy.Level, MaxEnemyLevel)
	}
}

// TestEnemyLevel_MaxLevelDefeat は最高レベル敵撃破時のゲームクリア判定をテストします。
// Requirement 13.8: 最高レベル敵撃破時のゲームクリア演出
func TestEnemyLevel_MaxLevelDefeat(t *testing.T) {
	generator := NewEnemyGenerator(nil)

	// レベル100の敵撃破はゲームクリア
	if !generator.IsMaxLevelBattle(MaxEnemyLevel) {
		t.Error("レベル100はゲームクリア対象であるべき")
	}

	// レベル99はゲームクリアではない
	if generator.IsMaxLevelBattle(99) {
		t.Error("レベル99はゲームクリア対象ではない")
	}
}

// TestEnemyLevel_ValidRange は有効なレベル範囲をテストします。
// Requirement 13.6: 高レベル敵ほど高いステータス
func TestEnemyLevel_ValidRange(t *testing.T) {
	enemyTypes := []masterdata.EnemyTypeData{
		{ID: "slime", Name: "スライム", BaseHP: 50, BaseAttackPower: 5,
			BaseAttackIntervalMS: 3000, AttackType: "physical"},
	}
	for i := range enemyTypes {
		enemyTypes[i].BaseAttackInterval = time.Duration(enemyTypes[i].BaseAttackIntervalMS) * time.Millisecond
	}
	generator := NewEnemyGenerator(enemyTypes)

	// 最低レベルは1
	enemy := generator.Generate(0)
	if enemy.Level < 1 {
		t.Errorf("レベルは最低1であるべき: got %d", enemy.Level)
	}

	// レベル-1も1にクランプ
	enemy = generator.Generate(-5)
	if enemy.Level < 1 {
		t.Errorf("負のレベルは1にクランプされるべき: got %d", enemy.Level)
	}
}

// TestEnemyGeneration_StatsScaling はステータススケーリングをテストします。
// Requirement 13.6, 20.2: 高レベルほど高ステータス
func TestEnemyGeneration_StatsScaling(t *testing.T) {
	enemyTypes := []masterdata.EnemyTypeData{
		{ID: "slime", Name: "スライム", BaseHP: 50, BaseAttackPower: 5,
			BaseAttackIntervalMS: 3000, AttackType: "physical"},
	}
	for i := range enemyTypes {
		enemyTypes[i].BaseAttackInterval = time.Duration(enemyTypes[i].BaseAttackIntervalMS) * time.Millisecond
	}
	generator := NewEnemyGenerator(enemyTypes)

	// レベルが上がるとステータスも上がることを確認
	previousHP := 0
	previousAttack := 0

	for level := 1; level <= 50; level += 10 {
		enemy := generator.Generate(level)

		if enemy.MaxHP <= previousHP && level > 1 {
			t.Errorf("レベル%dでHPが前レベルより低い: got %d, prev %d", level, enemy.MaxHP, previousHP)
		}
		if enemy.AttackPower <= previousAttack && level > 1 {
			t.Errorf("レベル%dで攻撃力が前レベルより低い: got %d, prev %d", level, enemy.AttackPower, previousAttack)
		}

		previousHP = enemy.MaxHP
		previousAttack = enemy.AttackPower
	}
}
