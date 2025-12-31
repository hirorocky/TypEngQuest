# Requirements Document

## Introduction

本ドキュメントはBlitzTypingOperatorにおける「エージェント周辺の機能拡張」の要件を定義します。
エージェントシステムはプレイヤーの戦闘ユニットを管理する中核ドメインであり、
コアとモジュールの組み合わせによる合成、装備管理、ステータス計算を担当しています。

本機能拡張では、以下の2つの主要領域に焦点を当てた改善・拡張を行います:

1. **エージェント特性**: コアのパッシブスキル、モジュールのチェイン効果、およびデータモデルのリファクタリング
2. **バトル**: パッシブスキルのステータステーブル反映、チェイン効果の発動システム、リキャスト中のエージェント使用不能化

### 前提: エージェントリキャスト機構

本機能拡張において、**モジュールが使用されるとエージェント自体がリキャスト状態になる**という基本機構を導入します。
リキャスト中のエージェントは全モジュールが使用不能となり、チェイン効果はこのエージェントリキャスト期間中に発動します。
この機構はRequirement 1で定義され、他の全要件はこの前提に基づいて設計されています。

## Requirements

### Requirement 1: リキャスト中のエージェント使用不能化（前提要件）
**Objective:** As a プレイヤー, I want モジュール使用後にエージェント全体がリキャスト状態になる, so that エージェント切り替えによる戦略的なプレイが重要になる

#### Acceptance Criteria
1. When モジュールが使用される, the Battle System shall そのモジュールを持つエージェントをリキャスト状態にする
2. While エージェントがリキャスト中, the Battle System shall そのエージェントの全モジュールを使用不能にする
3. While エージェントがリキャスト中, the Battle System shall エージェント選択UIでリキャスト状態を表示する
4. When リキャスト期間が終了する, the Battle System shall エージェントを使用可能状態に戻す
5. The Battle System shall エージェントのリキャスト残り時間をUIに表示する

### Requirement 2: コアのパッシブスキルシステム
**Objective:** As a プレイヤー, I want コアごとに固有のパッシブスキルがエージェントに反映される, so that コア特性による戦略的なエージェント編成ができる

#### Acceptance Criteria
1. The Agent System shall コア特性ごとに1つのパッシブスキルを定義する
2. When エージェントが合成される, the Agent System shall コアのパッシブスキルをエージェントに継承する
3. The Agent System shall パッシブスキルの効果（ID、名称、説明）をエージェント詳細画面で表示する
4. The Agent System shall パッシブスキルの効果量をコアレベルに基づいて計算する
5. While エージェントがバトルに参加している, the Battle System shall パッシブスキル効果をステータス計算などに適用する
6. While エージェントがリキャスト中, the Battle System shall パッシブスキル効果を継続して適用する

### Requirement 3: モジュールのチェイン効果システム
**Objective:** As a プレイヤー, I want モジュール使用後にエージェントのリキャスト期間中にチェイン効果が発動する, so that 連続したスキル使用による戦術的なコンボが可能になる

#### Acceptance Criteria
1. The Module System shall チェイン効果（ChainEffect）をモジュールインスタンスに紐付けて管理する
2. When プレイヤーがモジュールを入手する, the Module System shall モジュール種別とチェイン効果の組み合わせをランダムに決定する
3. The Module System shall 同一モジュール種別でもインスタンスごとに異なるチェイン効果を持つことを許容する
4. The Module System shall チェイン効果としてダメージ追加、回復追加、バフ延長、デバフ延長などを提供する
5. When モジュールが使用される, the Battle System shall そのモジュールに紐付くチェイン効果を待機状態として登録し、エージェントをリキャスト状態にする
6. While エージェントがリキャスト中, the Battle System shall そのエージェントのチェイン効果の発動タイミングを監視する
7. When エージェントのリキャスト期間中に発動条件が満たされる, the Battle System shall チェイン効果を発動する
8. The Agent System shall モジュールインスタンスのチェイン効果情報をエージェント詳細画面で表示する

### Requirement 4: データモデルのリファクタリング（コア）
**Objective:** As a 開発者, I want コアのデータモデルを最適化する, so that セーブデータとコード内の表現が一貫し、保守性が向上する

#### Acceptance Criteria
1. The Agent System shall コアをtypeId（コア特性ID）とlevel（レベル）の組として表現する
2. The Agent System shall コアモデルからインスタンスIDフィールドを削除する
3. When コアがロードされる, the Agent System shall typeIdからマスタデータを参照してステータスを再計算する
4. The Persistence System shall コアをtypeIdとlevelのペアとして永続化する
5. The Agent System shall コアの同一性をtypeIdとlevelの組み合わせで判定する

### Requirement 5: データモデルのリファクタリング（モジュール）
**Objective:** As a 開発者, I want モジュールのデータモデルを最適化する, so that チェイン効果を含む新しい構造に対応できる

#### Acceptance Criteria
1. The Module System shall モジュールをtypeId（モジュール種別ID）とchainEffect（チェイン効果）の組として表現する
2. The Module System shall モジュールモデルからインスタンスIDフィールドを削除する
3. When モジュールがロードされる, the Module System shall typeIdからマスタデータを参照して基礎効果を取得する
4. The Persistence System shall モジュールをtypeIdとchainEffectのペアとして永続化する
5. The Module System shall 同一typeIdのモジュールでも異なるchainEffectを持つことを許容する

### Requirement 6: バトル中のパッシブスキル反映
**Objective:** As a プレイヤー, I want バトル中にパッシブスキルがステータスに反映される, so that コア特性の恩恵を実感できる

#### Acceptance Criteria
1. When バトルが開始される, the Battle System shall 装備エージェントのパッシブスキルをステータステーブルに登録する
2. The Battle System shall パッシブスキルによるステータス補正をリアルタイムで計算する
3. While パッシブスキルが有効, the Battle System shall 補正後のステータスをダメージ計算に使用する
4. The Battle System shall パッシブスキルの効果をバトルUI上で視覚的に表示する
5. If 複数のエージェントが装備されている場合, then the Battle System shall 各エージェントのパッシブスキルを個別に管理する
6. While エージェントがリキャスト中, the Battle System shall そのエージェントのパッシブスキル効果を維持する

### Requirement 7: エージェントリキャスト中のチェイン効果発動
**Objective:** As a プレイヤー, I want エージェントのリキャスト期間中にチェイン効果が発動する, so that 戦術的なタイミングでボーナス効果を得られる

#### Acceptance Criteria
1. When モジュールが使用される, the Battle System shall エージェントのリキャスト期間を開始し、チェイン効果を待機状態にする
2. While エージェントがリキャスト中, the Battle System shall チェイン効果の発動条件を監視する
3. When エージェントのリキャスト期間中に他のエージェントのモジュールが使用される, the Battle System shall 待機中のチェイン効果を発動する
4. The Battle System shall チェイン効果発動時に視覚的なフィードバックを表示する
5. If エージェントのリキャスト期間が終了した場合, then the Battle System shall チェイン効果を破棄する
6. The Battle System shall チェイン効果の残りリキャスト時間（エージェントのリキャスト残り時間）を表示する
