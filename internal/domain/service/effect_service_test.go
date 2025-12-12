package service

import (
	"testing"

	"hirorocky/type-battle/internal/domain"
)

// TestCalculateEffect_Empty は空のEffectTableでの計算をテストします。
func TestCalculateEffect_Empty(t *testing.T) {
	table := domain.NewEffectTable()
	baseStats := domain.Stats{STR: 100, MAG: 100, SPD: 100, LUK: 100}

	result := Calculate(table, baseStats)

	// 効果がない場合は基礎ステータスをそのまま返す
	if result.STR != 100 {
		t.Errorf("STR expected 100, got %d", result.STR)
	}
	if result.MAG != 100 {
		t.Errorf("MAG expected 100, got %d", result.MAG)
	}
	if result.SPD != 100 {
		t.Errorf("SPD expected 100, got %d", result.SPD)
	}
	if result.LUK != 100 {
		t.Errorf("LUK expected 100, got %d", result.LUK)
	}
}

// TestCalculateEffect_WithAddition は加算効果をテストします。
func TestCalculateEffect_WithAddition(t *testing.T) {
	table := domain.NewEffectTable()
	table.AddRow(domain.EffectRow{
		ID:         "buff1",
		SourceType: domain.SourceBuff,
		Name:       "パワーアップ",
		Modifiers: domain.StatModifiers{
			STR_Add: 50,
			MAG_Add: 30,
		},
	})

	baseStats := domain.Stats{STR: 100, MAG: 100, SPD: 100, LUK: 100}
	result := Calculate(table, baseStats)

	// (100 + 50) × 1.0 = 150
	if result.STR != 150 {
		t.Errorf("STR expected 150, got %d", result.STR)
	}
	// (100 + 30) × 1.0 = 130
	if result.MAG != 130 {
		t.Errorf("MAG expected 130, got %d", result.MAG)
	}
}

// TestCalculateEffect_WithMultiplier は乗算効果をテストします。
func TestCalculateEffect_WithMultiplier(t *testing.T) {
	table := domain.NewEffectTable()
	table.AddRow(domain.EffectRow{
		ID:         "buff2",
		SourceType: domain.SourceBuff,
		Name:       "強化バフ",
		Modifiers: domain.StatModifiers{
			STR_Mult: 1.5, // 50%増加
			SPD_Mult: 0.5, // 50%減少
		},
	})

	baseStats := domain.Stats{STR: 100, MAG: 100, SPD: 100, LUK: 100}
	result := Calculate(table, baseStats)

	// 100 × 1.5 = 150
	if result.STR != 150 {
		t.Errorf("STR expected 150, got %d", result.STR)
	}
	// 100 × 0.5 = 50
	if result.SPD != 50 {
		t.Errorf("SPD expected 50, got %d", result.SPD)
	}
}

// TestCalculateEffect_CombineAddAndMult は加算と乗算の組み合わせをテストします。
func TestCalculateEffect_CombineAddAndMult(t *testing.T) {
	table := domain.NewEffectTable()
	table.AddRow(domain.EffectRow{
		ID:         "buff3",
		SourceType: domain.SourceBuff,
		Name:       "複合バフ",
		Modifiers: domain.StatModifiers{
			STR_Add:  50,  // +50加算
			STR_Mult: 1.5, // ×1.5乗算
		},
	})

	baseStats := domain.Stats{STR: 100, MAG: 100, SPD: 100, LUK: 100}
	result := Calculate(table, baseStats)

	// (100 + 50) × 1.5 = 225
	if result.STR != 225 {
		t.Errorf("STR expected 225, got %d", result.STR)
	}
}

// TestCalculateEffect_SpecialEffects は特殊効果をテストします。
func TestCalculateEffect_SpecialEffects(t *testing.T) {
	table := domain.NewEffectTable()
	table.AddRow(domain.EffectRow{
		ID:         "special1",
		SourceType: domain.SourceModule,
		Name:       "特殊効果",
		Modifiers: domain.StatModifiers{
			CDReduction:   0.1,  // クールダウン10%短縮
			CritRate:      0.05, // クリティカル率5%増加
			PhysicalEvade: 0.15, // 物理回避15%
		},
	})

	baseStats := domain.Stats{STR: 100, MAG: 100, SPD: 100, LUK: 100}
	result := Calculate(table, baseStats)

	if result.CDReduction != 0.1 {
		t.Errorf("CDReduction expected 0.1, got %f", result.CDReduction)
	}
	if result.CritRate != 0.05 {
		t.Errorf("CritRate expected 0.05, got %f", result.CritRate)
	}
	if result.PhysicalEvade != 0.15 {
		t.Errorf("PhysicalEvade expected 0.15, got %f", result.PhysicalEvade)
	}
}

// TestUpdateDurations_Basic は時限効果の更新をテストします。
func TestUpdateDurations_Basic(t *testing.T) {
	duration := 5.0
	table := domain.NewEffectTable()
	table.AddRow(domain.EffectRow{
		ID:         "timed1",
		SourceType: domain.SourceBuff,
		Name:       "時限バフ",
		Duration:   &duration,
	})

	// 2秒経過
	UpdateDurations(table, 2.0)

	if len(table.Rows) != 1 {
		t.Fatalf("Expected 1 row, got %d", len(table.Rows))
	}
	if *table.Rows[0].Duration != 3.0 {
		t.Errorf("Duration expected 3.0, got %f", *table.Rows[0].Duration)
	}
}

// TestUpdateDurations_Expire は期限切れ削除をテストします。
func TestUpdateDurations_Expire(t *testing.T) {
	duration := 2.0
	table := domain.NewEffectTable()
	table.AddRow(domain.EffectRow{
		ID:         "expire1",
		SourceType: domain.SourceBuff,
		Name:       "すぐ切れるバフ",
		Duration:   &duration,
	})
	// 永続効果も追加
	table.AddRow(domain.EffectRow{
		ID:         "permanent",
		SourceType: domain.SourceCore,
		Name:       "永続効果",
		Duration:   nil,
	})

	// 3秒経過（時限効果は期限切れ）
	UpdateDurations(table, 3.0)

	// 永続効果のみ残る
	if len(table.Rows) != 1 {
		t.Errorf("Expected 1 row, got %d", len(table.Rows))
	}
	if table.Rows[0].ID != "permanent" {
		t.Errorf("Expected permanent effect, got %s", table.Rows[0].ID)
	}
}

// TestUpdateDurations_PermanentUnaffected は永続効果が影響を受けないことをテストします。
func TestUpdateDurations_PermanentUnaffected(t *testing.T) {
	table := domain.NewEffectTable()
	table.AddRow(domain.EffectRow{
		ID:         "core1",
		SourceType: domain.SourceCore,
		Name:       "コア効果",
		Duration:   nil, // 永続
	})

	// 大量の時間経過
	UpdateDurations(table, 1000.0)

	// 永続効果は残る
	if len(table.Rows) != 1 {
		t.Errorf("Expected 1 row, got %d", len(table.Rows))
	}
}

// TestCalculate_NilTable はnilテーブルでの計算をテストします。
func TestCalculate_NilTable(t *testing.T) {
	baseStats := domain.Stats{STR: 100, MAG: 100, SPD: 100, LUK: 100}
	result := Calculate(nil, baseStats)

	// nilの場合は基礎ステータスをそのまま返す
	if result.STR != 100 {
		t.Errorf("STR expected 100, got %d", result.STR)
	}
}
