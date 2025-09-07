# 開発に関する指示

## 開発手法：テスト駆動開発 (TDD)
このプロジェクトでは **t-wada (和田卓人氏) が提唱するテスト駆動開発 (Test-Driven Development)** を採用します。

### TDDサイクル
1. **🔴 Red**: まず失敗するテストを書く
   - 新機能の仕様をテストコードで表現
   - テスト実行前にLint・Formatを実行
   - (重要)ステークホルダーによる仕様確認を促す
   - テストが失敗することを確認
2. **🟢 Green**: テストを通す最小限のコードを書く
   - 美しさよりも動作を優先してテストが成功する最小限の実装
   - テスト実行前にLint・Format
   - テストが成功することを確認
3. **🔵 Refactor**: コードを改善する
   - テストが通ることを保ちながらリファクタリング
   - 重複排除、可読性向上

### TDD実践ガイドライン
- **新機能実装前に必ずテストを先に書く**
- **小さなサイクルで素早く回す**
- **テストが失敗→成功→リファクタリングの順序を厳守**
- **テストコードも本体コードと同等に重要視**
- **コード品質を保つためLint・Format チェックを必須とする**
- **ランダムな機能はモックを使い、Flakyにならないようにする**

## コーディング規約
- **コメントは日本語で記述**: コード中のコメント・説明は全て日本語
- **テストは日本語記述**: describe・testメソッドの説明文は日本語
- **クラス名・変数名**: 英語（実装寄りの名前はそのまま）
- **JSDocコメント**: 全てのクラスとメソッドにJSDoc形式のコメントを付与
- **ユーザー向けメッセージ**: Unix風英語で記述（詳細は後述）

### 重要な指示
package.jsonの`type`フィールドを変更してはならない

### JSDocコメント規約
- **クラス**: 目的と責務を日本語で説明
- **メソッド**: 機能、引数、戻り値を日本語で説明
- **パラメータ**: 型と説明を明記
- **戻り値**: 型と説明を明記
- **例外**: throwsする場合は条件を明記

```typescript
/**
 * プレイヤークラス - ゲーム内のプレイヤー情報と装備を管理する
 */
export class Player {
  /**
   * プレイヤーのステータスを取得する
   * @param includeEquipment - 装備ボーナスを含めるかどうか
   * @returns プレイヤーのステータス情報
   * @throws {Error} プレイヤーが初期化されていない場合
   */
  getStatus(includeEquipment: boolean = true): PlayerStatus {
    // 実装
  }
}
```

### Unix風メッセージガイドライン
ユーザー向けのメッセージは以下の規約に従って記述します：

**基本方針**
- 小文字で始める（固有名詞除く）
- 簡潔で技術的な表現を使用
- 句読点は最小限に抑える
- Unixコマンドスタイルの慣例に従う

**メッセージ種別**
- **成功メッセージ**: 動作完了を示す（例：`game started`, `directory changed`）
- **エラーメッセージ**: 問題を簡潔に伝える（例：`no such file`, `permission denied`）
- **情報メッセージ**: 状態や結果を示す（例：`current directory: /home`, `3 files found`）
- **ヘルプメッセージ**: コマンドの使用方法（例：`usage: ls [options] [path]`）

**具体例**
```typescript
// 良い例
return this.success('new game started');
return this.error('no such directory');
return this.info('current path: /projects');

// 避けるべき例
return this.success('New game has been started successfully!');
return this.error('The directory you specified does not exist.');
```

## 品質保証
- **デグレ防止**: 変更後は必ず `npm run check` を実行
- **カバレッジ維持**: 94%以上のコードカバレッジを維持（`src/index.ts`は除外）
- **全テスト成功**: 全てのテストが成功することを確認
- **コード品質**: ESLintエラー0件、Prettierフォーマット準拠
- **継続的改善**: リファクタリング時もテスト・品質チェックを先に更新
- **自動化**: `npm test` 実行前にLint・Formatチェックを実行、エラーを無視しないこと
