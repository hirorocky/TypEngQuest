// Package adapter はデータ変換ロジックを集約するアダプター層を提供します。
//
// このパッケージは以下の責務を持ちます：
//   - SaveData <-> GameState間の変換（永続化アダプター）
//   - GameState -> 各種ScreenData間の変換（画面データアダプター）
//   - BattleStats -> RewardStats間の変換（報酬アダプター）
//
// アダプター層の導入により、ドメインモデルとUI/永続化層の境界が明確になり、
// 変換ロジックの重複を防ぎ、テストの容易性が向上します。
//
// Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
package adapter
