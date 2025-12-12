// Package app は BlitzTypingOperator TUIゲームのアダプター定義を提供します。
// このファイルはtui/presenterパッケージへの委譲を提供し、後方互換性を維持します。
package app

import (
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/tui/presenter"
	"hirorocky/type-battle/internal/usecase/agent"
)

// inventoryProviderAdapter はtui/presenter.InventoryProviderAdapterへの型エイリアスです。
// 後方互換性のため非公開の小文字名を維持します。
type inventoryProviderAdapter = presenter.InventoryProviderAdapter

// NewInventoryProviderAdapter は新しいInventoryProviderAdapterを作成します。
// tui/presenter.NewInventoryProviderAdapter に委譲します。
func NewInventoryProviderAdapter(
	inv *InventoryManager,
	agentMgr *agent.AgentManager,
	player *domain.PlayerModel,
) *inventoryProviderAdapter {
	return presenter.NewInventoryProviderAdapter(inv, agentMgr, player)
}
