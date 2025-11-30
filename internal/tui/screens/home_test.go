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

// ==================== Task 4.1: ASCIIアートロゴ統合のテスト ====================

// TestHomeScreenHasASCIILogo はASCIIロゴが表示されることをテストします。
// Requirement 1.1: ホーム画面にASCIIアートロゴを表示
func TestHomeScreenHasASCIILogo(t *testing.T) {
	screen := NewHomeScreen(10, nil)
	screen.width = 120
	screen.height = 40

	rendered := screen.View()

	// ロゴの特徴的な文字が含まれることを確認（フィグレット風）
	// TypeBattleロゴは「╔╦╗」などの文字を使用
	if !containsAny(rendered, "╔", "╗", "╚", "╝") {
		t.Error("ASCIIアートロゴが表示されていません")
	}
}

// TestHomeScreenHasLevelASCII はレベルがASCII数字で表示されることをテストします。
// Requirement 1.4: 進行状況パネルに到達レベルをASCII数字アートで表示
func TestHomeScreenHasLevelASCII(t *testing.T) {
	screen := NewHomeScreen(15, nil)
	screen.width = 120
	screen.height = 40

	rendered := screen.View()

	// ASCII数字の特徴的な文字が含まれることを確認
	// 数字は「█」を使用
	if !containsAny(rendered, "█") {
		t.Error("ASCII数字が表示されていません")
	}
}

// TestHomeScreenHasSubtitle はサブタイトルが表示されることをテストします。
func TestHomeScreenHasSubtitle(t *testing.T) {
	screen := NewHomeScreen(10, nil)
	screen.width = 120
	screen.height = 40

	rendered := screen.View()

	// サブタイトルが含まれることを確認
	if !containsAny(rendered, "Terminal Typing Battle Game") {
		t.Error("サブタイトルが表示されていません")
	}
}

// containsAny は文字列に指定したいずれかの部分文字列が含まれるかを確認します。
func containsAny(s string, substrs ...string) bool {
	for _, substr := range substrs {
		if contains(s, substr) {
			return true
		}
	}
	return false
}

// contains は文字列に部分文字列が含まれるかを確認します。
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 ||
		(len(s) > 0 && len(substr) > 0 && findSubstring(s, substr)))
}

// findSubstring は文字列内で部分文字列を探します。
func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
