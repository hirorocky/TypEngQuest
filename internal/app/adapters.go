// Package app は BlitzTypingOperator TUIゲームのアダプター定義を提供します。
package app

import (
	"hirorocky/type-battle/internal/agent"
	"hirorocky/type-battle/internal/domain"
)

// inventoryProviderAdapter はInventoryManagerとAgentManagerをInventoryProviderインターフェースに適合させます。
// コア・モジュールの管理はInventoryManager、エージェント・装備の管理はAgentManagerが担当します。
type inventoryProviderAdapter struct {
	inv      *InventoryManager
	agentMgr *agent.AgentManager
	player   *domain.PlayerModel
}

// NewInventoryProviderAdapter は新しいInventoryProviderAdapterを作成します。
func NewInventoryProviderAdapter(
	inv *InventoryManager,
	agentMgr *agent.AgentManager,
	player *domain.PlayerModel,
) *inventoryProviderAdapter {
	return &inventoryProviderAdapter{
		inv:      inv,
		agentMgr: agentMgr,
		player:   player,
	}
}

func (a *inventoryProviderAdapter) GetCores() []*domain.CoreModel {
	return a.inv.GetCores()
}

func (a *inventoryProviderAdapter) GetModules() []*domain.ModuleModel {
	return a.inv.GetModules()
}

func (a *inventoryProviderAdapter) GetAgents() []*domain.AgentModel {
	return a.agentMgr.GetAgents()
}

func (a *inventoryProviderAdapter) GetEquippedAgents() []*domain.AgentModel {
	return a.agentMgr.GetEquippedAgents()
}

func (a *inventoryProviderAdapter) AddAgent(agent *domain.AgentModel) error {
	return a.agentMgr.AddAgent(agent)
}

func (a *inventoryProviderAdapter) RemoveCore(id string) error {
	return a.inv.RemoveCore(id)
}

func (a *inventoryProviderAdapter) RemoveModule(id string) error {
	return a.inv.RemoveModule(id)
}

func (a *inventoryProviderAdapter) EquipAgent(slot int, agentModel *domain.AgentModel) error {
	return a.agentMgr.EquipAgent(slot, agentModel.ID, a.player)
}

func (a *inventoryProviderAdapter) UnequipAgent(slot int) error {
	return a.agentMgr.UnequipAgent(slot, a.player)
}
