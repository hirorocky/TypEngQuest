// Package voltage はボルテージ管理機能を提供します。
// 時間経過に基づいてボルテージを更新し、プレイヤーのダメージ乗算に使用します。
package voltage

import (
	"hirorocky/type-battle/internal/domain"
)

// VoltageMaxLimit はボルテージの上限値（999.9%）です。
const VoltageMaxLimit = 999.9

// VoltageInitial はボルテージの初期値（100%）です。
const VoltageInitial = 100.0

// VoltageManager はボルテージ更新を管理する構造体です。
// 時間経過に基づいて敵のボルテージを更新します。
type VoltageManager struct{}

// NewVoltageManager は新しいVoltageManagerを作成します。
func NewVoltageManager() *VoltageManager {
	return &VoltageManager{}
}

// Update はボルテージを時間経過で更新します。
// deltaSeconds: 前回更新からの経過秒数
// 10秒あたりの上昇量を経過時間で按分して加算します。
// ボルテージは999.9%を上限としてクランプされます。
func (m *VoltageManager) Update(enemy *domain.EnemyModel, deltaSeconds float64) {
	if enemy == nil {
		return
	}

	// 負の経過時間は無視
	if deltaSeconds <= 0 {
		return
	}

	// 10秒あたりの上昇量を取得
	risePer10s := enemy.Type.GetVoltageRisePer10s()
	if risePer10s <= 0 {
		return
	}

	// 経過時間に応じたボルテージ上昇量を計算
	// 上昇量 = (10秒あたりの上昇量 / 10) * 経過秒数
	riseAmount := risePer10s / 10.0 * deltaSeconds

	// 新しいボルテージを計算
	newVoltage := enemy.GetVoltage() + riseAmount

	// 上限クランプ
	if newVoltage > VoltageMaxLimit {
		newVoltage = VoltageMaxLimit
	}

	enemy.SetVoltage(newVoltage)
}

// Reset はボルテージを100%にリセットします。
func (m *VoltageManager) Reset(enemy *domain.EnemyModel) {
	if enemy == nil {
		return
	}

	enemy.SetVoltage(VoltageInitial)
}
