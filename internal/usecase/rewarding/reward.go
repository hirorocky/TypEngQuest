// Package reward はドロップ・報酬システムを提供します。
// バトル勝利時の報酬計算、コア/モジュールのドロップ判定を担当します。
package rewarding

import (
	"log/slog"
	"math/rand"
	"time"

	"hirorocky/type-battle/internal/domain"

	"github.com/google/uuid"
)

// ==================== チェイン効果プール ====================

// デフォルトのチェイン効果なし確率（30%）
const DefaultNoEffectProbability = 0.3

// ChainEffectDefinition はチェイン効果定義の構造体です。
// マスタデータからロードされたチェイン効果情報を保持します。
type ChainEffectDefinition struct {
	// ID はチェイン効果の一意識別子です。
	ID string

	// Name は表示名です。
	Name string

	// Category はカテゴリです（attack, defense, heal等）。
	Category string

	// EffectType はドメインモデルのChainEffectTypeです。
	EffectType domain.ChainEffectType

	// MinValue は効果値の最小値です。
	MinValue float64

	// MaxValue は効果値の最大値です。
	MaxValue float64
}

// ChainEffectPool はチェイン効果のプール管理を担当する構造体です。
// モジュール入手時にランダムなチェイン効果を生成します。
type ChainEffectPool struct {
	// Effects は利用可能なチェイン効果定義のリストです。
	Effects []ChainEffectDefinition

	// rng は乱数生成器です。
	rng *rand.Rand

	// noEffectProbability はチェイン効果なしの確率です。
	noEffectProbability float64
}

// NewChainEffectPool は新しいChainEffectPoolを作成します。
func NewChainEffectPool(effects []ChainEffectDefinition) *ChainEffectPool {
	return &ChainEffectPool{
		Effects:             effects,
		rng:                 rand.New(rand.NewSource(time.Now().UnixNano())),
		noEffectProbability: DefaultNoEffectProbability,
	}
}

// SetNoEffectProbability はチェイン効果なしの確率を設定します。
// 値は0.0から1.0の範囲で指定します。
func (p *ChainEffectPool) SetNoEffectProbability(probability float64) {
	if probability < 0.0 {
		probability = 0.0
	} else if probability > 1.0 {
		probability = 1.0
	}
	p.noEffectProbability = probability
}

// GenerateRandomEffect はランダムなチェイン効果を生成します。
// noEffectProbabilityの確率でnilを返します。
func (p *ChainEffectPool) GenerateRandomEffect() *domain.ChainEffect {
	// チェイン効果がない場合
	if len(p.Effects) == 0 {
		return nil
	}

	// チェイン効果なしの確率判定
	if p.rng.Float64() < p.noEffectProbability {
		return nil
	}

	// ランダムにチェイン効果を選択
	selected := p.Effects[p.rng.Intn(len(p.Effects))]

	// 効果値をmin-max範囲内でランダムに決定
	value := selected.MinValue
	if selected.MaxValue > selected.MinValue {
		value = selected.MinValue + p.rng.Float64()*(selected.MaxValue-selected.MinValue)
		// 整数に丸める（効果値は通常整数で表現される）
		value = float64(int(value + 0.5))
	}

	effect := domain.NewChainEffect(selected.EffectType, value)
	return &effect
}

// ドロップ関連の定数
const (
	// DefaultCoreDropRate はコアのデフォルトドロップ率（70%）です。
	DefaultCoreDropRate = 0.7

	// DefaultModuleDropRate はモジュールのデフォルトドロップ率（70%）です。
	DefaultModuleDropRate = 0.7

	// DefaultModuleDropCount はモジュールの最大ドロップ数です。
	DefaultModuleDropCount = 2

	// CoreLevelRange はコアレベルの敵レベルからの変動範囲です。
	CoreLevelRange = 2
)

// BattleStatistics はバトル統計を表す構造体です。
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
type RewardResult struct {
	// IsVictory は勝利かどうかです。
	IsVictory bool

	// ShowRewardScreen は報酬画面を表示すべきかどうかです。
	ShowRewardScreen bool

	// Stats はバトル統計です。
	Stats *BattleStatistics

	// DroppedCores はドロップしたコアのリストです。
	DroppedCores []*domain.CoreModel

	// DroppedModules はドロップしたモジュールのリストです。
	DroppedModules []*domain.ModuleModel

	// EnemyLevel は撃破した敵のレベルです。
	EnemyLevel int
}

// InventoryWarning はインベントリ警告を表す構造体です。
type InventoryWarning struct {
	// CoreInventoryFull はコアインベントリが満杯かどうかです。
	CoreInventoryFull bool

	// ModuleInventoryFull はモジュールインベントリが満杯かどうかです。
	ModuleInventoryFull bool

	// WarningMessage は警告メッセージです。
	WarningMessage string

	// SuggestDiscard は破棄を促すかどうかです。
	SuggestDiscard bool
}

// TempStorage は一時保管を表す構造体です。
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

// ModuleDropInfo はモジュールドロップに必要な情報を持つ構造体です。
type ModuleDropInfo struct {
	// ID はモジュールの一意識別子です。
	ID string

	// Name はモジュールの表示名です。
	Name string

	// Icon はモジュールのアイコン（絵文字）です。
	Icon string

	// Tags はモジュールのタグリストです。
	Tags []string

	// Description はモジュールの効果説明です。
	Description string

	// CooldownSeconds はモジュールのクールダウン時間（秒）です。
	CooldownSeconds float64

	// Difficulty はタイピングの難易度レベルです。
	Difficulty int

	// MinDropLevel はこのモジュールがドロップする最低敵レベルです。
	MinDropLevel int

	// Effects はモジュールの効果リストです。
	Effects []domain.ModuleEffect
}

// ToModuleType はModuleDropInfoをドメインモデルのModuleTypeに変換します。
func (m *ModuleDropInfo) ToModuleType() domain.ModuleType {
	// Tagsをコピー（スライスの参照共有を避ける）
	tagsCopy := make([]string, len(m.Tags))
	copy(tagsCopy, m.Tags)

	// Effectsをコピー
	effectsCopy := make([]domain.ModuleEffect, len(m.Effects))
	copy(effectsCopy, m.Effects)

	return domain.ModuleType{
		ID:              m.ID,
		Name:            m.Name,
		Icon:            m.Icon,
		Tags:            tagsCopy,
		Description:     m.Description,
		CooldownSeconds: m.CooldownSeconds,
		Difficulty:      m.Difficulty,
		MinDropLevel:    m.MinDropLevel,
		Effects:         effectsCopy,
	}
}

// ToDomain はModuleDropInfoをドメインモデルのModuleModelに変換します。
func (m *ModuleDropInfo) ToDomain() *domain.ModuleModel {
	moduleType := m.ToModuleType()
	return domain.NewModuleFromType(moduleType, nil)
}

// ToDomainWithChainEffect はチェイン効果付きでドメインモデルに変換します。
func (m *ModuleDropInfo) ToDomainWithChainEffect(chainEffect *domain.ChainEffect) *domain.ModuleModel {
	moduleType := m.ToModuleType()
	return domain.NewModuleFromType(moduleType, chainEffect)
}

// RewardCalculator はドメイン型を使用した報酬計算を担当する構造体です。
type RewardCalculator struct {
	// coreTypes はコア特性定義リストです（ドメイン型）。
	coreTypes []domain.CoreType

	// moduleTypes はモジュール定義リストです。
	moduleTypes []ModuleDropInfo

	// passiveSkills はパッシブスキル定義マップです。
	passiveSkills map[string]domain.PassiveSkill

	// chainEffectPool はチェイン効果プールです。
	chainEffectPool *ChainEffectPool

	// rng は乱数生成器です。
	rng *rand.Rand

	// coreDropRate はコアのドロップ率です。
	coreDropRate float64

	// moduleDropRate はモジュールのドロップ率です。
	moduleDropRate float64
}

// NewRewardCalculator はドメイン型を使用する新しいRewardCalculatorを作成します。
func NewRewardCalculator(
	coreTypes []domain.CoreType,
	moduleTypes []ModuleDropInfo,
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

// SetChainEffectPool はチェイン効果プールを設定します。
func (c *RewardCalculator) SetChainEffectPool(pool *ChainEffectPool) {
	c.chainEffectPool = pool
}

// GetChainEffectPool はチェイン効果プールを取得します。
func (c *RewardCalculator) GetChainEffectPool() *ChainEffectPool {
	return c.chainEffectPool
}

// GetCoreLevelRange はコアレベルの変動範囲を返します。
func (c *RewardCalculator) GetCoreLevelRange() int {
	return CoreLevelRange
}

// CreateRewardResult は報酬結果を作成します。
func (c *RewardCalculator) CreateRewardResult(isVictory bool, stats *BattleStatistics, enemyLevel int) *RewardResult {
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

// RollCoreDrop はコアドロップ判定を実行します。
func (c *RewardCalculator) RollCoreDrop(enemyLevel int) *domain.CoreModel {
	// ドロップ判定
	if c.rng.Float64() > c.coreDropRate {
		return nil
	}

	// ドロップ可能なコア特性を取得
	eligibleTypes := c.GetEligibleCoreTypes(enemyLevel)
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
// チェイン効果プールが設定されている場合、ランダムなチェイン効果を付与します。
func (c *RewardCalculator) RollModuleDrop(enemyLevel int, maxCount int) []*domain.ModuleModel {
	dropped := make([]*domain.ModuleModel, 0)

	// ドロップ可能なモジュールを取得
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

		// チェイン効果を生成（プールが設定されている場合）
		var chainEffect *domain.ChainEffect
		if c.chainEffectPool != nil {
			chainEffect = c.chainEffectPool.GenerateRandomEffect()
		}

		// モジュールをインスタンス化（チェイン効果付き）
		module := selectedType.ToDomainWithChainEffect(chainEffect)
		dropped = append(dropped, module)
	}

	return dropped
}

// GetEligibleCoreTypes は指定レベルでドロップ可能なコア特性を返します。
func (c *RewardCalculator) GetEligibleCoreTypes(enemyLevel int) []domain.CoreType {
	eligible := make([]domain.CoreType, 0)
	for _, coreType := range c.coreTypes {
		if coreType.MinDropLevel <= enemyLevel {
			eligible = append(eligible, coreType)
		}
	}
	return eligible
}

// GetEligibleModuleTypes は指定レベルでドロップ可能なモジュールを返します。
func (c *RewardCalculator) GetEligibleModuleTypes(enemyLevel int) []ModuleDropInfo {
	eligible := make([]ModuleDropInfo, 0)
	for _, moduleType := range c.moduleTypes {
		if moduleType.MinDropLevel <= enemyLevel {
			eligible = append(eligible, moduleType)
		}
	}
	return eligible
}

// CheckInventoryFull はインベントリの満杯状態をチェックします。
func (c *RewardCalculator) CheckInventoryFull(
	coreInv *domain.CoreInventory,
	moduleInv *domain.ModuleInventory,
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
func (c *RewardCalculator) CreateTempStorage() *TempStorage {
	return &TempStorage{
		Cores:   make([]*domain.CoreModel, 0),
		Modules: make([]*domain.ModuleModel, 0),
	}
}

// AddRewardsToInventory はドロップしたアイテムをインベントリに追加します。
// インベントリが満杯の場合は一時保管に追加します。
func AddRewardsToInventory(
	result *RewardResult,
	coreInv *domain.CoreInventory,
	moduleInv *domain.ModuleInventory,
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
			if err := coreInv.Add(core); err != nil {
				slog.Error("報酬コアのインベントリ追加に失敗",
					slog.String("core_id", core.ID),
					slog.String("core_type", core.Type.ID),
					slog.Any("error", err),
				)
			}
		}
	}

	// モジュールをインベントリに追加
	for _, module := range result.DroppedModules {
		if moduleInv.IsFull() {
			warning.ModuleInventoryFull = true
			warning.SuggestDiscard = true
			tempStorage.AddModule(module)
		} else {
			if err := moduleInv.Add(module); err != nil {
				slog.Error("報酬モジュールのインベントリ追加に失敗",
					slog.String("module_type_id", module.TypeID),
					slog.String("module_name", module.Name()),
					slog.Any("error", err),
				)
			}
		}
	}

	if warning.CoreInventoryFull || warning.ModuleInventoryFull {
		warning.WarningMessage = "インベントリが満杯です。一部のアイテムは一時保管されました。"
	}

	return warning
}
