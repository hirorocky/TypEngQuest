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

// ==================== Task 2.1: AnimatedHPBarのテスト ====================

// TestNewAnimatedHPBar はAnimatedHPBarの作成をテストします。
// Requirement 3.3: HPバーのスムーズアニメーション
func TestNewAnimatedHPBar(t *testing.T) {
	bar := NewAnimatedHPBar(100)
	if bar == nil {
		t.Error("NewAnimatedHPBar()がnilを返しました")
	}

	// 初期状態の確認
	if bar.MaxHP != 100 {
		t.Errorf("MaxHPが正しくありません: got %d, want %d", bar.MaxHP, 100)
	}
	if bar.TargetHP != 100 {
		t.Errorf("TargetHPが正しくありません: got %d, want %d", bar.TargetHP, 100)
	}
	if bar.CurrentDisplayHP != 100.0 {
		t.Errorf("CurrentDisplayHPが正しくありません: got %f, want %f", bar.CurrentDisplayHP, 100.0)
	}
	if bar.IsAnimating {
		t.Error("初期状態でIsAnimatingがtrueです")
	}
}

// TestAnimatedHPBarSetTarget は目標HP設定をテストします。
func TestAnimatedHPBarSetTarget(t *testing.T) {
	bar := NewAnimatedHPBar(100)

	// ダメージを受けた場合（減少）
	bar.SetTarget(70)
	if bar.TargetHP != 70 {
		t.Errorf("TargetHPが正しくありません: got %d, want %d", bar.TargetHP, 70)
	}
	if !bar.IsAnimating {
		t.Error("SetTarget後にIsAnimatingがfalseです")
	}

	// 回復した場合（増加）
	bar.SetTarget(90)
	if bar.TargetHP != 90 {
		t.Errorf("TargetHPが正しくありません: got %d, want %d", bar.TargetHP, 90)
	}
}

// TestAnimatedHPBarSetTargetBounds は目標HPの境界値をテストします。
func TestAnimatedHPBarSetTargetBounds(t *testing.T) {
	bar := NewAnimatedHPBar(100)

	// 0未満は0に制限
	bar.SetTarget(-10)
	if bar.TargetHP != 0 {
		t.Errorf("TargetHPが0に制限されていません: got %d", bar.TargetHP)
	}

	// MaxHP超過はMaxHPに制限
	bar.SetTarget(150)
	if bar.TargetHP != 100 {
		t.Errorf("TargetHPがMaxHPに制限されていません: got %d", bar.TargetHP)
	}
}

// TestAnimatedHPBarUpdate はアニメーション更新をテストします。
// Requirement 3.3: 100msごとの更新で自然なアニメーション
func TestAnimatedHPBarUpdate(t *testing.T) {
	bar := NewAnimatedHPBar(100)
	bar.SetTarget(50) // 100から50へ減少

	// 更新前の値を記録
	beforeHP := bar.CurrentDisplayHP

	// 100ms更新
	bar.Update(100)

	// HPが減少していることを確認
	if bar.CurrentDisplayHP >= beforeHP {
		t.Error("Update()でCurrentDisplayHPが減少していません")
	}

	// まだ目標に達していないはず
	if bar.CurrentDisplayHP <= float64(bar.TargetHP) {
		t.Error("1回の更新で目標に達するのは速すぎます")
	}
}

// TestAnimatedHPBarUpdateComplete はアニメーション完了をテストします。
func TestAnimatedHPBarUpdateComplete(t *testing.T) {
	bar := NewAnimatedHPBar(100)
	bar.SetTarget(50)

	// 十分な時間更新してアニメーション完了させる
	for i := 0; i < 50; i++ {
		bar.Update(100)
	}

	// 目標に達していることを確認
	if bar.GetCurrentHP() != 50 {
		t.Errorf("アニメーション完了後のHPが正しくありません: got %d, want %d", bar.GetCurrentHP(), 50)
	}

	// アニメーションが終了していることを確認
	if bar.IsAnimating {
		t.Error("アニメーション完了後もIsAnimatingがtrueです")
	}
}

// TestAnimatedHPBarRender はHPバーの描画をテストします。
func TestAnimatedHPBarRender(t *testing.T) {
	bar := NewAnimatedHPBar(100)
	gs := NewGameStyles()

	result := bar.Render(gs, 20)
	if result == "" {
		t.Error("Render()が空文字列を返しました")
	}
}

// TestAnimatedHPBarGetCurrentHP は現在の表示HPを取得するテストです。
func TestAnimatedHPBarGetCurrentHP(t *testing.T) {
	bar := NewAnimatedHPBar(100)

	hp := bar.GetCurrentHP()
	if hp != 100 {
		t.Errorf("GetCurrentHP()が正しくありません: got %d, want %d", hp, 100)
	}

	// 途中の値でも整数で取得できることを確認
	bar.CurrentDisplayHP = 75.7
	hp = bar.GetCurrentHP()
	if hp != 76 { // 四捨五入
		t.Errorf("GetCurrentHP()の丸めが正しくありません: got %d, want %d", hp, 76)
	}
}

// TestAnimatedHPBarHealingAnimation は回復アニメーションをテストします。
func TestAnimatedHPBarHealingAnimation(t *testing.T) {
	bar := NewAnimatedHPBar(100)
	bar.CurrentDisplayHP = 50
	bar.TargetHP = 50
	bar.IsAnimating = false

	// 回復（増加）
	bar.SetTarget(80)

	// 更新前の値を記録
	beforeHP := bar.CurrentDisplayHP

	// 100ms更新
	bar.Update(100)

	// HPが増加していることを確認
	if bar.CurrentDisplayHP <= beforeHP {
		t.Error("回復アニメーションでCurrentDisplayHPが増加していません")
	}
}
