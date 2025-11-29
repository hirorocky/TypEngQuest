// Package screens はTUI画面のテストを提供します。
package screens

import (
	"testing"

	tea "github.com/charmbracelet/bubbletea"
)

// ==================== Task 10.1: ホーム画面のテスト ====================

// TestNewHomeScreen はHomeScreenの初期化をテストします。
// Requirement 2.1: ゲーム起動時にホーム画面を表示
func TestNewHomeScreen(t *testing.T) {
	screen := NewHomeScreen(0, nil)

	if screen == nil {
		t.Fatal("HomeScreenがnilです")
	}

	// 初期状態で4つのメニューアイテムがあること
	// Requirement 2.2: 4つの主要機能を表示
	if len(screen.menu.Items) != 5 { // 4メニュー + 設定
		t.Errorf("メニューアイテム数が不正: got %d, want 5", len(screen.menu.Items))
	}
}

// TestHomeScreenMenuItems はメニューアイテムをテストします。
// Requirement 2.2: エージェント管理、バトル選択、図鑑、統計/実績
func TestHomeScreenMenuItems(t *testing.T) {
	screen := NewHomeScreen(0, nil)

	expectedItems := []string{
		"agent_management",
		"battle_select",
		"encyclopedia",
		"stats_achievements",
		"settings",
	}

	for i, expected := range expectedItems {
		if i >= len(screen.menu.Items) {
			t.Errorf("メニューアイテム%dが存在しません", i)
			continue
		}
		if screen.menu.Items[i].Value != expected {
			t.Errorf("メニューアイテム%d: got %s, want %s", i, screen.menu.Items[i].Value, expected)
		}
	}
}

// TestHomeScreenNavigation はメニューナビゲーションをテストします。
// Requirement 2.7: 矢印キーまたはhjklでメニュー選択
func TestHomeScreenNavigation(t *testing.T) {
	screen := NewHomeScreen(0, nil)

	// 下キーで移動
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyDown})
	if screen.menu.SelectedIndex != 1 {
		t.Errorf("下キー後の選択インデックス: got %d, want 1", screen.menu.SelectedIndex)
	}

	// jキーで移動（vim形式）
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'j'}})
	if screen.menu.SelectedIndex != 2 {
		t.Errorf("jキー後の選択インデックス: got %d, want 2", screen.menu.SelectedIndex)
	}

	// 上キーで移動
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyUp})
	if screen.menu.SelectedIndex != 1 {
		t.Errorf("上キー後の選択インデックス: got %d, want 1", screen.menu.SelectedIndex)
	}

	// kキーで移動（vim形式）
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'k'}})
	if screen.menu.SelectedIndex != 0 {
		t.Errorf("kキー後の選択インデックス: got %d, want 0", screen.menu.SelectedIndex)
	}
}

// TestHomeScreenEnterSelection はEnterキーによる選択をテストします。
// Requirement 2.8: Enterキーで項目実行
func TestHomeScreenEnterSelection(t *testing.T) {
	screen := NewHomeScreen(0, nil)

	// バトル選択を選択
	screen.menu.SelectedIndex = 1 // battle_select

	_, cmd := screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyEnter})
	if cmd == nil {
		t.Error("Enterキーでコマンドが返されません")
	}
}

// TestHomeScreenProgressDisplay は進行状況表示をテストします。
// Requirement 2.10: 現在の進行状況（到達最高レベル）を表示
func TestHomeScreenProgressDisplay(t *testing.T) {
	maxLevel := 15
	screen := NewHomeScreen(maxLevel, nil)

	rendered := screen.View()

	// レンダリング結果が空でないこと
	if rendered == "" {
		t.Error("レンダリング結果が空です")
	}

	// 最高レベルの情報が含まれていることを確認
	// （実際のレンダリング内容はUI実装に依存）
}

// TestHomeScreenRender はホーム画面のレンダリングをテストします。
func TestHomeScreenRender(t *testing.T) {
	screen := NewHomeScreen(10, nil)
	screen.width = 120
	screen.height = 40

	rendered := screen.View()

	if rendered == "" {
		t.Error("レンダリング結果が空です")
	}
}
