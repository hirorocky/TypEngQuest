// Package battle はバトルエンジンを提供します。
// バトル初期化、敵攻撃、モジュール効果、勝敗判定を担当します。
// Requirements: 9.1, 9.16, 9.17, 10.1-10.10, 11.1-11.27, 13.1
package battle

import (
	"fmt"
	"math/rand"
	"time"

	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/typing"

	"github.com/google/uuid"
)

// AccuracyPenaltyThreshold は効果半減の正確性閾値です。
// Requirement 10.9: 正確性50%未満で効果半減
const AccuracyPenaltyThreshold = 0.5

// EffectScaleFactor は効果計算のスケール係数です。
// ステータス値を適切なダメージ/回復量に変換するための係数
const EffectScaleFactor = 0.1

// 敵自己バフタイプ
type EnemyBuffType int

const (
	// EnemyBuffAttackUp は攻撃力UP
	// Requirement 11.18
	EnemyBuffAttackUp EnemyBuffType = iota

	// EnemyBuffPhysicalDamageDown は物理ダメージ軽減
	// Requirement 11.19
	EnemyBuffPhysicalDamageDown

	// EnemyBuffMagicDamageDown は魔法ダメージ軽減
	// Requirement 11.20
	EnemyBuffMagicDamageDown
)

// プレイヤーデバフタイプ
type PlayerDebuffType int

const (
	// PlayerDebuffTypingTimeDown はタイピング制限時間短縮
	// Requirement 11.22
	PlayerDebuffTypingTimeDown PlayerDebuffType = iota

	// PlayerDebuffTextShuffle はテキストシャッフル
	// Requirement 11.23
	PlayerDebuffTextShuffle

	// PlayerDebuffDifficultyUp は難易度上昇
	// Requirement 11.24
	PlayerDebuffDifficultyUp

	// PlayerDebuffCooldownExtend はクールダウン延長
	// Requirement 11.25
	PlayerDebuffCooldownExtend
)

// EnemyActionType は敵の行動タイプを表します。
// Requirement 11.8: 次回攻撃の属性と予測ダメージ表示
type EnemyActionType int

const (
	// EnemyActionAttack は攻撃行動
	EnemyActionAttack EnemyActionType = iota

	// EnemyActionSelfBuff は自己バフ行動
	EnemyActionSelfBuff

	// EnemyActionDebuff はプレイヤーへのデバフ行動
	EnemyActionDebuff
)

// NextEnemyAction は敵の次回行動を表します。
// Requirement 11.8: 次回攻撃の属性と予測ダメージ表示
type NextEnemyAction struct {
	// ActionType は行動タイプ（攻撃/自己バフ/デバフ）
	ActionType EnemyActionType

	// AttackType は攻撃属性（"physical" or "magic"）（攻撃時のみ有効）
	AttackType string

	// BuffType は自己バフの種類（自己バフ時のみ有効）
	BuffType EnemyBuffType

	// DebuffType はデバフの種類（デバフ時のみ有効）
	DebuffType PlayerDebuffType

	// ExpectedValue は予測ダメージまたは効果量
	ExpectedValue int
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
	// Requirement 11.8: 次回攻撃の属性と予測ダメージ表示
	NextAction NextEnemyAction
}

// BattleResult はバトル結果を表す構造体です。
type BattleResult struct {
	// IsVictory は勝利かどうかです。
	IsVictory bool

	// Stats はバトル統計です。
	Stats *BattleStatistics
}

// BattleEngine はバトルロジックを担当する構造体です。
// Requirements: 9.1, 9.16, 9.17, 10.1-10.10, 11.1-11.27, 13.1
type BattleEngine struct {
	// enemyTypes は敵タイプの定義リストです。
	enemyTypes []domain.EnemyType

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

// ==================== バトル初期化（Task 7.1） ====================

// InitializeBattle はバトルを初期化します。
// Requirement 9.1: 指定レベルの敵を生成しバトル開始
// Requirement 4.3: バトル開始時にプレイヤーのHPを最大値まで全回復
// Requirement 13.1: 指定レベルの敵を生成
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

	// Requirement 11.8: 初回行動を決定
	state.NextAction = e.DetermineNextAction(state)

	return state, nil
}

// generateEnemy は指定レベルの敵を生成します。
// Requirement 13.1, 13.2: レベルに応じた敵生成
func (e *BattleEngine) generateEnemy(level int) *domain.EnemyModel {
	if len(e.enemyTypes) == 0 {
		return nil
	}

	// ランダムに敵タイプを選択
	// Requirement 13.5: 同じレベルでも複数の敵バリエーションからランダム選択
	enemyType := e.enemyTypes[e.rng.Intn(len(e.enemyTypes))]

	// レベルに応じてステータスを計算
	// Requirement 13.2: レベルに応じたHP、攻撃力、攻撃間隔を計算
	hp := enemyType.BaseHP * level
	attackPower := enemyType.BaseAttackPower + (level * 2)

	// 高レベルほど短い攻撃間隔（ただし最低500ms）
	// Requirement 13.6, 20.4: 高レベル敵ほど短い攻撃間隔
	intervalReduction := time.Duration(level*50) * time.Millisecond
	attackInterval := enemyType.BaseAttackInterval - intervalReduction
	if attackInterval < 500*time.Millisecond {
		attackInterval = 500 * time.Millisecond
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
// Requirement 11.4: 攻撃ダメージ計算（攻撃力 - 防御バフ）
// Requirement 11.5: プレイヤーHP減少処理
func (e *BattleEngine) ProcessEnemyAttack(state *BattleState) int {
	// 敵の攻撃力を取得
	attackPower := state.Enemy.AttackPower

	// プレイヤーの防御効果を計算
	// Requirement 11.28: 防御バフ適用時のダメージ減算
	finalStats := state.Player.EffectTable.Calculate(domain.Stats{})
	damageReduction := finalStats.DamageReduction

	// ダメージ計算（軽減率を適用）
	damage := int(float64(attackPower) * (1.0 - damageReduction))
	if damage < 1 {
		damage = 1 // 最低1ダメージ
	}

	// プレイヤーにダメージを与える
	state.Player.TakeDamage(damage)
	state.Stats.TotalDamageTaken += damage

	// 次回攻撃時刻を更新
	state.NextAttackTime = time.Now().Add(state.Enemy.AttackInterval)

	return damage
}

// IsAttackReady は敵の攻撃準備が完了しているかを返します。
// Requirement 11.2: 敵の種類に応じた間隔で攻撃を自動実行
func (e *BattleEngine) IsAttackReady(state *BattleState) bool {
	return time.Now().After(state.NextAttackTime)
}

// GetTimeUntilNextAttack は次の攻撃までの残り時間を返します。
// Requirement 11.7: 敵の次回攻撃までの残り時間をリアルタイムで表示
func (e *BattleEngine) GetTimeUntilNextAttack(state *BattleState) time.Duration {
	remaining := time.Until(state.NextAttackTime)
	if remaining < 0 {
		return 0
	}
	return remaining
}

// GetExpectedDamage は次の攻撃の予測ダメージを返します。
// Requirement 11.8: 次回攻撃の属性と予測ダメージ表示
func (e *BattleEngine) GetExpectedDamage(state *BattleState) int {
	attackPower := state.Enemy.AttackPower
	finalStats := state.Player.EffectTable.Calculate(domain.Stats{})
	damageReduction := finalStats.DamageReduction

	damage := int(float64(attackPower) * (1.0 - damageReduction))
	if damage < 1 {
		damage = 1
	}
	return damage
}

// GetAttackType は敵の攻撃タイプを返します。
// Requirement 11.8: 次回攻撃の属性表示
func (e *BattleEngine) GetAttackType(state *BattleState) string {
	return state.Enemy.Type.AttackType
}

// DetermineNextAction は敵の次回行動を決定します。
// Requirement 11.8: 次回攻撃の属性と予測ダメージ表示
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
// Requirement 11.8, 11.16-11.27: 行動予告に基づいた行動実行
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
// Requirement 11.8: 行動予告表示用
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
// Requirement 11.8: 行動予告表示用
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
// Requirement 11.15: HP50%以下で強化フェーズに移行
func (e *BattleEngine) CheckPhaseTransition(state *BattleState) bool {
	if state.Enemy.CheckAndTransitionPhase() {
		// Requirement 11.16: 強化フェーズ移行時に特殊攻撃解禁
		return true
	}
	return false
}

// ApplyEnemySelfBuff は敵に自己バフを付与します。
// Requirement 11.18-11.21: 自己バフ行動
func (e *BattleEngine) ApplyEnemySelfBuff(state *BattleState, buffType EnemyBuffType) {
	duration := 10.0 // 10秒間

	var modifiers domain.StatModifiers
	var name string

	switch buffType {
	case EnemyBuffAttackUp:
		// Requirement 11.18: 攻撃力UP
		name = "攻撃力UP"
		modifiers.STR_Mult = 1.3 // 30%攻撃力上昇
	case EnemyBuffPhysicalDamageDown:
		// Requirement 11.19: 物理ダメージ軽減
		name = "物理防御UP"
		modifiers.DamageReduction = 0.3 // 30%軽減
	case EnemyBuffMagicDamageDown:
		// Requirement 11.20: 魔法ダメージ軽減
		name = "魔法防御UP"
		modifiers.DamageReduction = 0.3 // 30%軽減
	}

	// Requirement 11.21: バフアイコンと効果時間を表示
	state.Enemy.EffectTable.AddRow(domain.EffectRow{
		ID:         uuid.New().String(),
		SourceType: domain.SourceBuff,
		Name:       name,
		Duration:   &duration,
		Modifiers:  modifiers,
	})
}

// ApplyPlayerDebuff はプレイヤーにデバフを付与します。
// Requirement 11.22-11.27: プレイヤーへのデバフ
func (e *BattleEngine) ApplyPlayerDebuff(state *BattleState, debuffType PlayerDebuffType) {
	duration := 8.0 // 8秒間

	var modifiers domain.StatModifiers
	var name string

	switch debuffType {
	case PlayerDebuffTypingTimeDown:
		// Requirement 11.22: タイピング制限時間短縮
		name = "タイピング時間短縮"
		modifiers.TypingTimeExt = -2.0 // 2秒短縮
	case PlayerDebuffTextShuffle:
		// Requirement 11.23: テキストシャッフル（特殊フラグとして扱う）
		name = "テキストシャッフル"
		// 実際のシャッフル処理はUI側で行う
	case PlayerDebuffDifficultyUp:
		// Requirement 11.24: 難易度上昇
		name = "難易度上昇"
		// 実際の難易度変更はチャレンジ生成時に行う
	case PlayerDebuffCooldownExtend:
		// Requirement 11.25: クールダウン延長
		name = "クールダウン延長"
		modifiers.CDReduction = -0.3 // 30%延長（マイナス値 = 延長）
	}

	// Requirement 11.26: デバフアイコンと残り時間を表示
	state.Player.EffectTable.AddRow(domain.EffectRow{
		ID:         uuid.New().String(),
		SourceType: domain.SourceDebuff,
		Name:       name,
		Duration:   &duration,
		Modifiers:  modifiers,
	})
}

// UpdateEffects はバフ・デバフの時間を更新します。
// Requirement 11.27: デバフの効果時間終了で解除
func (e *BattleEngine) UpdateEffects(state *BattleState, deltaSeconds float64) {
	state.Player.EffectTable.UpdateDurations(deltaSeconds)
	state.Enemy.EffectTable.UpdateDurations(deltaSeconds)
}

// SelectEnemySpecialAction は敵の特殊行動を選択して実行します。
// 強化フェーズ時のみ発動し、確率で自己バフまたはプレイヤーデバフを選択。
// Requirement 11.16-11.27: 強化フェーズでの特殊行動
func (e *BattleEngine) SelectEnemySpecialAction(state *BattleState) (actionTaken bool, message string) {
	// 強化フェーズ以外では特殊行動しない
	if state.Enemy == nil || !state.Enemy.IsEnhanced() {
		return false, ""
	}

	// 30%の確率で特殊行動を発動
	if e.rng.Float64() > 0.3 {
		return false, ""
	}

	// 50%で自己バフ、50%でプレイヤーデバフ
	if e.rng.Float64() < 0.5 {
		// 自己バフを選択（3種類からランダム）
		buffTypes := []EnemyBuffType{EnemyBuffAttackUp, EnemyBuffPhysicalDamageDown, EnemyBuffMagicDamageDown}
		buff := buffTypes[e.rng.Intn(len(buffTypes))]
		e.ApplyEnemySelfBuff(state, buff)
		return true, getEnemyBuffMessage(buff)
	}

	// プレイヤーデバフを選択（4種類からランダム）
	debuffTypes := []PlayerDebuffType{PlayerDebuffTypingTimeDown, PlayerDebuffTextShuffle, PlayerDebuffDifficultyUp, PlayerDebuffCooldownExtend}
	debuff := debuffTypes[e.rng.Intn(len(debuffTypes))]
	e.ApplyPlayerDebuff(state, debuff)
	return true, getPlayerDebuffMessage(debuff)
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

// CalculateModuleEffect はモジュール効果を計算します。
// Requirement 10.2, 10.3: ダメージ/回復量 = 基礎効果 × ステータス × 速度係数 × 正確性係数
// Requirement 10.9: 正確性50%未満で効果半減
func (e *BattleEngine) CalculateModuleEffect(
	agent *domain.AgentModel,
	module *domain.ModuleModel,
	typingResult *typing.TypingResult,
) int {
	// Requirement 10.1: 参照ステータスの取得
	var statValue int
	switch module.StatRef {
	case "STR":
		statValue = agent.BaseStats.STR
	case "MAG":
		statValue = agent.BaseStats.MAG
	case "SPD":
		statValue = agent.BaseStats.SPD
	case "LUK":
		statValue = agent.BaseStats.LUK
	default:
		statValue = agent.BaseStats.STR // デフォルト
	}

	// 基礎効果 × ステータス値 × スケール係数
	baseEffect := module.BaseEffect * float64(statValue) * EffectScaleFactor

	// 速度係数と正確性係数を適用
	effect := baseEffect * typingResult.SpeedFactor * typingResult.AccuracyFactor

	// Requirement 10.9: 正確性50%未満で効果半減
	if typingResult.AccuracyFactor < AccuracyPenaltyThreshold {
		effect *= 0.5
	}

	return int(effect)
}

// ApplyModuleEffect はモジュール効果を適用します。
// Requirement 10.2-10.5: 攻撃、回復、バフ、デバフの効果適用
func (e *BattleEngine) ApplyModuleEffect(
	state *BattleState,
	agent *domain.AgentModel,
	module *domain.ModuleModel,
	typingResult *typing.TypingResult,
) int {
	effectAmount := e.CalculateModuleEffect(agent, module, typingResult)

	switch module.Category {
	case domain.PhysicalAttack, domain.MagicAttack:
		// Requirement 10.2: 攻撃系モジュール - 敵にダメージ
		// 敵のダメージ軽減を考慮
		enemyStats := state.Enemy.EffectTable.Calculate(domain.Stats{})
		damage := int(float64(effectAmount) * (1.0 - enemyStats.DamageReduction))
		if damage < 1 {
			damage = 1
		}
		state.Enemy.TakeDamage(damage)
		state.Stats.TotalDamageDealt += damage
		return damage

	case domain.Heal:
		// Requirement 10.3: 回復系モジュール - プレイヤーHP回復
		state.Player.Heal(effectAmount)
		state.Stats.TotalHealAmount += effectAmount
		return effectAmount

	case domain.Buff:
		// Requirement 10.4: バフ系モジュール - プレイヤーにバフ
		e.applyPlayerBuff(state, module, effectAmount)
		return effectAmount

	case domain.Debuff:
		// Requirement 10.5: デバフ系モジュール - 敵にデバフ
		e.applyEnemyDebuff(state, module, effectAmount)
		return effectAmount
	}

	return 0
}

// applyPlayerBuff はプレイヤーにバフを付与します。
func (e *BattleEngine) applyPlayerBuff(state *BattleState, module *domain.ModuleModel, effectAmount int) {
	duration := 10.0 // 10秒間

	modifiers := domain.StatModifiers{}
	switch module.StatRef {
	case "STR":
		modifiers.STR_Add = effectAmount
	case "MAG":
		modifiers.MAG_Add = effectAmount
	case "SPD":
		modifiers.SPD_Add = effectAmount
		modifiers.CDReduction = float64(effectAmount) * 0.01 // SPDに応じたCD短縮
	case "LUK":
		modifiers.LUK_Add = effectAmount
		modifiers.CritRate = float64(effectAmount) * 0.01 // LUKに応じたクリティカル率
	}

	state.Player.EffectTable.AddRow(domain.EffectRow{
		ID:         uuid.New().String(),
		SourceType: domain.SourceBuff,
		Name:       module.Name,
		Duration:   &duration,
		Modifiers:  modifiers,
	})
}

// applyEnemyDebuff は敵にデバフを付与します。
func (e *BattleEngine) applyEnemyDebuff(state *BattleState, module *domain.ModuleModel, effectAmount int) {
	duration := 8.0 // 8秒間

	modifiers := domain.StatModifiers{}
	switch module.StatRef {
	case "STR":
		modifiers.STR_Add = -effectAmount // 攻撃力低下
	case "MAG":
		modifiers.MAG_Add = -effectAmount
	case "SPD":
		modifiers.SPD_Add = -effectAmount // 速度低下
	}

	state.Enemy.EffectTable.AddRow(domain.EffectRow{
		ID:         uuid.New().String(),
		SourceType: domain.SourceDebuff,
		Name:       module.Name,
		Duration:   &duration,
		Modifiers:  modifiers,
	})
}

// ==================== バトル勝敗判定（Task 7.5） ====================

// CheckBattleEnd はバトル終了を判定します。
// Requirement 9.16: プレイヤーHP=0での敗北
// Requirement 9.17: 敵HP=0での勝利
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
// Requirement 3.9: バトル勝利時に到達最高レベルを更新
func (e *BattleEngine) ShouldUpdateMaxLevel(battleLevel, currentMaxLevel int) bool {
	return battleLevel > currentMaxLevel
}
