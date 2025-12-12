// Package enemy はドメイン型を使用した敵生成を提供します。
// loaderパッケージへの依存を解消するため、ドメイン型を直接使用するAPIを提供します。
package enemy

import (
	"fmt"
	"math/rand"
	"time"

	"hirorocky/type-battle/internal/domain"

	"github.com/google/uuid"
)

// DomainEnemyGenerator はドメイン型を使用した敵生成を担当する構造体です。
// loaderパッケージへの依存がありません。
type DomainEnemyGenerator struct {
	// enemyTypes は敵タイプ定義リストです（ドメイン型）。
	enemyTypes []domain.EnemyType

	// rng は乱数生成器です。
	rng *rand.Rand
}

// NewEnemyGeneratorWithDomainTypes はドメイン型を使用する新しいEnemyGeneratorを作成します。
func NewEnemyGeneratorWithDomainTypes(enemyTypes []domain.EnemyType) *DomainEnemyGenerator {
	return &DomainEnemyGenerator{
		enemyTypes: enemyTypes,
		rng:        rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// GenerateFromDomain は指定レベルの敵をドメイン型から生成します。
func (g *DomainEnemyGenerator) GenerateFromDomain(level int) *domain.EnemyModel {
	// レベルをクランプ
	level = g.clampLevel(level)

	// 敵タイプがない場合はデフォルトの敵を生成
	if len(g.enemyTypes) == 0 {
		return g.generateDefaultEnemy(level)
	}

	// 敵タイプからランダムに選択
	selectedType := g.enemyTypes[g.rng.Intn(len(g.enemyTypes))]

	// レベルに応じたステータス計算
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
		selectedType,
	)
}

// GenerateFromDomainWithType は指定された敵タイプで敵を生成します。
func (g *DomainEnemyGenerator) GenerateFromDomainWithType(level int, typeID string) *domain.EnemyModel {
	level = g.clampLevel(level)

	// 指定されたタイプを検索
	var selectedType *domain.EnemyType
	for i := range g.enemyTypes {
		if g.enemyTypes[i].ID == typeID {
			selectedType = &g.enemyTypes[i]
			break
		}
	}

	// タイプが見つからない場合はランダムに生成
	if selectedType == nil {
		return g.GenerateFromDomain(level)
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
		*selectedType,
	)
}

// GetDomainEnemyTypes は全ての敵タイプをドメイン型で返します。
func (g *DomainEnemyGenerator) GetDomainEnemyTypes() []domain.EnemyType {
	return g.enemyTypes
}

// SetSeed は乱数シードを設定します（テスト用）。
func (g *DomainEnemyGenerator) SetSeed(seed int64) {
	g.rng = rand.New(rand.NewSource(seed))
}

// generateDefaultEnemy はデフォルトの敵を生成します。
func (g *DomainEnemyGenerator) generateDefaultEnemy(level int) *domain.EnemyModel {
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

// calculateHP はレベルに応じたHPを計算します。
func (g *DomainEnemyGenerator) calculateHP(baseHP int, level int) int {
	return baseHP * level
}

// calculateAttackPower はレベルに応じた攻撃力を計算します。
func (g *DomainEnemyGenerator) calculateAttackPower(baseAttackPower int, level int) int {
	return baseAttackPower + (level * AttackPowerPerLevel)
}

// calculateAttackInterval はレベルに応じた攻撃間隔を計算します。
func (g *DomainEnemyGenerator) calculateAttackInterval(baseInterval time.Duration, level int) time.Duration {
	reduction := time.Duration(level*AttackIntervalReductionPerLevel) * time.Millisecond
	interval := baseInterval - reduction

	if interval < MinAttackInterval {
		interval = MinAttackInterval
	}

	return interval
}

// clampLevel はレベルを有効範囲内にクランプします。
func (g *DomainEnemyGenerator) clampLevel(level int) int {
	if level < MinEnemyLevel {
		return MinEnemyLevel
	}
	if level > MaxEnemyLevel {
		return MaxEnemyLevel
	}
	return level
}

// IsMaxLevelBattle は最高レベルのバトルかどうかを判定します。
func (g *DomainEnemyGenerator) IsMaxLevelBattle(level int) bool {
	return level >= MaxEnemyLevel
}

// GetMaxLevel は最大レベルを返します。
func (g *DomainEnemyGenerator) GetMaxLevel() int {
	return MaxEnemyLevel
}

// GetMinLevel は最小レベルを返します。
func (g *DomainEnemyGenerator) GetMinLevel() int {
	return MinEnemyLevel
}

// GetEnemyTypeCount は敵タイプの数を返します。
func (g *DomainEnemyGenerator) GetEnemyTypeCount() int {
	return len(g.enemyTypes)
}
