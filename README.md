```
╔╗ ╦  ╦╔╦╗╔═╗╔╦╗╦ ╦╔═╗╦╔╗╔╔═╗╔═╗╔═╗╔═╗╦═╗╔═╗╔╦╗╔═╗╦═╗
╠╩╗║  ║ ║ ╔═╝ ║ ╚╦╝╠═╝║║║║║ ╦║ ║╠═╝║╣ ╠╦╝╠═╣ ║ ║ ║╠╦╝
╚═╝╩═╝╩ ╩ ╚═╝ ╩  ╩ ╩  ╩╝╚╝╚═╝╚═╝╩  ╚═╝╩╚═╩ ╩ ╩ ╚═╝╩╚═
```

https://github.com/user-attachments/assets/e3af5577-ec2e-4204-89c6-551b1dfead8f


タイピング練習とRPGバトルを融合したターミナルベースのゲームです。

タイピングでスキルを発動し、敵とリアルタイムバトルを繰り広げましょう。

## インストール

### Homebrew (macOS / Linux)

```bash
brew tap hirorocky/blitztypingoperator
brew install blitztypingoperator
```

### GitHub Releases からダウンロード

[Releases](../../releases) ページから、お使いのOS・アーキテクチャに合ったファイルをダウンロードしてください。

| OS | アーキテクチャ | ファイル |
|---|---|---|
| macOS | Intel (x64) | `BlitzTypingOperator-darwin-amd64.tar.gz` |
| macOS | Apple Silicon (M1/M2/M3) | `BlitzTypingOperator-darwin-arm64.tar.gz` |
| Linux | x64 | `BlitzTypingOperator-linux-amd64.tar.gz` |
| Linux | ARM64 | `BlitzTypingOperator-linux-arm64.tar.gz` |
| Windows | x64 | `BlitzTypingOperator-windows-amd64.zip` |
| Windows | ARM64 | `BlitzTypingOperator-windows-arm64.zip` |

### macOS / Linux

```bash
# ダウンロードして展開
tar -xzf BlitzTypingOperator-<os>-<arch>.tar.gz

# 実行権限を付与（必要に応じて）
chmod +x BlitzTypingOperator

# 実行
./BlitzTypingOperator
```

### Windows

1. ZIPファイルを展開
2. `BlitzTypingOperator.exe` をダブルクリック、またはコマンドプロンプト/PowerShellから実行

```powershell
.\BlitzTypingOperator.exe
```

### ソースからビルド

Go 1.21以上が必要です。

```bash
git clone https://github.com/<username>/BlitzTypingOperator.git
cd BlitzTypingOperator
go build -o BlitzTypingOperator ./cmd/BlitzTypingOperator
./BlitzTypingOperator
```

## 遊び方

1. **ゲーム開始**: ターミナルでゲームを起動し、メニューから「バトル」を選択
2. **タイピングでスキル発動**: 画面に表示される英単語をタイプしてスキルを発動
3. **敵を倒す**: タイピングの速度（WPM）と正確性がダメージに影響します
4. **エージェント育成**: コア（特性）とモジュール（スキル）を組み合わせて、自分だけのエージェントを作成

### 操作方法

| キー | 操作 |
|---|---|
| `↑` `↓` | メニュー選択 |
| `Enter` | 決定 |
| `Esc` | 戻る / キャンセル |
| `Ctrl+C` | ゲーム終了 |

## 開発

### 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/hirorocky/BlitzTypingOperator.git
cd BlitzTypingOperator

# 依存関係のインストール
go mod download

# ビルド
go build -o BlitzTypingOperator ./cmd/BlitzTypingOperator

# テストの実行
go test ./...
```

### コントリビューション

プルリクエストやイシューの報告は大歓迎です！

## ライセンス

MIT License
