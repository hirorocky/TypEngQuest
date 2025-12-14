// Package domain はゲームのドメインモデルを定義します。
package domain

import (
	"testing"
)

// TestPassiveTriggerType_定数の確認 はPassiveTriggerType定数が正しく定義されていることを確認します。
func TestPassiveTriggerType_定数の確認(t *testing.T) {
	tests := []struct {
		name        string
		triggerType PassiveTriggerType
		expected    string
	}{
		{"永続効果", PassiveTriggerPermanent, "permanent"},
		{"条件付き", PassiveTriggerConditional, "conditional"},
		{"確率トリガー", PassiveTriggerProbability, "probability"},
		{"スタック型", PassiveTriggerStack, "stack"},
		{"反応型", PassiveTriggerReactive, "reactive"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.triggerType) != tt.expected {
				t.Errorf("PassiveTriggerTypeが期待値と異なります: got %s, want %s", tt.triggerType, tt.expected)
			}
		})
	}
}

// TestPassiveEffectType_定数の確認 はPassiveEffectType定数が正しく定義されていることを確認します。
func TestPassiveEffectType_定数の確認(t *testing.T) {
	tests := []struct {
		name       string
		effectType PassiveEffectType
		expected   string
	}{
		{"ステータス修正", PassiveEffectModifier, "modifier"},
		{"効果倍率", PassiveEffectMultiplier, "multiplier"},
		{"特殊効果", PassiveEffectSpecial, "special"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.effectType) != tt.expected {
				t.Errorf("PassiveEffectTypeが期待値と異なります: got %s, want %s", tt.effectType, tt.expected)
			}
		})
	}
}

// TestTriggerConditionType_定数の確認 はTriggerConditionType定数が正しく定義されていることを確認します。
func TestTriggerConditionType_定数の確認(t *testing.T) {
	tests := []struct {
		name          string
		conditionType TriggerConditionType
		expected      string
	}{
		{"正確性一致", TriggerConditionAccuracyEquals, "accuracy_equals"},
		{"WPM以上", TriggerConditionWPMAbove, "wpm_above"},
		{"HP以下（割合）", TriggerConditionHPBelowPercent, "hp_below_percent"},
		{"敵HP以下（割合）", TriggerConditionEnemyHPBelowPercent, "enemy_hp_below_percent"},
		{"敵デバフ中", TriggerConditionEnemyHasDebuff, "enemy_has_debuff"},
		{"スキル使用時", TriggerConditionOnSkillUse, "on_skill_use"},
		{"被ダメージ時", TriggerConditionOnDamageReceived, "on_damage_received"},
		{"回復時", TriggerConditionOnHeal, "on_heal"},
		{"バフ/デバフ使用時", TriggerConditionOnBuffDebuffUse, "on_buff_debuff_use"},
		{"物理攻撃時", TriggerConditionOnPhysicalAttack, "on_physical_attack"},
		{"タイピングミス時", TriggerConditionOnTypingMiss, "on_typing_miss"},
		{"時間切れ時", TriggerConditionOnTimeout, "on_timeout"},
		{"デバフ受け時", TriggerConditionOnDebuffReceived, "on_debuff_received"},
		{"戦闘開始時", TriggerConditionOnBattleStart, "on_battle_start"},
		{"ミスなし連続", TriggerConditionNoMissStreak, "no_miss_streak"},
		{"同種攻撃カウント", TriggerConditionSameAttackCount, "same_attack_count"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.conditionType) != tt.expected {
				t.Errorf("TriggerConditionTypeが期待値と異なります: got %s, want %s", tt.conditionType, tt.expected)
			}
		})
	}
}

// TestTriggerCondition_作成 はTriggerConditionが正しく作成されることを確認します。
func TestTriggerCondition_作成(t *testing.T) {
	condition := TriggerCondition{
		Type:  TriggerConditionAccuracyEquals,
		Value: 100,
	}

	if condition.Type != TriggerConditionAccuracyEquals {
		t.Errorf("Typeが期待値と異なります: got %s, want %s", condition.Type, TriggerConditionAccuracyEquals)
	}
	if condition.Value != 100 {
		t.Errorf("Valueが期待値と異なります: got %f, want 100", condition.Value)
	}
}

// TestPassiveSkillDefinition_作成 はPassiveSkillDefinitionが正しく作成されることを確認します。
func TestPassiveSkillDefinition_作成(t *testing.T) {
	def := PassiveSkillDefinition{
		ID:          "ps_perfect_rhythm",
		Name:        "パーフェクトリズム",
		Description: "正確性100%でスキル効果1.5倍",
		TriggerType: PassiveTriggerConditional,
		TriggerCondition: &TriggerCondition{
			Type:  TriggerConditionAccuracyEquals,
			Value: 100,
		},
		EffectType:  PassiveEffectMultiplier,
		EffectValue: 1.5,
		Probability: 0,
	}

	if def.ID != "ps_perfect_rhythm" {
		t.Errorf("IDが期待値と異なります: got %s, want ps_perfect_rhythm", def.ID)
	}
	if def.Name != "パーフェクトリズム" {
		t.Errorf("Nameが期待値と異なります: got %s, want パーフェクトリズム", def.Name)
	}
	if def.TriggerType != PassiveTriggerConditional {
		t.Errorf("TriggerTypeが期待値と異なります: got %s, want %s", def.TriggerType, PassiveTriggerConditional)
	}
	if def.TriggerCondition == nil {
		t.Error("TriggerConditionがnilです")
	}
	if def.EffectType != PassiveEffectMultiplier {
		t.Errorf("EffectTypeが期待値と異なります: got %s, want %s", def.EffectType, PassiveEffectMultiplier)
	}
	if def.EffectValue != 1.5 {
		t.Errorf("EffectValueが期待値と異なります: got %f, want 1.5", def.EffectValue)
	}
}

// TestPassiveSkillDefinition_確率トリガー は確率トリガータイプのPassiveSkillDefinitionが正しく作成されることを確認します。
func TestPassiveSkillDefinition_確率トリガー(t *testing.T) {
	def := PassiveSkillDefinition{
		ID:          "ps_last_stand",
		Name:        "ラストスタンド",
		Description: "HP25%以下で30%の確率で被ダメージ1",
		TriggerType: PassiveTriggerProbability,
		TriggerCondition: &TriggerCondition{
			Type:  TriggerConditionHPBelowPercent,
			Value: 25,
		},
		EffectType:  PassiveEffectSpecial,
		EffectValue: 1,
		Probability: 0.3,
	}

	if def.TriggerType != PassiveTriggerProbability {
		t.Errorf("TriggerTypeが期待値と異なります: got %s, want %s", def.TriggerType, PassiveTriggerProbability)
	}
	if def.Probability != 0.3 {
		t.Errorf("Probabilityが期待値と異なります: got %f, want 0.3", def.Probability)
	}
}

// TestPassiveSkillDefinition_永続効果 は永続効果タイプのPassiveSkillDefinitionが正しく作成されることを確認します。
func TestPassiveSkillDefinition_永続効果(t *testing.T) {
	def := PassiveSkillDefinition{
		ID:          "ps_buff_extender",
		Name:        "バフエクステンダー",
		Description: "バフ効果時間+50%",
		TriggerType: PassiveTriggerPermanent,
		EffectType:  PassiveEffectMultiplier,
		EffectValue: 1.5,
	}

	if def.TriggerType != PassiveTriggerPermanent {
		t.Errorf("TriggerTypeが期待値と異なります: got %s, want %s", def.TriggerType, PassiveTriggerPermanent)
	}
	if def.TriggerCondition != nil {
		t.Error("永続効果はTriggerConditionがnilであるべきです")
	}
}

// TestPassiveSkillDefinition_スタック型 はスタック型のPassiveSkillDefinitionが正しく作成されることを確認します。
func TestPassiveSkillDefinition_スタック型(t *testing.T) {
	def := PassiveSkillDefinition{
		ID:          "ps_combo_master",
		Name:        "コンボマスター",
		Description: "ミスなし連続タイピングでダメージ累積+10%（最大+50%）",
		TriggerType: PassiveTriggerStack,
		TriggerCondition: &TriggerCondition{
			Type: TriggerConditionNoMissStreak,
		},
		EffectType:     PassiveEffectModifier,
		EffectValue:    0.1,
		MaxStacks:      5,
		StackIncrement: 0.1,
	}

	if def.TriggerType != PassiveTriggerStack {
		t.Errorf("TriggerTypeが期待値と異なります: got %s, want %s", def.TriggerType, PassiveTriggerStack)
	}
	if def.MaxStacks != 5 {
		t.Errorf("MaxStacksが期待値と異なります: got %d, want 5", def.MaxStacks)
	}
	if def.StackIncrement != 0.1 {
		t.Errorf("StackIncrementが期待値と異なります: got %f, want 0.1", def.StackIncrement)
	}
}

// TestPassiveSkillDefinition_反応型 は反応型のPassiveSkillDefinitionが正しく作成されることを確認します。
func TestPassiveSkillDefinition_反応型(t *testing.T) {
	def := PassiveSkillDefinition{
		ID:          "ps_first_strike",
		Name:        "ファーストストライク",
		Description: "戦闘開始時、最初のスキルが即発動",
		TriggerType: PassiveTriggerReactive,
		TriggerCondition: &TriggerCondition{
			Type: TriggerConditionOnBattleStart,
		},
		EffectType:    PassiveEffectSpecial,
		UsesPerBattle: 1,
	}

	if def.TriggerType != PassiveTriggerReactive {
		t.Errorf("TriggerTypeが期待値と異なります: got %s, want %s", def.TriggerType, PassiveTriggerReactive)
	}
	if def.UsesPerBattle != 1 {
		t.Errorf("UsesPerBattleが期待値と異なります: got %d, want 1", def.UsesPerBattle)
	}
}

// TestPassiveSkillDefinition_IsPermanent は永続効果かどうかの判定を確認します。
func TestPassiveSkillDefinition_IsPermanent(t *testing.T) {
	tests := []struct {
		name        string
		triggerType PassiveTriggerType
		expected    bool
	}{
		{"永続効果", PassiveTriggerPermanent, true},
		{"条件付き", PassiveTriggerConditional, false},
		{"確率トリガー", PassiveTriggerProbability, false},
		{"スタック型", PassiveTriggerStack, false},
		{"反応型", PassiveTriggerReactive, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			def := PassiveSkillDefinition{TriggerType: tt.triggerType}
			if def.IsPermanent() != tt.expected {
				t.Errorf("IsPermanent()が期待値と異なります: got %v, want %v", def.IsPermanent(), tt.expected)
			}
		})
	}
}

// TestPassiveSkillDefinition_HasProbability は確率判定があるかどうかの確認をします。
func TestPassiveSkillDefinition_HasProbability(t *testing.T) {
	tests := []struct {
		name        string
		probability float64
		expected    bool
	}{
		{"確率あり", 0.3, true},
		{"確率なし（0）", 0, false},
		{"確率100%", 1.0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			def := PassiveSkillDefinition{Probability: tt.probability}
			if def.HasProbability() != tt.expected {
				t.Errorf("HasProbability()が期待値と異なります: got %v, want %v", def.HasProbability(), tt.expected)
			}
		})
	}
}

// TestPassiveSkillDefinition_IsStackable はスタック可能かどうかの判定を確認します。
func TestPassiveSkillDefinition_IsStackable(t *testing.T) {
	tests := []struct {
		name        string
		triggerType PassiveTriggerType
		maxStacks   int
		expected    bool
	}{
		{"スタック型", PassiveTriggerStack, 5, true},
		{"スタック0", PassiveTriggerStack, 0, false},
		{"非スタック型", PassiveTriggerConditional, 5, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			def := PassiveSkillDefinition{
				TriggerType: tt.triggerType,
				MaxStacks:   tt.maxStacks,
			}
			if def.IsStackable() != tt.expected {
				t.Errorf("IsStackable()が期待値と異なります: got %v, want %v", def.IsStackable(), tt.expected)
			}
		})
	}
}
