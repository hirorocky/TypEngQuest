// Package battle はバトルエンジンを提供します。
// バトル初期化、敵攻撃、モジュール効果、勝敗判定を担当します。

package combat

import (
	"fmt"
	"math/rand"
	"time"

	"hirorocky/type-battle/internal/config"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/usecase/typing"

	"github.com/google/uuid"
)

// AccuracyPenaltyThreshold は効果半減の正確性閾値です。

// config.AccuracyPenaltyThresholdを参照するためのエイリアス
const AccuracyPenaltyThreshold = config.AccuracyPenaltyThreshold

// calculateDamage はダメージを計算します（最低1ダメージ保証）。
func calculateDamage(baseDamage int, damageReduction float64) int {
	damage := int(float64(baseDamage) * (1.0 - damageReduction))
	if damage < 1 {
		damage = 1
	}
	return damage
}

// 敵自己バフタイプ
type EnemyBuffType int

const (
	// EnemyBuffAttackUp は攻撃力UP

	EnemyBuffAttackUp EnemyBuffType = iota

	// EnemyBuffPhysicalDamageDown は物理ダメージ軽減

	EnemyBuffPhysicalDamageDown

	// EnemyBuffMagicDamageDown は魔法ダメージ軽減

	EnemyBuffMagicDamageDown
)

// プレイヤーデバフタイプ
type PlayerDebuffType int

const (
	// PlayerDebuffTypingTimeDown はタイピング制限時間短縮

	PlayerDebuffTypingTimeDown PlayerDebuffType = iota

	// PlayerDebuffTextShuffle はテキストシャッフル

	PlayerDebuffTextShuffle

	// PlayerDebuffDifficultyUp は難易度上昇

	PlayerDebuffDifficultyUp

	// PlayerDebuffCooldownExtend はクールダウン延長

	PlayerDebuffCooldownExtend
)

// EnemyActionType は敵の行動タイプを表します。

type EnemyActionType int

const (
	// EnemyActionAttack は攻撃行動
	EnemyActionAttack EnemyActionType = iota

	// EnemyActionSelfBuff は自己バフ行動
	EnemyActionSelfBuff

	// EnemyActionDebuff はプレイヤーへのデバフ行動
	EnemyActionDebuff

	// EnemyActionDefense はディフェンス行動
	EnemyActionDefense
)

// NextEnemyAction は敵の次回行動を表します。

type NextEnemyAction struct {
	// ActionType は行動タイプ（攻撃/自己バフ/デバフ/ディフェンス）
	ActionType EnemyActionType

	// AttackType は攻撃属性（"physical" or "magic"）（攻撃時のみ有効）
	AttackType string

	// BuffType は自己バフの種類（自己バフ時のみ有効）
	BuffType EnemyBuffType

	// DebuffType はデバフの種類（デバフ時のみ有効）
	DebuffType PlayerDebuffType

	// ExpectedValue は予測ダメージまたは効果量
	ExpectedValue int

	// SourceAction はパターンベース行動のソース（nilの場合はランダム行動）
	SourceAction *domain.EnemyAction

	// ChargeTimeMs はチャージタイム（ミリ秒）
	ChargeTimeMs int

	// DefenseType はディフェンス種別（ディフェンス時のみ有効）
	DefenseType domain.EnemyDefenseType

	// DefenseValue は軽減率/回避率（ディフェンス時のみ有効）
	DefenseValue float64

	// DefenseDurationMs はディフェンス持続時間（ミリ秒）
	DefenseDurationMs int
}

// BattleStatistics はバトル統計を表す構造体です。
type BattleStatistics struct {
	// TotalTypingCount は総タイピング回数です。
	TotalTypingCount int

	// TotalWPM はWPMの合計値です。
	TotalWPM float64

	// TotalAccuracy は正確性の合計値です。
	TotalAccuracy float64

	// StartTime はバトル開始時刻です。
	StartTime time.Time

	// TotalDamageDealt は与えた総ダメージです。
	TotalDamageDealt int

	// TotalDamageTaken は受けた総ダメージです。
	TotalDamageTaken int

	// TotalHealAmount は総回復量です。
	TotalHealAmount int
}

// GetAverageWPM は平均WPMを返します。
func (s *BattleStatistics) GetAverageWPM() float64 {
	if s.TotalTypingCount == 0 {
		return 0
	}
	return s.TotalWPM / float64(s.TotalTypingCount)
}

// GetAverageAccuracy は平均正確性を返します。
func (s *BattleStatistics) GetAverageAccuracy() float64 {
	if s.TotalTypingCount == 0 {
		return 0
	}
	return s.TotalAccuracy / float64(s.TotalTypingCount)
}

// GetClearTime はクリア時間を返します。
func (s *BattleStatistics) GetClearTime() time.Duration {
	return time.Since(s.StartTime)
}

// BattleState はバトルの状態を表す構造体です。
type BattleState struct {
	// Enemy は敵の状態です。
	Enemy *domain.EnemyModel

	// Player はプレイヤーの状態です。
	Player *domain.PlayerModel

	// EquippedAgents は装備中のエージェントです。
	EquippedAgents []*domain.AgentModel

	// Level はバトルレベルです。
	Level int

	// Stats はバトル統計です。
	Stats *BattleStatistics

	// NextAttackTime は敵の次回攻撃時刻です。
	NextAttackTime time.Time

	// NextAction は敵の次回行動です。

	NextAction NextEnemyAction

	// LastAttackType は直前の攻撃属性です。
	LastAttackType string

	// SameAttackCount は同じ属性の攻撃の連続回数です。
	SameAttackCount int
}

// BattleResult はバトル結果を表す構造体です。
type BattleResult struct {
	// IsVictory は勝利かどうかです。
	IsVictory bool

	// Stats はバトル統計です。
	Stats *BattleStatistics
}

// BattleEngine はバトルロジックを担当する構造体です。
type BattleEngine struct {
	// enemyTypes は敵タイプの定義リストです。
	enemyTypes []domain.EnemyType

	// passiveSkills はパッシブスキル定義のマップです。
	passiveSkills map[string]domain.PassiveSkill

	// rng は乱数生成器です。
	rng *rand.Rand
}

// NewBattleEngine は新しいBattleEngineを作成します。
func NewBattleEngine(enemyTypes []domain.EnemyType) *BattleEngine {
	return &BattleEngine{
		enemyTypes: enemyTypes,
		rng:        rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// SetPassiveSkills はパッシブスキル定義を設定します。
// これにより、RegisterPassiveSkills で条件付きパッシブスキルが EffectTable に登録されます。
func (e *BattleEngine) SetPassiveSkills(skills map[string]domain.PassiveSkill) {
	e.passiveSkills = skills
}

// SetRng は乱数生成器を設定します（テスト用）。
func (e *BattleEngine) SetRng(rng *rand.Rand) {
	e.rng = rng
}

// ==================== バトル初期化（Task 7.1） ====================

// InitializeBattle はバトルを初期化します。

func (e *BattleEngine) InitializeBattle(level int, agents []*domain.AgentModel) (*BattleState, error) {
	if len(agents) == 0 {
		return nil, fmt.Errorf("エージェントが装備されていません")
	}

	// 敵を生成
	enemy := e.generateEnemy(level)
	if enemy == nil {
		return nil, fmt.Errorf("敵の生成に失敗しました")
	}

	// プレイヤーを初期化
	player := domain.NewPlayer()
	player.RecalculateHP(agents)
	player.PrepareForBattle() // HP全回復、EffectTableリセット

	// バトル状態を作成
	state := &BattleState{
		Enemy:          enemy,
		Player:         player,
		EquippedAgents: agents,
		Level:          level,
		Stats: &BattleStatistics{
			StartTime: time.Now(),
		},
		NextAttackTime: time.Now().Add(enemy.AttackInterval),
	}

	state.NextAction = e.DetermineNextAction(state)

	return state, nil
}

// generateEnemy は指定レベルの敵を生成します。

func (e *BattleEngine) generateEnemy(level int) *domain.EnemyModel {
	if len(e.enemyTypes) == 0 {
		return nil
	}

	// ランダムに敵タイプを選択

	enemyType := e.enemyTypes[e.rng.Intn(len(e.enemyTypes))]

	// レベルに応じてステータスを計算

	hp := enemyType.BaseHP * level
	attackPower := enemyType.BaseAttackPower + (level * 2)

	// 高レベルほど短い攻撃間隔（ただし最低500ms）

	intervalReduction := time.Duration(level*50) * time.Millisecond
	attackInterval := enemyType.BaseAttackInterval - intervalReduction
	if attackInterval < config.MinEnemyAttackInterval {
		attackInterval = config.MinEnemyAttackInterval
	}

	return domain.NewEnemy(
		uuid.New().String(),
		fmt.Sprintf("%s Lv.%d", enemyType.Name, level),
		level,
		hp,
		attackPower,
		attackInterval,
		enemyType,
	)
}

// ==================== 敵攻撃システム（Task 7.2） ====================

// ProcessEnemyAttack は敵の攻撃を処理します。
// 回避、反射、ダメージカットなどの効果を適用します。
func (e *BattleEngine) ProcessEnemyAttack(state *BattleState) int {
	// 敵の攻撃力を取得
	attackPower := state.Enemy.AttackPower

	// プレイヤーの防御効果を計算（新しい効果システム）
	ctx := domain.NewEffectContext(state.Player.HP, state.Player.MaxHP, state.Enemy.HP, state.Enemy.MaxHP)
	effects := state.Player.EffectTable.Aggregate(ctx)

	// 回避判定
	if effects.Evasion > 0 && e.rng.Float64() < effects.Evasion {
		// 回避成功 - ダメージなし
		state.NextAttackTime = time.Now().Add(state.Enemy.AttackInterval)
		return 0
	}

	// ダメージ計算（軽減率を適用）
	damage := calculateDamage(attackPower, effects.DamageCut)

	// プレイヤーにダメージを与える
	state.Player.TakeDamage(damage)
	state.Stats.TotalDamageTaken += damage

	// 反射処理
	if effects.Reflect > 0 && damage > 0 {
		reflectDamage := int(float64(damage) * effects.Reflect)
		if reflectDamage > 0 {
			state.Enemy.TakeDamage(reflectDamage)
			state.Stats.TotalDamageDealt += reflectDamage
		}
	}

	// 次回攻撃時刻を更新
	state.NextAttackTime = time.Now().Add(state.Enemy.AttackInterval)

	return damage
}

// ProcessEnemyAttackWithPassive は被ダメージ時パッシブを考慮して敵の攻撃を処理します。
// ps_last_stand（ダメージ固定）、ps_counter_charge（次攻撃バフ）などを評価します。
func (e *BattleEngine) ProcessEnemyAttackWithPassive(state *BattleState) int {
	// 敵の攻撃力を取得
	attackPower := state.Enemy.AttackPower

	// プレイヤーの防御効果を計算
	ctx := domain.NewEffectContext(state.Player.HP, state.Player.MaxHP, state.Enemy.HP, state.Enemy.MaxHP)
	ctx.SetEvent(domain.EventOnDamageRecv)
	effects := state.Player.EffectTable.Aggregate(ctx)

	// 回避判定
	if effects.Evasion > 0 && e.rng.Float64() < effects.Evasion {
		state.NextAttackTime = time.Now().Add(state.Enemy.AttackInterval)
		return 0
	}

	// ダメージ計算（軽減率を適用）
	damage := calculateDamage(attackPower, effects.DamageCut)

	// 被ダメージ時パッシブの評価
	damage = e.evaluateDamageRecvPassives(state, damage)

	// プレイヤーにダメージを与える
	state.Player.TakeDamage(damage)
	state.Stats.TotalDamageTaken += damage

	// 反射処理
	if effects.Reflect > 0 && damage > 0 {
		reflectDamage := int(float64(damage) * effects.Reflect)
		if reflectDamage > 0 {
			state.Enemy.TakeDamage(reflectDamage)
			state.Stats.TotalDamageDealt += reflectDamage
		}
	}

	// 被ダメージ後のパッシブ効果（バフ付与など）
	e.applyPostDamagePassives(state)

	// 次回攻撃時刻を更新
	state.NextAttackTime = time.Now().Add(state.Enemy.AttackInterval)

	return damage
}

// evaluateDamageRecvPassives は被ダメージ時のパッシブ効果を評価します。
// ps_last_stand（ダメージ固定）などを処理します。
func (e *BattleEngine) evaluateDamageRecvPassives(state *BattleState, damage int) int {
	for _, agent := range state.EquippedAgents {
		passiveID := agent.Core.PassiveSkill.ID
		if def, ok := e.passiveSkills[passiveID]; ok {
			// ps_last_stand: HP条件 + 確率でダメージ固定
			if def.ID == "ps_last_stand" {
				// HP条件チェック
				hpPercent := float64(state.Player.HP) / float64(state.Player.MaxHP)
				threshold := def.TriggerCondition.Value / 100.0
				if hpPercent <= threshold {
					// 確率判定
					if e.rng.Float64() < def.Probability {
						return int(def.EffectValue) // ダメージを固定値に
					}
				}
			}
		}
	}
	return damage
}

// applyPostDamagePassives は被ダメージ後のパッシブ効果を適用します。
// ps_counter_charge（次攻撃バフ）などを処理します。
func (e *BattleEngine) applyPostDamagePassives(state *BattleState) {
	for _, agent := range state.EquippedAgents {
		passiveID := agent.Core.PassiveSkill.ID
		if def, ok := e.passiveSkills[passiveID]; ok {
			// ps_counter_charge: 被ダメージ時に確率で次攻撃バフ
			if def.ID == "ps_counter_charge" {
				// 確率判定
				if e.rng.Float64() < def.Probability {
					// 次攻撃2倍バフを付与（5秒間）
					duration := 5.0
					state.Player.EffectTable.AddBuff(
						"カウンターチャージ",
						duration,
						map[domain.EffectColumn]float64{
							domain.ColDamageMultiplier: def.EffectValue,
						},
					)
				}
			}
		}
	}
}

// RecordAttackType は攻撃タイプを記録し、連続回数を更新します。
func (e *BattleEngine) RecordAttackType(state *BattleState, attackType string) {
	if state.LastAttackType == attackType {
		state.SameAttackCount++
	} else {
		state.LastAttackType = attackType
		state.SameAttackCount = 1
	}
}

// ProcessEnemyAttackWithPassiveAndPattern は攻撃パターンを考慮してダメージを処理します。
// ps_adaptive_shield（同種攻撃連続時の軽減）などを評価します。
func (e *BattleEngine) ProcessEnemyAttackWithPassiveAndPattern(state *BattleState, attackType string) int {
	// 攻撃タイプを記録
	e.RecordAttackType(state, attackType)

	// 敵の攻撃力を取得
	attackPower := state.Enemy.AttackPower

	// プレイヤーの防御効果を計算
	ctx := domain.NewEffectContext(state.Player.HP, state.Player.MaxHP, state.Enemy.HP, state.Enemy.MaxHP)
	ctx.SetEvent(domain.EventOnDamageRecv)
	effects := state.Player.EffectTable.Aggregate(ctx)

	// 回避判定
	if effects.Evasion > 0 && e.rng.Float64() < effects.Evasion {
		state.NextAttackTime = time.Now().Add(state.Enemy.AttackInterval)
		return 0
	}

	// ps_adaptive_shield: 同種攻撃連続時の軽減
	adaptiveShieldCut := e.evaluateAdaptiveShield(state)

	// ダメージ計算（軽減率を適用）
	totalDamageCut := effects.DamageCut + adaptiveShieldCut
	if totalDamageCut > 1.0 {
		totalDamageCut = 1.0 // 最大100%軽減
	}
	damage := calculateDamage(attackPower, totalDamageCut)

	// 被ダメージ時パッシブの評価
	damage = e.evaluateDamageRecvPassives(state, damage)

	// プレイヤーにダメージを与える
	state.Player.TakeDamage(damage)
	state.Stats.TotalDamageTaken += damage

	// 反射処理
	if effects.Reflect > 0 && damage > 0 {
		reflectDamage := int(float64(damage) * effects.Reflect)
		if reflectDamage > 0 {
			state.Enemy.TakeDamage(reflectDamage)
			state.Stats.TotalDamageDealt += reflectDamage
		}
	}

	// 被ダメージ後のパッシブ効果（バフ付与など）
	e.applyPostDamagePassives(state)

	// 次回攻撃時刻を更新
	state.NextAttackTime = time.Now().Add(state.Enemy.AttackInterval)

	return damage
}

// evaluateAdaptiveShield はps_adaptive_shieldの軽減効果を評価します。
func (e *BattleEngine) evaluateAdaptiveShield(state *BattleState) float64 {
	for _, agent := range state.EquippedAgents {
		passiveID := agent.Core.PassiveSkill.ID
		if def, ok := e.passiveSkills[passiveID]; ok {
			if def.ID == "ps_adaptive_shield" && def.TriggerCondition != nil {
				threshold := int(def.TriggerCondition.Value)
				if state.SameAttackCount >= threshold {
					return def.EffectValue
				}
			}
		}
	}
	return 0.0
}

// IsAttackReady は敵の攻撃準備が完了しているかを返します。

func (e *BattleEngine) IsAttackReady(state *BattleState) bool {
	return time.Now().After(state.NextAttackTime)
}

// GetTimeUntilNextAttack は次の攻撃までの残り時間を返します。

func (e *BattleEngine) GetTimeUntilNextAttack(state *BattleState) time.Duration {
	remaining := time.Until(state.NextAttackTime)
	if remaining < 0 {
		return 0
	}
	return remaining
}

// GetExpectedDamage は次の攻撃の予測ダメージを返します。
func (e *BattleEngine) GetExpectedDamage(state *BattleState) int {
	attackPower := state.Enemy.AttackPower
	ctx := domain.NewEffectContext(state.Player.HP, state.Player.MaxHP, state.Enemy.HP, state.Enemy.MaxHP)
	effects := state.Player.EffectTable.Aggregate(ctx)
	return calculateDamage(attackPower, effects.DamageCut)
}

// GetAttackType は敵の攻撃タイプを返します。

func (e *BattleEngine) GetAttackType(state *BattleState) string {
	return state.Enemy.Type.AttackType
}

// DetermineNextAction は敵の次回行動を決定します。

func (e *BattleEngine) DetermineNextAction(state *BattleState) NextEnemyAction {
	// 強化フェーズでない場合は攻撃のみ
	if !state.Enemy.IsEnhanced() {
		return NextEnemyAction{
			ActionType:    EnemyActionAttack,
			AttackType:    state.Enemy.Type.AttackType,
			ExpectedValue: e.GetExpectedDamage(state),
		}
	}

	// 強化フェーズ: 30%確率で特殊行動
	if e.rng.Float64() > 0.3 {
		return NextEnemyAction{
			ActionType:    EnemyActionAttack,
			AttackType:    state.Enemy.Type.AttackType,
			ExpectedValue: e.GetExpectedDamage(state),
		}
	}

	// 50%で自己バフ、50%でプレイヤーデバフ
	if e.rng.Float64() < 0.5 {
		buffTypes := []EnemyBuffType{EnemyBuffAttackUp, EnemyBuffPhysicalDamageDown, EnemyBuffMagicDamageDown}
		return NextEnemyAction{
			ActionType: EnemyActionSelfBuff,
			BuffType:   buffTypes[e.rng.Intn(len(buffTypes))],
		}
	}

	debuffTypes := []PlayerDebuffType{PlayerDebuffTypingTimeDown, PlayerDebuffTextShuffle,
		PlayerDebuffDifficultyUp, PlayerDebuffCooldownExtend}
	return NextEnemyAction{
		ActionType: EnemyActionDebuff,
		DebuffType: debuffTypes[e.rng.Intn(len(debuffTypes))],
	}
}

// ExecuteNextAction は事前決定された次回行動を実行します。

func (e *BattleEngine) ExecuteNextAction(state *BattleState) (damage int, message string) {
	action := state.NextAction

	switch action.ActionType {
	case EnemyActionAttack:
		// 通常攻撃を実行
		damage = e.ProcessEnemyAttack(state)
		return damage, fmt.Sprintf("%dダメージを受けた！", damage)

	case EnemyActionSelfBuff:
		// 自己バフを適用
		e.ApplyEnemySelfBuff(state, action.BuffType)
		return 0, getEnemyBuffMessage(action.BuffType)

	case EnemyActionDebuff:
		// プレイヤーデバフを適用
		e.ApplyPlayerDebuff(state, action.DebuffType)
		return 0, getPlayerDebuffMessage(action.DebuffType)
	}

	return 0, ""
}

// GetEnemyBuffName は敵自己バフの名前を返します。

func GetEnemyBuffName(buffType EnemyBuffType) string {
	switch buffType {
	case EnemyBuffAttackUp:
		return "攻撃力UP"
	case EnemyBuffPhysicalDamageDown:
		return "物理防御UP"
	case EnemyBuffMagicDamageDown:
		return "魔法防御UP"
	default:
		return "強化"
	}
}

// GetPlayerDebuffName はプレイヤーデバフの名前を返します。

func GetPlayerDebuffName(debuffType PlayerDebuffType) string {
	switch debuffType {
	case PlayerDebuffTypingTimeDown:
		return "タイピング時間短縮"
	case PlayerDebuffTextShuffle:
		return "テキストシャッフル"
	case PlayerDebuffDifficultyUp:
		return "難易度上昇"
	case PlayerDebuffCooldownExtend:
		return "クールダウン延長"
	default:
		return "デバフ"
	}
}

// ==================== 敵フェーズ変化と特殊行動（Task 7.3） ====================

// CheckPhaseTransition はフェーズ変化をチェックし、必要に応じて移行します。

func (e *BattleEngine) CheckPhaseTransition(state *BattleState) bool {
	return state.Enemy.CheckAndTransitionPhase()
}

// ApplyEnemySelfBuff は敵に自己バフを付与します。
func (e *BattleEngine) ApplyEnemySelfBuff(state *BattleState, buffType EnemyBuffType) {
	values := make(map[domain.EffectColumn]float64)
	var name string

	switch buffType {
	case EnemyBuffAttackUp:
		name = "攻撃力UP"
		values[domain.ColDamageMultiplier] = 1.3 // 30%攻撃力上昇
	case EnemyBuffPhysicalDamageDown:
		name = "物理防御UP"
		values[domain.ColDamageCut] = 0.3 // 30%軽減
	case EnemyBuffMagicDamageDown:
		name = "魔法防御UP"
		values[domain.ColDamageCut] = 0.3 // 30%軽減
	}

	state.Enemy.EffectTable.AddBuff(name, config.BuffDuration, values)
}

// ApplyPlayerDebuff はプレイヤーにデバフを付与します。
func (e *BattleEngine) ApplyPlayerDebuff(state *BattleState, debuffType PlayerDebuffType) {
	values := make(map[domain.EffectColumn]float64)
	var name string

	switch debuffType {
	case PlayerDebuffTypingTimeDown:
		name = "タイピング時間短縮"
		values[domain.ColTimeExtend] = -2.0 // 2秒短縮
	case PlayerDebuffTextShuffle:
		name = "テキストシャッフル"
		// 実際のシャッフル処理はUI側で行う
	case PlayerDebuffDifficultyUp:
		name = "難易度上昇"
		// 実際の難易度変更はチャレンジ生成時に行う
	case PlayerDebuffCooldownExtend:
		name = "クールダウン延長"
		values[domain.ColCooldownReduce] = -0.3 // 30%延長（マイナス値 = 延長）
	}

	state.Player.EffectTable.AddDebuff(name, config.DebuffDuration, values)
}

// UpdateEffects はバフ・デバフの時間を更新し、継続効果（Regen等）を適用します。
func (e *BattleEngine) UpdateEffects(state *BattleState, deltaSeconds float64) {
	// 持続時間の更新
	state.Player.EffectTable.UpdateDurations(deltaSeconds)
	state.Enemy.EffectTable.UpdateDurations(deltaSeconds)

	// Regen 処理（プレイヤー）
	ctx := domain.NewEffectContext(state.Player.HP, state.Player.MaxHP, state.Enemy.HP, state.Enemy.MaxHP)
	effects := state.Player.EffectTable.Aggregate(ctx)
	if effects.Regen > 0 {
		// 毎秒 effects.Regen% のHP回復
		regenAmount := int(float64(state.Player.MaxHP) * effects.Regen / 100.0 * deltaSeconds)
		if regenAmount > 0 {
			state.Player.Heal(regenAmount)
			state.Stats.TotalHealAmount += regenAmount
		}
	}
}

// getEnemyBuffMessage は敵自己バフのメッセージを返します。
func getEnemyBuffMessage(buffType EnemyBuffType) string {
	switch buffType {
	case EnemyBuffAttackUp:
		return "敵の攻撃力が上昇した！"
	case EnemyBuffPhysicalDamageDown:
		return "敵が物理防御を強化した！"
	case EnemyBuffMagicDamageDown:
		return "敵が魔法防御を強化した！"
	default:
		return "敵が強化された！"
	}
}

// getPlayerDebuffMessage はプレイヤーデバフのメッセージを返します。
func getPlayerDebuffMessage(debuffType PlayerDebuffType) string {
	switch debuffType {
	case PlayerDebuffTypingTimeDown:
		return "タイピング時間が短縮された！"
	case PlayerDebuffTextShuffle:
		return "テキストがシャッフルされた！"
	case PlayerDebuffDifficultyUp:
		return "難易度が上昇した！"
	case PlayerDebuffCooldownExtend:
		return "クールダウンが延長された！"
	default:
		return "デバフを受けた！"
	}
}

// ==================== モジュール効果計算（Task 7.4） ====================

// getStatValue はステータス参照名に応じたステータス値を取得します。
func (e *BattleEngine) getStatValue(stats domain.Stats, statRef string) int {
	switch statRef {
	case "STR":
		return stats.STR
	case "INT":
		return stats.INT
	case "WIL":
		return stats.WIL
	case "LUK":
		return stats.LUK
	default:
		return stats.STR
	}
}

// calculateHPChange は効果のHP変化量を計算します。
func (e *BattleEngine) calculateHPChange(
	effect *domain.ModuleEffect,
	stats domain.Stats,
	typingResult *typing.TypingResult,
) int {
	if effect.HPFormula == nil {
		return 0
	}

	// base + stat_coef * STAT
	statValue := e.getStatValue(stats, effect.HPFormula.StatRef)
	baseHP := effect.HPFormula.Base + effect.HPFormula.StatCoef*float64(statValue)

	// タイピング結果による補正
	if typingResult != nil {
		baseHP *= typingResult.SpeedFactor * typingResult.AccuracyFactor
		if typingResult.AccuracyFactor < AccuracyPenaltyThreshold {
			baseHP *= 0.5
		}
	}

	// スケール係数を適用
	return int(baseHP)
}

// ApplyModuleEffect はモジュール効果を適用します。
// 新しいエフェクトベースのシステムで各効果を順に評価・適用します。
func (e *BattleEngine) ApplyModuleEffect(
	state *BattleState,
	agent *domain.AgentModel,
	module *domain.ModuleModel,
	typingResult *typing.TypingResult,
) int {
	// プレイヤーの効果を取得
	ctx := domain.NewEffectContext(state.Player.HP, state.Player.MaxHP, state.Enemy.HP, state.Enemy.MaxHP)

	// タイピング結果をコンテキストに設定（パッシブスキル評価用）
	if typingResult != nil {
		ctx.SetTypingResult(typingResult.Accuracy, typingResult.WPM, 0)
		ctx.SetEvent(domain.EventOnTypingDone)
	}

	playerEffects := state.Player.EffectTable.Aggregate(ctx)
	enemyEffects := state.Enemy.EffectTable.Aggregate(ctx)

	totalEffect := 0

	// 各効果を評価・適用
	for _, effect := range module.Type.Effects {
		// LUKに基づく発動判定
		if !effect.ShouldTrigger(agent.BaseStats.LUK, e.rng) {
			continue
		}

		// HP変化効果の適用
		if effect.HPFormula != nil {
			hpChange := e.calculateHPChange(&effect, agent.BaseStats, typingResult)

			switch effect.Target {
			case domain.TargetEnemy:
				// ダメージ効果
				damage := -hpChange // ダメージは負のHP変化
				if damage < 0 {
					damage = -damage
				}

				// ダメージ乗算を適用
				if playerEffects.DamageMultiplier != 1.0 {
					damage = int(float64(damage) * playerEffects.DamageMultiplier)
				}

				// ArmorPierce が有効でなければ敵の DamageCut を適用
				if !playerEffects.ArmorPierce {
					damage = calculateDamage(damage, enemyEffects.DamageCut)
				}

				state.Enemy.TakeDamage(damage)
				state.Stats.TotalDamageDealt += damage
				totalEffect += damage

				// ライフスティール処理
				if playerEffects.LifeSteal > 0 && damage > 0 {
					healAmount := int(float64(damage) * playerEffects.LifeSteal)
					if healAmount > 0 {
						state.Player.Heal(healAmount)
						state.Stats.TotalHealAmount += healAmount
					}
				}

			case domain.TargetSelf:
				// 回復または自傷効果
				if hpChange > 0 {
					// 回復
					healAmount := hpChange
					if playerEffects.HealMultiplier != 1.0 {
						healAmount = int(float64(healAmount) * playerEffects.HealMultiplier)
					}
					if playerEffects.Overheal {
						state.Player.HealWithOverheal(healAmount)
					} else {
						state.Player.Heal(healAmount)
					}
					state.Stats.TotalHealAmount += healAmount
					totalEffect += healAmount
				} else if hpChange < 0 {
					// 自傷ダメージ
					state.Player.TakeDamage(-hpChange)
				}

			case domain.TargetBoth:
				// 両方に効果（将来の拡張用）
			}
		}

		// EffectColumn効果の適用（バフ/デバフ）
		if effect.ColumnSpec != nil {
			values := map[domain.EffectColumn]float64{
				effect.ColumnSpec.Column: effect.ColumnSpec.Value,
			}
			duration := effect.ColumnSpec.Duration
			if duration == 0 {
				duration = config.BuffDuration
			}

			switch effect.Target {
			case domain.TargetSelf:
				state.Player.EffectTable.AddBuff(module.Name(), duration, values)
			case domain.TargetEnemy:
				state.Enemy.EffectTable.AddDebuff(module.Name(), duration, values)
			}
		}
	}

	return totalEffect
}

// ApplyModuleEffectWithCombo はコンボカウントを考慮してモジュール効果を適用します。
// スタック型パッシブスキル（ps_combo_master等）の効果を正しく計算します。
func (e *BattleEngine) ApplyModuleEffectWithCombo(
	state *BattleState,
	agent *domain.AgentModel,
	module *domain.ModuleModel,
	typingResult *typing.TypingResult,
	comboCount int,
) int {
	// 基本効果を適用
	baseDamage := e.ApplyModuleEffect(state, agent, module, typingResult)

	// コンボ乗算を計算
	comboMultiplier := e.calculateStackMultiplier(state, comboCount)
	if comboMultiplier > 1.0 {
		// 既に適用された基本ダメージに対して、追加分のダメージを計算
		// baseDamage × (comboMultiplier - 1) = 追加ダメージ
		additionalDamage := int(float64(baseDamage) * (comboMultiplier - 1.0))
		if additionalDamage > 0 {
			// 追加ダメージを敵に適用
			state.Enemy.HP -= additionalDamage
			if state.Enemy.HP < 0 {
				state.Enemy.HP = 0
			}
			return baseDamage + additionalDamage
		}
	}

	return baseDamage
}

// calculateStackMultiplier はスタック型パッシブの効果倍率を計算します。
func (e *BattleEngine) calculateStackMultiplier(state *BattleState, comboCount int) float64 {
	multiplier := 1.0

	// 装備中のエージェントのパッシブスキルをチェック
	for _, agent := range state.EquippedAgents {
		passiveID := agent.Core.PassiveSkill.ID
		if def, ok := e.passiveSkills[passiveID]; ok {
			// スタック型パッシブかつコンボ条件のみ処理
			if def.TriggerType == domain.PassiveTriggerStack &&
				def.TriggerCondition != nil &&
				def.TriggerCondition.Type == domain.TriggerConditionNoMissStreak {

				// コンボ数が閾値以上の場合、スタック効果を計算
				threshold := int(def.TriggerCondition.Value)
				if comboCount >= threshold {
					// スタック数を計算（コンボ数をスタックとして扱う）
					stacks := comboCount
					if def.MaxStacks > 0 && stacks > def.MaxStacks {
						stacks = def.MaxStacks
					}
					// 効果倍率を計算: ベース + (スタック数 × 増分)
					stackEffect := def.EffectValue + float64(stacks)*def.StackIncrement
					multiplier *= stackEffect
				}
			}
		}
	}

	return multiplier
}

// ==================== バトル勝敗判定（Task 7.5） ====================

// CheckBattleEnd はバトル終了を判定します。

func (e *BattleEngine) CheckBattleEnd(state *BattleState) (bool, *BattleResult) {
	if !state.Player.IsAlive() {
		// プレイヤー敗北
		return true, &BattleResult{
			IsVictory: false,
			Stats:     state.Stats,
		}
	}

	if !state.Enemy.IsAlive() {
		// プレイヤー勝利
		return true, &BattleResult{
			IsVictory: true,
			Stats:     state.Stats,
		}
	}

	return false, nil
}

// RecordTypingResult はタイピング結果を統計に記録します。
func (e *BattleEngine) RecordTypingResult(state *BattleState, result *typing.TypingResult) {
	state.Stats.TotalTypingCount++
	state.Stats.TotalWPM += result.WPM
	state.Stats.TotalAccuracy += result.Accuracy
}

// ShouldUpdateMaxLevel は最高レベルを更新すべきかを判定します。

func (e *BattleEngine) ShouldUpdateMaxLevel(battleLevel, currentMaxLevel int) bool {
	return battleLevel > currentMaxLevel
}

// ==================== パッシブスキル統合（Task 6） ====================

// RegisterPassiveSkills は装備エージェントのパッシブスキルをEffectTableに登録します。
// 各エージェントのコアに紐づくパッシブスキルを永続効果として登録します。
func (e *BattleEngine) RegisterPassiveSkills(
	state *BattleState,
	agents []*domain.AgentModel,
) {
	for i, agent := range agents {
		if agent == nil || agent.Core == nil {
			continue
		}

		corePassive := agent.Core.PassiveSkill

		// パッシブスキルIDが空の場合はスキップ
		if corePassive.ID == "" {
			continue
		}

		// エンジンのpassiveSkillsマップから完全な定義を取得
		// （トリガー条件、効果タイプなどが含まれる）
		passiveSkill := corePassive
		if fullDef, ok := e.passiveSkills[corePassive.ID]; ok {
			passiveSkill = fullDef
		}

		// PassiveSkill を EffectEntry に変換して登録
		entry := passiveSkill.ToEntry()
		entry.SourceID = fmt.Sprintf("passive_%d_%s", i, passiveSkill.ID)
		entry.SourceIndex = i
		state.Player.EffectTable.AddEntry(entry)
	}
}

// GetPlayerFinalStats はパッシブスキルを含む全ての効果を適用したプレイヤーステータスを返します。
func (e *BattleEngine) GetPlayerFinalStats(state *BattleState) domain.EffectResult {
	ctx := domain.NewEffectContext(state.Player.HP, state.Player.MaxHP, 0, 0)
	return state.Player.EffectTable.Aggregate(ctx)
}

// CalculateModuleEffectWithPassive はパッシブスキル効果を適用したモジュール効果を計算します。
// 新しいエフェクトベースシステムでは、全ての効果の合計値を返します。
func (e *BattleEngine) CalculateModuleEffectWithPassive(
	agent *domain.AgentModel,
	module *domain.ModuleModel,
	typingResult *typing.TypingResult,
) int {
	totalEffect := 0

	// 各効果のHP変化量を合計
	for _, effect := range module.Type.Effects {
		if effect.HPFormula != nil {
			hpChange := e.calculateHPChange(&effect, agent.BaseStats, typingResult)
			if hpChange < 0 {
				hpChange = -hpChange // ダメージの場合は絶対値
			}
			totalEffect += hpChange
		}
	}

	return totalEffect
}

// EvaluateEchoSkill はps_echo_skillの発動を評価し、繰り返し回数を返します。
// 発動しない場合は1を返します。
func (e *BattleEngine) EvaluateEchoSkill(state *BattleState, agent *domain.AgentModel) int {
	passiveID := agent.Core.PassiveSkill.ID
	if def, ok := e.passiveSkills[passiveID]; ok {
		if def.ID == "ps_echo_skill" {
			// 確率判定
			if e.rng.Float64() < def.Probability {
				return int(def.EffectValue) // 2回発動
			}
		}
	}
	return 1 // 通常は1回
}

// ApplyModuleEffectWithEcho はエコースキルを考慮してモジュール効果を適用します。
func (e *BattleEngine) ApplyModuleEffectWithEcho(
	state *BattleState,
	agent *domain.AgentModel,
	module *domain.ModuleModel,
	typingResult *typing.TypingResult,
	repeatCount int,
) int {
	totalEffect := 0
	for i := 0; i < repeatCount; i++ {
		effect := e.ApplyModuleEffect(state, agent, module, typingResult)
		totalEffect += effect
	}
	return totalEffect
}

// EvaluateMiracleHeal はps_miracle_healの発動を評価します。
// 回復スキル使用時のみ確率で発動します。
func (e *BattleEngine) EvaluateMiracleHeal(state *BattleState, agent *domain.AgentModel, module *domain.ModuleModel) bool {
	// 回復効果を持たないスキルでは発動しない
	hasHeal := false
	for _, effect := range module.Type.Effects {
		if effect.IsHealEffect() {
			hasHeal = true
			break
		}
	}
	if !hasHeal {
		return false
	}

	passiveID := agent.Core.PassiveSkill.ID
	if def, ok := e.passiveSkills[passiveID]; ok {
		if def.ID == "ps_miracle_heal" {
			// 確率判定
			if e.rng.Float64() < def.Probability {
				return true
			}
		}
	}
	return false
}

// EvaluateFirstStrike はps_first_strikeの発動を評価します。
// バトル開始時に最初のスキルを即発動するかどうかを返します。
func (e *BattleEngine) EvaluateFirstStrike(state *BattleState, agent *domain.AgentModel) bool {
	passiveID := agent.Core.PassiveSkill.ID
	if def, ok := e.passiveSkills[passiveID]; ok {
		if def.ID == "ps_first_strike" {
			return true
		}
	}
	return false
}

// EvaluateTypoRecovery はps_typo_recoveryの発動を評価します。
// ミス時の時間延長（秒）を返します。発動しない場合は0。
func (e *BattleEngine) EvaluateTypoRecovery(state *BattleState, agent *domain.AgentModel) float64 {
	passiveID := agent.Core.PassiveSkill.ID
	if def, ok := e.passiveSkills[passiveID]; ok {
		if def.ID == "ps_typo_recovery" {
			// 確率判定
			if e.rng.Float64() < def.Probability {
				return def.EffectValue // +1秒など
			}
		}
	}
	return 0.0
}

// EvaluateSecondChance はps_second_chanceの発動を評価します。
// タイムアウト時に再挑戦できるかどうかを返します。
func (e *BattleEngine) EvaluateSecondChance(state *BattleState, agent *domain.AgentModel) bool {
	passiveID := agent.Core.PassiveSkill.ID
	if def, ok := e.passiveSkills[passiveID]; ok {
		if def.ID == "ps_second_chance" {
			// 確率判定
			if e.rng.Float64() < def.Probability {
				return true
			}
		}
	}
	return false
}

// GetPassiveSkill はパッシブスキル定義を取得します。
func (e *BattleEngine) GetPassiveSkill(passiveID string) (domain.PassiveSkill, bool) {
	skill, ok := e.passiveSkills[passiveID]
	return skill, ok
}

// EvaluateQuickRecovery はps_quick_recoveryの発動を評価します。
// 被ダメージ時にリキャスト短縮効果が発動するかを判定し、短縮秒数を返します。
func (e *BattleEngine) EvaluateQuickRecovery(state *BattleState, agent *domain.AgentModel) float64 {
	passiveID := agent.Core.PassiveSkill.ID
	if def, ok := e.passiveSkills[passiveID]; ok {
		if def.ID == "ps_quick_recovery" {
			// 確率判定
			if e.rng.Float64() < def.Probability {
				return def.EffectValue // 短縮秒数（例: 2.0秒）
			}
		}
	}
	return 0.0
}

// ==================== チャージシステム（Phase 3.2） ====================

// DeterminePatternBasedAction はパターンベースの次回行動を決定します。
// 敵の行動パターンから現在の行動を取得し、NextEnemyAction形式で返します。
func (e *BattleEngine) DeterminePatternBasedAction(state *BattleState) NextEnemyAction {
	action := state.Enemy.GetCurrentAction()

	// ドメインの行動タイプをバトルエンジンの行動タイプに変換
	var actionType EnemyActionType
	switch action.ActionType {
	case domain.EnemyActionAttack:
		actionType = EnemyActionAttack
	case domain.EnemyActionBuff:
		actionType = EnemyActionSelfBuff
	case domain.EnemyActionDebuff:
		actionType = EnemyActionDebuff
	case domain.EnemyActionDefense:
		actionType = EnemyActionDefense
	default:
		actionType = EnemyActionAttack
	}

	nextAction := NextEnemyAction{
		ActionType:   actionType,
		SourceAction: &action,
		ChargeTimeMs: int(action.ChargeTime.Milliseconds()),
	}

	// 行動タイプ別の追加情報を設定
	switch action.ActionType {
	case domain.EnemyActionAttack:
		nextAction.AttackType = action.AttackType
		nextAction.ExpectedValue = e.CalculatePatternDamage(state, action)
	case domain.EnemyActionDefense:
		nextAction.DefenseType = action.DefenseType
		if action.DefenseType == domain.DefenseDebuffEvade {
			nextAction.DefenseValue = action.EvadeRate
		} else {
			nextAction.DefenseValue = action.ReductionRate
		}
		nextAction.DefenseDurationMs = int(action.Duration * 1000)
	}

	return nextAction
}

// CalculatePatternDamage はパターンベース攻撃のダメージを計算します。
// ダメージ = DamageBase + Level * DamagePerLevel
func (e *BattleEngine) CalculatePatternDamage(state *BattleState, action domain.EnemyAction) int {
	baseDamage := action.DamageBase + float64(state.Enemy.Level)*action.DamagePerLevel

	// 敵のバフ効果を適用
	ctx := domain.NewEffectContext(state.Player.HP, state.Player.MaxHP, state.Enemy.HP, state.Enemy.MaxHP)
	enemyEffects := state.Enemy.EffectTable.Aggregate(ctx)

	// ダメージ乗算を適用
	if enemyEffects.DamageMultiplier != 1.0 {
		baseDamage *= enemyEffects.DamageMultiplier
	}

	// ダメージボーナスを適用
	baseDamage += float64(enemyEffects.DamageBonus)

	damage := int(baseDamage)
	if damage < 1 {
		damage = 1
	}
	return damage
}

// StartEnemyCharging は敵のチャージを開始します。
// ディフェンス行動はチャージタイム0なので即座に発動します。
func (e *BattleEngine) StartEnemyCharging(state *BattleState, now time.Time) {
	action := state.NextAction

	// ディフェンス行動はチャージタイム0なので即座に発動
	if action.ActionType == EnemyActionDefense && action.SourceAction != nil {
		e.ActivateDefense(state, now)
		return
	}

	// チャージ開始
	if action.SourceAction != nil {
		state.Enemy.StartCharging(*action.SourceAction, now)
	}
}

// ActivateDefense はディフェンス行動を発動します。
func (e *BattleEngine) ActivateDefense(state *BattleState, now time.Time) {
	action := state.NextAction
	if action.SourceAction == nil {
		return
	}

	duration := time.Duration(action.DefenseDurationMs) * time.Millisecond
	state.Enemy.StartDefense(action.DefenseType, action.DefenseValue, duration, now)

	// 行動インデックスを進める
	state.Enemy.AdvanceActionIndex()
}

// CheckDefenseExpired はディフェンス終了をチェックし、必要なら終了処理を行います。
func (e *BattleEngine) CheckDefenseExpired(state *BattleState, now time.Time) bool {
	if !state.Enemy.IsDefending {
		return false
	}

	if !state.Enemy.IsDefenseActive(now) {
		state.Enemy.EndDefense()
		return true
	}
	return false
}

// ExecuteChargedAction はチャージ完了した行動を実行します。
func (e *BattleEngine) ExecuteChargedAction(state *BattleState) (damage int, message string) {
	action := state.Enemy.ExecuteChargedAction()
	if action == nil {
		return 0, ""
	}

	switch action.ActionType {
	case domain.EnemyActionAttack:
		damage = e.ExecutePatternAttack(state, *action)
		return damage, fmt.Sprintf("%s！%dダメージを受けた！", action.Name, damage)

	case domain.EnemyActionBuff:
		e.ApplyPatternBuff(state, *action)
		return 0, fmt.Sprintf("%sが%sを発動！", state.Enemy.Name, action.Name)

	case domain.EnemyActionDebuff:
		if e.CheckDebuffEvasion(state) {
			return 0, fmt.Sprintf("%sを回避した！", action.Name)
		}
		e.ApplyPatternDebuff(state, *action)
		return 0, fmt.Sprintf("%sが%sを発動！", state.Enemy.Name, action.Name)
	}

	return 0, ""
}

// ExecutePatternAttack はパターンベースの攻撃を実行します。
func (e *BattleEngine) ExecutePatternAttack(state *BattleState, action domain.EnemyAction) int {
	damage := e.CalculatePatternDamage(state, action)

	// プレイヤーの防御効果を取得
	ctx := domain.NewEffectContext(state.Player.HP, state.Player.MaxHP, state.Enemy.HP, state.Enemy.MaxHP)
	playerEffects := state.Player.EffectTable.Aggregate(ctx)

	// ダメージ軽減を適用
	if playerEffects.DamageCut > 0 {
		damage = calculateDamage(damage, playerEffects.DamageCut)
	}

	state.Player.TakeDamage(damage)
	state.Stats.TotalDamageTaken += damage

	return damage
}

// ApplyPatternBuff はパターンベースのバフを適用します。
func (e *BattleEngine) ApplyPatternBuff(state *BattleState, action domain.EnemyAction) {
	values := make(map[domain.EffectColumn]float64)

	switch action.EffectType {
	case "damage_mult":
		values[domain.ColDamageMultiplier] = action.EffectValue
	case "attack_up":
		values[domain.ColDamageBonus] = action.EffectValue
	case "defense_up":
		values[domain.ColDamageCut] = action.EffectValue
	case "cooldown_reduce":
		values[domain.ColCooldownReduce] = action.EffectValue
	}

	// AddBuff は秒数（float64）を受け取る
	state.Enemy.EffectTable.AddBuff(action.ID, action.Duration, values)
}

// ApplyPatternDebuff はパターンベースのデバフを適用します。
func (e *BattleEngine) ApplyPatternDebuff(state *BattleState, action domain.EnemyAction) {
	values := make(map[domain.EffectColumn]float64)

	switch action.EffectType {
	case "damage_mult":
		values[domain.ColDamageMultiplier] = action.EffectValue
	case "speed_down":
		values[domain.ColCooldownReduce] = -action.EffectValue
	case "defense_down":
		values[domain.ColDamageCut] = -action.EffectValue
	}

	// AddDebuff は秒数（float64）を受け取る
	state.Player.EffectTable.AddDebuff(action.ID, action.Duration, values)
}

// CheckDebuffEvasion はデバフ回避を判定します。
// 敵がデバフ回避ディフェンス中の場合、回避判定を行います。
func (e *BattleEngine) CheckDebuffEvasion(state *BattleState) bool {
	now := time.Now()
	if !state.Enemy.IsDefenseActive(now) {
		return false
	}
	if state.Enemy.ActiveDefenseType != domain.DefenseDebuffEvade {
		return false
	}

	// 回避率で判定
	return e.rng.Float64() < state.Enemy.DefenseValue
}

// ApplyDefenseReduction はディフェンスによるダメージ軽減を適用します。
// プレイヤーからの攻撃に対して、敵のディフェンス状態を考慮したダメージを計算します。
func (e *BattleEngine) ApplyDefenseReduction(state *BattleState, baseDamage int, attackType string) int {
	now := time.Now()
	if !state.Enemy.IsDefenseActive(now) {
		return baseDamage
	}

	// 攻撃属性とディフェンス種別のマッチング
	switch state.Enemy.ActiveDefenseType {
	case domain.DefensePhysicalCut:
		if attackType == "physical" {
			reduction := state.Enemy.DefenseValue
			return int(float64(baseDamage) * (1.0 - reduction))
		}
	case domain.DefenseMagicCut:
		if attackType == "magic" {
			reduction := state.Enemy.DefenseValue
			return int(float64(baseDamage) * (1.0 - reduction))
		}
	}

	return baseDamage
}

// IsEnemyCharging は敵がチャージ中かどうかを返します。
func (e *BattleEngine) IsEnemyCharging(state *BattleState) bool {
	return state.Enemy.IsCharging
}

// IsEnemyDefending は敵がディフェンス中かどうかを返します。
func (e *BattleEngine) IsEnemyDefending(state *BattleState, now time.Time) bool {
	return state.Enemy.IsDefenseActive(now)
}

// GetChargeInfo はチャージ情報を取得します（UI表示用）。
func (e *BattleEngine) GetChargeInfo(state *BattleState, now time.Time) (progress float64, remainingMs int, actionName string) {
	if !state.Enemy.IsCharging {
		return 0, 0, ""
	}

	progress = state.Enemy.GetChargeProgress(now)
	remaining := state.Enemy.GetChargeRemainingTime(now)
	remainingMs = int(remaining.Milliseconds())

	if state.Enemy.PendingAction != nil {
		actionName = state.Enemy.PendingAction.Name
	}

	return progress, remainingMs, actionName
}

// GetDefenseInfo はディフェンス情報を取得します（UI表示用）。
func (e *BattleEngine) GetDefenseInfo(state *BattleState, now time.Time) (active bool, remainingMs int, typeName string) {
	if !state.Enemy.IsDefenseActive(now) {
		return false, 0, ""
	}

	remaining := state.Enemy.GetDefenseRemainingTime(now)
	remainingMs = int(remaining.Milliseconds())
	typeName = state.Enemy.GetDefenseTypeName()

	return true, remainingMs, typeName
}

// ==================== 敵パッシブスキルシステム（Task 4） ====================

// RegisterEnemyPassive は敵の通常パッシブをEffectTableに登録します。
// バトル開始時に呼び出され、敵タイプに設定されているNormalPassiveを
// 一時ステータス修正として効果を適用します。
// パッシブ未設定の場合はスキップします。
func (e *BattleEngine) RegisterEnemyPassive(state *BattleState) {
	if state.Enemy == nil {
		return
	}

	// 敵タイプから通常パッシブを取得
	normalPassive := state.Enemy.Type.NormalPassive
	if normalPassive == nil {
		return
	}

	// パッシブスキルをEffectEntryに変換して登録
	entry := normalPassive.ToEntry()
	state.Enemy.EffectTable.AddEntry(entry)

	// ActivePassiveIDを設定
	state.Enemy.ActivePassiveID = normalPassive.ID
}

// SwitchEnemyPassive はフェーズ遷移時に敵のパッシブを切り替えます。
// 通常パッシブを無効化し、強化パッシブを登録します。
// 強化フェーズ遷移後に呼び出されることを想定しています。
func (e *BattleEngine) SwitchEnemyPassive(state *BattleState) {
	if state.Enemy == nil {
		return
	}

	// 通常パッシブを無効化（EffectTableからパッシブ効果を削除）
	state.Enemy.EffectTable.RemoveBySourceType(domain.SourcePassive)

	// ActivePassiveIDをクリア
	state.Enemy.ActivePassiveID = ""

	// 強化パッシブを登録
	enhancedPassive := state.Enemy.Type.EnhancedPassive
	if enhancedPassive == nil {
		return
	}

	// 強化パッシブスキルをEffectEntryに変換して登録
	entry := enhancedPassive.ToEntry()
	state.Enemy.EffectTable.AddEntry(entry)

	// ActivePassiveIDを更新
	state.Enemy.ActivePassiveID = enhancedPassive.ID
}
