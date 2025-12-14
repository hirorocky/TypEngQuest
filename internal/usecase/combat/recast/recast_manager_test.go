// Package recast はリキャスト管理機能を提供します。
package recast

import (
	"testing"
	"time"
)

// TestNewRecastManager はRecastManagerの生成をテストします。
func TestNewRecastManager(t *testing.T) {
	rm := NewRecastManager()
	if rm == nil {
		t.Fatal("RecastManagerがnilです")
	}

	// 初期状態では全エージェントが使用可能
	for i := 0; i < 3; i++ {
		if !rm.IsAgentReady(i) {
			t.Errorf("初期状態でエージェント%dが使用不可です", i)
		}
	}
}

// TestStartRecast はリキャスト開始をテストします。
func TestStartRecast(t *testing.T) {
	rm := NewRecastManager()

	// リキャスト開始
	rm.StartRecast(0, 5.0*time.Second)

	// エージェントが使用不可になる
	if rm.IsAgentReady(0) {
		t.Error("リキャスト中のエージェントが使用可能になっています")
	}

	// 他のエージェントは影響を受けない
	if !rm.IsAgentReady(1) {
		t.Error("他のエージェントが影響を受けています")
	}

	// リキャスト状態を取得
	state := rm.GetRecastState(0)
	if state == nil {
		t.Fatal("リキャスト状態がnilです")
	}
	if state.AgentIndex != 0 {
		t.Errorf("AgentIndex: got %d, want 0", state.AgentIndex)
	}
	if state.TotalSeconds != 5.0 {
		t.Errorf("TotalSeconds: got %f, want 5.0", state.TotalSeconds)
	}
	if state.RemainingSeconds != 5.0 {
		t.Errorf("RemainingSeconds: got %f, want 5.0", state.RemainingSeconds)
	}
}

// TestUpdateRecast はリキャスト更新をテストします。
func TestUpdateRecast(t *testing.T) {
	rm := NewRecastManager()

	// リキャスト開始
	rm.StartRecast(0, 3.0*time.Second)

	// 1秒経過
	completed := rm.UpdateRecast(1.0 * time.Second)

	// まだ完了していない
	if len(completed) != 0 {
		t.Error("リキャストが早すぎるタイミングで完了しました")
	}

	// 残り時間を確認
	state := rm.GetRecastState(0)
	if state == nil {
		t.Fatal("リキャスト状態がnilです")
	}
	if state.RemainingSeconds != 2.0 {
		t.Errorf("RemainingSeconds: got %f, want 2.0", state.RemainingSeconds)
	}

	// さらに2秒経過（合計3秒で完了）
	completed = rm.UpdateRecast(2.0 * time.Second)

	// 完了したエージェントが返される
	if len(completed) != 1 || completed[0] != 0 {
		t.Errorf("完了したエージェント: got %v, want [0]", completed)
	}

	// エージェントが再び使用可能
	if !rm.IsAgentReady(0) {
		t.Error("リキャスト完了後もエージェントが使用不可です")
	}

	// リキャスト状態がクリアされている
	state = rm.GetRecastState(0)
	if state != nil {
		t.Error("リキャスト完了後も状態が残っています")
	}
}

// TestMultipleAgentRecast は複数エージェントの同時リキャストをテストします。
func TestMultipleAgentRecast(t *testing.T) {
	rm := NewRecastManager()

	// 複数エージェントのリキャスト開始
	rm.StartRecast(0, 3.0*time.Second)
	rm.StartRecast(1, 5.0*time.Second)
	rm.StartRecast(2, 4.0*time.Second)

	// 全エージェントが使用不可
	for i := 0; i < 3; i++ {
		if rm.IsAgentReady(i) {
			t.Errorf("エージェント%dがリキャスト中なのに使用可能です", i)
		}
	}

	// 3秒経過 - エージェント0が完了
	completed := rm.UpdateRecast(3.0 * time.Second)
	if len(completed) != 1 || completed[0] != 0 {
		t.Errorf("3秒後の完了エージェント: got %v, want [0]", completed)
	}

	// エージェント0のみ使用可能
	if !rm.IsAgentReady(0) {
		t.Error("エージェント0がまだ使用不可です")
	}
	if rm.IsAgentReady(1) || rm.IsAgentReady(2) {
		t.Error("エージェント1,2が使用可能になっています")
	}

	// 1秒経過 - エージェント2が完了（合計4秒）
	completed = rm.UpdateRecast(1.0 * time.Second)
	if len(completed) != 1 || completed[0] != 2 {
		t.Errorf("4秒後の完了エージェント: got %v, want [2]", completed)
	}

	// 1秒経過 - エージェント1が完了（合計5秒）
	completed = rm.UpdateRecast(1.0 * time.Second)
	if len(completed) != 1 || completed[0] != 1 {
		t.Errorf("5秒後の完了エージェント: got %v, want [1]", completed)
	}

	// 全エージェントが使用可能
	for i := 0; i < 3; i++ {
		if !rm.IsAgentReady(i) {
			t.Errorf("エージェント%dがまだ使用不可です", i)
		}
	}
}

// TestGetAllRecastStates は全リキャスト状態取得をテストします。
func TestGetAllRecastStates(t *testing.T) {
	rm := NewRecastManager()

	// 初期状態では空
	states := rm.GetAllRecastStates()
	if len(states) != 0 {
		t.Errorf("初期状態のリキャスト状態数: got %d, want 0", len(states))
	}

	// 複数エージェントのリキャスト開始
	rm.StartRecast(0, 3.0*time.Second)
	rm.StartRecast(2, 5.0*time.Second)

	states = rm.GetAllRecastStates()
	if len(states) != 2 {
		t.Fatalf("リキャスト状態数: got %d, want 2", len(states))
	}

	// インデックス順にソートされていることを確認
	if states[0].AgentIndex != 0 || states[1].AgentIndex != 2 {
		t.Error("リキャスト状態がエージェントインデックス順にソートされていません")
	}
}

// TestRecastOverwrite はリキャスト中に再度リキャストを開始した場合をテストします。
func TestRecastOverwrite(t *testing.T) {
	rm := NewRecastManager()

	// リキャスト開始
	rm.StartRecast(0, 5.0*time.Second)

	// 2秒経過
	rm.UpdateRecast(2.0 * time.Second)

	// リキャスト中に再度開始（上書き）
	rm.StartRecast(0, 3.0*time.Second)

	// 新しいリキャスト時間で上書きされる
	state := rm.GetRecastState(0)
	if state.TotalSeconds != 3.0 {
		t.Errorf("TotalSeconds: got %f, want 3.0", state.TotalSeconds)
	}
	if state.RemainingSeconds != 3.0 {
		t.Errorf("RemainingSeconds: got %f, want 3.0", state.RemainingSeconds)
	}
}

// TestInvalidAgentIndex は無効なエージェントインデックスをテストします。
func TestInvalidAgentIndex(t *testing.T) {
	rm := NewRecastManager()

	// 範囲外のインデックスでもpanicしない（マップに登録される）
	rm.StartRecast(-1, 5.0*time.Second)
	rm.StartRecast(100, 5.0*time.Second)

	// 範囲外のインデックスの状態取得（登録されているので取得可能）
	state := rm.GetRecastState(-1)
	if state == nil {
		t.Error("登録したインデックスの状態が取得できません")
	}

	// 登録された範囲外インデックスはリキャスト中なのでReadyではない
	if rm.IsAgentReady(-1) {
		t.Error("リキャスト中インデックスがReadyになっています")
	}
	if rm.IsAgentReady(100) {
		t.Error("リキャスト中インデックスがReadyになっています")
	}

	// 登録されていないインデックスはReadyとして扱う
	if !rm.IsAgentReady(50) {
		t.Error("未登録インデックスがReadyではありません")
	}
}

// TestZeroOrNegativeDuration はゼロまたは負の期間をテストします。
func TestZeroOrNegativeDuration(t *testing.T) {
	rm := NewRecastManager()

	// ゼロ秒のリキャスト
	rm.StartRecast(0, 0)
	if !rm.IsAgentReady(0) {
		t.Error("ゼロ秒リキャストでエージェントが使用不可です")
	}

	// 負の秒数のリキャスト
	rm.StartRecast(1, -1*time.Second)
	if !rm.IsAgentReady(1) {
		t.Error("負の秒数リキャストでエージェントが使用不可です")
	}
}

// TestGetProgress はリキャスト進捗取得をテストします。
func TestGetProgress(t *testing.T) {
	rm := NewRecastManager()

	// リキャスト開始
	rm.StartRecast(0, 4.0*time.Second)

	// 初期状態
	progress := rm.GetProgress(0)
	if progress != 0.0 {
		t.Errorf("初期プログレス: got %f, want 0.0", progress)
	}

	// 1秒経過（25%）
	rm.UpdateRecast(1.0 * time.Second)
	progress = rm.GetProgress(0)
	if progress != 0.25 {
		t.Errorf("1秒後プログレス: got %f, want 0.25", progress)
	}

	// 2秒経過（50%）
	rm.UpdateRecast(1.0 * time.Second)
	progress = rm.GetProgress(0)
	if progress != 0.5 {
		t.Errorf("2秒後プログレス: got %f, want 0.5", progress)
	}

	// リキャストしていないエージェント
	progress = rm.GetProgress(1)
	if progress != 1.0 {
		t.Errorf("リキャストなしエージェントのプログレス: got %f, want 1.0", progress)
	}
}

// TestCancelRecast はリキャストキャンセルをテストします。
func TestCancelRecast(t *testing.T) {
	rm := NewRecastManager()

	// リキャスト開始
	rm.StartRecast(0, 5.0*time.Second)

	// リキャスト中であることを確認
	if rm.IsAgentReady(0) {
		t.Error("リキャスト中なのに使用可能です")
	}

	// キャンセル
	rm.CancelRecast(0)

	// 使用可能になる
	if !rm.IsAgentReady(0) {
		t.Error("キャンセル後も使用不可です")
	}

	// 状態がクリアされている
	if rm.GetRecastState(0) != nil {
		t.Error("キャンセル後も状態が残っています")
	}
}
