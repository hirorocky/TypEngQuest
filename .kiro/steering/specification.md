# Specification Standards

## Overview

このドキュメントはドメイン別仕様の管理基準を定義します。
各ドメインの要件・仕様は `.kiro/steering/specifications/{domain}.md` に配置されます。

## Directory Structure

```
.kiro/steering/
├── product.md           # プロダクト概要
├── tech.md              # 技術スタック
├── structure.md         # プロジェクト構造
├── specification.md     # 本ドキュメント（仕様インデックス）
└── specifications/      # ドメイン別仕様
    ├── battle.md        # バトルシステム
    ├── gameloop.md      # ゲームループ・状態遷移
    ├── agent.md         # エージェント・合成システム
    ├── typing.md        # タイピング評価・入力処理
    ├── enemy.md         # 敵・ステージシステム
    └── collection.md    # 図鑑・実績システム
```

## Domain Specification Format

各ドメイン仕様ファイルは以下の構造で記述:

```markdown
# {Domain Name}

## 概要
[ドメインの責務と目的]

## 要件

### REQ-{DOMAIN}-{N}: {要件名}
**種別**: {Ubiquitous | Event-Driven | State-Driven | Optional}

{EARS形式の要件文}

**受け入れ基準**:
1. [測定可能な条件1]
2. [測定可能な条件2]

## 仕様

### {コンポーネント/機能名}

**責務**: [何をするか]

**インターフェース**:
- 入力: [受け取るもの]
- 出力: [返すもの]

**ルール**:
1. [ビジネスルール1]
2. [ビジネスルール2]

**状態遷移** (該当する場合):
[Mermaid stateDiagram]

## 関連ドメイン
- {他ドメイン名}: [依存関係の説明]
```

## Domain List

| ドメイン | ファイル | 責務 |
|---------|---------|------|
| Battle | `battle.md` | バトル進行、ターン管理、ダメージ計算、勝敗判定 |
| Game Loop | `gameloop.md` | シーン遷移、ゲーム状態管理、セーブ/ロード |
| Agent | `agent.md` | エージェント合成、装備、ステータス計算 |
| Typing | `typing.md` | 入力評価、WPM/正確性計算、チャレンジ生成 |
| Enemy | `enemy.md` | 敵定義、ステージ構成、AI行動パターン |
| Collection | `collection.md` | 図鑑登録、実績解除、進行状況追跡 |

## EARS Requirement Format

要件は EARS（Easy Approach to Requirements Syntax）形式で記述:

| 種別 | 構文 | 例 |
|-----|------|-----|
| Ubiquitous | The {system} shall {action} | The battle system shall calculate damage based on WPM |
| Event-Driven | When {trigger}, the {system} shall {action} | When player HP reaches 0, the battle system shall end with defeat |
| State-Driven | While {state}, the {system} shall {action} | While typing challenge is active, the system shall accept keyboard input |
| Optional | Where {condition}, the {system} shall {action} | Where critical hit occurs, the damage shall be doubled |

## Cross-Domain References

ドメイン間の依存関係を明示:

```
Battle ──depends──> Typing (ダメージ計算にWPM使用)
Battle ──depends──> Agent (装備エージェントのスキル参照)
Battle ──depends──> Enemy (敵パラメータ参照)
Agent ──depends──> Collection (合成時の図鑑更新)
Game Loop ──orchestrates──> All Domains
```

## Versioning

仕様変更時は以下を記録:
- 変更日
- 変更内容の要約
- 影響を受ける機能

---
_ドメイン仕様はプロジェクトの設計意図を永続化するもの。実装の「なぜ」を記録する_
_updated_at: 2025-12-31_
