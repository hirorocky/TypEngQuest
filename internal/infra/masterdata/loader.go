// Package masterdata はマスタデータのロード処理を提供します。
// コア特性、モジュール定義、敵タイプ定義、タイピング辞書などを
// JSONファイルから読み込みます。

package masterdata

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"time"

	"hirorocky/type-battle/internal/domain"
)

// DataLoader は外部データファイルのロードを担当する構造体です。
type DataLoader struct {
	// dataDir はデータファイルが格納されているディレクトリパスです。
	// 外部ディレクトリ使用時のみ設定されます。
	dataDir string
	// fileSystem は埋め込みまたはOSファイルシステムです。
	fileSystem fs.FS
	// subDir はfs.FS内でのサブディレクトリパスです（埋め込み時は "data"）。
	subDir string
}

// NewDataLoader は外部ディレクトリから読み込むDataLoaderを作成します。
func NewDataLoader(dataDir string) *DataLoader {
	return &DataLoader{
		dataDir:    dataDir,
		fileSystem: nil,
		subDir:     "",
	}
}

// NewEmbeddedDataLoader は埋め込みFSから読み込むDataLoaderを作成します。
// embeddedFS は embed.FS などの fs.FS 実装です。
// subDir は埋め込みFS内でのサブディレクトリパスです（通常は "data"）。
func NewEmbeddedDataLoader(embeddedFS fs.FS, subDir string) *DataLoader {
	return &DataLoader{
		dataDir:    "",
		fileSystem: embeddedFS,
		subDir:     subDir,
	}
}

// readFile はファイルを読み込むヘルパーメソッドです。
// 外部ディレクトリまたは埋め込みFSから読み込みます。
func (l *DataLoader) readFile(filename string) ([]byte, error) {
	if l.dataDir != "" {
		// 外部ディレクトリから読み込み
		filePath := filepath.Join(l.dataDir, filename)
		return os.ReadFile(filePath)
	}

	// 埋め込みFSから読み込み
	var filePath string
	if l.subDir != "" {
		filePath = l.subDir + "/" + filename
	} else {
		filePath = filename
	}
	return fs.ReadFile(l.fileSystem, filePath)
}

// ExternalData は外部データファイルから読み込んだ全データを格納する構造体です。
type ExternalData struct {
	CoreTypes         []CoreTypeData
	ModuleDefinitions []ModuleDefinitionData
	EnemyTypes        []EnemyTypeData
	TypingDictionary  *TypingDictionary
}

// ==================== コア特性定義 ====================

// CoreTypeData はcores.jsonから読み込むコア特性データの構造体です。
type CoreTypeData struct {
	ID             string             `json:"id"`
	Name           string             `json:"name"`
	AllowedTags    []string           `json:"allowed_tags"`
	StatWeights    map[string]float64 `json:"stat_weights"`
	PassiveSkillID string             `json:"passive_skill_id"`
	MinDropLevel   int                `json:"min_drop_level"`
}

// coresFileData はcores.jsonのルート構造です。
type coresFileData struct {
	CoreTypes []CoreTypeData `json:"core_types"`
}

// LoadCoreTypes はcores.jsonからコア特性定義を読み込みます。

func (l *DataLoader) LoadCoreTypes() ([]CoreTypeData, error) {
	data, err := l.readFile("cores.json")
	if err != nil {
		return nil, fmt.Errorf("cores.jsonの読み込みに失敗: %w", err)
	}

	var fileData coresFileData
	if err := json.Unmarshal(data, &fileData); err != nil {
		return nil, fmt.Errorf("cores.jsonのパースに失敗: %w", err)
	}

	return fileData.CoreTypes, nil
}

// ToDomain はCoreTypeDataをドメインモデルのCoreTypeに変換します。
func (c *CoreTypeData) ToDomain() domain.CoreType {
	// AllowedTagsをコピー
	allowedTags := make([]string, len(c.AllowedTags))
	copy(allowedTags, c.AllowedTags)

	// StatWeightsをコピー
	statWeights := make(map[string]float64)
	for k, v := range c.StatWeights {
		statWeights[k] = v
	}

	return domain.CoreType{
		ID:             c.ID,
		Name:           c.Name,
		StatWeights:    statWeights,
		PassiveSkillID: c.PassiveSkillID,
		AllowedTags:    allowedTags,
		MinDropLevel:   c.MinDropLevel,
	}
}

// ==================== モジュール定義 ====================

// ModuleDefinitionData はmodules.jsonから読み込むモジュール定義データの構造体です。
type ModuleDefinitionData struct {
	ID              string   `json:"id"`
	Name            string   `json:"name"`
	Category        string   `json:"category"`
	Level           int      `json:"level"`
	Tags            []string `json:"tags"`
	BaseEffect      float64  `json:"base_effect"`
	StatReference   string   `json:"stat_reference"`
	Description     string   `json:"description"`
	CooldownSeconds float64  `json:"cooldown_seconds"`
	Difficulty      int      `json:"difficulty"`
	MinDropLevel    int      `json:"min_drop_level"`
}

// modulesFileData はmodules.jsonのルート構造です。
type modulesFileData struct {
	Modules []ModuleDefinitionData `json:"modules"`
}

// LoadModuleDefinitions はmodules.jsonからモジュール定義を読み込みます。

func (l *DataLoader) LoadModuleDefinitions() ([]ModuleDefinitionData, error) {
	data, err := l.readFile("modules.json")
	if err != nil {
		return nil, fmt.Errorf("modules.jsonの読み込みに失敗: %w", err)
	}

	var fileData modulesFileData
	if err := json.Unmarshal(data, &fileData); err != nil {
		return nil, fmt.Errorf("modules.jsonのパースに失敗: %w", err)
	}

	return fileData.Modules, nil
}

// ToDomain はModuleDefinitionDataをドメインモデルのModuleModelに変換します。
func (m *ModuleDefinitionData) ToDomain() *domain.ModuleModel {
	// カテゴリ文字列をModuleCategoryに変換
	var category domain.ModuleCategory
	switch m.Category {
	case "physical_attack":
		category = domain.PhysicalAttack
	case "magic_attack":
		category = domain.MagicAttack
	case "heal":
		category = domain.Heal
	case "buff":
		category = domain.Buff
	case "debuff":
		category = domain.Debuff
	default:
		category = domain.PhysicalAttack // デフォルト
	}

	return domain.NewModule(
		m.ID,
		m.Name,
		category,
		m.Level,
		m.Tags,
		m.BaseEffect,
		m.StatReference,
		m.Description,
	)
}

// ==================== 敵タイプ定義 ====================

// EnemyTypeData はenemies.jsonから読み込む敵タイプデータの構造体です。
type EnemyTypeData struct {
	ID                   string `json:"id"`
	Name                 string `json:"name"`
	BaseHP               int    `json:"base_hp"`
	BaseAttackPower      int    `json:"base_attack_power"`
	BaseAttackIntervalMS int64  `json:"base_attack_interval_ms"`
	AttackType           string `json:"attack_type"`
	ASCIIArt             string `json:"ascii_art"`
	// 内部で計算されるフィールド
	BaseAttackInterval time.Duration `json:"-"`
}

// enemiesFileData はenemies.jsonのルート構造です。
type enemiesFileData struct {
	EnemyTypes []EnemyTypeData `json:"enemy_types"`
}

// LoadEnemyTypes はenemies.jsonから敵タイプ定義を読み込みます。

func (l *DataLoader) LoadEnemyTypes() ([]EnemyTypeData, error) {
	data, err := l.readFile("enemies.json")
	if err != nil {
		return nil, fmt.Errorf("enemies.jsonの読み込みに失敗: %w", err)
	}

	var fileData enemiesFileData
	if err := json.Unmarshal(data, &fileData); err != nil {
		return nil, fmt.Errorf("enemies.jsonのパースに失敗: %w", err)
	}

	// ミリ秒をtime.Durationに変換
	for i := range fileData.EnemyTypes {
		fileData.EnemyTypes[i].BaseAttackInterval = time.Duration(fileData.EnemyTypes[i].BaseAttackIntervalMS) * time.Millisecond
	}

	return fileData.EnemyTypes, nil
}

// ToDomain はEnemyTypeDataをドメインモデルのEnemyTypeに変換します。
func (e *EnemyTypeData) ToDomain() domain.EnemyType {
	return domain.EnemyType{
		ID:                 e.ID,
		Name:               e.Name,
		BaseHP:             e.BaseHP,
		BaseAttackPower:    e.BaseAttackPower,
		BaseAttackInterval: e.BaseAttackInterval,
		AttackType:         e.AttackType,
		ASCIIArt:           e.ASCIIArt,
	}
}

// ==================== パッシブスキル定義 ====================

// PassiveSkillData はpassive_skills.jsonから読み込むパッシブスキルデータの構造体です。
type PassiveSkillData struct {
	ID               string                `json:"id"`
	Name             string                `json:"name"`
	Description      string                `json:"description"`
	TriggerType      string                `json:"trigger_type"`
	TriggerCondition *TriggerConditionData `json:"trigger_condition"`
	EffectType       string                `json:"effect_type"`
	EffectValue      float64               `json:"effect_value"`
	Probability      float64               `json:"probability"`
	MaxStacks        int                   `json:"max_stacks"`
	StackIncrement   float64               `json:"stack_increment"`
	UsesPerBattle    int                   `json:"uses_per_battle"`
}

// TriggerConditionData はトリガー条件のJSONデータ構造体です。
type TriggerConditionData struct {
	Type  string  `json:"type"`
	Value float64 `json:"value"`
}

// passiveSkillsFileData はpassive_skills.jsonのルート構造です。
type passiveSkillsFileData struct {
	PassiveSkills []PassiveSkillData `json:"passive_skills"`
}

// LoadPassiveSkills はpassive_skills.jsonからパッシブスキル定義を読み込みます。
func (l *DataLoader) LoadPassiveSkills() ([]PassiveSkillData, error) {
	data, err := l.readFile("passive_skills.json")
	if err != nil {
		return nil, fmt.Errorf("passive_skills.jsonの読み込みに失敗: %w", err)
	}

	var fileData passiveSkillsFileData
	if err := json.Unmarshal(data, &fileData); err != nil {
		return nil, fmt.Errorf("passive_skills.jsonのパースに失敗: %w", err)
	}

	return fileData.PassiveSkills, nil
}

// ToDomain はPassiveSkillDataをドメインモデルのPassiveSkillDefinitionに変換します。
func (p *PassiveSkillData) ToDomain() domain.PassiveSkillDefinition {
	def := domain.PassiveSkillDefinition{
		ID:             p.ID,
		Name:           p.Name,
		Description:    p.Description,
		TriggerType:    convertTriggerType(p.TriggerType),
		EffectType:     convertEffectType(p.EffectType),
		EffectValue:    p.EffectValue,
		Probability:    p.Probability,
		MaxStacks:      p.MaxStacks,
		StackIncrement: p.StackIncrement,
		UsesPerBattle:  p.UsesPerBattle,
	}

	if p.TriggerCondition != nil {
		def.TriggerCondition = &domain.TriggerCondition{
			Type:  convertTriggerConditionType(p.TriggerCondition.Type),
			Value: p.TriggerCondition.Value,
		}
	}

	return def
}

// convertTriggerType は文字列をPassiveTriggerTypeに変換します。
func convertTriggerType(s string) domain.PassiveTriggerType {
	switch s {
	case "permanent":
		return domain.PassiveTriggerPermanent
	case "conditional":
		return domain.PassiveTriggerConditional
	case "probability":
		return domain.PassiveTriggerProbability
	case "stack":
		return domain.PassiveTriggerStack
	case "reactive":
		return domain.PassiveTriggerReactive
	default:
		return domain.PassiveTriggerPermanent
	}
}

// convertEffectType は文字列をPassiveEffectTypeに変換します。
func convertEffectType(s string) domain.PassiveEffectType {
	switch s {
	case "modifier":
		return domain.PassiveEffectModifier
	case "multiplier":
		return domain.PassiveEffectMultiplier
	case "special":
		return domain.PassiveEffectSpecial
	default:
		return domain.PassiveEffectModifier
	}
}

// convertTriggerConditionType は文字列をTriggerConditionTypeに変換します。
func convertTriggerConditionType(s string) domain.TriggerConditionType {
	switch s {
	case "accuracy_equals":
		return domain.TriggerConditionAccuracyEquals
	case "wpm_above":
		return domain.TriggerConditionWPMAbove
	case "hp_below_percent":
		return domain.TriggerConditionHPBelowPercent
	case "enemy_hp_below_percent":
		return domain.TriggerConditionEnemyHPBelowPercent
	case "enemy_has_debuff":
		return domain.TriggerConditionEnemyHasDebuff
	case "on_skill_use":
		return domain.TriggerConditionOnSkillUse
	case "on_damage_received":
		return domain.TriggerConditionOnDamageReceived
	case "on_heal":
		return domain.TriggerConditionOnHeal
	case "on_buff_debuff_use":
		return domain.TriggerConditionOnBuffDebuffUse
	case "on_physical_attack":
		return domain.TriggerConditionOnPhysicalAttack
	case "on_typing_miss":
		return domain.TriggerConditionOnTypingMiss
	case "on_timeout":
		return domain.TriggerConditionOnTimeout
	case "on_debuff_received":
		return domain.TriggerConditionOnDebuffReceived
	case "on_battle_start":
		return domain.TriggerConditionOnBattleStart
	case "no_miss_streak":
		return domain.TriggerConditionNoMissStreak
	case "same_attack_count":
		return domain.TriggerConditionSameAttackCount
	default:
		return domain.TriggerConditionAccuracyEquals
	}
}

// ==================== チェイン効果定義 ====================

// SkillEffectData はskill_effects.jsonから読み込むチェイン効果データの構造体です。
type SkillEffectData struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Category    string  `json:"category"`
	EffectType  string  `json:"effect_type"`
	MinValue    float64 `json:"min_value"`
	MaxValue    float64 `json:"max_value"`
}

// skillEffectsFileData はskill_effects.jsonのルート構造です。
type skillEffectsFileData struct {
	SkillEffects []SkillEffectData `json:"skill_effects"`
}

// LoadSkillEffects はskill_effects.jsonからチェイン効果定義を読み込みます。
func (l *DataLoader) LoadSkillEffects() ([]SkillEffectData, error) {
	data, err := l.readFile("skill_effects.json")
	if err != nil {
		return nil, fmt.Errorf("skill_effects.jsonの読み込みに失敗: %w", err)
	}

	var fileData skillEffectsFileData
	if err := json.Unmarshal(data, &fileData); err != nil {
		return nil, fmt.Errorf("skill_effects.jsonのパースに失敗: %w", err)
	}

	return fileData.SkillEffects, nil
}

// ToDomainEffectType はSkillEffectDataからドメインモデルのChainEffectTypeに変換します。
func (s *SkillEffectData) ToDomainEffectType() domain.ChainEffectType {
	return convertChainEffectType(s.EffectType)
}

// ToDomainCategory はSkillEffectDataからドメインモデルのChainEffectCategoryに変換します。
func (s *SkillEffectData) ToDomainCategory() domain.ChainEffectCategory {
	return convertChainEffectCategory(s.Category)
}

// ToSkillEffectDefinition はSkillEffectDataをSkillEffectDefinitionに変換します。
// rewardingパッケージのChainEffectPoolで使用されます。
func (s *SkillEffectData) ToSkillEffectDefinition() SkillEffectDefinitionData {
	return SkillEffectDefinitionData{
		ID:         s.ID,
		Name:       s.Name,
		Category:   s.Category,
		EffectType: convertChainEffectType(s.EffectType),
		MinValue:   s.MinValue,
		MaxValue:   s.MaxValue,
	}
}

// SkillEffectDefinitionData はチェイン効果定義のデータ構造体です。
// rewardingパッケージのSkillEffectDefinitionと同等の構造を持ちます。
type SkillEffectDefinitionData struct {
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

// convertChainEffectType は文字列をChainEffectTypeに変換します。
func convertChainEffectType(s string) domain.ChainEffectType {
	switch s {
	case "damage_bonus":
		return domain.ChainEffectDamageBonus
	case "heal_bonus":
		return domain.ChainEffectHealBonus
	case "buff_extend":
		return domain.ChainEffectBuffExtend
	case "debuff_extend":
		return domain.ChainEffectDebuffExtend
	case "damage_amp":
		return domain.ChainEffectDamageAmp
	case "armor_pierce":
		return domain.ChainEffectArmorPierce
	case "life_steal":
		return domain.ChainEffectLifeSteal
	case "damage_cut":
		return domain.ChainEffectDamageCut
	case "evasion":
		return domain.ChainEffectEvasion
	case "reflect":
		return domain.ChainEffectReflect
	case "regen":
		return domain.ChainEffectRegen
	case "heal_amp":
		return domain.ChainEffectHealAmp
	case "overheal":
		return domain.ChainEffectOverheal
	case "time_extend":
		return domain.ChainEffectTimeExtend
	case "auto_correct":
		return domain.ChainEffectAutoCorrect
	case "cooldown_reduce":
		return domain.ChainEffectCooldownReduce
	case "buff_duration":
		return domain.ChainEffectBuffDuration
	case "debuff_duration":
		return domain.ChainEffectDebuffDuration
	case "double_cast":
		return domain.ChainEffectDoubleCast
	default:
		return domain.ChainEffectDamageBonus
	}
}

// convertChainEffectCategory は文字列をChainEffectCategoryに変換します。
func convertChainEffectCategory(s string) domain.ChainEffectCategory {
	switch s {
	case "attack":
		return domain.ChainEffectCategoryAttack
	case "defense":
		return domain.ChainEffectCategoryDefense
	case "heal":
		return domain.ChainEffectCategoryHeal
	case "typing":
		return domain.ChainEffectCategoryTyping
	case "recast":
		return domain.ChainEffectCategoryRecast
	case "effect_extend":
		return domain.ChainEffectCategoryEffectExtend
	case "special":
		return domain.ChainEffectCategorySpecial
	default:
		return domain.ChainEffectCategorySpecial
	}
}

// ==================== タイピング辞書 ====================

// TypingDictionary はwords.jsonから読み込むタイピング辞書データの構造体です。

type TypingDictionary struct {
	Easy   []string `json:"easy"`
	Medium []string `json:"medium"`
	Hard   []string `json:"hard"`
}

// wordsFileData はwords.jsonのルート構造です。
type wordsFileData struct {
	Words TypingDictionary `json:"words"`
}

// LoadTypingDictionary はwords.jsonからタイピング辞書を読み込みます。

func (l *DataLoader) LoadTypingDictionary() (*TypingDictionary, error) {
	data, err := l.readFile("words.json")
	if err != nil {
		return nil, fmt.Errorf("words.jsonの読み込みに失敗: %w", err)
	}

	var fileData wordsFileData
	if err := json.Unmarshal(data, &fileData); err != nil {
		return nil, fmt.Errorf("words.jsonのパースに失敗: %w", err)
	}

	return &fileData.Words, nil
}

// ==================== 全データ一括ロード ====================

// LoadAllExternalData は全ての外部データファイルを一括でロードします。

func (l *DataLoader) LoadAllExternalData() (*ExternalData, error) {
	coreTypes, err := l.LoadCoreTypes()
	if err != nil {
		return nil, fmt.Errorf("コア特性のロードに失敗: %w", err)
	}

	modules, err := l.LoadModuleDefinitions()
	if err != nil {
		return nil, fmt.Errorf("モジュール定義のロードに失敗: %w", err)
	}

	enemyTypes, err := l.LoadEnemyTypes()
	if err != nil {
		return nil, fmt.Errorf("敵タイプのロードに失敗: %w", err)
	}

	dictionary, err := l.LoadTypingDictionary()
	if err != nil {
		return nil, fmt.Errorf("タイピング辞書のロードに失敗: %w", err)
	}

	return &ExternalData{
		CoreTypes:         coreTypes,
		ModuleDefinitions: modules,
		EnemyTypes:        enemyTypes,
		TypingDictionary:  dictionary,
	}, nil
}

// ==================== バリデーション ====================

// ValidateCoreTypeData はコア特性データのバリデーションを行います。
func ValidateCoreTypeData(data CoreTypeData) error {
	if data.ID == "" {
		return fmt.Errorf("コア特性IDが空です")
	}
	if data.Name == "" {
		return fmt.Errorf("コア特性名が空です: ID=%s", data.ID)
	}
	if len(data.AllowedTags) == 0 {
		return fmt.Errorf("許可タグが空です: ID=%s", data.ID)
	}
	if len(data.StatWeights) == 0 {
		return fmt.Errorf("ステータス重みが空です: ID=%s", data.ID)
	}
	return nil
}

// ValidateModuleDefinitionData はモジュール定義データのバリデーションを行います。
func ValidateModuleDefinitionData(data ModuleDefinitionData) error {
	if data.ID == "" {
		return fmt.Errorf("モジュールIDが空です")
	}
	if data.Name == "" {
		return fmt.Errorf("モジュール名が空です: ID=%s", data.ID)
	}
	if data.Category == "" {
		return fmt.Errorf("モジュールカテゴリが空です: ID=%s", data.ID)
	}
	if data.Level < 1 {
		return fmt.Errorf("モジュールレベルが不正です: ID=%s, Level=%d", data.ID, data.Level)
	}
	return nil
}

// ValidateEnemyTypeData は敵タイプデータのバリデーションを行います。
func ValidateEnemyTypeData(data EnemyTypeData) error {
	if data.ID == "" {
		return fmt.Errorf("敵タイプIDが空です")
	}
	if data.Name == "" {
		return fmt.Errorf("敵タイプ名が空です: ID=%s", data.ID)
	}
	if data.BaseHP <= 0 {
		return fmt.Errorf("敵の基礎HPが不正です: ID=%s, BaseHP=%d", data.ID, data.BaseHP)
	}
	if data.BaseAttackPower <= 0 {
		return fmt.Errorf("敵の基礎攻撃力が不正です: ID=%s, BaseAttackPower=%d", data.ID, data.BaseAttackPower)
	}
	return nil
}
