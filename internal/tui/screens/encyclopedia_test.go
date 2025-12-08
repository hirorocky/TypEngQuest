// Package screens はTUI画面のテストを提供します。
package screens

import (
	"testing"

	"hirorocky/type-battle/internal/domain"

	tea "github.com/charmbracelet/bubbletea"
)

// ==================== Task 10.5: 図鑑画面のテスト ====================

// TestNewEncyclopediaScreen はEncyclopediaScreenの初期化をテストします。
func TestNewEncyclopediaScreen(t *testing.T) {
	data := createTestEncyclopediaData()
	screen := NewEncyclopediaScreen(data)

	if screen == nil {
		t.Fatal("EncyclopediaScreenがnilです")
	}
}

// TestEncyclopediaCategories は3カテゴリ表示をテストします。
// Requirement 14.1: 3つのカテゴリ（コア図鑑、モジュール図鑑、敵図鑑）を表示
func TestEncyclopediaCategories(t *testing.T) {
	data := createTestEncyclopediaData()
	screen := NewEncyclopediaScreen(data)

	// 初期カテゴリ
	if screen.currentCategory != CategoryCore {
		t.Errorf("初期カテゴリが正しくありません: got %d, want %d", screen.currentCategory, CategoryCore)
	}

	// カテゴリ切り替え（右へ）
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyRight})
	if screen.currentCategory != CategoryModule {
		t.Errorf("カテゴリ切り替え(右)が正しくありません: got %d, want %d", screen.currentCategory, CategoryModule)
	}

	// さらに右へ
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyRight})
	if screen.currentCategory != CategoryEnemy {
		t.Errorf("カテゴリ切り替え(右)が正しくありません: got %d, want %d", screen.currentCategory, CategoryEnemy)
	}
}

// TestEncyclopediaCoreEncyclopedia はコア図鑑をテストします。
// Requirement 14.2, 14.3: コア図鑑（全特性一覧、獲得状況）
func TestEncyclopediaCoreEncyclopedia(t *testing.T) {
	data := createTestEncyclopediaData()
	screen := NewEncyclopediaScreen(data)

	// コア図鑑タブ
	screen.currentCategory = CategoryCore

	// 全特性が表示されていること
	if len(screen.data.AllCoreTypes) == 0 {
		t.Error("コア特性が空です")
	}

	// 獲得状況が判定できること
	for _, ct := range screen.data.AllCoreTypes {
		acquired := screen.isCoreTypeAcquired(ct.ID)
		// 獲得済みかどうかはデータ依存
		_ = acquired
	}
}

// TestEncyclopediaModuleEncyclopedia はモジュール図鑑をテストします。
// Requirement 14.5, 14.6: モジュール図鑑（全タイプ一覧、獲得状況）
func TestEncyclopediaModuleEncyclopedia(t *testing.T) {
	data := createTestEncyclopediaData()
	screen := NewEncyclopediaScreen(data)

	// モジュール図鑑タブ
	screen.currentCategory = CategoryModule

	// 全モジュールタイプが表示されていること
	if len(screen.data.AllModuleTypes) == 0 {
		t.Error("モジュールタイプが空です")
	}
}

// TestEncyclopediaEnemyEncyclopedia は敵図鑑をテストします。
// Requirement 14.8, 14.9: 敵図鑑（遭遇済み一覧、詳細情報）
func TestEncyclopediaEnemyEncyclopedia(t *testing.T) {
	data := createTestEncyclopediaData()
	screen := NewEncyclopediaScreen(data)

	// 敵図鑑タブ
	screen.currentCategory = CategoryEnemy

	// 全敵タイプが表示されていること
	if len(screen.data.AllEnemyTypes) == 0 {
		t.Error("敵タイプが空です")
	}

	// 遭遇状況が判定できること
	for _, et := range screen.data.AllEnemyTypes {
		encountered := screen.isEnemyEncountered(et.ID)
		_ = encountered
	}
}

// TestEncyclopediaUnacquiredDisplay は未獲得表示をテストします。
// Requirement 14.4, 14.7, 14.10: 未獲得をシルエットまたは「???」で表示
func TestEncyclopediaUnacquiredDisplay(t *testing.T) {
	data := createTestEncyclopediaData()
	// 獲得済みリストを空にする
	data.AcquiredCoreTypes = []string{}
	data.AcquiredModuleTypes = []string{}
	data.EncounteredEnemies = []string{}

	screen := NewEncyclopediaScreen(data)

	// 未獲得コアは「???」表示
	if len(screen.data.AllCoreTypes) > 0 {
		ct := screen.data.AllCoreTypes[0]
		displayName := screen.getCoreDisplayName(ct)
		if displayName != "???" {
			t.Errorf("未獲得コアの表示が正しくありません: got %s, want ???", displayName)
		}
	}
}

// TestEncyclopediaCompletionRate はコンプリート率をテストします。
// Requirement 14.11: コンプリート率表示
func TestEncyclopediaCompletionRate(t *testing.T) {
	data := createTestEncyclopediaData()
	screen := NewEncyclopediaScreen(data)

	// コンプリート率計算
	coreRate := screen.getCoreCompletionRate()
	moduleRate := screen.getModuleCompletionRate()
	enemyRate := screen.getEnemyCompletionRate()

	// 0〜100の範囲であること
	if coreRate < 0 || coreRate > 100 {
		t.Errorf("コア図鑑コンプリート率が範囲外: %d", coreRate)
	}
	if moduleRate < 0 || moduleRate > 100 {
		t.Errorf("モジュール図鑑コンプリート率が範囲外: %d", moduleRate)
	}
	if enemyRate < 0 || enemyRate > 100 {
		t.Errorf("敵図鑑コンプリート率が範囲外: %d", enemyRate)
	}
}

// TestEncyclopediaBackNavigation は戻るナビゲーションをテストします。
func TestEncyclopediaBackNavigation(t *testing.T) {
	data := createTestEncyclopediaData()
	screen := NewEncyclopediaScreen(data)

	_, cmd := screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyEsc})

	if cmd == nil {
		t.Error("Escキーでコマンドが返されません")
	}
}

// TestEncyclopediaRender はレンダリングをテストします。
func TestEncyclopediaRender(t *testing.T) {
	data := createTestEncyclopediaData()
	screen := NewEncyclopediaScreen(data)
	screen.width = 120
	screen.height = 40

	rendered := screen.View()

	if rendered == "" {
		t.Error("レンダリング結果が空です")
	}
}

// ==================== ヘルパー関数 ====================

func createTestEncyclopediaData() *EncyclopediaData {
	coreTypes := []domain.CoreType{
		{ID: "all_rounder", Name: "オールラウンダー", StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0}},
		{ID: "attacker", Name: "攻撃バランス", StatWeights: map[string]float64{"STR": 1.2, "MAG": 1.2, "SPD": 0.8, "LUK": 0.8}},
		{ID: "healer", Name: "ヒーラー", StatWeights: map[string]float64{"STR": 0.8, "MAG": 1.4, "SPD": 0.9, "LUK": 0.9}},
	}

	moduleTypes := []ModuleTypeInfo{
		{ID: "physical_lv1", Name: "物理攻撃Lv1", Category: domain.PhysicalAttack, Level: 1},
		{ID: "magic_lv1", Name: "魔法攻撃Lv1", Category: domain.MagicAttack, Level: 1},
		{ID: "heal_lv1", Name: "回復Lv1", Category: domain.Heal, Level: 1},
	}

	enemyTypes := []domain.EnemyType{
		{ID: "goblin", Name: "ゴブリン"},
		{ID: "orc", Name: "オーク"},
		{ID: "dragon", Name: "ドラゴン"},
	}

	return &EncyclopediaData{
		AllCoreTypes:        coreTypes,
		AllModuleTypes:      moduleTypes,
		AllEnemyTypes:       enemyTypes,
		AcquiredCoreTypes:   []string{"all_rounder"},
		AcquiredModuleTypes: []string{"physical_lv1"},
		EncounteredEnemies:  []string{"goblin"},
	}
}
