package service

import "hirorocky/type-battle/internal/domain"

// Calculate は基礎ステータスに効果を適用して最終ステータスを計算します。
// 計算順序: 加算 → 乗算
// tableがnilの場合は基礎ステータスをそのまま返します。
func Calculate(table *domain.EffectTable, baseStats domain.Stats) domain.FinalStats {
	if table == nil || len(table.Rows) == 0 {
		return domain.FinalStats{
			STR: baseStats.STR,
			MAG: baseStats.MAG,
			SPD: baseStats.SPD,
			LUK: baseStats.LUK,
		}
	}

	// 加算値の集計
	var addSTR, addMAG, addSPD, addLUK int
	// 乗算値の集計（初期値1.0）
	multSTR, multMAG, multSPD, multLUK := 1.0, 1.0, 1.0, 1.0
	// 特殊効果の集計
	var cdReduction, typingTimeExt, dmgReduction float64
	var critRate, physEvade, magEvade float64

	for _, row := range table.Rows {
		m := row.Modifiers

		// 加算値を集計
		addSTR += m.STR_Add
		addMAG += m.MAG_Add
		addSPD += m.SPD_Add
		addLUK += m.LUK_Add

		// 乗算値を集計（0.0は1.0として扱う）
		if m.STR_Mult != 0 {
			multSTR *= m.STR_Mult
		}
		if m.MAG_Mult != 0 {
			multMAG *= m.MAG_Mult
		}
		if m.SPD_Mult != 0 {
			multSPD *= m.SPD_Mult
		}
		if m.LUK_Mult != 0 {
			multLUK *= m.LUK_Mult
		}

		// 特殊効果を集計（加算）
		cdReduction += m.CDReduction
		typingTimeExt += m.TypingTimeExt
		dmgReduction += m.DamageReduction
		critRate += m.CritRate
		physEvade += m.PhysicalEvade
		magEvade += m.MagicEvade
	}

	// 最終ステータス計算: (基礎 + 加算) × 乗算
	return domain.FinalStats{
		STR: int(float64(baseStats.STR+addSTR) * multSTR),
		MAG: int(float64(baseStats.MAG+addMAG) * multMAG),
		SPD: int(float64(baseStats.SPD+addSPD) * multSPD),
		LUK: int(float64(baseStats.LUK+addLUK) * multLUK),

		CDReduction:     cdReduction,
		TypingTimeExt:   typingTimeExt,
		DamageReduction: dmgReduction,
		CritRate:        critRate,
		PhysicalEvade:   physEvade,
		MagicEvade:      magEvade,
	}
}

// UpdateDurations は時限効果の残り時間を更新します。
// 毎ティック呼び出され、残り時間が0以下になった行は自動削除されます。
func UpdateDurations(table *domain.EffectTable, deltaSeconds float64) {
	if table == nil {
		return
	}

	for i := range table.Rows {
		if table.Rows[i].Duration != nil {
			*table.Rows[i].Duration -= deltaSeconds
		}
	}
	// 期限切れの行を削除
	table.Rows = filterExpired(table.Rows)
}

// filterExpired は期限切れでない行のみを返すヘルパー関数です。
func filterExpired(rows []domain.EffectRow) []domain.EffectRow {
	newRows := make([]domain.EffectRow, 0, len(rows))
	for _, row := range rows {
		// 永続効果（Duration == nil）または残り時間がある行を保持
		if row.Duration == nil || *row.Duration > 0 {
			newRows = append(newRows, row)
		}
	}
	return newRows
}
