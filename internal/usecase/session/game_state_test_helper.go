package session

import (
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/usecase/rewarding"
)

// NewGameStateForTest はテスト用の GameState を作成します。
// テスト用の最小限のマスタデータを提供します。
func NewGameStateForTest() *GameState {
	coreTypes := []domain.CoreType{
		{
			ID:             "all_rounder",
			Name:           "オールラウンダー",
			StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
			AllowedTags:    []string{"physical_low", "magic_low", "heal_low", "buff_low", "debuff_low"},
			PassiveSkillID: "test_skill",
			MinDropLevel:   1,
		},
	}
	moduleTypes := []rewarding.ModuleDropInfo{
		{
			ID:           "test_module",
			Name:         "テストモジュール",
			Category:     domain.PhysicalAttack,
			Tags:         []string{"physical_low"},
			BaseEffect:   10.0,
			StatRef:      "STR",
			Description:  "テスト用モジュール",
			MinDropLevel: 1,
		},
	}
	passiveSkills := map[string]domain.PassiveSkill{
		"test_skill": {
			ID:          "test_skill",
			Name:        "テストスキル",
			Description: "テスト用パッシブスキル",
		},
	}
	return NewGameState(coreTypes, moduleTypes, passiveSkills)
}
