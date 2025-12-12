// Package app は BlitzTypingOperator TUIゲームのアダプターテストを提供します。
package app

import (
	"testing"

	"hirorocky/type-battle/internal/embedded"
)

// TestInventoryProviderAdapter_GetCores はGetCoresメソッドを検証します
func TestInventoryProviderAdapter_GetCores(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	adapter := model.createInventoryAdapter()

	cores := adapter.GetCores()
	if cores == nil {
		t.Fatal("GetCores() returned nil")
	}
}

// TestInventoryProviderAdapter_GetModules はGetModulesメソッドを検証します
func TestInventoryProviderAdapter_GetModules(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	adapter := model.createInventoryAdapter()

	modules := adapter.GetModules()
	if modules == nil {
		t.Fatal("GetModules() returned nil")
	}
}

// TestInventoryProviderAdapter_GetAgents はGetAgentsメソッドを検証します
func TestInventoryProviderAdapter_GetAgents(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	adapter := model.createInventoryAdapter()

	agents := adapter.GetAgents()
	if agents == nil {
		t.Fatal("GetAgents() returned nil")
	}
}

// TestInventoryProviderAdapter_GetEquippedAgents はGetEquippedAgentsメソッドを検証します
func TestInventoryProviderAdapter_GetEquippedAgents(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	adapter := model.createInventoryAdapter()

	equippedAgents := adapter.GetEquippedAgents()
	if equippedAgents == nil {
		t.Fatal("GetEquippedAgents() returned nil")
	}
}

// TestNewInventoryProviderAdapter は新しいアダプターの生成を検証します
func TestNewInventoryProviderAdapter(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	gs := model.GameState()

	adapter := NewInventoryProviderAdapter(
		gs.Inventory(),
		gs.AgentManager(),
		gs.Player(),
	)

	if adapter == nil {
		t.Fatal("NewInventoryProviderAdapter() returned nil")
	}
}

// TestInventoryProviderAdapter_ImplementsInterface はインターフェース準拠を検証します
func TestInventoryProviderAdapter_ImplementsInterface(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	adapter := model.createInventoryAdapter()

	// InventoryProviderインターフェースを実装していることを確認
	var _ InventoryProvider = adapter
}

// TestAdapterDelegate_CoreOperations はアダプターが正しくコア操作を委譲することを検証します
func TestAdapterDelegate_CoreOperations(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	adapter := model.createInventoryAdapter()

	// コア一覧取得
	cores := adapter.GetCores()
	if cores == nil {
		t.Fatal("GetCores should return non-nil slice")
	}

	// モジュール一覧取得
	modules := adapter.GetModules()
	if modules == nil {
		t.Fatal("GetModules should return non-nil slice")
	}
}

// TestAdapterDelegate_AgentOperations はアダプターが正しくエージェント操作を委譲することを検証します
func TestAdapterDelegate_AgentOperations(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	adapter := model.createInventoryAdapter()

	// エージェント一覧取得
	agents := adapter.GetAgents()
	if agents == nil {
		t.Fatal("GetAgents should return non-nil slice")
	}

	// 装備エージェント一覧取得
	equipped := adapter.GetEquippedAgents()
	if equipped == nil {
		t.Fatal("GetEquippedAgents should return non-nil slice")
	}
}
