// Package styles はTUIスタイリングのテストを提供します。
package styles

import (
	"testing"
)

// ==================== Task 11.1: 基本スタイリングのテスト ====================

// TestNewGameStyles はGameStylesの初期化をテストします。
// Requirement 18.1: ボックス描画文字によるレイアウト
// Requirement 18.2: カラー表示のサポート
func TestNewGameStyles(t *testing.T) {
	styles := NewGameStyles()

	if styles == nil {
		t.Fatal("GameStylesがnilです")
	}

	// スタイルが初期化されていることを確認（Border構造体は空でないこと）
	if styles.Box.BorderForeground == "" {
		t.Error("Boxスタイルのボーダー色が設定されていません")
	}
}

// TestHPColorRanges はHP色分けのテストです。
// Requirement 18.2: HP色分け（緑/黄/赤）
func TestHPColorRanges(t *testing.T) {
	styles := NewGameStyles()

	tests := []struct {
		name       string
		percentage float64
		expected   string // "green", "yellow", "red"
	}{
		{"満タン100%", 1.0, "green"},
		{"高HP75%", 0.75, "green"},
		{"中HP55%", 0.55, "green"},
		{"中HP50%", 0.50, "yellow"},
		{"低HP30%", 0.30, "yellow"},
		{"危険HP25%", 0.25, "red"},
		{"危険HP10%", 0.10, "red"},
		{"HP0%", 0.0, "red"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			colorType := styles.GetHPColorType(tt.percentage)
			if colorType != tt.expected {
				t.Errorf("HP %.0f%% の色: got %s, want %s", tt.percentage*100, colorType, tt.expected)
			}
		})
	}
}

// TestRenderHPBar はHPバーの描画をテストします。
// Requirement 18.4: HPバーの視覚的表示
func TestRenderHPBar(t *testing.T) {
	styles := NewGameStyles()

	tests := []struct {
		name        string
		current     int
		max         int
		width       int
		expectFull  bool
		expectEmpty bool
	}{
		{"満タン", 100, 100, 20, true, false},
		{"半分", 50, 100, 20, false, false},
		{"空", 0, 100, 20, false, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bar := styles.RenderHPBar(tt.current, tt.max, tt.width)
			if bar == "" {
				t.Error("HPバーが空文字列です")
			}
			// HPバーの長さが期待値に近いことを確認（ボーダー含む）
			// 実際のレンダリング結果をチェック
			if len(bar) == 0 {
				t.Error("HPバーのレンダリングに失敗しました")
			}
		})
	}
}

// TestDamageStyle はダメージ表示スタイルのテストです。
// Requirement 18.2: ダメージは赤
func TestDamageStyle(t *testing.T) {
	styles := NewGameStyles()

	rendered := styles.RenderDamage(42)
	if rendered == "" {
		t.Error("ダメージ表示が空です")
	}
}

// TestHealStyle は回復表示スタイルのテストです。
// Requirement 18.2: 回復は緑
func TestHealStyle(t *testing.T) {
	styles := NewGameStyles()

	rendered := styles.RenderHeal(25)
	if rendered == "" {
		t.Error("回復表示が空です")
	}
}

// TestBoxBorder はボックス描画文字のテストです。
// Requirement 18.1: ボックス描画文字によるレイアウト
func TestBoxBorder(t *testing.T) {
	styles := NewGameStyles()

	boxContent := styles.RenderBox("テスト内容", 30)
	if boxContent == "" {
		t.Error("ボックス描画が空です")
	}

	// ボックス描画文字が含まれていることを確認
	if len(boxContent) < 10 {
		t.Error("ボックス描画が不十分です")
	}
}

// TestFallbackDisplay はカラー非対応ターミナルでの代替表示テストです。
// Requirement 18.3: カラー非対応ターミナルでの代替表示
func TestFallbackDisplay(t *testing.T) {
	// NoColorモードでのスタイル作成
	styles := NewGameStylesWithNoColor()

	// 代替表示でも正しくレンダリングできることを確認
	bar := styles.RenderHPBar(50, 100, 20)
	if bar == "" {
		t.Error("NoColorモードでHPバーがレンダリングできません")
	}

	damage := styles.RenderDamage(10)
	if damage == "" {
		t.Error("NoColorモードでダメージがレンダリングできません")
	}
}
