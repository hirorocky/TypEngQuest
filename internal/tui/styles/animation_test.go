// Package styles はTUIスタイリングのテストを提供します。
package styles

import (
	"testing"
)

// ==================== Task 11.2: アニメーションとフィードバックのテスト ====================

// TestTypingColors はタイピング入力の色分けをテストします。
// Requirement 18.6: タイピング入力の色分け（入力中、完了済み、未入力）
func TestTypingColors(t *testing.T) {
	styles := NewGameStyles()

	// 完了済みテキスト
	completed := styles.RenderTypingCompleted("abc")
	if completed == "" {
		t.Error("完了済みテキストが空です")
	}

	// 入力中テキスト
	current := styles.RenderTypingCurrent("d")
	if current == "" {
		t.Error("入力中テキストが空です")
	}

	// 未入力テキスト
	remaining := styles.RenderTypingRemaining("efg")
	if remaining == "" {
		t.Error("未入力テキストが空です")
	}

	// 誤入力テキスト
	incorrect := styles.RenderTypingIncorrect("x")
	if incorrect == "" {
		t.Error("誤入力テキストが空です")
	}
}

// TestRenderTypingChallenge はタイピングチャレンジ全体の描画をテストします。
func TestRenderTypingChallenge(t *testing.T) {
	styles := NewGameStyles()

	result := styles.RenderTypingChallenge("hello", 3, nil)
	if result == "" {
		t.Error("タイピングチャレンジの描画が空です")
	}

	// 誤入力位置ありの場合
	mistakes := []int{1}
	result = styles.RenderTypingChallenge("hello", 3, mistakes)
	if result == "" {
		t.Error("誤入力ありタイピングチャレンジの描画が空です")
	}
}

// TestDamageAnimation はダメージアニメーションのテストです。
// Requirement 18.5: ダメージ発生時のアニメーション効果
func TestDamageAnimation(t *testing.T) {
	styles := NewGameStyles()

	// ダメージ表示のアニメーションフレーム取得
	frames := styles.GetDamageAnimationFrames(100)
	if len(frames) == 0 {
		t.Error("ダメージアニメーションフレームが空です")
	}

	// 各フレームが空でないことを確認
	for i, frame := range frames {
		if frame == "" {
			t.Errorf("フレーム%dが空です", i)
		}
	}
}

// TestHighlightMessage は重要メッセージの強調表示テストです。
// Requirement 18.7: 重要メッセージの強調表示
func TestHighlightMessage(t *testing.T) {
	styles := NewGameStyles()

	tests := []struct {
		name     string
		message  string
		msgType  MessageType
	}{
		{"レベルクリア", "Level Clear!", MessageTypeSuccess},
		{"アイテム獲得", "Core acquired!", MessageTypeInfo},
		{"警告", "HP Low!", MessageTypeWarning},
		{"エラー", "Failed!", MessageTypeError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := styles.RenderHighlightMessage(tt.message, tt.msgType)
			if result == "" {
				t.Error("強調メッセージが空です")
			}
		})
	}
}

// TestFlickerMinimization は画面ちらつき最小化のテストです。
// Requirement 18.8: 画面ちらつき最小化
func TestFlickerMinimization(t *testing.T) {
	// レンダリング最適化のテスト
	// 同じ内容を複数回レンダリングしても一貫した結果が得られることを確認
	styles := NewGameStyles()

	render1 := styles.RenderHPBar(50, 100, 20)
	render2 := styles.RenderHPBar(50, 100, 20)

	if render1 != render2 {
		t.Error("同じ入力で異なる出力が生成されました（ちらつきの原因）")
	}
}

// TestCooldownProgressBar はクールダウンプログレスバーのテストです。
// Requirement 18.9: モジュールのクールダウン状態を視覚的に表示
func TestCooldownProgressBar(t *testing.T) {
	styles := NewGameStyles()

	tests := []struct {
		name        string
		remaining   float64
		total       float64
	}{
		{"満タン", 5.0, 5.0},
		{"半分", 2.5, 5.0},
		{"残りわずか", 0.5, 5.0},
		{"完了", 0.0, 5.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := styles.RenderCooldownBar(tt.remaining, tt.total, 10)
			if result == "" {
				t.Error("クールダウンバーが空です")
			}
		})
	}
}
