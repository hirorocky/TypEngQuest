# TypEngQuest プロジェクト概要

## プロジェクトの目的
**TypEngQuest** は、エンジニア向けのTypeScript CLIベースのタイピングRPGゲームです。
プレイヤーは仮想ファイルシステムを `cd` コマンドで探索し、プログラミング関連の単語や文章をタイピングして敵と戦い、ドロップした英単語装備を収集して文法的に正しい英文を装備し強くなります。

## 技術スタック
- **言語**: TypeScript (ES2022ターゲット)
- **モジュールシステム**: CommonJS (package.json type: module)
- **ランタイム**: Node.js 22.17.0 (mise.tomlで管理)
- **CLIフレームワーク**: Commander.js + Inquirer.js
- **UI**: 
  - Blessed (ターミナルUI)
  - Chalk (色付け)
  - CLI-progress (プログレスバー)
  - Figlet (ASCIIアート)
- **データ管理**: 
  - Lowdb (JSONデータベース)
  - Zod (バリデーション)
- **テスト**: Jest + ts-jest
- **品質管理**: 
  - ESLint (コード品質チェック)
  - Prettier (コード整形)
  - cspell (スペルチェック)

## 開発手法
- **TDD (テスト駆動開発)**: t-wada氏が提唱するTDDサイクルに従う
- **アジャイル開発**: 12の小プロジェクトに分割した段階的開発
- **コードカバレッジ目標**: 95%以上