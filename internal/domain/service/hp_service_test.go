package service

import (
	"testing"

	"hirorocky/type-battle/internal/domain"
)

// TestCalculateMaxHP_Empty は空のエージェントリストでBaseHPを返すことをテストします。
func TestCalculateMaxHP_Empty(t *testing.T) {
	result := CalculateMaxHP([]*domain.AgentModel{})

	// エージェントがいない場合は基礎HP(100)を返す
	if result != domain.BaseHP {
		t.Errorf("Expected BaseHP (%d), got %d", domain.BaseHP, result)
	}
}

// TestCalculateMaxHP_SingleAgent は単一エージェントでの計算をテストします。
func TestCalculateMaxHP_SingleAgent(t *testing.T) {
	coreType := domain.CoreType{
		ID: "test",
		StatWeights: map[string]float64{
			"STR": 1.0,
			"MAG": 1.0,
			"SPD": 1.0,
			"LUK": 1.0,
		},
	}
	core := domain.NewCore("c1", "テストコア", 10, coreType, domain.PassiveSkill{})
	agent := domain.NewAgent("a1", core, nil)

	result := CalculateMaxHP([]*domain.AgentModel{agent})

	// レベル10 × HP係数(10) + 基礎HP(100) = 200
	expected := int(10.0*domain.HPCoefficient) + domain.BaseHP
	if result != expected {
		t.Errorf("Expected %d, got %d", expected, result)
	}
}

// TestCalculateMaxHP_MultipleAgents は複数エージェントでの平均計算をテストします。
func TestCalculateMaxHP_MultipleAgents(t *testing.T) {
	coreType := domain.CoreType{
		ID: "test",
		StatWeights: map[string]float64{
			"STR": 1.0,
			"MAG": 1.0,
			"SPD": 1.0,
			"LUK": 1.0,
		},
	}

	// レベル5, 10, 15のエージェント（平均10）
	core1 := domain.NewCore("c1", "コア1", 5, coreType, domain.PassiveSkill{})
	core2 := domain.NewCore("c2", "コア2", 10, coreType, domain.PassiveSkill{})
	core3 := domain.NewCore("c3", "コア3", 15, coreType, domain.PassiveSkill{})

	agent1 := domain.NewAgent("a1", core1, nil)
	agent2 := domain.NewAgent("a2", core2, nil)
	agent3 := domain.NewAgent("a3", core3, nil)

	agents := []*domain.AgentModel{agent1, agent2, agent3}
	result := CalculateMaxHP(agents)

	// 平均レベル(10) × HP係数(10) + 基礎HP(100) = 200
	avgLevel := (5.0 + 10.0 + 15.0) / 3.0
	expected := int(avgLevel*domain.HPCoefficient) + domain.BaseHP
	if result != expected {
		t.Errorf("Expected %d, got %d", expected, result)
	}
}

// TestCalculateMaxHP_NilInput はnilを渡した場合をテストします。
func TestCalculateMaxHP_NilInput(t *testing.T) {
	result := CalculateMaxHP(nil)

	// nilの場合も基礎HPを返す
	if result != domain.BaseHP {
		t.Errorf("Expected BaseHP (%d), got %d", domain.BaseHP, result)
	}
}
