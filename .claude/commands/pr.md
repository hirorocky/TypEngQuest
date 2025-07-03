---
allowed-tools: Bash(git:*)
description: "GithubのPRをから作業を開始するコマンドです。"
---

# 指示の概要
PR番号#`$ARGUMENTS`を参照し、そこについたコメントを解決するための作業を行ってください。

# 作業の流れ
1. 指定されたPRを確認し、コメントを理解
2. PRのブランチにswitch、pullして最新状態にする
3. 作業を開始し、必要な変更を行う（feature単位でgit commitする）
4. 作業が完了したら、必要に応じて下記参照ドキュメントを更新
5. git pushして作業を完了する

# 参照
@docs/game-systems.md - ゲームシステムの詳細
@docs/development-guidelines.md - 開発ガイドライン
@docs/project-structure.md - プロジェクト構造
@docs/development-commands.md - 開発・テスト・ゲーム実行コマンド一覧
@docs/testing-guide.md - テスト実行方法と品質保証