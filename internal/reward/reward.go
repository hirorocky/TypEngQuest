// Package reward はドロップ・報酬システムを提供します。
// バトル勝利時の報酬計算、コア/モジュールのドロップ判定を担当します。
// Requirements: 12.1-12.18
package reward

import (
	"math/rand"
	"time"

	"github.com/google/uuid"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/inventory"
	"hirorocky/type-battle/internal/loader"
)

// ドロップ関連の定数
const (
	// DefaultCoreDropRate はコアのデフォルトドロップ率（70%）です。
	DefaultCoreDropRate = 0.7

	// DefaultModuleDropRate はモジュールのデフォルトドロップ率（70%）です。
	DefaultModuleDropRate = 0.7

	// DefaultModuleDropCount はモジュールの最大ドロップ数です。
	DefaultModuleDropCount = 2

	// CoreLevelRange はコアレベルの敵レベルからの変動範囲です。
	// Requirement 12.6: コアレベル = 敵レベル ± この値
	CoreLevelRange = 2
)

// BattleStatistics はバトル統計を表す構造体です。
// Requirement 12.2: バトル統計（WPM、正確性、クリアタイム）
type BattleStatistics struct {
	// TotalWPM はWPMの合計値です。
	TotalWPM float64

	// TotalAccuracy は正確性の合計値です。
	TotalAccuracy float64

	// ClearTime はクリア時間です。
	ClearTime time.Duration

	// TotalTypingCount は総タイピング回数です。
	TotalTypingCount int

	// TotalDamageDealt は与えた総ダメージです。
	TotalDamageDealt int

	// TotalDamageTaken は受けた総ダメージです。
	TotalDamageTaken int

	// TotalHealAmount は総回復量です。
	TotalHealAmount int
}

// GetAverageWPM は平均WPMを返します。
func (s *BattleStatistics) GetAverageWPM() float64 {
	if s.TotalTypingCount == 0 {
		return 0
	}
	return s.TotalWPM / float64(s.TotalTypingCount)
}

// GetAverageAccuracy は平均正確性を返します。
func (s *BattleStatistics) GetAverageAccuracy() float64 {
	if s.TotalTypingCount == 0 {
		return 0
	}
	return s.TotalAccuracy / float64(s.TotalTypingCount)
}

// RewardResult は報酬計算結果を表す構造体です。
// Requirement 12.1: 勝利時の報酬画面表示
type RewardResult struct {
	// IsVictory は勝利かどうかです。
	IsVictory bool

	// ShowRewardScreen は報酬画面を表示すべきかどうかです。
	// Requirement 12.4: 敗北時は報酬画面を表示しない
	ShowRewardScreen bool

	// Stats はバトル統計です。
	// Requirement 12.2: バトル統計表示
	Stats *BattleStatistics

	// DroppedCores はドロップしたコアのリストです。
	// Requirement 12.7: ドロップ情報表示
	DroppedCores []*domain.CoreModel

	// DroppedModules はドロップしたモジュールのリストです。
	// Requirement 12.12: ドロップ情報表示
	DroppedModules []*domain.ModuleModel

	// EnemyLevel は撃破した敵のレベルです。
	EnemyLevel int
}

// InventoryWarning はインベントリ警告を表す構造体です。
// Requirement 12.17: 満杯警告表示
type InventoryWarning struct {
	// CoreInventoryFull はコアインベントリが満杯かどうかです。
	CoreInventoryFull bool

	// ModuleInventoryFull はモジュールインベントリが満杯かどうかです。
	ModuleInventoryFull bool

	// WarningMessage は警告メッセージです。
	WarningMessage string

	// SuggestDiscard は破棄を促すかどうかです。
	// Requirement 12.17: 不要アイテム破棄促進
	SuggestDiscard bool
}

// TempStorage は一時保管を表す構造体です。
// Requirement 12.18: 一時保管と後日受け取り機能
type TempStorage struct {
	// Cores は一時保管中のコアリストです。
	Cores []*domain.CoreModel

	// Modules は一時保管中のモジュールリストです。
	Modules []*domain.ModuleModel
}

// AddCore はコアを一時保管に追加します。
func (s *TempStorage) AddCore(core *domain.CoreModel) {
	s.Cores = append(s.Cores, core)
}

// AddModule はモジュールを一時保管に追加します。
func (s *TempStorage) AddModule(module *domain.ModuleModel) {
	s.Modules = append(s.Modules, module)
}

// RetrieveCores は一時保管中のコアを全て取り出します。
func (s *TempStorage) RetrieveCores() []*domain.CoreModel {
	cores := s.Cores
	s.Cores = nil
	return cores
}

// RetrieveModules は一時保管中のモジュールを全て取り出します。
func (s *TempStorage) RetrieveModules() []*domain.ModuleModel {
	modules := s.Modules
	s.Modules = nil
	return modules
}

// HasItems は一時保管にアイテムがあるかどうかを返します。
func (s *TempStorage) HasItems() bool {
	return len(s.Cores) > 0 || len(s.Modules) > 0
}

// RewardCalculator は報酬計算を担当する構造体です。
// Requirements: 12.1-12.18
type RewardCalculator struct {
	// coreTypes はコア特性定義リストです。
	coreTypes []loader.CoreTypeData

	// moduleTypes はモジュール定義リストです。
	moduleTypes []loader.ModuleDefinitionData

	// passiveSkills はパッシブスキル定義マップです。
	passiveSkills map[string]domain.PassiveSkill

	// rng は乱数生成器です。
	rng *rand.Rand

	// coreDropRate はコアのドロップ率です。
	coreDropRate float64

	// moduleDropRate はモジュールのドロップ率です。
	moduleDropRate float64
}

// NewRewardCalculator は新しいRewardCalculatorを作成します。
func NewRewardCalculator(
	coreTypes []loader.CoreTypeData,
	moduleTypes []loader.ModuleDefinitionData,
	passiveSkills map[string]domain.PassiveSkill,
) *RewardCalculator {
	return &RewardCalculator{
		coreTypes:      coreTypes,
		moduleTypes:    moduleTypes,
		passiveSkills:  passiveSkills,
		rng:            rand.New(rand.NewSource(time.Now().UnixNano())),
		coreDropRate:   DefaultCoreDropRate,
		moduleDropRate: DefaultModuleDropRate,
	}
}

// SetCoreDropRate はコアのドロップ率を設定します（テスト用）。
func (c *RewardCalculator) SetCoreDropRate(rate float64) {
	c.coreDropRate = rate
}

// SetModuleDropRate はモジュールのドロップ率を設定します（テスト用）。
func (c *RewardCalculator) SetModuleDropRate(rate float64) {
	c.moduleDropRate = rate
}

// GetCoreLevelRange はコアレベルの変動範囲を返します。
func (c *RewardCalculator) GetCoreLevelRange() int {
	return CoreLevelRange
}

// ==================== Task 8.1: 報酬計算と表示 ====================

// CreateRewardResult は報酬結果を作成します。
// Requirement 12.1: 勝利時の報酬画面表示
// Requirement 12.2: バトル統計表示
// Requirement 12.4: 敗北時の報酬なし直接遷移
func (c *RewardCalculator) CreateRewardResult(isVictory bool, stats *BattleStatistics, enemyLevel int) *RewardResult {
	result := &RewardResult{
		IsVictory:      isVictory,
		Stats:          stats,
		EnemyLevel:     enemyLevel,
		DroppedCores:   make([]*domain.CoreModel, 0),
		DroppedModules: make([]*domain.ModuleModel, 0),
	}

	// Requirement 12.4: 敗北時は報酬なし
	if !isVictory {
		result.ShowRewardScreen = false
		return result
	}

	// Requirement 12.1: 勝利時は報酬画面を表示
	result.ShowRewardScreen = true

	return result
}

// CalculateRewards は報酬を計算します（ドロップ判定含む）。
func (c *RewardCalculator) CalculateRewards(isVictory bool, stats *BattleStatistics, enemyLevel int) *RewardResult {
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

// ==================== Task 8.2: コアドロップシステム ====================

// RollCoreDrop はコアドロップ判定を実行します。
// Requirement 12.5: ドロップ判定処理
// Requirement 12.6: コアレベル決定（敵レベル ± 範囲内ランダム）
// Requirement 12.8, 12.9: 特性別ドロップ最低敵レベル制限
func (c *RewardCalculator) RollCoreDrop(enemyLevel int) *domain.CoreModel {
	// ドロップ判定
	if c.rng.Float64() > c.coreDropRate {
		return nil
	}

	// ドロップ可能なコア特性を取得
	// Requirement 12.9: 敵レベルがドロップ最低レベル未満のコア特性を除外
	eligibleTypes := c.GetEligibleCoreTypes(enemyLevel)
	if len(eligibleTypes) == 0 {
		return nil
	}

	// ランダムにコア特性を選択
	selectedType := eligibleTypes[c.rng.Intn(len(eligibleTypes))]

	// Requirement 12.6: コアレベルを敵レベル±範囲内でランダムに決定
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

	// Requirement 12.7: コアをインスタンス化
	coreType := selectedType.ToDomain()
	return domain.NewCore(
		uuid.New().String(),
		selectedType.Name,
		coreLevel,
		coreType,
		passiveSkill,
	)
}

// GetEligibleCoreTypes は指定レベルでドロップ可能なコア特性を返します。
// Requirement 12.8, 12.9: 特性別ドロップ最低敵レベル制限
func (c *RewardCalculator) GetEligibleCoreTypes(enemyLevel int) []loader.CoreTypeData {
	eligible := make([]loader.CoreTypeData, 0)
	for _, coreType := range c.coreTypes {
		if coreType.MinDropLevel <= enemyLevel {
			eligible = append(eligible, coreType)
		}
	}
	return eligible
}

// ==================== Task 8.3: モジュールドロップシステム ====================

// RollModuleDrop はモジュールドロップ判定を実行します。
// Requirement 12.11: ドロップ判定処理
// Requirement 12.13, 12.14: カテゴリ×レベル別ドロップ最低敵レベル制限
// Requirement 12.15, 12.16: 高レベルモジュールの段階的ドロップ設定
func (c *RewardCalculator) RollModuleDrop(enemyLevel int, maxCount int) []*domain.ModuleModel {
	dropped := make([]*domain.ModuleModel, 0)

	// ドロップ可能なモジュールを取得
	// Requirement 12.14: 敵レベルがドロップ最低レベル未満のモジュールを除外
	eligibleTypes := c.GetEligibleModuleTypes(enemyLevel)
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

		// Requirement 12.12: モジュールをインスタンス化
		module := selectedType.ToDomain()
		// IDを新規生成（同じ定義から複数のインスタンスを作成可能）
		module.ID = uuid.New().String()
		dropped = append(dropped, module)
	}

	return dropped
}

// GetEligibleModuleTypes は指定レベルでドロップ可能なモジュールを返します。
// Requirement 12.13, 12.14: カテゴリ×レベル別ドロップ最低敵レベル制限
// Requirement 12.15, 12.16: 高レベルモジュールほど高レベルの敵からのみドロップ
func (c *RewardCalculator) GetEligibleModuleTypes(enemyLevel int) []loader.ModuleDefinitionData {
	eligible := make([]loader.ModuleDefinitionData, 0)
	for _, moduleType := range c.moduleTypes {
		if moduleType.MinDropLevel <= enemyLevel {
			eligible = append(eligible, moduleType)
		}
	}
	return eligible
}

// ==================== Task 8.4: インベントリ満杯時の処理 ====================

// CheckInventoryFull はインベントリの満杯状態をチェックします。
// Requirement 12.17: 満杯警告表示
func (c *RewardCalculator) CheckInventoryFull(
	coreInv *inventory.CoreInventory,
	moduleInv *inventory.ModuleInventory,
) *InventoryWarning {
	warning := &InventoryWarning{
		CoreInventoryFull:   coreInv.IsFull(),
		ModuleInventoryFull: moduleInv.IsFull(),
	}

	if warning.CoreInventoryFull || warning.ModuleInventoryFull {
		warning.WarningMessage = "インベントリが満杯です。不要なアイテムを破棄してください。"
		warning.SuggestDiscard = true
	}

	return warning
}

// CreateTempStorage は一時保管を作成します。
// Requirement 12.18: 一時保管と後日受け取り機能
func (c *RewardCalculator) CreateTempStorage() *TempStorage {
	return &TempStorage{
		Cores:   make([]*domain.CoreModel, 0),
		Modules: make([]*domain.ModuleModel, 0),
	}
}

// AddRewardsToInventory はドロップしたアイテムをインベントリに追加します。
// インベントリが満杯の場合は一時保管に追加します。
// Requirement 12.7, 12.12: ドロップ情報表示とインベントリ追加
// Requirement 12.17, 12.18: 満杯時の処理
func (c *RewardCalculator) AddRewardsToInventory(
	result *RewardResult,
	coreInv *inventory.CoreInventory,
	moduleInv *inventory.ModuleInventory,
	tempStorage *TempStorage,
) *InventoryWarning {
	warning := &InventoryWarning{}

	// コアをインベントリに追加
	for _, core := range result.DroppedCores {
		if coreInv.IsFull() {
			warning.CoreInventoryFull = true
			warning.SuggestDiscard = true
			tempStorage.AddCore(core)
		} else {
			coreInv.Add(core)
		}
	}

	// モジュールをインベントリに追加
	for _, module := range result.DroppedModules {
		if moduleInv.IsFull() {
			warning.ModuleInventoryFull = true
			warning.SuggestDiscard = true
			tempStorage.AddModule(module)
		} else {
			moduleInv.Add(module)
		}
	}

	if warning.CoreInventoryFull || warning.ModuleInventoryFull {
		warning.WarningMessage = "インベントリが満杯です。一部のアイテムは一時保管されました。"
	}

	return warning
}
