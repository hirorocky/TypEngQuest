# Requirements Document

## Project Description (Input)
GitHub Issue #10「怒りシステム」より:

敵には「ボルテージ」という値があり、バトル開始時は100%からスタートする。時間経過とともにボルテージが上昇し、プレイヤーが与えるダメージはボルテージの割合で乗算される。これにより、プレイヤーは消耗戦だけでは勝利できなくなる。

ボルテージの上昇量は敵ごとにマスターデータで設定可能で、「10秒間でXポイント上昇」という形式で細かく調整できる。

## Introduction

ボルテージシステムは、バトルに時間的プレッシャーを与える仕組みです。敵のボルテージが上昇するとプレイヤーの与ダメージが増加し、素早く敵を倒すほど有利になります。これにより、消耗戦ではなく積極的な攻撃を促し、タイピングゲームとしての緊張感を維持します。

## Requirements

### Requirement 1: ボルテージ初期化
**Objective:** プレイヤーとして、バトル開始時にボルテージが100%から始まることで、ダメージ計算の基準を明確に理解したい

#### Acceptance Criteria
1. When バトルが開始される, the battle system shall ボルテージを100%に初期化する
2. The battle system shall ボルテージを敵ごとに管理する
3. When バトルが再開される（リトライ時）, the battle system shall ボルテージを100%にリセットする

### Requirement 2: ボルテージの時間経過上昇
**Objective:** プレイヤーとして、時間経過でボルテージが上昇することで、迅速なバトル遂行へのモチベーションを得たい

#### Acceptance Criteria
1. While バトル進行中, the battle system shall 10秒間で敵ごとに設定されたポイント分だけボルテージを上昇させる
2. The battle system shall ボルテージ上昇量をマスターデータ（enemies.json）で敵タイプごとに設定可能とする
3. The battle system shall ボルテージを小数点以下の精度で管理する（例: 100.0%, 115.5%）
4. The battle system shall ボルテージの上限を999.9%とする

### Requirement 3: ボルテージによるダメージ乗算
**Objective:** プレイヤーとして、高いボルテージ時により大きなダメージを与えることで、時間経過を戦略的に活用したい

#### Acceptance Criteria
1. When プレイヤーがダメージを与える, the battle system shall 最終ダメージ = 基礎ダメージ × (ボルテージ / 100) で計算する
2. The battle system shall ボルテージが100%のとき等倍ダメージ（×1.0）を適用する
3. The battle system shall ボルテージが150%のとき1.5倍ダメージを適用する

### Requirement 4: ボルテージのUI表示
**Objective:** プレイヤーとして、現在のボルテージをリアルタイムで確認することで、戦略的な判断を行いたい

#### Acceptance Criteria
1. While バトル進行中, the battle system shall 現在のボルテージをパーセント表示する
2. The battle system shall ボルテージを整数パーセント（小数点以下切り捨て）で表示する
3. When ボルテージが上昇する, the battle system shall 表示をリアルタイムに更新する
4. The battle system shall ボルテージ表示を画面右上に配置する

### Requirement 5: マスターデータ設定
**Objective:** ゲームデザイナーとして、敵ごとのボルテージ上昇量を調整することで、バトルバランスを細かく制御したい

#### Acceptance Criteria
1. The enemy system shall enemies.jsonに「voltage_rise_per_10s」フィールドを追加する
2. The enemy system shall voltage_rise_per_10sに整数または小数値を設定可能とする
3. If voltage_rise_per_10sが未設定の場合, the enemy system shall デフォルト値（10ポイント/10秒）を適用する
4. The enemy system shall voltage_rise_per_10sに0を設定した場合はボルテージが上昇しない

### Requirement 6: ボルテージとフェーズの連携
**Objective:** プレイヤーとして、敵のフェーズ変化とボルテージの関係を理解し、戦略を立てたい

#### Acceptance Criteria
1. When 敵がフェーズ移行（通常→強化）する, the battle system shall ボルテージをリセットせず継続する
2. The battle system shall フェーズによってボルテージ上昇率を変更しない（一定の上昇率を維持）
3. The battle system shall ボルテージはフェーズとは独立した値として管理する

### Requirement 7: ボルテージ表示のビジュアルフィードバック
**Objective:** プレイヤーとして、ボルテージの危険度を視覚的に把握し、プレッシャーを感じながらプレイしたい

#### Acceptance Criteria
1. While ボルテージが100%〜149%, the battle system shall 通常色（白）で表示する
2. While ボルテージが150%〜199%, the battle system shall 警告色（黄色）で表示する
3. While ボルテージが200%以上, the battle system shall 危険色（赤）で表示する
