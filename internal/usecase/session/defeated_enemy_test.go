// Package session は撃破済み敵情報管理のテストを提供します。
package session

import (
	"testing"
)

// TestDefeatedEnemiesInitialState は撃破済み敵情報の初期状態をテストします。
func TestDefeatedEnemiesInitialState(t *testing.T) {
	gs := NewGameState(nil, nil, nil)

	defeated := gs.GetDefeatedEnemies()

	if len(defeated) != 0 {
		t.Errorf("初期状態で撃破済み敵が存在します: got %d, want 0", len(defeated))
	}
}

// TestRecordEnemyDefeat は敵撃破記録をテストします。
func TestRecordEnemyDefeat(t *testing.T) {
	gs := NewGameState(nil, nil, nil)

	// 敵を撃破
	gs.RecordEnemyDefeat("slime", 1)

	defeated := gs.GetDefeatedEnemies()

	if level, ok := defeated["slime"]; !ok {
		t.Error("撃破した敵が記録されていません")
	} else if level != 1 {
		t.Errorf("撃破レベルが不正です: got %d, want 1", level)
	}
}

// TestRecordEnemyDefeatHigherLevel は高レベル撃破で最高レベルが更新されることをテストします。
func TestRecordEnemyDefeatHigherLevel(t *testing.T) {
	gs := NewGameState(nil, nil, nil)

	// レベル1で撃破
	gs.RecordEnemyDefeat("slime", 1)
	// レベル5で撃破
	gs.RecordEnemyDefeat("slime", 5)

	defeated := gs.GetDefeatedEnemies()

	if level := defeated["slime"]; level != 5 {
		t.Errorf("最高レベルが更新されていません: got %d, want 5", level)
	}
}

// TestRecordEnemyDefeatLowerLevel は低レベル撃破で最高レベルが維持されることをテストします。
func TestRecordEnemyDefeatLowerLevel(t *testing.T) {
	gs := NewGameState(nil, nil, nil)

	// レベル5で撃破
	gs.RecordEnemyDefeat("slime", 5)
	// レベル3で撃破
	gs.RecordEnemyDefeat("slime", 3)

	defeated := gs.GetDefeatedEnemies()

	if level := defeated["slime"]; level != 5 {
		t.Errorf("最高レベルが低下しています: got %d, want 5", level)
	}
}

// TestRecordMultipleEnemyTypes は複数の敵タイプの撃破記録をテストします。
func TestRecordMultipleEnemyTypes(t *testing.T) {
	gs := NewGameState(nil, nil, nil)

	gs.RecordEnemyDefeat("slime", 1)
	gs.RecordEnemyDefeat("goblin", 3)
	gs.RecordEnemyDefeat("dragon", 10)

	defeated := gs.GetDefeatedEnemies()

	if len(defeated) != 3 {
		t.Errorf("撃破敵数が不正です: got %d, want 3", len(defeated))
	}

	tests := []struct {
		enemyID string
		level   int
	}{
		{"slime", 1},
		{"goblin", 3},
		{"dragon", 10},
	}

	for _, tt := range tests {
		if level, ok := defeated[tt.enemyID]; !ok {
			t.Errorf("敵%sが記録されていません", tt.enemyID)
		} else if level != tt.level {
			t.Errorf("敵%sのレベルが不正です: got %d, want %d", tt.enemyID, level, tt.level)
		}
	}
}

// TestIsEnemyDefeated は敵が撃破済みかどうかの判定をテストします。
func TestIsEnemyDefeated(t *testing.T) {
	gs := NewGameState(nil, nil, nil)

	gs.RecordEnemyDefeat("slime", 1)

	if !gs.IsEnemyDefeated("slime") {
		t.Error("撃破済み敵がfalseを返しています")
	}

	if gs.IsEnemyDefeated("goblin") {
		t.Error("未撃破敵がtrueを返しています")
	}
}

// TestGetDefeatedLevel は撃破レベル取得をテストします。
func TestGetDefeatedLevel(t *testing.T) {
	gs := NewGameState(nil, nil, nil)

	gs.RecordEnemyDefeat("slime", 5)

	level := gs.GetDefeatedLevel("slime")
	if level != 5 {
		t.Errorf("撃破レベルが不正です: got %d, want 5", level)
	}

	// 未撃破敵は0を返す
	level = gs.GetDefeatedLevel("goblin")
	if level != 0 {
		t.Errorf("未撃破敵のレベルが0でありません: got %d, want 0", level)
	}
}
