// Package adapter はデータ変換ロジックを集約するアダプター層を提供します。
package adapter

import (
	"hirorocky/type-battle/internal/battle"
	"hirorocky/type-battle/internal/reward"
)

// RewardAdapter はバトル統計から報酬用統計への変換を担当するアダプターです。
// Requirements: 10.4
type RewardAdapter struct{}

// NewRewardAdapter は新しいRewardAdapterを作成します。
func NewRewardAdapter() *RewardAdapter {
	return &RewardAdapter{}
}

// ConvertBattleStatsToRewardStats はバトル統計を報酬用統計に変換します。
// nil入力に対しては空の統計を返します。
// Requirements: 10.4
func (a *RewardAdapter) ConvertBattleStatsToRewardStats(stats *battle.BattleStatistics) *reward.BattleStatistics {
	if stats == nil {
		return &reward.BattleStatistics{}
	}
	return &reward.BattleStatistics{
		TotalWPM:         stats.TotalWPM,
		TotalAccuracy:    stats.TotalAccuracy,
		TotalTypingCount: stats.TotalTypingCount,
		TotalDamageDealt: stats.TotalDamageDealt,
		TotalDamageTaken: stats.TotalDamageTaken,
		TotalHealAmount:  stats.TotalHealAmount,
	}
}

// ConvertBattleStatsToRewardStats はパッケージレベルで利用可能な変換関数です。
// 既存コードとの互換性のために提供されています。
// Requirements: 10.4
func ConvertBattleStatsToRewardStats(stats *battle.BattleStatistics) *reward.BattleStatistics {
	adapter := NewRewardAdapter()
	return adapter.ConvertBattleStatsToRewardStats(stats)
}
