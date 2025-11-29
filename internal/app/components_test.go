package app

import (
	"testing"

	"github.com/charmbracelet/bubbles/progress"
)

// TestBubblesProgressAvailable はbubblesプログレスコンポーネントが利用可能であることを検証します
func TestBubblesProgressAvailable(t *testing.T) {
	// bubblesが正しくインポートされていることを確認するためにプログレスバーを作成
	p := progress.New(progress.WithDefaultGradient())
	if p.Width == 0 {
		// デフォルトでWidthが0でも問題ない
	}
	// パニックなしで作成できることを確認
}
