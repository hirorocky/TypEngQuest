// Package components はTUI共通コンポーネントのテストを提供します。
package components

import (
	"testing"
)

// ==================== メニューコンポーネントのテスト ====================

// TestNewMenu はMenuの初期化をテストします。
func TestNewMenu(t *testing.T) {
	items := []MenuItem{
		{Label: "バトル選択", Value: "battle"},
		{Label: "エージェント管理", Value: "agent"},
		{Label: "図鑑", Value: "encyclopedia"},
		{Label: "統計/実績", Value: "stats"},
	}

	menu := NewMenu(items)

	if menu == nil {
		t.Fatal("Menuがnilです")
	}

	if len(menu.Items) != 4 {
		t.Errorf("アイテム数が不正: got %d, want 4", len(menu.Items))
	}

	if menu.SelectedIndex != 0 {
		t.Errorf("初期選択インデックスが不正: got %d, want 0", menu.SelectedIndex)
	}
}

// TestMenuNavigation はメニューナビゲーションをテストします。
func TestMenuNavigation(t *testing.T) {
	items := []MenuItem{
		{Label: "Item1", Value: "1"},
		{Label: "Item2", Value: "2"},
		{Label: "Item3", Value: "3"},
	}

	menu := NewMenu(items)

	// 下に移動
	menu.MoveDown()
	if menu.SelectedIndex != 1 {
		t.Errorf("MoveDown後のインデックス: got %d, want 1", menu.SelectedIndex)
	}

	// 上に移動
	menu.MoveUp()
	if menu.SelectedIndex != 0 {
		t.Errorf("MoveUp後のインデックス: got %d, want 0", menu.SelectedIndex)
	}

	// 上限を超えて下に移動（ラップアラウンド）
	menu.SelectedIndex = 2
	menu.MoveDown()
	if menu.SelectedIndex != 0 {
		t.Errorf("ラップアラウンド後のインデックス: got %d, want 0", menu.SelectedIndex)
	}

	// 下限を超えて上に移動（ラップアラウンド）
	menu.SelectedIndex = 0
	menu.MoveUp()
	if menu.SelectedIndex != 2 {
		t.Errorf("ラップアラウンド後のインデックス: got %d, want 2", menu.SelectedIndex)
	}
}

// TestMenuSelection はメニュー選択をテストします。
func TestMenuSelection(t *testing.T) {
	items := []MenuItem{
		{Label: "Item1", Value: "value1"},
		{Label: "Item2", Value: "value2"},
	}

	menu := NewMenu(items)
	menu.SelectedIndex = 1

	selected := menu.GetSelected()
	if selected.Value != "value2" {
		t.Errorf("選択値が不正: got %s, want value2", selected.Value)
	}
}

// TestMenuRender はメニューのレンダリングをテストします。
func TestMenuRender(t *testing.T) {
	items := []MenuItem{
		{Label: "バトル選択", Value: "battle"},
		{Label: "エージェント管理", Value: "agent"},
	}

	menu := NewMenu(items)
	rendered := menu.Render()

	if rendered == "" {
		t.Error("レンダリング結果が空です")
	}
}

// ==================== 入力フィールドコンポーネントのテスト ====================

// TestNewInputField はInputFieldの初期化をテストします。
func TestNewInputField(t *testing.T) {
	input := NewInputField("レベル番号を入力")

	if input == nil {
		t.Fatal("InputFieldがnilです")
	}

	if input.Placeholder != "レベル番号を入力" {
		t.Errorf("プレースホルダーが不正: got %s", input.Placeholder)
	}
}

// TestInputFieldInput は入力処理をテストします。
func TestInputFieldInput(t *testing.T) {
	input := NewInputField("")
	input.InputMode = InputModeNumeric

	// 数値入力
	input.HandleInput('1')
	input.HandleInput('2')
	input.HandleInput('3')

	if input.Value != "123" {
		t.Errorf("入力値が不正: got %s, want 123", input.Value)
	}

	// 非数値は無視される
	input.HandleInput('a')
	if input.Value != "123" {
		t.Errorf("非数値入力後の値: got %s, want 123", input.Value)
	}

	// バックスペース
	input.HandleBackspace()
	if input.Value != "12" {
		t.Errorf("バックスペース後の値: got %s, want 12", input.Value)
	}
}

// TestInputFieldValidation は入力検証をテストします。
func TestInputFieldValidation(t *testing.T) {
	input := NewInputField("")
	input.InputMode = InputModeNumeric
	input.MinValue = 1
	input.MaxValue = 100

	// 有効な入力
	input.Value = "50"
	valid, _ := input.Validate()
	if !valid {
		t.Error("有効な値が無効と判定されました")
	}

	// 範囲外（小さすぎ）
	input.Value = "0"
	valid, msg := input.Validate()
	if valid {
		t.Error("無効な値が有効と判定されました")
	}
	if msg == "" {
		t.Error("エラーメッセージが空です")
	}

	// 範囲外（大きすぎ）
	input.Value = "150"
	valid, _ = input.Validate()
	if valid {
		t.Error("無効な値が有効と判定されました")
	}
}

// ==================== 情報パネルコンポーネントのテスト ====================

// TestNewInfoPanel はInfoPanelの初期化をテストします。
func TestNewInfoPanel(t *testing.T) {
	panel := NewInfoPanel("プレイヤー情報")

	if panel == nil {
		t.Fatal("InfoPanelがnilです")
	}

	if panel.Title != "プレイヤー情報" {
		t.Errorf("タイトルが不正: got %s", panel.Title)
	}
}

// TestInfoPanelItems はInfoPanelのアイテム追加をテストします。
func TestInfoPanelItems(t *testing.T) {
	panel := NewInfoPanel("ステータス")

	panel.AddItem("HP", "100/100")
	panel.AddItem("レベル", "10")

	if len(panel.Items) != 2 {
		t.Errorf("アイテム数が不正: got %d, want 2", len(panel.Items))
	}

	rendered := panel.Render(30)
	if rendered == "" {
		t.Error("レンダリング結果が空です")
	}
}
