package service

import "hirorocky/type-battle/internal/domain"

// CalculateMaxHP は装備中エージェントのコアレベル平均からMaxHPを計算します。
// 計算式: レベル平均 × HP係数(10) + 基礎HP(100)
// エージェントが装備されていない場合は基礎HPを返します。
func CalculateMaxHP(agents []*domain.AgentModel) int {
	if len(agents) == 0 {
		return domain.BaseHP
	}

	totalLevel := 0
	for _, agent := range agents {
		totalLevel += agent.Level
	}

	// 平均レベル × HP係数 + 基礎HP
	avgLevel := float64(totalLevel) / float64(len(agents))
	return int(avgLevel*domain.HPCoefficient) + domain.BaseHP
}
