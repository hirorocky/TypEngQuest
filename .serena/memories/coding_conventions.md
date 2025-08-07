# コーディング規約とスタイル

## 言語とコメント
- **コメントは日本語**: コード中のコメント・説明は全て日本語
- **テストも日本語**: describe・testメソッドの説明文は日本語
- **クラス名・変数名**: 英語（実装寄りの名前はそのまま）
- **ユーザー向けメッセージ**: Unix風英語で記述

## JSDocコメント規約
全てのクラスとメソッドにJSDoc形式のコメントを必須とする：
- **クラス**: 目的と責務を日本語で説明
- **メソッド**: 機能、引数、戻り値を日本語で説明
- **パラメータ**: 型と説明を明記
- **戻り値**: 型と説明を明記
- **例外**: throwsする場合は条件を明記

## TypeScript設定
- **target**: ES2022
- **module**: CommonJS
- **strict**: true (厳格モード有効)
- **esModuleInterop**: true
- **moduleResolution**: node

## ESLint設定
- **no-console**: off (CLIゲームのため許可)
- **no-unused-vars**: TypeScript版ルール使用 (アンダースコア変数は無視)
- **prefer-const**: error
- **no-var**: error
- **complexity**: 10以下
- **max-depth**: 4以下
- **max-params**: 4以下

## Prettier設定
- **semi**: true (セミコロンあり)
- **singleQuote**: true (シングルクォート)
- **printWidth**: 100
- **tabWidth**: 2
- **trailingComma**: es5

## Unix風メッセージガイドライン
- 小文字で始める（固有名詞除く）
- 簡潔で技術的な表現を使用
- 句読点は最小限に抑える
- 例: `game started`, `no such directory`, `current path: /projects`

## 重要な制約
- **package.jsonのtypeフィールドを変更してはならない**
- **ランダムな機能はモックを使い、Flakyにならないようにする**