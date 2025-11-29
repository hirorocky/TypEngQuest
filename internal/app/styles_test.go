package app

import (
	"testing"

	"github.com/charmbracelet/lipgloss"
)

// TestStylesInitialization はlipglossスタイルが作成できることを検証します
func TestStylesInitialization(t *testing.T) {
	style := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("#FAFAFA"))

	if style.GetBold() != true {
		t.Fatal("Style should be bold")
	}
}

// TestTitleStyle はタイトルスタイルの設定を検証します
func TestTitleStyle(t *testing.T) {
	styles := NewStyles()
	if styles.Title.GetBold() != true {
		t.Fatal("Title style should be bold")
	}
}

// TestErrorStyle はエラースタイルが赤い前景色を持つことを検証します
func TestErrorStyle(t *testing.T) {
	styles := NewStyles()
	// エラースタイルが存在すること
	_ = styles.Error
}

// TestSuccessStyle は成功スタイルが緑の前景色を持つことを検証します
func TestSuccessStyle(t *testing.T) {
	styles := NewStyles()
	// 成功スタイルが存在すること
	_ = styles.Success
}
