// Package domain はゲームのドメインモデルを定義します。
package domain

// HPCoefficient はプレイヤーの最大HP計算に使用する係数です。
// MaxHP = 装備中エージェントのコアレベル平均 × HP係数
// Requirement 4.1, 20.7に基づく
const HPCoefficient = 10.0

// PlayerModel はゲーム内のプレイヤーエンティティを表す構造体です。
// プレイヤーはHP（敵の攻撃対象）とバフ・デバフ状態（一時的なステータス効果）を持ちます。
// Requirements 4.1-4.7に基づいて設計されています。
type PlayerModel struct {
	// HP はプレイヤーの現在HP値です。
	// Requirement 4.4: バトル画面に現在HPを常時表示
	HP int

	// MaxHP はプレイヤーの最大HP値です。
	// Requirement 4.1: 装備中エージェントのコアレベル平均 × HP係数で計算
	MaxHP int

	// EffectTable はプレイヤーに適用されているステータス効果テーブルです。
	// バフ/デバフ/コア特性/モジュールパッシブなどの効果を集約します。
	// Requirement 4.5: バフ・デバフの効果名、効果時間、効果量を表示
	// Requirement 4.6: バフ・デバフの効果時間経過で削除
	EffectTable *EffectTable
}

// NewPlayer は新しいPlayerModelを作成します。
// 初期状態ではHP/MaxHPは0で、エージェント装備後にRecalculateHPで計算されます。
func NewPlayer() *PlayerModel {
	return &PlayerModel{
		HP:          0,
		MaxHP:       0,
		EffectTable: NewEffectTable(),
	}
}

// CalculateMaxHP は装備中エージェントのコアレベル平均からMaxHPを計算します。
// Requirement 4.1: HP = 装備中エージェントのコアレベル平均 × HP係数
// エージェントが装備されていない場合は0を返します。
func CalculateMaxHP(agents []*AgentModel) int {
	if len(agents) == 0 {
		return 0
	}

	totalLevel := 0
	for _, agent := range agents {
		totalLevel += agent.Level
	}

	// 平均レベル × HP係数
	avgLevel := float64(totalLevel) / float64(len(agents))
	return int(avgLevel * HPCoefficient)
}

// RecalculateHP は装備エージェントに基づいてMaxHPを再計算し、HPを全回復します。
// Requirement 4.2: エージェントの装備・装備解除時にMaxHPを再計算し更新
func (p *PlayerModel) RecalculateHP(agents []*AgentModel) {
	p.MaxHP = CalculateMaxHP(agents)
	p.HP = p.MaxHP
}

// FullHeal はHPを最大値まで回復します。
func (p *PlayerModel) FullHeal() {
	p.HP = p.MaxHP
}

// TakeDamage はダメージを受けてHPを減少させます。
// HPは0未満にはなりません。
func (p *PlayerModel) TakeDamage(damage int) {
	p.HP -= damage
	if p.HP < 0 {
		p.HP = 0
	}
}

// Heal はHPを回復します。
// HPはMaxHPを超えません。
func (p *PlayerModel) Heal(amount int) {
	p.HP += amount
	if p.HP > p.MaxHP {
		p.HP = p.MaxHP
	}
}

// IsAlive はプレイヤーが生存しているかどうかを返します。
// HP > 0 の場合に生存とみなします。
func (p *PlayerModel) IsAlive() bool {
	return p.HP > 0
}

// PrepareForBattle はバトル開始時の準備を行います。
// Requirement 4.3: バトル開始時にHPを最大値まで全回復
// Requirement 4.7: HPを次のバトルに持ち越さない
func (p *PlayerModel) PrepareForBattle() {
	p.FullHeal()
	// EffectTableもリセット（バトル間で効果を持ち越さない）
	p.EffectTable = NewEffectTable()
}

// GetHPPercentage はHPの残り割合を0.0〜1.0で返します。
func (p *PlayerModel) GetHPPercentage() float64 {
	if p.MaxHP == 0 {
		return 0.0
	}
	return float64(p.HP) / float64(p.MaxHP)
}
