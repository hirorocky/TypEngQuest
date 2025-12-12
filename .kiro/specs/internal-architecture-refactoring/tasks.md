# 実装計画

## Phase 1: ドメインサービス層の新設

- [x] 1. domain/service層の基盤構築
- [x] 1.1 ステータス計算サービスの実装
  - コアレベルとコア特性からステータス値を計算する純粋関数を作成
  - 計算式（基礎値 × レベル × ステータス重み）をカプセル化
  - 既存のCalculateStats関数をdomainから移動
  - _Requirements: 2.4, 2.5_

- [x] 1.2 (P) MaxHP計算サービスの実装
  - 装備中エージェントのコアレベル平均からMaxHPを計算する関数を作成
  - HP係数と基礎HPを使った計算ロジックをカプセル化
  - 既存のCalculateMaxHP関数をdomainから移動
  - _Requirements: 2.4, 2.5_

- [x] 1.3 (P) エフェクト計算サービスの実装
  - エフェクトテーブルから最終ステータスを計算する関数を作成
  - 時限効果の残り時間を更新する関数を作成
  - EffectTableのCalculateメソッドとUpdateDurationsメソッドをサービス関数として再実装
  - _Requirements: 2.4, 2.5_

- [x] 1.4 ドメインサービス層の参照更新
  - 既存のCalculateStats、CalculateMaxHP、エフェクト計算の呼び出し箇所を特定
  - 各呼び出し箇所のインポートパスをdomain/serviceに更新
  - ビルドとテストで動作確認
  - _Requirements: 2.1, 2.2, 2.3, 17.1, 17.4_

## Phase 2: ユースケース層の再編成

- [x] 2. ユースケース層の基盤移動
- [x] 2.1 ゲーム状態管理のユースケース化
  - app/game_state.goのGameState構造体とそのメソッドをusecase/game_stateに移動
  - app/inventory_manager.goの機能をusecase/game_stateに統合
  - app/game_state/サブディレクトリの重複コードを解消し削除
  - InventoryManagerとStatisticsManagerの重複定義を解消
  - _Requirements: 4.1, 4.2, 4.5, 14.1, 14.2, 14.3_

- [x] 2.2 統計管理のユースケース化
  - app/statistics_manager.goをusecase/statisticsに移動
  - ゲーム統計の管理ロジックを独立したユースケースとして分離
  - 重複定義を解消して単一ソースを維持
  - _Requirements: 4.3, 14.3_

- [x] 2.3 (P) 設定管理のユースケース化
  - app/settings.goをusecase/settingsに移動
  - ゲーム設定の管理ロジックを独立したユースケースとして分離
  - 重複定義を解消して単一ソースを維持
  - _Requirements: 4.4, 14.4_

- [x] 2.4 (P) デフォルトデータの適切な配置
  - app/game_state/defaults.goのデフォルトデータ定義をinfra/defaultsまたはembeddedに移動
  - getDefaultCoreTypeData等のデフォルト生成関数の重複を解消
  - _Requirements: 6.2, 14.5, 14.6_

- [ ] 2.5 既存ユースケースパッケージの移動
  - battle、typing、agent、enemy、inventory、reward、achievement、balanceをusecase/配下に移動
  - 各パッケージのインポートパスを更新
  - ビルドとテストで動作確認
  - _Requirements: 3.1, 3.2, 3.4, 17.1, 17.4_

## Phase 3: usecase層からinfra層への逆依存解消

- [ ] 3. レイヤー間の不正な依存関係の修正
- [x] 3.1 実績システムの永続化分離
  - achievementパッケージからpersistenceへの直接依存を解消
  - ToSaveDataとLoadFromSaveDataメソッドをinfra/persistenceに移動
  - achievementパッケージはドメイン型のみを使用するようリファクタリング
  - _Requirements: 15.1_

- [x] 3.2 (P) 報酬システムのローダー依存解消
  - rewardパッケージにドメイン型を使用するDomainRewardCalculatorを追加
  - ModuleDropInfo型を定義してloader.ModuleDefinitionDataの代替として使用可能に
  - 既存コードとの後方互換性を維持しつつ、新規コードはドメイン型を使用可能
  - _Requirements: 15.2_

- [x] 3.3 (P) 敵システムのローダー依存解消
  - enemyパッケージにドメイン型を使用するDomainEnemyGeneratorを追加
  - domain.EnemyTypeを直接使用するAPIを追加
  - 既存コードとの後方互換性を維持しつつ、新規コードはドメイン型を使用可能
  - _Requirements: 15.3_

- [ ] 3.4 ユースケース層の依存制約検証
  - ユースケース層がdomain、domain/service、configのみに依存していることを確認
  - infra、app、tuiへの依存がないことを検証
  - 違反があれば修正
  - _Requirements: 3.2, 3.3_

## Phase 4: tui/presenter層の新設

- [x] 4. UIデータ変換層の構築
- [x] 4.1 presenter層の基盤構築とインベントリプレゼンター
  - tui/presenterディレクトリを新設
  - app/adapters.goのinventoryProviderAdapterをtui/presenter/inventory_presenter.goに移動
  - InventoryManagerとAgentManagerをInventoryProviderインターフェースに適合させる
  - _Requirements: 5.1, 5.2_

- [x] 4.2 (P) 統計プレゼンターの実装
  - app/helpers.goのCreateStatsDataFromGameStateをtui/presenter/stats_presenter.goに移動
  - GameStateから統計表示用のStatsDataを生成するロジックを実装
  - _Requirements: 5.3_

- [x] 4.3 (P) 設定プレゼンターの実装
  - app/helpers.goのCreateSettingsDataFromGameStateをtui/presenter/settings_presenter.goに移動
  - GameStateから設定表示用のSettingsDataを生成するロジックを実装
  - _Requirements: 5.3_

- [x] 4.4 (P) 図鑑プレゼンターの実装
  - app/helpers.goのCreateEncyclopediaDataFromGameStateをtui/presenter/encyclopedia_presenter.goに移動
  - GameStateから図鑑表示用のEncyclopediaDataを生成するロジックを実装
  - _Requirements: 5.3_

- [ ] 4.5 presenter層の参照更新
  - app/helpers.goとapp/adapters.goからの移行を完了
  - 既存の呼び出し箇所のインポートパスをtui/presenterに更新
  - ビルドとテストで動作確認
  - _Requirements: 5.4, 11.3, 17.1, 17.4_

## Phase 5: インフラストラクチャ層の整理

- [ ] 5. インフラ層の再編成
- [ ] 5.1 ターミナルサービスの移動
  - app/terminal.goをinfra/terminalに移動
  - ターミナルサイズ検証と警告メッセージ生成のロジックをinfra層に配置
  - _Requirements: 6.1_

- [ ] 5.2 (P) 永続化変換ロジックの統合
  - app/game_state/persistence.goのセーブ/ロード変換ロジックをinfra/persistenceに統合
  - GameStateとSaveData間の変換をinfra層で一元管理
  - _Requirements: 6.3_

- [ ] 5.3 既存infraパッケージの移動
  - persistence、loader、embedded、errorhandler、startupをinfra/配下に移動
  - 各パッケージのインポートパスを更新
  - ビルドとテストで動作確認
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 17.1, 17.4_

## Phase 6: TUI層とapp層の整理

- [ ] 6. UI関心事の分離とapp層責務限定
- [ ] 6.1 スタイル定義の統合
  - app/styles.goの内容をtui/styles/styles.goに統合
  - カラーパレット（ColorPrimary等）とスタイル定義（Styles構造体）をtui層で一元管理
  - 重複するスタイル定義を統合
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 6.2 (P) balance層の責務整理
  - balanceパッケージからシーン定義（SceneHome等）をapp/scene.goに移動
  - balanceパッケージからセーブイベント定義（SaveEventBattleEnd等）を適切な場所に移動
  - シーン遷移ルール（allowedTransitions）をapp層で管理
  - balanceパッケージはゲームバランスパラメータのみを含むよう整理
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [ ] 6.3 TUI層の外部依存削除
  - tui層がtui/presenterを使用してデータ変換するよう更新
  - 外部adapter層への依存を削除
  - tui/styles/にapp層から移動したスタイル定義が統合されていることを確認
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 6.4 app層の責務限定確認
  - app層がroot_model.go、scene.go、scene_router.go、screen_factory.go、screen_map.go、message_handlers.goのみを含むことを確認
  - ビジネスロジック、データ変換、インフラ関心事がapp層から除去されていることを検証
  - 不要なファイルの削除
  - _Requirements: 8.1, 8.2, 8.3_

## Phase 7: adapter層廃止と最終整理

- [ ] 7. 既存adapter層の廃止とレイヤー構造完成
- [ ] 7.1 adapter層の機能再配置
  - 既存のadapter/配下の機能で未移行のものを特定
  - UI向け変換ロジックをtui/presenterに移動
  - infra向け変換ロジックを各infraパッケージ（loader、persistence）に統合
  - adapter/reward_adapter.goの機能を適切な場所に再配置
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 7.2 adapter層の削除
  - adapter/ディレクトリを削除
  - 残存する参照がないことを確認
  - ビルドとテストで動作確認
  - _Requirements: 10.1, 17.2, 17.3, 17.4_

## Phase 8: レイヤー分類とドキュメント更新

- [ ] 8. レイヤー構造の文書化と最終検証
- [ ] 8.1 steering構造ドキュメントの更新
  - structure.md steeringドキュメントを新しいディレクトリ構造に更新
  - レイヤー依存関係図を追加
  - 各レイヤーの目的と責務を記述
  - 各パッケージの配置理由を記述
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ] 8.2 レイヤー依存ルールの文書化
  - 5レイヤー（domain、usecase、infra、app、tui）の依存ルールをsteeringに文書化
  - domain/serviceサブカテゴリの説明を追加
  - 禁止されている依存関係を明示
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 8.3 config層とテスト配置の確認
  - configパッケージが横断的関心事としてinternal/configに維持されていることを確認
  - configが他のinternalパッケージに依存していないことを検証
  - integration_testが適切な場所に配置されていることを確認
  - _Requirements: 12.1, 12.2, 12.3, 13.1, 13.2_

- [ ] 8.4 全体テストと動作確認
  - すべての既存テストがパスすることを確認
  - アプリケーション全体の動作確認
  - シーン遷移の正常動作を検証
  - _Requirements: 17.2, 17.3_
