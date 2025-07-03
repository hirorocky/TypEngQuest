---
allowed-tools: Bash(git:*)
description: "GithubのIssueを元に新しいブランチを作成し、作業を開始するコマンドです。"
---

# 指示の概要
Issue番号#`$ARGUMENTS`を元に新しいブランチを作成し、作業を開始してください。

# 作業の流れ
1. 指定されたIssueを確認し、内容を理解
2. 新しいブランチを作成
   - ブランチ名は`feature/issue-#<Issue番号>`とする
3. 作業を開始し、必要な変更を行う
4. 作業が完了したら、git pushしプルリクエストを作成
5. プルリクエストを私にレビューしてもらう
6. レビュー後、必要な修正を行い、再度プルリクエストを更新
7. レビューが完了したら、私がプルリクエストをマージ、作業完了とする

# 参照
@docs/game-systems.md - ゲームシステムの詳細
@docs/development-guidelines.md - 開発ガイドライン
@docs/project-structure.md - プロジェクト構造
@docs/development-commands.md - 開発・テスト・ゲーム実行コマンド一覧
@docs/testing-guide.md - テスト実行方法と品質保証