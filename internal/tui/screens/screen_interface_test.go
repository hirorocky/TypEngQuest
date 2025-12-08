// Package screens はTUIゲームの画面を提供します。
package screens

import (
	"testing"

	tea "github.com/charmbracelet/bubbletea"
)

// ==================== Screenインターフェースのテスト ====================

// TestScreenInterfaceExists はScreenインターフェースが定義されていることをテストします。
func TestScreenInterfaceExists(t *testing.T) {
	// Screenインターフェースが存在することを確認（コンパイル時チェック）
	var _ Screen = (*testScreenImpl)(nil)
}

// TestBaseScreenSetSize はBaseScreen.SetSizeが正しく動作することをテストします。
func TestBaseScreenSetSize(t *testing.T) {
	base := &BaseScreen{}

	base.SetSize(120, 40)

	if base.width != 120 {
		t.Errorf("SetSize width: got %d, want %d", base.width, 120)
	}
	if base.height != 40 {
		t.Errorf("SetSize height: got %d, want %d", base.height, 40)
	}
}

// TestBaseScreenGetTitle はBaseScreen.GetTitleが正しく動作することをテストします。
func TestBaseScreenGetTitle(t *testing.T) {
	base := &BaseScreen{title: "テスト画面"}

	title := base.GetTitle()

	if title != "テスト画面" {
		t.Errorf("GetTitle: got %q, want %q", title, "テスト画面")
	}
}

// TestBaseScreenGetSize はBaseScreen.GetSizeが正しく動作することをテストします。
func TestBaseScreenGetSize(t *testing.T) {
	base := &BaseScreen{width: 100, height: 50}

	width, height := base.GetSize()

	if width != 100 {
		t.Errorf("GetSize width: got %d, want %d", width, 100)
	}
	if height != 50 {
		t.Errorf("GetSize height: got %d, want %d", height, 50)
	}
}

// TestNewBaseScreen はNewBaseScreenコンストラクタが正しく動作することをテストします。
func TestNewBaseScreen(t *testing.T) {
	base := NewBaseScreen("ホーム画面")

	if base.title != "ホーム画面" {
		t.Errorf("NewBaseScreen title: got %q, want %q", base.title, "ホーム画面")
	}
	if base.width != 0 {
		t.Errorf("NewBaseScreen width: got %d, want %d", base.width, 0)
	}
	if base.height != 0 {
		t.Errorf("NewBaseScreen height: got %d, want %d", base.height, 0)
	}
}

// TestBaseScreenHandleWindowSizeMsg はBaseScreenがWindowSizeMsgを処理することをテストします。
func TestBaseScreenHandleWindowSizeMsg(t *testing.T) {
	base := &BaseScreen{}
	msg := tea.WindowSizeMsg{Width: 160, Height: 80}

	base.HandleWindowSizeMsg(msg)

	if base.width != 160 {
		t.Errorf("HandleWindowSizeMsg width: got %d, want %d", base.width, 160)
	}
	if base.height != 80 {
		t.Errorf("HandleWindowSizeMsg height: got %d, want %d", base.height, 80)
	}
}

// ==================== テスト用のScreen実装 ====================

// testScreenImpl はScreenインターフェースのテスト用実装です。
type testScreenImpl struct {
	BaseScreen
}

// Init はtea.Modelインターフェースを満たします。
func (t *testScreenImpl) Init() tea.Cmd {
	return nil
}

// Update はtea.Modelインターフェースを満たします。
func (t *testScreenImpl) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	return t, nil
}

// View はtea.Modelインターフェースを満たします。
func (t *testScreenImpl) View() string {
	return "test screen"
}
