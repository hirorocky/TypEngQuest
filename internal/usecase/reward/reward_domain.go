// Package reward はドメイン型を使用した報酬計算を提供します。
// loaderパッケージへの依存を解消するため、ドメイン型を直接使用するAPIを提供します。
package reward

import (
	"math/rand"
	"time"

	"hirorocky/type-battle/internal/domain"

	"github.com/google/uuid"
)

// ModuleDropInfo はモジュールドロップに必要な情報を持つ構造体です。
// masterdata.ModuleDefinitionDataの代わりにドメイン層で使用できる型として定義します。
type ModuleDropInfo struct {
	// ID はモジュールの一意識別子です。
	ID string

	// Name はモジュールの表示名です。
	Name string

	// Category はモジュールのカテゴリです。
	Category domain.ModuleCategory

	// Level はモジュールのレベルです。
	Level int

	// Tags はモジュールのタグリストです。
	Tags []string

	// BaseEffect はモジュールの基礎効果値です。
	BaseEffect float64

	// StatRef は効果計算時に参照するステータスです。
	StatRef string

	// Description はモジュールの効果説明です。
	Description string

	// MinDropLevel はこのモジュールがドロップする最低敵レベルです。
	MinDropLevel int
}

// ToDomain はModuleDropInfoをドメインモデルのModuleModelに変換します。
func (m *ModuleDropInfo) ToDomain() *domain.ModuleModel {
	return domain.NewModule(
		m.ID,
		m.Name,
		m.Category,
		m.Level,
		m.Tags,
		m.BaseEffect,
		m.StatRef,
		m.Description,
	)
}

// DomainRewardCalculator はドメイン型を使用した報酬計算を担当する構造体です。
// loaderパッケージへの依存がありません。
type DomainRewardCalculator struct {
	// coreTypes はコア特性定義リストです（ドメイン型）。
	coreTypes []domain.CoreType

	// moduleTypes はモジュール定義リストです（ドメイン型互換）。
	moduleTypes []ModuleDropInfo

	// passiveSkills はパッシブスキル定義マップです。
	passiveSkills map[string]domain.PassiveSkill

	// rng は乱数生成器です。
	rng *rand.Rand

	// coreDropRate はコアのドロップ率です。
	coreDropRate float64

	// moduleDropRate はモジュールのドロップ率です。
	moduleDropRate float64
}

// NewRewardCalculatorWithDomainTypes はドメイン型を使用する新しいRewardCalculatorを作成します。
func NewRewardCalculatorWithDomainTypes(
	coreTypes []domain.CoreType,
	moduleTypes []ModuleDropInfo,
	passiveSkills map[string]domain.PassiveSkill,
) *DomainRewardCalculator {
	return &DomainRewardCalculator{
		coreTypes:      coreTypes,
		moduleTypes:    moduleTypes,
		passiveSkills:  passiveSkills,
		rng:            rand.New(rand.NewSource(time.Now().UnixNano())),
		coreDropRate:   DefaultCoreDropRate,
		moduleDropRate: DefaultModuleDropRate,
	}
}

// SetCoreDropRate はコアのドロップ率を設定します（テスト用）。
func (c *DomainRewardCalculator) SetCoreDropRate(rate float64) {
	c.coreDropRate = rate
}

// SetModuleDropRate はモジュールのドロップ率を設定します（テスト用）。
func (c *DomainRewardCalculator) SetModuleDropRate(rate float64) {
	c.moduleDropRate = rate
}

// CreateRewardResult は報酬結果を作成します。
func (c *DomainRewardCalculator) CreateRewardResult(isVictory bool, stats *BattleStatistics, enemyLevel int) *RewardResult {
	result := &RewardResult{
		IsVictory:      isVictory,
		Stats:          stats,
		EnemyLevel:     enemyLevel,
		DroppedCores:   make([]*domain.CoreModel, 0),
		DroppedModules: make([]*domain.ModuleModel, 0),
	}

	if !isVictory {
		result.ShowRewardScreen = false
		return result
	}

	result.ShowRewardScreen = true
	return result
}

// CalculateRewards は報酬を計算します（ドロップ判定含む）。
func (c *DomainRewardCalculator) CalculateRewards(isVictory bool, stats *BattleStatistics, enemyLevel int) *RewardResult {
	result := c.CreateRewardResult(isVictory, stats, enemyLevel)

	if !isVictory {
		return result
	}

	// コアドロップ判定
	droppedCore := c.RollCoreDrop(enemyLevel)
	if droppedCore != nil {
		result.DroppedCores = append(result.DroppedCores, droppedCore)
	}

	// モジュールドロップ判定
	droppedModules := c.RollModuleDrop(enemyLevel, DefaultModuleDropCount)
	result.DroppedModules = droppedModules

	return result
}

// RollCoreDrop はコアドロップ判定を実行します。
func (c *DomainRewardCalculator) RollCoreDrop(enemyLevel int) *domain.CoreModel {
	// ドロップ判定
	if c.rng.Float64() > c.coreDropRate {
		return nil
	}

	// ドロップ可能なコア特性を取得
	eligibleTypes := c.GetEligibleDomainCoreTypes(enemyLevel)
	if len(eligibleTypes) == 0 {
		return nil
	}

	// ランダムにコア特性を選択
	selectedType := eligibleTypes[c.rng.Intn(len(eligibleTypes))]

	// コアレベルを敵レベル±範囲内でランダムに決定
	minLevel := enemyLevel - CoreLevelRange
	if minLevel < 1 {
		minLevel = 1
	}
	maxLevel := enemyLevel + CoreLevelRange
	coreLevel := minLevel + c.rng.Intn(maxLevel-minLevel+1)

	// パッシブスキルを取得
	passiveSkill := domain.PassiveSkill{}
	if c.passiveSkills != nil {
		if skill, ok := c.passiveSkills[selectedType.PassiveSkillID]; ok {
			passiveSkill = skill
		}
	}

	// コアをインスタンス化
	return domain.NewCore(
		uuid.New().String(),
		selectedType.Name,
		coreLevel,
		selectedType,
		passiveSkill,
	)
}

// RollModuleDrop はモジュールドロップ判定を実行します。
func (c *DomainRewardCalculator) RollModuleDrop(enemyLevel int, maxCount int) []*domain.ModuleModel {
	dropped := make([]*domain.ModuleModel, 0)

	// ドロップ可能なモジュールを取得
	eligibleTypes := c.GetEligibleDomainModuleTypes(enemyLevel)
	if len(eligibleTypes) == 0 {
		return dropped
	}

	for i := 0; i < maxCount; i++ {
		// ドロップ判定
		if c.rng.Float64() > c.moduleDropRate {
			continue
		}

		// ランダムにモジュールを選択
		selectedType := eligibleTypes[c.rng.Intn(len(eligibleTypes))]

		// モジュールをインスタンス化
		module := selectedType.ToDomain()
		dropped = append(dropped, module)
	}

	return dropped
}

// GetEligibleDomainCoreTypes は指定レベルでドロップ可能なコア特性を返します。
func (c *DomainRewardCalculator) GetEligibleDomainCoreTypes(enemyLevel int) []domain.CoreType {
	eligible := make([]domain.CoreType, 0)
	for _, coreType := range c.coreTypes {
		if coreType.MinDropLevel <= enemyLevel {
			eligible = append(eligible, coreType)
		}
	}
	return eligible
}

// GetEligibleDomainModuleTypes は指定レベルでドロップ可能なモジュールを返します。
func (c *DomainRewardCalculator) GetEligibleDomainModuleTypes(enemyLevel int) []ModuleDropInfo {
	eligible := make([]ModuleDropInfo, 0)
	for _, moduleType := range c.moduleTypes {
		if moduleType.MinDropLevel <= enemyLevel {
			eligible = append(eligible, moduleType)
		}
	}
	return eligible
}
