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

- [x] 1.2 (P) PassiveSkillを効果量計算対応に拡張する
  - 既存のPassiveSkill構造体にBaseModifiersとScalePerLevelフィールドを追加
  - コアレベルに応じた効果量を計算するCalculateModifiersメソッドを実装
  - StatModifiersとの連携インターフェースを定義
  - _Requirements: 2.1, 2.4_

- [x] 1.3 CoreModelをtypeIdとlevelベースに リファクタリングする
  - インスタンスIDフィールドを削除し、TypeIDフィールドを追加
  - TypeIDとLevelの組み合わせによる同一性判定（Equalsメソッド）を実装
  - PassiveSkillをCoreTypeから導出する仕組みを構築
  - ステータスをロード時にマスタデータから再計算する設計に変更
  - 既存のCoreModel参照箇所を更新
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 1.4 ModuleModelをチェイン効果対応にリファクタリングする
  - インスタンスIDフィールドを削除し、TypeIDフィールドを追加
  - ChainEffectフィールド（nilを許容）を追加
  - 同一TypeIDでも異なるChainEffectを持つことを許容する設計に変更
  - 既存のModuleModel参照箇所を更新
  - _Requirements: 3.1, 5.1, 5.2, 5.5_

- [x] 1.5. 全19種類のチェイン効果タイプを実装する
- [x] 1.5.1 (P) 攻撃強化カテゴリのチェイン効果タイプを追加する
  - ChainEffectDamageAmp: ダメージアンプ（効果中の攻撃ダメージ+X%）
  - ChainEffectArmorPierce: アーマーピアス（効果中の攻撃が防御バフ無視）
  - ChainEffectLifeSteal: ライフスティール（効果中の攻撃ダメージのX%回復）
  - _Requirements: 3.4_

- [x] 1.5.2 (P) 防御強化カテゴリのチェイン効果タイプを追加する
  - ChainEffectDamageCut: ダメージカット（効果中の被ダメージ-X%）
  - ChainEffectEvasion: イベイジョン（効果中X%で攻撃回避）
  - ChainEffectReflect: リフレクト（効果中被ダメージ反射）
  - ChainEffectRegen: リジェネ（効果中毎秒HP X%回復）
  - _Requirements: 3.4_

- [x] 1.5.3 (P) 回復強化カテゴリのチェイン効果タイプを追加する
  - ChainEffectHealAmp: ヒールアンプ（効果中の回復量+X%）
  - ChainEffectOverheal: オーバーヒール（効果中の超過回復を一時HPに）
  - _Requirements: 3.4_

- [x] 1.5.4 (P) タイピングカテゴリのチェイン効果タイプを追加する
  - ChainEffectTimeExtend: タイムエクステンド（効果中のタイピング制限時間+X秒）
  - ChainEffectAutoCorrect: オートコレクト（効果中ミスX回まで無視）
  - _Requirements: 3.4_

- [x] 1.5.5 (P) リキャストカテゴリのチェイン効果タイプを追加する
  - ChainEffectCooldownReduce: クールダウンリデュース（効果中発生した他エージェントのリキャスト時間X%短縮）
  - _Requirements: 3.4_

- [x] 1.5.6 (P) 効果延長カテゴリのチェイン効果タイプを追加する
  - ChainEffectBuffDuration: バフデュレーション（効果中のバフスキル効果時間+X秒）
  - ChainEffectDebuffDuration: デバフデュレーション（効果中のデバフスキル効果時間+X秒）
  - _Requirements: 3.4_

- [x] 1.5.7 (P) 特殊カテゴリのチェイン効果タイプを追加する
  - ChainEffectDoubleCast: ダブルキャスト（効果中X%でスキル2回発動）
  - _Requirements: 3.4_

- [x] 1.5.8 ChainEffect値オブジェクトに全19種類のGenerateDescription対応を追加する
  - 各チェイン効果タイプに対応する説明テンプレートを追加
  - カテゴリ（attack, defense, heal, typing, recast, effect_extend, special）の判定メソッドを追加
  - 全チェイン効果タイプのユニットテストを追加
  - _Requirements: 3.4, 3.8_

- [x] 2. マスタデータの拡張とパッシブスキル実装
- [x] 2.1 パッシブスキルの基本構造とトリガータイプを定義する
  - PassiveTriggerType（conditional, probability, permanent）の型定義
  - PassiveEffectType（modifier, multiplier, special）の型定義
  - TriggerCondition構造体の定義
  - PassiveSkillDefinition構造体（マスタデータ用）の定義
  - _Requirements: 2.1, 2.4_

- [x] 2.2 (P) 永続効果タイプのパッシブスキルを実装する
  - ps_buff_extender: バフエクステンダー（バフ効果時間+50%）
  - 永続効果のEffectTable登録ロジック
  - _Requirements: 2.1, 2.4_

- [x] 2.3 (P) 条件付き効果倍率タイプのパッシブスキルを実装する
  - ps_perfect_rhythm: パーフェクトリズム（正確性100%でスキル効果1.5倍）
  - ps_speed_break: スピードブレイク（WPM80以上で25%追加ダメージ）
  - ps_endgame_specialist: エンドゲームスペシャリスト（敵HP30%以下で全ダメージ+25%）
  - ps_weak_point: ウィークポイント（デバフ中の敵へダメージ+20%）
  - ps_overdrive: オーバードライブ（HP50%以下でリキャスト-30%、被ダメ+20%）
  - 条件判定とステータス修正ロジック
  - _Requirements: 2.1, 2.4_

- [x] 2.4 (P) 確率トリガータイプのパッシブスキルを実装する
  - ps_last_stand: ラストスタンド（HP25%以下で30%の確率で被ダメージ1）
  - ps_counter_charge: カウンターチャージ（被ダメージ時20%で次の攻撃2倍）
  - ps_miracle_heal: ミラクルヒール（回復スキル時10%でHP全回復）
  - ps_chain_reaction: チェインリアクション（バフ/デバフ使用時30%で効果時間2倍）
  - ps_echo_skill: エコースキル（15%の確率でスキル2回発動）
  - ps_shadow_step: シャドウステップ（物理攻撃成功時20%で敵攻撃タイマーリセット）
  - ps_debuff_reflect: デバフリフレクト（デバフ受け時30%で敵にも同効果）
  - ps_second_chance: セカンドチャンス（時間切れ時50%で再挑戦、制限時間半分）
  - 確率判定と効果発動ロジック
  - _Requirements: 2.1, 2.4_

- [x] 2.5 (P) スタック型・カウンター型のパッシブスキルを実装する
  - ps_combo_master: コンボマスター（ミスなし連続タイピングでダメージ累積+10%、最大+50%）
  - ps_adaptive_shield: アダプティブシールド（同種攻撃3回目以降ダメージ-25%）
  - スタックカウンター管理とリセットロジック
  - _Requirements: 2.1, 2.4_

- [x] 2.6 (P) 反応型のパッシブスキルを実装する
  - ps_debuff_absorber: デバフアブソーバー（デバフ効果時間半減＋小回復）
  - ps_typo_recovery: タイポリカバリー（ミス時制限時間+1秒、1回/チャレンジ）
  - ps_first_strike: ファーストストライク（戦闘開始時、最初のスキルが即発動）
  - イベントフック登録とコールバック処理
  - _Requirements: 2.1, 2.4_

- [x] 2.7 パッシブスキルのユニットテストを作成する
  - 各トリガータイプの発動条件テスト
  - 確率トリガーのモック化テスト
  - スタック/カウンターの状態管理テスト
  - 複数パッシブスキルの併存テスト
  - _Requirements: 2.1, 2.4_

- [x] 2.8 (P) passive_skills.jsonマスタデータを作成する
  - 22種類のパッシブスキル定義をJSON形式で記述
  - トリガータイプ、条件、効果タイプ、効果量パラメータを定義
  - マスタデータローダーにパッシブスキル読み込み処理を追加
  - _Requirements: 2.1, 2.4_

- [x] 2.9 (P) skill_effects.jsonマスタデータを作成する
  - 19種類のチェイン効果定義（ダメージアンプ、ダメージカット等）を記述
  - カテゴリ（attack, defense, heal, typing, recast, effect_extend, special）を定義
  - 効果値の最小・最大範囲を定義
  - マスタデータローダーにチェイン効果読み込み処理を追加
  - _Requirements: 3.4_

- [x] 2.10 cores.jsonにパッシブスキル参照を追加する
  - 各コア特性にpassive_skill_idフィールドを追加
  - 22種類のコア特性とパッシブスキルの対応関係を定義
  - マスタデータからドメインへの変換処理を更新
  - _Requirements: 2.1, 2.2_

- [x] 3. 永続化層（セーブ/ロード）のリファクタリング
- [x] 3.1 (P) CoreInstanceSaveをリファクタリングする
  - IDフィールドを削除し、core_type_idとlevelのみを保持する構造に変更
  - セーブデータのバージョンをv1.0.0として定義
  - CoreInstanceSaveからCoreModelへの変換処理を実装
  - 旧フォーマット検出時の新規ゲーム開始処理を実装
  - _Requirements: 4.4_

- [x] 3.2 (P) ModuleInstanceSaveを新規実装する
  - type_idとchain_effect（オプショナル）を持つ構造体を作成
  - ChainEffectSave構造体（type, value）を作成
  - 既存のModuleCountsマップをModuleInstancesスライスに置き換え
  - ModuleInstanceSaveからModuleModelへの変換処理を実装
  - _Requirements: 5.4, 5.5_

- [x] 3.3 AgentInstanceSaveをチェイン効果対応に更新する
  - module_chain_effectsフィールド（nullを含むスライス）を追加
  - エージェント保存・読み込み処理を更新
  - モジュールとチェイン効果の対応関係を永続化
  - _Requirements: 5.4_

- [x] 4. リキャストマネージャーの実装
- [x] 4.1 RecastManagerを実装する
  - RecastState構造体（AgentIndex, RemainingSeconds, TotalSeconds）を定義
  - エージェントごとのリキャスト状態を管理するマップを実装
  - StartRecast: エージェントのリキャストを開始する処理
  - UpdateRecast: 毎tick呼び出しでリキャスト時間を更新し、終了したエージェントを返す
  - IsAgentReady: エージェントが使用可能かを判定
  - GetRecastState/GetAllRecastStates: 状態取得メソッド
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 4.2 RecastManagerのユニットテストを作成する
  - リキャスト開始→更新→終了の状態遷移テスト
  - 複数エージェントの同時リキャスト管理テスト
  - IsAgentReady判定の正確性テスト
  - 負の値やエッジケースのバリデーションテスト
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 5. チェイン効果マネージャーの実装
- [x] 5.1 ChainEffectManagerを実装する
  - PendingChainEffect構造体（AgentIndex, Effect, SourceModule）を定義
  - TriggeredChainEffect構造体（Effect, EffectValue, Message）を定義
  - RegisterChainEffect: モジュール使用時にチェイン効果を待機状態として登録
  - CheckAndTrigger: 他エージェントのモジュール使用時に発動条件をチェックし、発動を実行
  - ExpireEffectsForAgent: リキャスト終了時に未発動チェイン効果を破棄
  - GetPendingEffects: 待機中チェイン効果の取得
  - _Requirements: 3.5, 3.6, 3.7, 7.1, 7.2, 7.3, 7.5_

- [x] 5.2 チェイン効果の発動ロジックを実装する
  - ダメージボーナス効果: 攻撃ダメージに追加ダメージを適用
  - 回復ボーナス効果: 回復量に追加回復を適用
  - バフ延長効果: EffectTableのバフ効果時間を延長
  - デバフ延長効果: EffectTableのデバフ効果時間を延長
  - BattleStateとの連携による効果適用
  - _Requirements: 3.4, 7.3_

- [x] 5.3 ChainEffectManagerのユニットテストを作成する
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

- [ ] 12.3 全19種類のチェイン効果の挙動検証テストを実施する
  - 攻撃強化カテゴリ: DamageAmp（ダメージ増加率）、ArmorPierce（防御無視）、LifeSteal（HP回復量）
  - 防御強化カテゴリ: DamageCut（被ダメージ軽減率）、Evasion（回避発動率）、Reflect（反射ダメージ量）、Regen（毎秒回復量）
  - 回復強化カテゴリ: HealAmp（回復増加率）、Overheal（一時HP付与量）
  - タイピングカテゴリ: TimeExtend（制限時間延長）、AutoCorrect（ミス無視回数）
  - リキャストカテゴリ: CooldownReduce（リキャスト短縮率）
  - 効果延長カテゴリ: BuffDuration（バフ延長秒数）、DebuffDuration（デバフ延長秒数）
  - 特殊カテゴリ: DoubleCast（二重発動率）
  - 各効果値が正しく計算されることを検証
  - _Requirements: 3.4, 7.3_

- [ ] 12.4 全19種類のパッシブスキルの挙動検証テストを実施する
  - 永続効果: ps_buff_extender（バフ効果時間+50%が常時適用されること）
  - 条件付き効果倍率: ps_perfect_rhythm（正確性100%時のみ効果1.5倍）、ps_speed_break（WPM80以上で25%追加）、ps_endgame_specialist（敵HP30%以下で25%増加）、ps_weak_point（デバフ中の敵へ20%増加）、ps_overdrive（HP50%以下でリキャスト-30%/被ダメ+20%）
  - 確率トリガー: ps_last_stand、ps_counter_charge、ps_miracle_heal、ps_chain_reaction、ps_echo_skill、ps_shadow_step、ps_debuff_reflect、ps_second_chance（各確率が正しく適用されること、モック化テストで発動/非発動を検証）
  - スタック型: ps_combo_master（ダメージ累積+10%、最大+50%のスタック上限）、ps_adaptive_shield（3回目以降のダメージ-25%）
  - 反応型: ps_debuff_absorber、ps_typo_recovery、ps_first_strike（イベント発生時に正しく反応すること）
  - _Requirements: 2.1, 2.4, 6.2_

- [ ] 12.5 複数効果の独立性・併存テストを実施する
  - 複数エージェントのパッシブスキルが同時に有効であること（Agent1のbuff_extender + Agent2のperfect_rhythm）
  - 同一エージェントのパッシブスキルとチェイン効果が独立して動作すること
  - 複数のチェイン効果が待機状態で共存できること
  - 同時発動時の効果計算順序が正しいこと（加算→乗算の順序）
  - 効果の重複時（同種効果が複数ある場合）の挙動検証
  - パッシブスキルとチェイン効果の相互作用テスト（ps_chain_reactionによるチェイン効果延長など）
  - _Requirements: 6.5, 7.3_

- [ ] 12.6 効果の発動・終了タイミング検証テストを実施する
  - パッシブスキルがバトル開始時に正しく登録されること
  - チェイン効果がモジュール使用時に待機状態になること
  - チェイン効果が他エージェントモジュール使用時に発動すること
  - チェイン効果がリキャスト終了時に破棄されること
  - 確率トリガーの発動タイミングが正しいこと
  - 条件付きパッシブの条件変化時に効果がリアルタイムで切り替わること
  - _Requirements: 3.5, 3.6, 3.7, 6.1, 7.1, 7.2_

- [ ] 12.7 UI表示の一貫性検証を実施する
  - バトル画面でのリキャスト状態表示確認
  - エージェント詳細画面でのパッシブスキル/チェイン効果表示確認
  - 各種通知・フィードバックの表示タイミング確認
  - _Requirements: 1.3, 2.3, 3.8, 6.4, 7.4, 7.6_
