# Requirements Document

## Introduction

本ドキュメントは「敵のレベル設計と多様化」機能の要件を定義します。

バトルレベル選択システム、敵の二重状態（通常/強化）管理、順序実行型の行動パターン、状態別パッシブスキル、確定報酬システムを実装します。

## Requirements

### Requirement 1: レベル選択システム

**Objective:** As a プレイヤー, I want バトル開始前にレベルと敵を選択, so that 自分に合った相手と戦える

#### Acceptance Criteria

1. The Level Selection System shall バトルのレベルと敵を一対一対応させる（レベル1〜100、敵100種類）
2. The Level Selection System shall 各敵タイプにデフォルトレベル（DefaultLevel）を設定可能にする
3. When プレイヤーがレベル選択画面を開く, the Level Selection System shall 対応する敵の特徴を表示する
4. Where プレイヤーが敵を未撃破, the Level Selection System shall その敵タイプのデフォルトレベルのみ選択可能にする
5. Where プレイヤーが一度でも敵を倒している, the Level Selection System shall デフォルトレベル以上のレベルで再挑戦可能にする
6. The Level Selection System shall レベルが上がった分、報酬のクオリティを向上させる
7. The Level Selection UI shall 左右キーで敵の種類を変更可能にする
8. Where プレイヤーが一度でも敵を倒している, the Level Selection UI shall 上下キーでレベルを変更可能にする

### Requirement 2: 敵の状態管理

**Objective:** As a プレイヤー, I want 敵が通常状態と強化状態を持つ, so that バトル中に戦略的な緊張感を味わえる

#### Acceptance Criteria

1. The Enemy System shall 各敵に通常状態と強化状態の2つの状態を定義する
2. When 敵HPが50%以下になる, the Enemy System shall 通常状態から強化状態へ遷移する
3. The Enemy System shall 一度強化状態に遷移した敵を通常状態に戻さない

### Requirement 3: 敵の行動パターン

**Objective:** As a プレイヤー, I want 敵が予測可能な行動パターンを持つ, so that 戦略を立てて対処できる

#### Acceptance Criteria

1. The Enemy Action System shall 通常行動パターンを行動の配列（最低1つ）として定義する
2. The Enemy Action System shall 配列の最初から順に行動を実行し、最後まで選ばれたら最初に戻る
3. The Enemy Action System shall 強化行動パターンを通常行動パターンと同じ形式で定義する
4. When 敵が強化状態になる, the Enemy Action System shall 強化行動パターンに切り替える
5. The Enemy Action System shall 敵の行動速度で設定された時間が経つごとに行動を実行する

### Requirement 4: 敵のパッシブスキル

**Objective:** As a プレイヤー, I want 敵が状態別のパッシブスキルを持つ, so that 敵ごとの個性を感じられる

#### Acceptance Criteria

1. The Passive Skill System shall 通常パッシブを定義可能にする
2. The Passive Skill System shall 通常パッシブを一時ステータスに加えて常時発動する効果として適用する
3. When 敵が強化状態になる, the Passive Skill System shall 通常パッシブを無効にする
4. The Passive Skill System shall 強化パッシブを定義可能にする
5. When 敵が強化状態になる, the Passive Skill System shall 強化パッシブの効果を適用する

### Requirement 5: 報酬システム

**Objective:** As a プレイヤー, I want 敵を倒すと確実に報酬を得られる, so that 挑戦する価値がある

#### Acceptance Criteria

1. When 敵を撃破する, the Reward System shall 必ず1つアイテムをドロップする
2. The Reward System shall 敵ごとに落とすアイテムのカテゴリ（DropItemCategory: "core"または"module"）とTypeID（DropItemTypeID）を設定可能にする
3. Where DropItemCategoryが"core", the Reward System shall 指定されたTypeIDのコアを敵レベルを上限としてレベルをランダムに決定して生成する
4. Where DropItemCategoryが"module", the Reward System shall 指定されたTypeIDのモジュールを敵レベルに応じてチェイン効果をランダムに選択して生成する

### Requirement 6: バトルシステム統合

**Objective:** As a システム, I want 上記ロジックがバトル中に正しく動作, so that 一貫したゲーム体験を提供できる

#### Acceptance Criteria

1. The Battle System shall 敵の状態遷移ロジックを実行する
2. The Battle System shall 敵の行動パターンに従って行動を実行する
3. The Battle System shall 敵のパッシブスキル効果を適用する
4. When バトル終了時, the Battle System shall 報酬システムを呼び出す
