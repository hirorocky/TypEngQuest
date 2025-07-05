---
allowed-tools: Bash(git:*)
description: "GithubのPRをから作業を開始するコマンドです。"
---

# 指示の概要
PR番号#`$ARGUMENTS`を参照し、そこについたコメントを解決するための作業を行ってください。

# 作業の流れ
1. 指定されたPRを確認し、解決されてないコメントを確認
   - `bash ./scripts/pr-review-comments.sh $ARGUMENTS`を実行
2. PRのブランチにswitch、pullして最新状態にする
3. コメントの内容を元にレビュワーにわかりやすいようにタスクを分割
   - 開発を行い、必要に応じて下記参照ドキュメントを更新（タスク単位で`git commit`する）
   - 対応したPRコメントに返信する
4. `npm run check`を実行、エラーやRedが全てなくなるまで修正
5. 全タスクが完了したら`git push`し、対応したコメントに返信する
6. 作業完了とする

# 参照
@docs/game-systems.md - ゲームシステムの詳細
@docs/development-guidelines.md - 開発ガイドライン
@docs/project-structure.md - プロジェクト構造
@docs/development-commands.md - 開発・テスト・ゲーム実行コマンド一覧
@docs/testing-guide.md - テスト実行方法と品質保証