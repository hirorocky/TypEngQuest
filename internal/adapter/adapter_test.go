// Package adapter はデータ変換ロジックを集約するアダプター層を提供します。
// ドメインモデルとUI/永続化層の境界を明確にし、変換ロジックを一元管理します。
package adapter

import "testing"

// TestPackageExists はadapterパッケージが存在することを確認します。
func TestPackageExists(t *testing.T) {
	// このテストはパッケージの存在確認のみを行います。
	// パッケージが正しく初期化されていれば、このテストは通過します。
	t.Log("adapter package exists")
}
