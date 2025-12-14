# Implementation Plan

## Task Format Template

- [ ] {{NUMBER}}. {{TASK_DESCRIPTION}}{{PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}}
  - _Requirements: {{REQUIREMENT_IDS}}_

---

## Tasks

- [ ] 1. ドメイン層の値オブジェクトとエンティティ拡張
- [x] 1.1 (P) ChainEffect値オブジェクトを実装する
  - チェイン効果の種別（damage_bonus, heal_bonus, buff_extend, debuff_extend）を定義
  - チェイン効果のType、Value、Descriptionフィールドを持つイミュータブルな構造体を作成
  - チェイン効果種別ごとの説明テンプレートを定義
  - 値の等価性判定メソッドを実装
  - _Requirements: 3.1, 3.4, 5.1_

- [ ] 1.2 (P) PassiveSkillを効果量計算対応に拡張する
  - 既存のPassiveSkill構造体にBaseModifiersとScalePerLevelフィールドを追加
  - コアレベルに応じた効果量を計算するCalculateModifiersメソッドを実装
  - StatModifiersとの連携インターフェースを定義
  - _Requirements: 2.1, 2.4_

- [ ] 1.3 CoreModelをtypeIdとlevelベースに リファクタリングする
  - インスタンスIDフィールドを削除し、TypeIDフィールドを追加
  - TypeIDとLevelの組み合わせによる同一性判定（Equalsメソッド）を実装
  - PassiveSkillをCoreTypeから導出する仕組みを構築
  - ステータスをロード時にマスタデータから再計算する設計に変更
  - 既存のCoreModel参照箇所を更新
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 1.4 ModuleModelをチェイン効果対応にリファクタリングする
  - インスタンスIDフィールドを削除し、TypeIDフィールドを追加
  - ChainEffectフィールド（nilを許容）を追加
  - 同一TypeIDでも異なるChainEffectを持つことを許容する設計に変更
  - 既存のModuleModel参照箇所を更新
  - _Requirements: 3.1, 5.1, 5.2, 5.5_

- [ ] 2. マスタデータの拡張
- [ ] 2.1 (P) パッシブスキルマスタデータを作成する
  - passive_skills.jsonファイルを新規作成
  - 22種類のパッシブスキル定義（パーフェクトリズム、コンボマスター等）を記述
  - トリガータイプ（conditional, probability, permanent）とその条件を定義
  - 効果タイプと効果量パラメータを定義
  - マスタデータローダーにパッシブスキル読み込み処理を追加
  - _Requirements: 2.1, 2.4_

- [ ] 2.2 (P) チェイン効果マスタデータを作成する
  - skill_effects.jsonファイルを新規作成
  - 19種類のチェイン効果定義（ダメージアンプ、ダメージカット等）を記述
  - カテゴリ（attack, defense, heal, typing, recast, effect_extend, special）を定義
  - 効果値の最小・最大範囲を定義
  - マスタデータローダーにチェイン効果読み込み処理を追加
  - _Requirements: 3.4_

- [ ] 2.3 cores.jsonにパッシブスキル参照を追加する
  - 各コア特性にpassive_skill_idフィールドを追加
  - 22種類のコア特性とパッシブスキルの対応関係を定義
  - マスタデータからドメインへの変換処理を更新
  - _Requirements: 2.1, 2.2_

- [ ] 3. 永続化層（セーブ/ロード）のリファクタリング
- [ ] 3.1 (P) CoreInstanceSaveをリファクタリングする
  - IDフィールドを削除し、core_type_idとlevelのみを保持する構造に変更
  - セーブデータのバージョンをv1.0.0として定義
  - CoreInstanceSaveからCoreModelへの変換処理を実装
  - 旧フォーマット検出時の新規ゲーム開始処理を実装
  - _Requirements: 4.4_

- [ ] 3.2 (P) ModuleInstanceSaveを新規実装する
  - type_idとchain_effect（オプショナル）を持つ構造体を作成
  - ChainEffectSave構造体（type, value）を作成
  - 既存のModuleCountsマップをModuleInstancesスライスに置き換え
  - ModuleInstanceSaveからModuleModelへの変換処理を実装
  - _Requirements: 5.4, 5.5_

- [ ] 3.3 AgentInstanceSaveをチェイン効果対応に更新する
  - module_chain_effectsフィールド（nullを含むスライス）を追加
  - エージェント保存・読み込み処理を更新
  - モジュールとチェイン効果の対応関係を永続化
  - _Requirements: 5.4_

- [ ] 4. リキャストマネージャーの実装
- [ ] 4.1 RecastManagerを実装する
  - RecastState構造体（AgentIndex, RemainingSeconds, TotalSeconds）を定義
  - エージェントごとのリキャスト状態を管理するマップを実装
  - StartRecast: エージェントのリキャストを開始する処理
  - UpdateRecast: 毎tick呼び出しでリキャスト時間を更新し、終了したエージェントを返す
  - IsAgentReady: エージェントが使用可能かを判定
  - GetRecastState/GetAllRecastStates: 状態取得メソッド
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [ ] 4.2 RecastManagerのユニットテストを作成する
  - リキャスト開始→更新→終了の状態遷移テスト
  - 複数エージェントの同時リキャスト管理テスト
  - IsAgentReady判定の正確性テスト
  - 負の値やエッジケースのバリデーションテスト
  - _Requirements: 1.1, 1.2, 1.4_

- [ ] 5. チェイン効果マネージャーの実装
- [ ] 5.1 ChainEffectManagerを実装する
  - PendingChainEffect構造体（AgentIndex, Effect, SourceModule）を定義
  - TriggeredChainEffect構造体（Effect, EffectValue, Message）を定義
  - RegisterChainEffect: モジュール使用時にチェイン効果を待機状態として登録
  - CheckAndTrigger: 他エージェントのモジュール使用時に発動条件をチェックし、発動を実行
  - ExpireEffectsForAgent: リキャスト終了時に未発動チェイン効果を破棄
  - GetPendingEffects: 待機中チェイン効果の取得
  - _Requirements: 3.5, 3.6, 3.7, 7.1, 7.2, 7.3, 7.5_

- [ ] 5.2 チェイン効果の発動ロジックを実装する
  - ダメージボーナス効果: 攻撃ダメージに追加ダメージを適用
  - 回復ボーナス効果: 回復量に追加回復を適用
  - バフ延長効果: EffectTableのバフ効果時間を延長
  - デバフ延長効果: EffectTableのデバフ効果時間を延長
  - BattleStateとの連携による効果適用
  - _Requirements: 3.4, 7.3_

- [ ] 5.3 ChainEffectManagerのユニットテストを作成する
  - チェイン効果登録→発動→削除のライフサイクルテスト
  - 他エージェントモジュール使用による発動条件テスト
  - リキャスト終了時の効果破棄テスト
  - 各チェイン効果タイプの効果適用テスト
  - _Requirements: 3.5, 3.6, 3.7, 7.1, 7.2, 7.3, 7.5_

- [ ] 6. バトルエンジンへのパッシブスキル統合
- [ ] 6.1 (P) パッシブスキルのEffectTable登録を実装する
  - RegisterPassiveSkillsメソッドをBattleEngineに追加
  - バトル初期化時に装備エージェントのパッシブスキルを永続効果として登録
  - パッシブスキルの効果量をコアレベルに応じて計算
  - 複数エージェントのパッシブスキルを個別管理
  - _Requirements: 6.1, 6.2, 6.5_

- [ ] 6.2 パッシブスキル効果のダメージ計算への反映を実装する
  - EffectTableからパッシブスキル修正値を取得
  - ステータス補正をリアルタイムで計算
  - 補正後のステータスをダメージ計算に使用
  - リキャスト中もパッシブスキル効果を継続適用
  - _Requirements: 6.2, 6.3, 6.6_

- [ ] 6.3 パッシブスキル統合テストを作成する
  - バトル初期化→パッシブスキル登録→ステータス計算の一連フロー検証
  - 複数エージェントのパッシブスキル併存テスト
  - リキャスト中のパッシブスキル効果継続テスト
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_

- [ ] 7. バトル画面へのリキャスト・チェイン効果統合
- [ ] 7.1 BattleScreenにRecastManagerを統合する
  - モジュール使用時にエージェント全体のリキャストを開始
  - リキャスト中エージェントのモジュール使用をブロック
  - バトルtickごとにRecastManager.UpdateRecastを呼び出し
  - リキャスト終了時のエージェント使用可能化
  - _Requirements: 1.1, 1.2, 1.4_

- [ ] 7.2 BattleScreenにChainEffectManagerを統合する
  - モジュール使用時にチェイン効果を待機状態として登録
  - 他エージェントのモジュール使用時に発動条件チェック
  - チェイン効果発動時の効果適用処理
  - リキャスト終了時の未発動チェイン効果破棄
  - _Requirements: 3.5, 7.1, 7.2, 7.3, 7.5_

- [ ] 7.3 バトル画面統合テストを作成する
  - モジュール使用→リキャスト開始→チェイン効果登録の一連フロー検証
  - リキャスト中のモジュール使用ブロック検証
  - チェイン効果発動条件とタイミングの検証
  - _Requirements: 1.1, 1.2, 3.5, 7.1, 7.2, 7.3_

- [ ] 8. UI コンポーネントの実装
- [ ] 8.1 (P) RecastProgressBarコンポーネントを実装する
  - 残り時間と総時間からプログレス割合を計算
  - 完了に近づくにつれ色が変化（赤→黄→緑）するスタイル
  - 残り秒数のテキスト表示
  - プログレスバーの幅を設定可能に
  - _Requirements: 1.3, 1.5_

- [ ] 8.2 (P) SkillEffectBadgeコンポーネントを実装する
  - チェイン効果のカテゴリに応じたアイコン表示（攻撃、防御、回復等）
  - 効果値の簡潔な表示
  - カテゴリとアイコンのマッピング定義
  - _Requirements: 3.8_

- [ ] 8.3 (P) PassiveSkillNotificationコンポーネントを実装する
  - パッシブスキル発動時のフローティング通知
  - 2-3秒で自動フェードアウトするアニメーション
  - 複数通知のキュー管理
  - _Requirements: 6.4_

- [ ] 9. バトル画面UIの拡張
- [ ] 9.1 エージェントカードにリキャスト状態表示を追加する
  - リキャスト中エージェントのグレーアウト表示
  - RecastProgressBarをエージェントカードに組み込み
  - リキャスト残り時間の数値表示
  - リキャスト完了時の視覚的フィードバック
  - _Requirements: 1.3, 1.5_

- [ ] 9.2 チェイン効果発動フィードバックを実装する
  - リキャスト中エージェントのチェイン効果名をカード下部に表示
  - チェイン効果発動時のエフェクト表示
  - SkillEffectBadgeをバトル画面に組み込み
  - _Requirements: 7.4, 7.6_

- [ ] 9.3 パッシブスキル効果表示を実装する
  - パッシブスキル発動時のPassiveSkillNotification表示
  - 確率トリガー発動時の視覚的フィードバック
  - バフ/デバフアイコン領域へのパッシブスキル効果表示
  - _Requirements: 6.4_

- [ ] 10. エージェント管理画面の拡張
- [ ] 10.1 コア詳細にパッシブスキル情報を表示する
  - パッシブスキル名と効果説明の表示
  - コアレベルに応じた効果量の表示
  - パッシブスキルアイコンの表示
  - _Requirements: 2.3_

- [ ] 10.2 モジュール詳細にチェイン効果情報を表示する
  - 各モジュールのチェイン効果情報表示
  - チェイン効果がある場合のSkillEffectBadge表示
  - チェイン効果がない場合の「(No Effect)」表示
  - _Requirements: 3.8_

- [ ] 10.3 エージェント合成プレビューにパッシブスキルとチェイン効果を表示する
  - 合成後のパッシブスキル効果プレビュー
  - 装備モジュールのチェイン効果一覧表示
  - _Requirements: 2.3, 3.8_

- [ ] 11. モジュール入手時のチェイン効果決定
- [ ] 11.1 モジュールドロップ時のチェイン効果ランダム決定を実装する
  - モジュール種別に基づくチェイン効果プール定義
  - ランダムなチェイン効果選択ロジック
  - チェイン効果の効果値をmin-max範囲内でランダム決定
  - チェイン効果なしの確率設定（nilを許容）
  - _Requirements: 3.2, 3.3_

- [ ] 11.2 モジュール入手処理の更新
  - ModuleDropInfoにチェイン効果情報を追加
  - インベントリへの追加時にチェイン効果を保持
  - ドロップ結果画面でのチェイン効果表示
  - _Requirements: 3.2, 3.3_

- [ ] 12. エンドツーエンド統合とリグレッション検証
- [ ] 12.1 セーブ・ロードの統合テストを実施する
  - 新形式セーブデータの保存・読み込み検証
  - ChainEffect/PassiveSkillの永続化・復元検証
  - 旧形式セーブデータ検出時の新規ゲーム開始検証
  - _Requirements: 4.4, 5.4_

- [ ] 12.2 バトルフロー全体の統合テストを実施する
  - バトル開始→パッシブスキル登録→モジュール使用→リキャスト→チェイン効果発動の一連フロー
  - 複数エージェント切り替えによる戦略的プレイの検証
  - エージェントリキャスト中の全モジュール使用不能化検証
  - _Requirements: 1.1, 1.2, 2.5, 6.1, 7.1, 7.2, 7.3_

- [ ] 12.3 UI表示の一貫性検証を実施する
  - バトル画面でのリキャスト状態表示確認
  - エージェント詳細画面でのパッシブスキル/チェイン効果表示確認
  - 各種通知・フィードバックの表示タイミング確認
  - _Requirements: 1.3, 2.3, 3.8, 6.4, 7.4, 7.6_
