# Requirements Document

## Introduction

このドキュメントはBlitzTypingOperatorの全体的なUI改善に関する要件を定義します。BlitzTypingOperatorはターミナルベースのタイピングバトルゲームであり、bubbletea/lipglossを使用したTUIで構成されています。本仕様は、ユーザー体験の向上、視覚的な一貫性の強化、操作性の改善を目的としています。

## Requirements

### Requirement 1: ホーム画面のレイアウト改善

**Objective:** プレイヤーとして、ホーム画面で必要な情報と主要機能に素早くアクセスしたい。これにより、ゲームプレイがスムーズになる。

#### Acceptance Criteria

1. The BlitzTypingOperator shall ホーム画面に複数行（5-8行程度）のフィグレット風ASCIIアートでゲームロゴを表示する
2. The BlitzTypingOperator shall 左側にメインメニュー、右側に進行状況パネルを横並びで表示する
3. The BlitzTypingOperator shall メインメニューの下部に操作キーのヘルプを表示する
4. The BlitzTypingOperator shall 進行状況パネルに到達レベルをフィグレット風の大きなASCII数字アートで表示する
5. The BlitzTypingOperator shall 進行状況パネルに装備中エージェント一覧を表示する
6. When 装備エージェントが空である, the BlitzTypingOperator shall エージェント管理への誘導メッセージを表示し、バトル選択メニューを無効化（グレーアウト）する

### Requirement 2: エージェント管理画面の改善

**Objective:** プレイヤーとして、エージェントの合成・装備を効率的に行いたい。これにより、戦略的なエージェント構築が容易になる。

#### Acceptance Criteria

1. The BlitzTypingOperator shall 合成タブで左側に選択可能なパーツ（コア/モジュール）のリストを表示する
2. The BlitzTypingOperator shall 合成タブで右側に合成用に選択済みのパーツ一覧（コア1つ + モジュール4つ）を表示する
3. The BlitzTypingOperator shall 合成タブの左側リスト下部にカーソル中のパーツの詳細性能を表示する
4. The BlitzTypingOperator shall 合成タブの右側選択済み一覧の下部に完成後のエージェントステータス予測を表示する
5. The BlitzTypingOperator shall 装備タブの上部エリアで、左側に所持エージェント一覧を縦リストで表示する
6. The BlitzTypingOperator shall 装備タブの上部エリアで、右側に選択中エージェントの詳細（ステータス、モジュール一覧）を表示する
7. The BlitzTypingOperator shall 装備タブの下部エリアに装備中の3体のエージェントを横並びのカード形式で表示する
8. The BlitzTypingOperator shall 装備タブでTabキーにより選択スロット（1〜3）を切り替える
9. When エージェントを削除する, the BlitzTypingOperator shall 確認ダイアログを表示する

### Requirement 3: バトル画面のUI改善

**Objective:** プレイヤーとして、バトル中に必要な情報を素早く把握したい。これにより、戦略的な判断がしやすくなる。

#### Acceptance Criteria

1. The BlitzTypingOperator shall 戦闘画面を上から「敵情報エリア」「エージェントエリア」「プレイヤー情報エリア」の3エリアで構成する
2. The BlitzTypingOperator shall エージェントエリアに装備中の3体のエージェントを横並びのカード形式で表示する
3. The BlitzTypingOperator shall HPバーの変化をアニメーション（徐々に増減）で表示する
4. When ダメージまたは回復が発生する, the BlitzTypingOperator shall HPバーの横に数値を一時的に表示し、数秒後に消去する
5. The BlitzTypingOperator shall 次の敵攻撃までの時間をプログレスバーで視覚化する
6. The BlitzTypingOperator shall モジュール一覧でカテゴリ別にアイコンを表示する
7. When バフまたはデバフが適用される, the BlitzTypingOperator shall エフェクト名と残り時間を視覚的に区別して表示する
8. While タイピングチャレンジ中である, the BlitzTypingOperator shall 入力済み・現在位置・未入力を明確に色分けして表示する
9. When 戦闘が終了する, the BlitzTypingOperator shall エージェントエリアにASCIIアートで「WIN」または「LOSE」を表示する

### Requirement 4: カラーテーマとスタイルの統一

**Objective:** プレイヤーとして、一貫したビジュアルスタイルでゲームを楽しみたい。これにより、プロフェッショナルな印象を受ける。

#### Acceptance Criteria

1. The BlitzTypingOperator shall 全画面で統一されたカラーパレット（styles.goで定義済み）を使用する
2. The BlitzTypingOperator shall ボーダースタイル（RoundedBorder）を全画面で統一する
3. The BlitzTypingOperator shall プライマリ・セカンダリ・アクセントカラーを明確に定義して使用する
4. When カラー非対応ターミナルを検出する, the BlitzTypingOperator shall モノクロ代替表示に切り替える
5. The BlitzTypingOperator shall テキストの階層（タイトル、サブタイトル、本文、補足）を一貫したスタイルで表現する

### Requirement 5: 視覚的フィードバックの強化

**Objective:** プレイヤーとして、自分の操作に対する即座のフィードバックを視覚的に受け取りたい。これにより、ゲームへの没入感が高まる。

#### Acceptance Criteria

1. When メニュー項目が選択される, the BlitzTypingOperator shall 選択項目をハイライト表示し、カーソル位置を明示する
2. When ボタンやメニュー項目がフォーカスを受け取る, the BlitzTypingOperator shall アニメーション効果でフォーカス状態を示す
3. When 操作が無効である, the BlitzTypingOperator shall 無効な操作の理由を含むエラーメッセージを表示する
4. When アクションが成功する, the BlitzTypingOperator shall 成功を示す視覚的フィードバック（色変化、アイコン）を表示する
