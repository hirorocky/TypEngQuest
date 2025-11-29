// Package agent はエージェント管理機能を提供します。
// コア特性とモジュールの互換性検証、エージェント合成、装備管理を担当します。
// Requirements: 5.9-5.12, 7.1-7.13, 8.1-8.8
package agent

import (
	"fmt"

	"github.com/google/uuid"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/inventory"
)

// MaxEquipmentSlots はエージェント装備スロットの最大数です。
// Requirement 8.2: 3つの装備スロット
const MaxEquipmentSlots = 3

// SynthesisPreview はエージェント合成プレビュー情報を表す構造体です。
// Requirement 7.13: 合成プレビューで最終的なステータスと能力を表示
type SynthesisPreview struct {
	// CoreName はコアの名前です。
	CoreName string

	// CoreTypeName はコア特性の名前です。
	CoreTypeName string

	// Level はエージェントのレベル（=コアレベル）です。
	Level int

	// BaseStats は基礎ステータスです。
	BaseStats domain.Stats

	// Modules は装備予定のモジュールリストです。
	Modules []*domain.ModuleModel

	// PassiveSkillName はパッシブスキルの名前です。
	PassiveSkillName string

	// PassiveSkillDesc はパッシブスキルの説明です。
	PassiveSkillDesc string
}

// AgentManager はエージェント管理を担当する構造体です。
// Requirements: 5.9-5.12, 7.1-7.13, 8.1-8.8
type AgentManager struct {
	// coreInventory はコアインベントリです。
	coreInventory *inventory.CoreInventory

	// moduleInventory はモジュールインベントリです。
	moduleInventory *inventory.ModuleInventory

	// agentInventory はエージェントインベントリです。
	agentInventory *inventory.AgentInventory

	// equippedAgents は装備中のエージェント（スロット番号 → エージェント）です。
	// Requirement 8.2: 3つの装備スロット
	equippedAgents [MaxEquipmentSlots]*domain.AgentModel
}

// NewAgentManager は新しいAgentManagerを作成します。
func NewAgentManager(
	coreInv *inventory.CoreInventory,
	moduleInv *inventory.ModuleInventory,
	agentInv *inventory.AgentInventory,
) *AgentManager {
	return &AgentManager{
		coreInventory:   coreInv,
		moduleInventory: moduleInv,
		agentInventory:  agentInv,
		equippedAgents:  [MaxEquipmentSlots]*domain.AgentModel{},
	}
}

// ==================== コア特性とモジュールタグ互換性検証（Task 5.1） ====================

// GetAllowedTags はコア特性の許可タグリストを取得します。
// Requirement 5.10: コア特性ごとに許可するモジュールタグのリストを持つ
func (m *AgentManager) GetAllowedTags(core *domain.CoreModel) []string {
	return core.AllowedTags
}

// ValidateModuleCompatibility はモジュールがコアに装備可能かを判定します。
// Requirement 5.11, 5.12: コアの許可タグとモジュールタグの照合
func (m *AgentManager) ValidateModuleCompatibility(core *domain.CoreModel, module *domain.ModuleModel) bool {
	return module.IsCompatibleWithCore(core)
}

// FilterCompatibleModules はコアに装備可能なモジュールのみをフィルタリングします。
// Requirement 7.4: 選択コアの許可タグに基づくモジュールフィルタリング
func (m *AgentManager) FilterCompatibleModules(core *domain.CoreModel) []*domain.ModuleModel {
	if m.moduleInventory == nil {
		return nil
	}
	return m.moduleInventory.FilterCompatibleWithCore(core)
}

// ==================== エージェント合成機能（Task 5.2） ====================

// SynthesizeAgent はコアとモジュールからエージェントを合成します。
// Requirement 7.1-7.8: エージェント合成機能
// Requirement 7.10, 7.11: バリデーション
func (m *AgentManager) SynthesizeAgent(coreID string, moduleIDs []string) (*domain.AgentModel, error) {
	// Requirement 7.11: モジュールが4個必要
	if len(moduleIDs) != domain.ModuleSlotCount {
		return nil, fmt.Errorf("モジュールが4個必要です（現在: %d個）", len(moduleIDs))
	}

	// コアを取得
	core := m.coreInventory.Get(coreID)
	if core == nil {
		return nil, fmt.Errorf("コアが見つかりません: %s", coreID)
	}

	// モジュールを取得し、互換性チェック
	modules := make([]*domain.ModuleModel, 0, domain.ModuleSlotCount)
	for _, moduleID := range moduleIDs {
		module := m.moduleInventory.Get(moduleID)
		if module == nil {
			return nil, fmt.Errorf("モジュールが見つかりません: %s", moduleID)
		}

		// Requirement 7.10: モジュールタグがコアの許可タグに含まれない場合、選択を拒否
		if !m.ValidateModuleCompatibility(core, module) {
			return nil, fmt.Errorf("モジュール '%s' はコア '%s' に装備できません", module.Name, core.Name)
		}

		modules = append(modules, module)
	}

	// Requirement 7.12: エージェント保有数上限チェック
	if m.agentInventory.IsFull() {
		return nil, fmt.Errorf("エージェントインベントリが満杯です")
	}

	// 新しいエージェントを作成
	agentID := uuid.New().String()
	agent := domain.NewAgent(agentID, core, modules)

	// Requirement 7.8: 素材を消費
	m.coreInventory.Remove(coreID)
	for _, moduleID := range moduleIDs {
		m.moduleInventory.Remove(moduleID)
	}

	// エージェントをインベントリに追加
	if err := m.agentInventory.Add(agent); err != nil {
		return nil, fmt.Errorf("エージェントの追加に失敗: %w", err)
	}

	return agent, nil
}

// GetSynthesisPreview は合成プレビュー情報を取得します。
// Requirement 7.13: 合成プレビューで最終的なステータスと能力を確定前に表示
func (m *AgentManager) GetSynthesisPreview(coreID string, moduleIDs []string) (*SynthesisPreview, error) {
	if len(moduleIDs) != domain.ModuleSlotCount {
		return nil, fmt.Errorf("モジュールが4個必要です（現在: %d個）", len(moduleIDs))
	}

	core := m.coreInventory.Get(coreID)
	if core == nil {
		return nil, fmt.Errorf("コアが見つかりません: %s", coreID)
	}

	modules := make([]*domain.ModuleModel, 0, domain.ModuleSlotCount)
	for _, moduleID := range moduleIDs {
		module := m.moduleInventory.Get(moduleID)
		if module == nil {
			return nil, fmt.Errorf("モジュールが見つかりません: %s", moduleID)
		}
		if !m.ValidateModuleCompatibility(core, module) {
			return nil, fmt.Errorf("モジュール '%s' はコア '%s' に装備できません", module.Name, core.Name)
		}
		modules = append(modules, module)
	}

	return &SynthesisPreview{
		CoreName:         core.Name,
		CoreTypeName:     core.Type.Name,
		Level:            core.Level,
		BaseStats:        core.Stats,
		Modules:          modules,
		PassiveSkillName: core.PassiveSkill.Name,
		PassiveSkillDesc: core.PassiveSkill.Description,
	}, nil
}

// ==================== エージェント装備機能（Task 5.3） ====================

// EquipAgent はエージェントを指定スロットに装備します。
// Requirement 8.4, 8.5: 装備処理
// Requirement 8.6: 装備変更時のプレイヤー最大HP再計算
func (m *AgentManager) EquipAgent(slot int, agentID string, player *domain.PlayerModel) error {
	// スロット番号チェック
	if slot < 0 || slot >= MaxEquipmentSlots {
		return fmt.Errorf("無効なスロット番号です: %d（有効範囲: 0-%d）", slot, MaxEquipmentSlots-1)
	}

	// エージェントを取得
	agent := m.agentInventory.Get(agentID)
	if agent == nil {
		return fmt.Errorf("エージェントが見つかりません: %s", agentID)
	}

	// 既に他のスロットに装備されている場合はエラー
	for i := 0; i < MaxEquipmentSlots; i++ {
		if m.equippedAgents[i] != nil && m.equippedAgents[i].ID == agentID && i != slot {
			return fmt.Errorf("エージェント '%s' は既にスロット %d に装備されています", agent.ID, i)
		}
	}

	// 装備
	m.equippedAgents[slot] = agent
	m.agentInventory.SetEquipped(agentID, true)

	// Requirement 8.6: プレイヤーHPを再計算
	m.recalculatePlayerHP(player)

	return nil
}

// UnequipAgent はエージェントを装備解除します。
// Requirement 8.7: 装備解除オプション
func (m *AgentManager) UnequipAgent(slot int, player *domain.PlayerModel) error {
	if slot < 0 || slot >= MaxEquipmentSlots {
		return fmt.Errorf("無効なスロット番号です: %d", slot)
	}

	agent := m.equippedAgents[slot]
	if agent != nil {
		m.agentInventory.SetEquipped(agent.ID, false)
	}
	m.equippedAgents[slot] = nil

	// Requirement 8.6: プレイヤーHPを再計算
	m.recalculatePlayerHP(player)

	return nil
}

// GetEquippedAgents は装備中のエージェントリストを返します。
// Requirement 8.3: 装備スロットに現在装備中のエージェント情報を表示
func (m *AgentManager) GetEquippedAgents() []*domain.AgentModel {
	result := make([]*domain.AgentModel, 0, MaxEquipmentSlots)
	for _, agent := range m.equippedAgents {
		if agent != nil {
			result = append(result, agent)
		}
	}
	return result
}

// GetEquippedAgentAt は指定スロットの装備エージェントを返します。
func (m *AgentManager) GetEquippedAgentAt(slot int) *domain.AgentModel {
	if slot < 0 || slot >= MaxEquipmentSlots {
		return nil
	}
	return m.equippedAgents[slot]
}

// GetEquippedCount は装備中のエージェント数を返します。
func (m *AgentManager) GetEquippedCount() int {
	count := 0
	for _, agent := range m.equippedAgents {
		if agent != nil {
			count++
		}
	}
	return count
}

// HasEquippedAgent はエージェントが1体以上装備されているかを返します。
// Requirement 3.8: 1体もエージェントを装備していない場合、バトル開始を拒否
func (m *AgentManager) HasEquippedAgent() bool {
	return m.GetEquippedCount() > 0
}

// recalculatePlayerHP は装備エージェントに基づいてプレイヤーHPを再計算します。
// Requirement 4.2, 8.6: 装備変更時にMaxHPを再計算
func (m *AgentManager) recalculatePlayerHP(player *domain.PlayerModel) {
	agents := m.GetEquippedAgents()
	player.RecalculateHP(agents)
}

// GetAgentDetails はエージェントの詳細情報を取得します。
// Requirement 8.8: 装備中エージェントの詳細情報を表示
func (m *AgentManager) GetAgentDetails(agentID string) *domain.AgentModel {
	return m.agentInventory.Get(agentID)
}
