// Package enemy はドメイン型を使用した敵生成のテストを提供します。
package enemy

import (
	"testing"
	"time"

	"hirorocky/type-battle/internal/domain"
)

// TestEnemyGenerator_WithDomainTypes はドメイン型を使用した敵生成をテストします。
func TestEnemyGenerator_WithDomainTypes(t *testing.T) {
	// ドメイン型で敵タイプを定義
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "goblin",
			Name:               "ゴブリン",
			BaseHP:             50,
			BaseAttackPower:    5,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
		{
			ID:                 "orc",
			Name:               "オーク",
			BaseHP:             100,
			BaseAttackPower:    10,
			BaseAttackInterval: 4 * time.Second,
			AttackType:         "physical",
		},
	}

	// ドメイン型を直接使用するEnemyGeneratorを作成
	gen := NewEnemyGeneratorWithDomainTypes(enemyTypes)

	if gen == nil {
		t.Fatal("NewEnemyGeneratorWithDomainTypes returned nil")
	}

	// 敵を生成
	enemy := gen.GenerateFromDomain(5)
	if enemy == nil {
		t.Fatal("GenerateFromDomain returned nil")
	}

	if enemy.Level != 5 {
		t.Errorf("Expected level 5, got %d", enemy.Level)
	}

	// HPがレベルに応じて計算されていること
	if enemy.HP <= 0 {
		t.Error("Enemy HP should be positive")
	}
}

// TestEnemyGenerator_GenerateWithDomainType は特定のドメイン型で敵を生成するテストです。
func TestEnemyGenerator_GenerateWithDomainType(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "dragon",
			Name:               "ドラゴン",
			BaseHP:             500,
			BaseAttackPower:    50,
			BaseAttackInterval: 5 * time.Second,
			AttackType:         "magic",
		},
	}

	gen := NewEnemyGeneratorWithDomainTypes(enemyTypes)
	gen.SetSeed(42) // 再現可能な結果のために固定シード

	enemy := gen.GenerateFromDomainWithType(10, "dragon")
	if enemy == nil {
		t.Fatal("GenerateFromDomainWithType returned nil")
	}

	// ドラゴンタイプの名前が含まれていること
	if enemy.Type.ID != "dragon" {
		t.Errorf("Expected dragon type, got %s", enemy.Type.ID)
	}

	// HP = BaseHP * level = 500 * 10 = 5000
	if enemy.HP != 5000 {
		t.Errorf("Expected HP 5000, got %d", enemy.HP)
	}
}

// TestEnemyGenerator_GetDomainEnemyTypes はドメイン型の敵タイプ取得をテストします。
func TestEnemyGenerator_GetDomainEnemyTypes(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{ID: "type1", Name: "タイプ1"},
		{ID: "type2", Name: "タイプ2"},
	}

	gen := NewEnemyGeneratorWithDomainTypes(enemyTypes)

	types := gen.GetDomainEnemyTypes()
	if len(types) != 2 {
		t.Errorf("Expected 2 enemy types, got %d", len(types))
	}
}
