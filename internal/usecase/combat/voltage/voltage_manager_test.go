// Package voltage はボルテージ管理機能を提供します。
// 時間経過に基づいてボルテージを更新し、プレイヤーのダメージ乗算に使用します。
package voltage

import (
	"testing"

	"hirorocky/type-battle/internal/domain"
)

// TestVoltageManager_Update_NormalRise は通常のボルテージ上昇をテストします。
func TestVoltageManager_Update_NormalRise(t *testing.T) {
	// 10秒で20ポイント上昇する設定
	enemyType := domain.EnemyType{
		ID:                "test_enemy",
		VoltageRisePer10s: 20.0,
	}
	enemy := domain.NewEnemy("1", "テスト敵", 1, 100, 10, enemyType)

	manager := NewVoltageManager()

	// 5秒経過で10ポイント上昇（20 / 10 * 5 = 10）
	manager.Update(enemy, 5.0)
	expectedVoltage := 110.0

	if enemy.GetVoltage() != expectedVoltage {
		t.Errorf("expected voltage %.1f, got %.1f", expectedVoltage, enemy.GetVoltage())
	}
}

// TestVoltageManager_Update_10SecondsRise は10秒経過時のボルテージ上昇をテストします。
func TestVoltageManager_Update_10SecondsRise(t *testing.T) {
	enemyType := domain.EnemyType{
		ID:                "test_enemy",
		VoltageRisePer10s: 15.0,
	}
	enemy := domain.NewEnemy("1", "テスト敵", 1, 100, 10, enemyType)

	manager := NewVoltageManager()

	// 10秒経過で15ポイント上昇
	manager.Update(enemy, 10.0)
	expectedVoltage := 115.0

	if enemy.GetVoltage() != expectedVoltage {
		t.Errorf("expected voltage %.1f, got %.1f", expectedVoltage, enemy.GetVoltage())
	}
}

// TestVoltageManager_Update_ZeroRiseRate はボルテージ上昇率0の場合をテストします。
func TestVoltageManager_Update_ZeroRiseRate(t *testing.T) {
	enemyType := domain.EnemyType{
		ID:                "test_enemy",
		VoltageRisePer10s: 0.0,
	}
	enemy := domain.NewEnemy("1", "テスト敵", 1, 100, 10, enemyType)

	manager := NewVoltageManager()

	// 10秒経過してもボルテージは上昇しない
	manager.Update(enemy, 10.0)
	expectedVoltage := 100.0

	if enemy.GetVoltage() != expectedVoltage {
		t.Errorf("expected voltage %.1f, got %.1f", expectedVoltage, enemy.GetVoltage())
	}
}

// TestVoltageManager_Update_Clamp999 は上限999.9%のクランプをテストします。
func TestVoltageManager_Update_Clamp999(t *testing.T) {
	// 10秒で1000ポイント上昇（上限を超える設定）
	enemyType := domain.EnemyType{
		ID:                "test_enemy",
		VoltageRisePer10s: 1000.0,
	}
	enemy := domain.NewEnemy("1", "テスト敵", 1, 100, 10, enemyType)

	manager := NewVoltageManager()

	// 10秒経過で1000ポイント上昇するはずだが、999.9%で止まる
	manager.Update(enemy, 10.0)
	expectedVoltage := 999.9

	if enemy.GetVoltage() != expectedVoltage {
		t.Errorf("expected voltage %.1f, got %.1f", expectedVoltage, enemy.GetVoltage())
	}
}

// TestVoltageManager_Update_AlreadyAtMax は既に上限の場合をテストします。
func TestVoltageManager_Update_AlreadyAtMax(t *testing.T) {
	enemyType := domain.EnemyType{
		ID:                "test_enemy",
		VoltageRisePer10s: 50.0,
	}
	enemy := domain.NewEnemy("1", "テスト敵", 1, 100, 10, enemyType)
	enemy.SetVoltage(999.9)

	manager := NewVoltageManager()

	// 更新しても999.9のまま
	manager.Update(enemy, 10.0)
	expectedVoltage := 999.9

	if enemy.GetVoltage() != expectedVoltage {
		t.Errorf("expected voltage %.1f, got %.1f", expectedVoltage, enemy.GetVoltage())
	}
}

// TestVoltageManager_Update_NegativeDelta は負のdeltaSecondsの場合をテストします。
func TestVoltageManager_Update_NegativeDelta(t *testing.T) {
	enemyType := domain.EnemyType{
		ID:                "test_enemy",
		VoltageRisePer10s: 20.0,
	}
	enemy := domain.NewEnemy("1", "テスト敵", 1, 100, 10, enemyType)

	manager := NewVoltageManager()

	// 負のdeltaでは更新されない
	manager.Update(enemy, -5.0)
	expectedVoltage := 100.0

	if enemy.GetVoltage() != expectedVoltage {
		t.Errorf("expected voltage %.1f, got %.1f", expectedVoltage, enemy.GetVoltage())
	}
}

// TestVoltageManager_Update_SmallDelta は小さなdeltaSecondsの場合をテストします。
func TestVoltageManager_Update_SmallDelta(t *testing.T) {
	// 10秒で10ポイント上昇する設定（デフォルト相当）
	enemyType := domain.EnemyType{
		ID:                "test_enemy",
		VoltageRisePer10s: 10.0,
	}
	enemy := domain.NewEnemy("1", "テスト敵", 1, 100, 10, enemyType)

	manager := NewVoltageManager()

	// 0.1秒経過で0.1ポイント上昇（10 / 10 * 0.1 = 0.1）
	manager.Update(enemy, 0.1)
	expectedVoltage := 100.1

	if enemy.GetVoltage() != expectedVoltage {
		t.Errorf("expected voltage %.1f, got %.1f", expectedVoltage, enemy.GetVoltage())
	}
}

// TestVoltageManager_Reset はResetメソッドをテストします。
func TestVoltageManager_Reset(t *testing.T) {
	enemyType := domain.EnemyType{
		ID:                "test_enemy",
		VoltageRisePer10s: 20.0,
	}
	enemy := domain.NewEnemy("1", "テスト敵", 1, 100, 10, enemyType)
	enemy.SetVoltage(150.0)

	manager := NewVoltageManager()

	manager.Reset(enemy)
	expectedVoltage := 100.0

	if enemy.GetVoltage() != expectedVoltage {
		t.Errorf("expected voltage %.1f, got %.1f", expectedVoltage, enemy.GetVoltage())
	}
}

// TestVoltageManager_Reset_FromHigh は高いボルテージからのリセットをテストします。
func TestVoltageManager_Reset_FromHigh(t *testing.T) {
	enemyType := domain.EnemyType{
		ID:                "test_enemy",
		VoltageRisePer10s: 20.0,
	}
	enemy := domain.NewEnemy("1", "テスト敵", 1, 100, 10, enemyType)
	enemy.SetVoltage(500.0)

	manager := NewVoltageManager()

	manager.Reset(enemy)
	expectedVoltage := 100.0

	if enemy.GetVoltage() != expectedVoltage {
		t.Errorf("expected voltage %.1f, got %.1f", expectedVoltage, enemy.GetVoltage())
	}
}

// TestVoltageManager_Update_NilEnemy はnilの敵に対するUpdateをテストします。
func TestVoltageManager_Update_NilEnemy(t *testing.T) {
	manager := NewVoltageManager()

	// panicしないことを確認
	manager.Update(nil, 1.0)
}

// TestVoltageManager_Reset_NilEnemy はnilの敵に対するResetをテストします。
func TestVoltageManager_Reset_NilEnemy(t *testing.T) {
	manager := NewVoltageManager()

	// panicしないことを確認
	manager.Reset(nil)
}
