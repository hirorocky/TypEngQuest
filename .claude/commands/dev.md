---
allowed-tools: Bash(git:*)
description: "GithubのIssueを元に新しいブランチを作成し、作業を開始するコマンドです。"
---

# 指示の概要
Issue番号#`$ARGUMENTS`を元に新しいブランチを作成し、作業を開始してください。
プルリクエストを作成するまで基本的に私に指示を仰がなくていいです。

# 作業の流れ
1. 指定されたIssueを確認し、内容を理解
2. 新しいブランチを作成
   - ブランチ名は`feature/issue-#<Issue番号>`とする
3. Issueの内容を元にレビュワーにわかりやすいようにタスクを分割
   - 開発を行い、必要に応じて下記参照ドキュメントを更新（タスク単位で`git commit`する）
4. `npm run check`を実行、エラーやRedが全てなくなるまで修正
5. 全タスクが完了したら`git push`しプルリクエストを作成
6. 作業完了とする

# 参照
@docs/game-systems.md - ゲームシステムの詳細
@docs/development-guidelines.md - 開発ガイドライン
@docs/project-structure.md - プロジェクト構造
@docs/development-commands.md - 開発・テスト・ゲーム実行コマンド一覧
@docs/testing-guide.md - テスト実行方法と品質保証
