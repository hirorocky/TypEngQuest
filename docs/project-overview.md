# プロジェクト概要
**TypEngQuest** - エンジニア向けTypeScript CLI ベースのタイピングRPGゲーム。プレイヤーはファイルシステムのようなマップを `cd` コマンドで探索し、プログラミング関連の単語や文章をタイピングして敵と戦い、ドロップした英単語装備を収集して文法的に正しい英文を装備し強くなります。

### 技術アーキテクチャ
- **言語**: TypeScript with ES Modules
- **ランタイム**: Node.js 22.17.0 (mise.tomlで管理)
- **CLIフレームワーク**: Commander.js + Inquirer.js
- **UI**: Blessed (ターミナルUI), Chalk (色), CLI-progress
- **データ**: Lowdb (JSONデータベース), Zod (バリデーション)
- **テスト**: Jest + ts-jest (TypeScript対応)
- **品質管理**: ESLint (コード品質), Prettier (コード整形)