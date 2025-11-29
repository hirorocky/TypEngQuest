// Package enemy は敵生成システムを提供します。
// レベルに応じた敵の生成、ステータス計算を担当します。
// Requirements: 13.2, 13.4-13.8, 20.2-20.4, 20.8
package enemy

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/loader"
)

// 敵生成関連の定数
const (
	// MaxEnemyLevel は敵の最大レベルです。
	// Requirement 13.7, 20.8: レベル上限（100）
	MaxEnemyLevel = 100

	// MinEnemyLevel は敵の最小レベルです。
	MinEnemyLevel = 1

	// MinAttackInterval は敵の最低攻撃間隔です。
	// Requirement 20.4: 高レベルでも最低攻撃間隔を保証
	MinAttackInterval = 500 * time.Millisecond

	// AttackPowerPerLevel はレベルあたりの攻撃力上昇値です。
	// Requirement 20.2: レベルに応じた攻撃力計算
	AttackPowerPerLevel = 2

	// AttackIntervalReductionPerLevel はレベルあたりの攻撃間隔短縮（ミリ秒）です。
	// Requirement 20.3, 20.4: 高レベルほど短い攻撃間隔
	AttackIntervalReductionPerLevel = 50
)

// EnemyGenerator は敵生成を担当する構造体です。
// Requirements: 13.2, 13.4-13.8, 20.2-20.4, 20.8
type EnemyGenerator struct {
	// enemyTypes は敵タイプ定義リストです。
	enemyTypes []loader.EnemyTypeData

	// rng は乱数生成器です。
	rng *rand.Rand
}

// NewEnemyGenerator は新しいEnemyGeneratorを作成します。
func NewEnemyGenerator(enemyTypes []loader.EnemyTypeData) *EnemyGenerator {
	return &EnemyGenerator{
		enemyTypes: enemyTypes,
		rng:        rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// Generate は指定レベルの敵を生成します。
// Requirement 13.2: レベルに応じたHP、攻撃力、攻撃間隔を計算
// Requirement 13.4, 13.5: 敵タイプからのランダム選択
// Requirement 13.6: 高レベル敵ほど高いステータス
// Requirement 13.7: レベル上限の設定
func (g *EnemyGenerator) Generate(level int) *domain.EnemyModel {
	// レベルをクランプ
	level = g.clampLevel(level)

	// 敵タイプがない場合はデフォルトの敵を生成
	if len(g.enemyTypes) == 0 {
		return g.generateDefaultEnemy(level)
	}

	// Requirement 13.5: 敵タイプからランダムに選択
	selectedType := g.enemyTypes[g.rng.Intn(len(g.enemyTypes))]

	// Requirement 13.2: レベルに応じたステータス計算
	hp := g.calculateHP(selectedType.BaseHP, level)
	attackPower := g.calculateAttackPower(selectedType.BaseAttackPower, level)
	attackInterval := g.calculateAttackInterval(selectedType.BaseAttackInterval, level)

	// 敵モデルを作成
	return domain.NewEnemy(
		uuid.New().String(),
		fmt.Sprintf("%s Lv.%d", selectedType.Name, level),
		level,
		hp,
		attackPower,
		attackInterval,
		selectedType.ToDomain(),
	)
}

// generateDefaultEnemy はデフォルトの敵を生成します。
func (g *EnemyGenerator) generateDefaultEnemy(level int) *domain.EnemyModel {
	defaultType := domain.EnemyType{
		ID:                 "default",
		Name:               "敵",
		BaseHP:             50,
		BaseAttackPower:    5,
		BaseAttackInterval: 3000 * time.Millisecond,
		AttackType:         "physical",
	}

	hp := g.calculateHP(defaultType.BaseHP, level)
	attackPower := g.calculateAttackPower(defaultType.BaseAttackPower, level)
	attackInterval := g.calculateAttackInterval(defaultType.BaseAttackInterval, level)

	return domain.NewEnemy(
		uuid.New().String(),
		fmt.Sprintf("敵 Lv.%d", level),
		level,
		hp,
		attackPower,
		attackInterval,
		defaultType,
	)
}

// ==================== Task 9.1: 敵ステータス計算 ====================

// calculateHP はレベルに応じたHPを計算します。
// Requirement 13.2: HP = BaseHP * level
func (g *EnemyGenerator) calculateHP(baseHP int, level int) int {
	return baseHP * level
}

// calculateAttackPower はレベルに応じた攻撃力を計算します。
// Requirement 20.2: 攻撃力 = BaseAttackPower + (level * AttackPowerPerLevel)
func (g *EnemyGenerator) calculateAttackPower(baseAttackPower int, level int) int {
	return baseAttackPower + (level * AttackPowerPerLevel)
}

// calculateAttackInterval はレベルに応じた攻撃間隔を計算します。
// Requirement 20.3, 20.4: 高レベルほど短い間隔、最低値を保証
func (g *EnemyGenerator) calculateAttackInterval(baseInterval time.Duration, level int) time.Duration {
	// レベルに応じて攻撃間隔を短縮
	reduction := time.Duration(level*AttackIntervalReductionPerLevel) * time.Millisecond
	interval := baseInterval - reduction

	// 最低攻撃間隔を保証
	if interval < MinAttackInterval {
		interval = MinAttackInterval
	}

	return interval
}

// ==================== Task 9.2: 敵バリエーションとレベル上限 ====================

// clampLevel はレベルを有効範囲内にクランプします。
// Requirement 13.7: レベル上限（100）
func (g *EnemyGenerator) clampLevel(level int) int {
	if level < MinEnemyLevel {
		return MinEnemyLevel
	}
	if level > MaxEnemyLevel {
		return MaxEnemyLevel
	}
	return level
}

// IsMaxLevelBattle は最高レベルのバトルかどうかを判定します。
// Requirement 13.8, 20.8: 最高レベル敵撃破時のゲームクリア
func (g *EnemyGenerator) IsMaxLevelBattle(level int) bool {
	return level >= MaxEnemyLevel
}

// GetMaxLevel は最大レベルを返します。
func (g *EnemyGenerator) GetMaxLevel() int {
	return MaxEnemyLevel
}

// GetMinLevel は最小レベルを返します。
func (g *EnemyGenerator) GetMinLevel() int {
	return MinEnemyLevel
}

// GetEnemyTypeCount は敵タイプの数を返します。
// Requirement 13.4: 複数種類の敵キャラクター
func (g *EnemyGenerator) GetEnemyTypeCount() int {
	return len(g.enemyTypes)
}

// GenerateWithType は指定された敵タイプで敵を生成します。
func (g *EnemyGenerator) GenerateWithType(level int, typeID string) *domain.EnemyModel {
	level = g.clampLevel(level)

	// 指定されたタイプを検索
	var selectedType *loader.EnemyTypeData
	for i := range g.enemyTypes {
		if g.enemyTypes[i].ID == typeID {
			selectedType = &g.enemyTypes[i]
			break
		}
	}

	// タイプが見つからない場合はランダムに生成
	if selectedType == nil {
		return g.Generate(level)
	}

	hp := g.calculateHP(selectedType.BaseHP, level)
	attackPower := g.calculateAttackPower(selectedType.BaseAttackPower, level)
	attackInterval := g.calculateAttackInterval(selectedType.BaseAttackInterval, level)

	return domain.NewEnemy(
		uuid.New().String(),
		fmt.Sprintf("%s Lv.%d", selectedType.Name, level),
		level,
		hp,
		attackPower,
		attackInterval,
		selectedType.ToDomain(),
	)
}

// GetAllEnemyTypes は全ての敵タイプを返します。
func (g *EnemyGenerator) GetAllEnemyTypes() []loader.EnemyTypeData {
	return g.enemyTypes
}

// SetSeed は乱数シードを設定します（テスト用）。
func (g *EnemyGenerator) SetSeed(seed int64) {
	g.rng = rand.New(rand.NewSource(seed))
}
