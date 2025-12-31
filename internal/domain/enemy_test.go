// Package domain はゲームのドメインモデルを定義します。
package domain

import (
	"testing"
	"time"
)

// TestEnemyPhase_定数の確認 はEnemyPhase定数が正しく定義されていることを確認します。
func TestEnemyPhase_定数の確認(t *testing.T) {
	if PhaseNormal != 0 {
		t.Errorf("PhaseNormalが期待値と異なります: got %d, want 0", PhaseNormal)
	}
	if PhaseEnhanced != 1 {
		t.Errorf("PhaseEnhancedが期待値と異なります: got %d, want 1", PhaseEnhanced)
	}
}

// TestEnemyPhase_String はEnemyPhaseのString()メソッドが正しい表示名を返すことを確認します。
func TestEnemyPhase_String(t *testing.T) {
	if PhaseNormal.String() != "通常" {
		t.Errorf("PhaseNormal.String()が期待値と異なります: got %s, want 通常", PhaseNormal.String())
	}
	if PhaseEnhanced.String() != "強化" {
		t.Errorf("PhaseEnhanced.String()が期待値と異なります: got %s, want 強化", PhaseEnhanced.String())
	}
}

// TestEnemyType_フィールドの確認 はEnemyType構造体のフィールドが正しく設定されることを確認します。
func TestEnemyType_フィールドの確認(t *testing.T) {
	enemyType := EnemyType{
		ID:                 "goblin",
		Name:               "ゴブリン",
		BaseHP:             100,
		BaseAttackPower:    10,
		BaseAttackInterval: 3 * time.Second,
		AttackType:         "physical",
	}

	if enemyType.ID != "goblin" {
		t.Errorf("IDが期待値と異なります: got %s, want goblin", enemyType.ID)
	}
	if enemyType.Name != "ゴブリン" {
		t.Errorf("Nameが期待値と異なります: got %s, want ゴブリン", enemyType.Name)
	}
	if enemyType.BaseHP != 100 {
		t.Errorf("BaseHPが期待値と異なります: got %d, want 100", enemyType.BaseHP)
	}
	if enemyType.BaseAttackPower != 10 {
		t.Errorf("BaseAttackPowerが期待値と異なります: got %d, want 10", enemyType.BaseAttackPower)
	}
	if enemyType.BaseAttackInterval != 3*time.Second {
		t.Errorf("BaseAttackIntervalが期待値と異なります: got %v, want 3s", enemyType.BaseAttackInterval)
	}
	if enemyType.AttackType != "physical" {
		t.Errorf("AttackTypeが期待値と異なります: got %s, want physical", enemyType.AttackType)
	}
}

// TestEnemyModel_フィールドの確認 はEnemyModel構造体のフィールドが正しく設定されることを確認します。

func TestEnemyModel_フィールドの確認(t *testing.T) {
	enemyType := EnemyType{
		ID:                 "goblin",
		Name:               "ゴブリン",
		BaseHP:             100,
		BaseAttackPower:    10,
		BaseAttackInterval: 3 * time.Second,
	}

	enemy := EnemyModel{
		ID:             "enemy_001",
		Name:           "ゴブリン兵士",
		Level:          5,
		HP:             150,
		MaxHP:          150,
		AttackPower:    15,
		AttackInterval: 2500 * time.Millisecond,
		Type:           enemyType,
		Phase:          PhaseNormal,
		EffectTable:    NewEffectTable(),
	}

	if enemy.ID != "enemy_001" {
		t.Errorf("IDが期待値と異なります: got %s, want enemy_001", enemy.ID)
	}
	if enemy.Name != "ゴブリン兵士" {
		t.Errorf("Nameが期待値と異なります: got %s, want ゴブリン兵士", enemy.Name)
	}
	if enemy.Level != 5 {
		t.Errorf("Levelが期待値と異なります: got %d, want 5", enemy.Level)
	}
	if enemy.HP != 150 {
		t.Errorf("HPが期待値と異なります: got %d, want 150", enemy.HP)
	}
	if enemy.MaxHP != 150 {
		t.Errorf("MaxHPが期待値と異なります: got %d, want 150", enemy.MaxHP)
	}
	if enemy.AttackPower != 15 {
		t.Errorf("AttackPowerが期待値と異なります: got %d, want 15", enemy.AttackPower)
	}
	if enemy.Phase != PhaseNormal {
		t.Errorf("Phaseが期待値と異なります: got %d, want PhaseNormal", enemy.Phase)
	}
	if enemy.EffectTable == nil {
		t.Error("EffectTableがnilです")
	}
}

// TestNewEnemy_敵作成 はNewEnemy関数で敵が正しく作成されることを確認します。
func TestNewEnemy_敵作成(t *testing.T) {
	enemyType := EnemyType{
		ID:                 "goblin",
		Name:               "ゴブリン",
		BaseHP:             100,
		BaseAttackPower:    10,
		BaseAttackInterval: 3 * time.Second,
	}

	enemy := NewEnemy("enemy_001", "ゴブリン兵士", 5, 150, 15, 2500*time.Millisecond, enemyType)

	if enemy.ID != "enemy_001" {
		t.Errorf("IDが期待値と異なります: got %s, want enemy_001", enemy.ID)
	}
	if enemy.Phase != PhaseNormal {
		t.Error("初期状態はPhaseNormalであるべきです")
	}
	if enemy.EffectTable == nil {
		t.Error("EffectTableが初期化されていません")
	}
}

// TestEnemyModel_HP50以下でフェーズ変化 は敵のHPが50%以下でフェーズ変化するルールを確認します。

func TestEnemyModel_HP50以下でフェーズ変化(t *testing.T) {
	tests := []struct {
		name          string
		maxHP         int
		currentHP     int
		shouldEnhance bool
	}{
		{"HP100% (100/100)", 100, 100, false},
		{"HP60% (60/100)", 100, 60, false},
		{"HP51% (51/100)", 100, 51, false},
		{"HP50% (50/100)", 100, 50, true}, // 50%以下で強化
		{"HP49% (49/100)", 100, 49, true},
		{"HP10% (10/100)", 100, 10, true},
		{"HP0% (0/100)", 100, 0, true},
		{"HP50% (25/50)", 50, 25, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			enemy := EnemyModel{
				HP:    tt.currentHP,
				MaxHP: tt.maxHP,
				Phase: PhaseNormal,
			}

			shouldTransition := enemy.ShouldTransitionToEnhanced()

			if shouldTransition != tt.shouldEnhance {
				t.Errorf("ShouldTransitionToEnhancedの結果が期待値と異なります: got %v, want %v",
					shouldTransition, tt.shouldEnhance)
			}
		})
	}
}

// TestEnemyModel_フェーズ移行 は敵のフェーズ移行を確認します。

func TestEnemyModel_フェーズ移行(t *testing.T) {
	enemy := EnemyModel{
		HP:    50,
		MaxHP: 100,
		Phase: PhaseNormal,
	}

	// 移行前
	if enemy.Phase != PhaseNormal {
		t.Error("初期状態はPhaseNormalであるべきです")
	}

	// フェーズ移行
	enemy.TransitionToEnhanced()

	// 移行後
	if enemy.Phase != PhaseEnhanced {
		t.Error("移行後はPhaseEnhancedであるべきです")
	}
}

// TestEnemyModel_フェーズ移行は1回のみ はフェーズ移行が2回行われないことを確認します。
func TestEnemyModel_フェーズ移行は1回のみ(t *testing.T) {
	enemy := EnemyModel{
		HP:    30,
		MaxHP: 100,
		Phase: PhaseEnhanced, // 既に強化フェーズ
	}

	// 強化フェーズ中は再移行しない
	if enemy.ShouldTransitionToEnhanced() {
		t.Error("既にPhaseEnhancedの場合、ShouldTransitionToEnhancedはfalseを返すべきです")
	}
}

// TestEnemyModel_ダメージ受け はダメージを受けてHPが減少することを確認します。
func TestEnemyModel_ダメージ受け(t *testing.T) {
	enemy := EnemyModel{
		HP:    100,
		MaxHP: 100,
		Phase: PhaseNormal,
	}

	// ダメージを受ける
	enemy.TakeDamage(30)
	if enemy.HP != 70 {
		t.Errorf("ダメージ後のHPが期待値と異なります: got %d, want 70", enemy.HP)
	}

	// 致死ダメージ（HPは0以下にならない）
	enemy.TakeDamage(100)
	if enemy.HP != 0 {
		t.Errorf("HPが0未満になっています: got %d, want 0", enemy.HP)
	}
}

// TestEnemyModel_生存確認 は敵の生存確認を確認します。
func TestEnemyModel_生存確認(t *testing.T) {
	enemy := EnemyModel{
		HP:    100,
		MaxHP: 100,
	}

	// 生存状態
	if !enemy.IsAlive() {
		t.Error("HPが0より大きい場合は生存しているはずです")
	}

	// 死亡状態
	enemy.HP = 0
	if enemy.IsAlive() {
		t.Error("HP=0の場合は死亡しているはずです")
	}
}

// TestEnemyModel_HP割合取得 はHP割合の取得を確認します。
func TestEnemyModel_HP割合取得(t *testing.T) {
	tests := []struct {
		name     string
		hp       int
		maxHP    int
		expected float64
	}{
		{"100%", 100, 100, 1.0},
		{"50%", 50, 100, 0.5},
		{"0%", 0, 100, 0.0},
		{"75%", 75, 100, 0.75},
		{"MaxHP=0", 0, 0, 0.0}, // ゼロ除算対応
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			enemy := EnemyModel{HP: tt.hp, MaxHP: tt.maxHP}
			percentage := enemy.GetHPPercentage()

			if percentage != tt.expected {
				t.Errorf("HP割合が期待値と異なります: got %f, want %f", percentage, tt.expected)
			}
		})
	}
}

// TestEnemyModel_強化フェーズ判定 は現在強化フェーズかどうかを確認します。
func TestEnemyModel_強化フェーズ判定(t *testing.T) {
	enemy := EnemyModel{Phase: PhaseNormal}
	if enemy.IsEnhanced() {
		t.Error("PhaseNormalではIsEnhanced()はfalseを返すべきです")
	}

	enemy.Phase = PhaseEnhanced
	if !enemy.IsEnhanced() {
		t.Error("PhaseEnhancedではIsEnhanced()はtrueを返すべきです")
	}
}

// TestEnemyModel_EffectTable操作 は敵のEffectTableを操作できることを確認します。
func TestEnemyModel_EffectTable操作(t *testing.T) {
	enemy := NewEnemy("enemy_001", "テスト敵", 5, 100, 15, 3*time.Second, EnemyType{ID: "test"})

	// バフを追加
	enemy.EffectTable.AddBuff("攻撃力UP", 5.0, map[EffectColumn]float64{
		ColDamageBonus: 10,
	})

	if len(enemy.EffectTable.Entries) != 1 {
		t.Errorf("EffectTableのエントリ数が期待値と異なります: got %d, want 1", len(enemy.EffectTable.Entries))
	}
}

// TestEnemyModel_CheckAndTransitionPhase はHP変化後のフェーズ移行チェックを確認します。
func TestEnemyModel_CheckAndTransitionPhase(t *testing.T) {
	enemy := EnemyModel{
		HP:    60,
		MaxHP: 100,
		Phase: PhaseNormal,
	}

	// まだ移行しない
	transitioned := enemy.CheckAndTransitionPhase()
	if transitioned {
		t.Error("HP60%ではフェーズ移行しないはずです")
	}
	if enemy.Phase != PhaseNormal {
		t.Error("フェーズがまだNormalであるべきです")
	}

	// HP減少
	enemy.HP = 50

	// フェーズ移行
	transitioned = enemy.CheckAndTransitionPhase()
	if !transitioned {
		t.Error("HP50%ではフェーズ移行するはずです")
	}
	if enemy.Phase != PhaseEnhanced {
		t.Error("フェーズがEnhancedに変わるべきです")
	}
}

// TestEnhanceThreshold は強化フェーズ移行の閾値が正しい値であることを確認します。
func TestEnhanceThreshold(t *testing.T) {
	if EnhanceThreshold != 0.5 {
		t.Errorf("EnhanceThresholdが期待値と異なります: got %f, want 0.5", EnhanceThreshold)
	}
}

// ========== タスク1.1: 敵の行動データ構造のテスト ==========

// TestEnemyActionType_定数の確認 はEnemyActionType定数が正しく定義されていることを確認します。
func TestEnemyActionType_定数の確認(t *testing.T) {
	// 行動タイプは Attack, SelfBuff, Debuff の3種類
	if EnemyActionAttack != 0 {
		t.Errorf("EnemyActionAttackが期待値と異なります: got %d, want 0", EnemyActionAttack)
	}
	if EnemyActionSelfBuff != 1 {
		t.Errorf("EnemyActionSelfBuffが期待値と異なります: got %d, want 1", EnemyActionSelfBuff)
	}
	if EnemyActionDebuff != 2 {
		t.Errorf("EnemyActionDebuffが期待値と異なります: got %d, want 2", EnemyActionDebuff)
	}
}

// TestEnemyActionType_String はEnemyActionTypeのString()メソッドが正しい表示名を返すことを確認します。
func TestEnemyActionType_String(t *testing.T) {
	tests := []struct {
		actionType EnemyActionType
		expected   string
	}{
		{EnemyActionAttack, "攻撃"},
		{EnemyActionSelfBuff, "自己バフ"},
		{EnemyActionDebuff, "デバフ"},
		{EnemyActionType(99), "不明"}, // 未定義値
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			if tt.actionType.String() != tt.expected {
				t.Errorf("String()が期待値と異なります: got %s, want %s", tt.actionType.String(), tt.expected)
			}
		})
	}
}

// TestEnemyAction_攻撃行動のフィールド は攻撃行動のフィールドが正しく設定されることを確認します。
func TestEnemyAction_攻撃行動のフィールド(t *testing.T) {
	// 物理攻撃
	physicalAttack := EnemyAction{
		ActionType: EnemyActionAttack,
		AttackType: "physical",
	}
	if physicalAttack.ActionType != EnemyActionAttack {
		t.Error("ActionTypeがAttackであるべきです")
	}
	if physicalAttack.AttackType != "physical" {
		t.Errorf("AttackTypeが期待値と異なります: got %s, want physical", physicalAttack.AttackType)
	}

	// 魔法攻撃
	magicAttack := EnemyAction{
		ActionType: EnemyActionAttack,
		AttackType: "magic",
	}
	if magicAttack.AttackType != "magic" {
		t.Errorf("AttackTypeが期待値と異なります: got %s, want magic", magicAttack.AttackType)
	}
}

// TestEnemyAction_バフ行動のフィールド は自己バフ行動のフィールドが正しく設定されることを確認します。
func TestEnemyAction_バフ行動のフィールド(t *testing.T) {
	buff := EnemyAction{
		ActionType:  EnemyActionSelfBuff,
		EffectType:  "attackUp",
		EffectValue: 0.3,
		Duration:    10.0,
	}

	if buff.ActionType != EnemyActionSelfBuff {
		t.Error("ActionTypeがSelfBuffであるべきです")
	}
	if buff.EffectType != "attackUp" {
		t.Errorf("EffectTypeが期待値と異なります: got %s, want attackUp", buff.EffectType)
	}
	if buff.EffectValue != 0.3 {
		t.Errorf("EffectValueが期待値と異なります: got %f, want 0.3", buff.EffectValue)
	}
	if buff.Duration != 10.0 {
		t.Errorf("Durationが期待値と異なります: got %f, want 10.0", buff.Duration)
	}
}

// TestEnemyAction_デバフ行動のフィールド はデバフ行動のフィールドが正しく設定されることを確認します。
func TestEnemyAction_デバフ行動のフィールド(t *testing.T) {
	debuff := EnemyAction{
		ActionType:  EnemyActionDebuff,
		EffectType:  "defenseDown",
		EffectValue: 0.2,
		Duration:    5.0,
	}

	if debuff.ActionType != EnemyActionDebuff {
		t.Error("ActionTypeがDebuffであるべきです")
	}
	if debuff.EffectType != "defenseDown" {
		t.Errorf("EffectTypeが期待値と異なります: got %s, want defenseDown", debuff.EffectType)
	}
	if debuff.EffectValue != 0.2 {
		t.Errorf("EffectValueが期待値と異なります: got %f, want 0.2", debuff.EffectValue)
	}
	if debuff.Duration != 5.0 {
		t.Errorf("Durationが期待値と異なります: got %f, want 5.0", debuff.Duration)
	}
}

// TestEnemyAction_IsAttack は攻撃行動かどうかを判定するヘルパーメソッドを確認します。
func TestEnemyAction_IsAttack(t *testing.T) {
	attack := EnemyAction{ActionType: EnemyActionAttack}
	buff := EnemyAction{ActionType: EnemyActionSelfBuff}
	debuff := EnemyAction{ActionType: EnemyActionDebuff}

	if !attack.IsAttack() {
		t.Error("Attack行動でIsAttack()がtrueを返すべきです")
	}
	if buff.IsAttack() {
		t.Error("SelfBuff行動でIsAttack()がfalseを返すべきです")
	}
	if debuff.IsAttack() {
		t.Error("Debuff行動でIsAttack()がfalseを返すべきです")
	}
}

// TestEnemyAction_IsBuff はバフ行動かどうかを判定するヘルパーメソッドを確認します。
func TestEnemyAction_IsBuff(t *testing.T) {
	attack := EnemyAction{ActionType: EnemyActionAttack}
	buff := EnemyAction{ActionType: EnemyActionSelfBuff}
	debuff := EnemyAction{ActionType: EnemyActionDebuff}

	if attack.IsBuff() {
		t.Error("Attack行動でIsBuff()がfalseを返すべきです")
	}
	if !buff.IsBuff() {
		t.Error("SelfBuff行動でIsBuff()がtrueを返すべきです")
	}
	if debuff.IsBuff() {
		t.Error("Debuff行動でIsBuff()がfalseを返すべきです")
	}
}

// TestEnemyAction_IsDebuff はデバフ行動かどうかを判定するヘルパーメソッドを確認します。
func TestEnemyAction_IsDebuff(t *testing.T) {
	attack := EnemyAction{ActionType: EnemyActionAttack}
	buff := EnemyAction{ActionType: EnemyActionSelfBuff}
	debuff := EnemyAction{ActionType: EnemyActionDebuff}

	if attack.IsDebuff() {
		t.Error("Attack行動でIsDebuff()がfalseを返すべきです")
	}
	if buff.IsDebuff() {
		t.Error("SelfBuff行動でIsDebuff()がfalseを返すべきです")
	}
	if !debuff.IsDebuff() {
		t.Error("Debuff行動でIsDebuff()がtrueを返すべきです")
	}
}

// ========== タスク1.2: 敵パッシブスキルのデータ構造のテスト ==========

// TestEnemyPassiveSkill_フィールドの確認 はEnemyPassiveSkill構造体のフィールドが正しく設定されることを確認します。
func TestEnemyPassiveSkill_フィールドの確認(t *testing.T) {
	passive := EnemyPassiveSkill{
		ID:          "slime_normal",
		Name:        "ぷるぷるボディ",
		Description: "物理ダメージを10%軽減",
		Effects: map[EffectColumn]float64{
			ColDamageCut: 0.1,
		},
	}

	if passive.ID != "slime_normal" {
		t.Errorf("IDが期待値と異なります: got %s, want slime_normal", passive.ID)
	}
	if passive.Name != "ぷるぷるボディ" {
		t.Errorf("Nameが期待値と異なります: got %s, want ぷるぷるボディ", passive.Name)
	}
	expectedDesc := "物理ダメージを10%軽減"
	if passive.Description != expectedDesc {
		t.Errorf("Descriptionが期待値と異なります: got %s, want %s", passive.Description, expectedDesc)
	}
	if len(passive.Effects) != 1 {
		t.Errorf("Effectsの要素数が期待値と異なります: got %d, want 1", len(passive.Effects))
	}
	if passive.Effects[ColDamageCut] != 0.1 {
		t.Errorf("Effects[ColDamageCut]が期待値と異なります: got %f, want 0.1", passive.Effects[ColDamageCut])
	}
}

// TestEnemyPassiveSkill_複数効果 は複数の効果を持つパッシブスキルを確認します。
func TestEnemyPassiveSkill_複数効果(t *testing.T) {
	passive := EnemyPassiveSkill{
		ID:          "boss_enhanced",
		Name:        "狂戦士の怒り",
		Description: "攻撃力20%上昇、ライフスティール10%",
		Effects: map[EffectColumn]float64{
			ColDamageMultiplier: 1.2,
			ColLifeSteal:        0.1,
		},
	}

	if len(passive.Effects) != 2 {
		t.Errorf("Effectsの要素数が期待値と異なります: got %d, want 2", len(passive.Effects))
	}
	if passive.Effects[ColDamageMultiplier] != 1.2 {
		t.Errorf("Effects[ColDamageMultiplier]が期待値と異なります: got %f, want 1.2", passive.Effects[ColDamageMultiplier])
	}
	if passive.Effects[ColLifeSteal] != 0.1 {
		t.Errorf("Effects[ColLifeSteal]が期待値と異なります: got %f, want 0.1", passive.Effects[ColLifeSteal])
	}
}

// TestEnemyPassiveSkill_ToEntry はEffectEntryへの変換を確認します。
func TestEnemyPassiveSkill_ToEntry(t *testing.T) {
	passive := EnemyPassiveSkill{
		ID:          "slime_normal",
		Name:        "ぷるぷるボディ",
		Description: "物理ダメージを10%軽減",
		Effects: map[EffectColumn]float64{
			ColDamageCut: 0.1,
		},
	}

	entry := passive.ToEntry()

	// ソースタイプはパッシブであること
	if entry.SourceType != SourcePassive {
		t.Errorf("SourceTypeが期待値と異なります: got %s, want %s", entry.SourceType, SourcePassive)
	}
	// ソースIDはパッシブのIDと一致すること
	if entry.SourceID != passive.ID {
		t.Errorf("SourceIDが期待値と異なります: got %s, want %s", entry.SourceID, passive.ID)
	}
	// 表示名はパッシブの名前と一致すること
	if entry.Name != passive.Name {
		t.Errorf("Nameが期待値と異なります: got %s, want %s", entry.Name, passive.Name)
	}
	// 永続効果であること（Durationがnil）
	if entry.Duration != nil {
		t.Error("パッシブスキルは永続効果（Duration=nil）であるべきです")
	}
	// 効果値が正しく変換されていること
	if entry.Values[ColDamageCut] != 0.1 {
		t.Errorf("Values[ColDamageCut]が期待値と異なります: got %f, want 0.1", entry.Values[ColDamageCut])
	}
}

// TestEnemyPassiveSkill_ToEntry_複数効果 は複数効果のEffectEntry変換を確認します。
func TestEnemyPassiveSkill_ToEntry_複数効果(t *testing.T) {
	passive := EnemyPassiveSkill{
		ID:   "boss_enhanced",
		Name: "狂戦士の怒り",
		Effects: map[EffectColumn]float64{
			ColDamageMultiplier: 1.2,
			ColLifeSteal:        0.1,
		},
	}

	entry := passive.ToEntry()

	if len(entry.Values) != 2 {
		t.Errorf("Valuesの要素数が期待値と異なります: got %d, want 2", len(entry.Values))
	}
	if entry.Values[ColDamageMultiplier] != 1.2 {
		t.Errorf("Values[ColDamageMultiplier]が期待値と異なります: got %f, want 1.2", entry.Values[ColDamageMultiplier])
	}
	if entry.Values[ColLifeSteal] != 0.1 {
		t.Errorf("Values[ColLifeSteal]が期待値と異なります: got %f, want 0.1", entry.Values[ColLifeSteal])
	}
}

// TestEnemyPassiveSkill_EffectTableとの連携 はEffectTableにパッシブスキルを登録できることを確認します。
func TestEnemyPassiveSkill_EffectTableとの連携(t *testing.T) {
	passive := EnemyPassiveSkill{
		ID:   "slime_normal",
		Name: "ぷるぷるボディ",
		Effects: map[EffectColumn]float64{
			ColDamageCut: 0.1,
		},
	}

	table := NewEffectTable()
	table.AddEntry(passive.ToEntry())

	// エントリが追加されていること
	if len(table.Entries) != 1 {
		t.Errorf("エントリ数が期待値と異なります: got %d, want 1", len(table.Entries))
	}

	// パッシブを検索できること
	passives := table.FindBySourceType(SourcePassive)
	if len(passives) != 1 {
		t.Errorf("パッシブスキル数が期待値と異なります: got %d, want 1", len(passives))
	}

	// SourceIDで検索できること
	found := table.FindBySourceID("slime_normal")
	if found == nil {
		t.Error("SourceIDで検索できませんでした")
	}
}
