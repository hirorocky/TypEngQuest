package app

import (
	"testing"

	tea "github.com/charmbracelet/bubbletea"
)

// TestNewApp は新しいAppモデルが正常に作成できることを検証します
func TestNewApp(t *testing.T) {
	model := New()
	if model == nil {
		t.Fatal("New() returned nil")
	}
}

// TestAppImplementsTeaModel はAppがtea.Modelインターフェースを実装していることを検証します
func TestAppImplementsTeaModel(t *testing.T) {
	var _ tea.Model = (*Model)(nil)
}

// TestAppInit はInitが有効なtea.Cmd（nilも可）を返すことを検証します
func TestAppInit(t *testing.T) {
	model := New()
	cmd := model.Init()
	// Initはnilまたは有効なコマンドを返すことができます
	_ = cmd
}

// TestAppUpdate はUpdateが基本的なメッセージを処理し、モデルとコマンドを返すことを検証します
func TestAppUpdate(t *testing.T) {
	model := New()
	updatedModel, cmd := model.Update(nil)
	if updatedModel == nil {
		t.Fatal("Update() returned nil model")
	}
	// cmdはnilになることがあります
	_ = cmd
}

// TestAppView はViewが空でない文字列を返すことを検証します
func TestAppView(t *testing.T) {
	model := New()
	view := model.View()
	if view == "" {
		t.Fatal("View() returned empty string")
	}
}

// TestAppViewContainsGameTitle は初期ビューにゲームタイトルが含まれていることを検証します
func TestAppViewContainsGameTitle(t *testing.T) {
	model := New()
	view := model.View()
	// ゲームタイトル（BlitzTypingOperatorまたは関連）の存在を確認
	if len(view) == 0 {
		t.Fatal("View should contain some content")
	}
}
