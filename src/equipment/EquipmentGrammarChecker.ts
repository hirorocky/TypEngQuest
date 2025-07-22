import nlp from 'compromise';

/**
 * 装備アイテムの英文法チェッククラス
 * 英単語で構成される英文の妥当性を検証する（compromiseライブラリ使用）
 */
export class EquipmentGrammarChecker {
  /**
   * 単語が有効な英文を構成するかチェックする
   * @param words - チェックする単語の配列
   * @returns 有効な英文の場合true
   */
  isValidSentence(words: string[]): boolean {
    // 基本的なチェック
    if (!words || words.length === 0) {
      return false;
    }

    // null/undefinedチェック
    if (words.some(word => word == null)) {
      return false;
    }

    // 単語の妥当性チェック
    if (!this.validateWords(words)) {
      return false;
    }

    // 基本的な文法チェック（compromise使用）
    return this.checkBasicGrammar(words);
  }

  /**
   * 単語が有効な英単語かチェックする
   * @param words - チェックする単語の配列
   * @returns 全て有効な英単語の場合true
   */
  validateWords(words: string[]): boolean {
    if (!words || words.length === 0) {
      return false;
    }

    for (const word of words) {
      if (typeof word !== 'string' || word.trim() === '') {
        return false;
      }

      // 英字以外の文字（数字、記号）が含まれているかチェック
      if (!/^[a-zA-Z]+$/.test(word)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 基本的な英文法構造をチェックする（compromise使用）
   * @param words - チェックする単語の配列
   * @returns 基本的な文法を満たす場合true
   */
  checkBasicGrammar(words: string[]): boolean {
    if (!words || words.length === 0) {
      return false;
    }

    const sentence = words.join(' ');
    const doc = nlp(sentence);

    const partOfSpeech = this.getPartOfSpeech(doc);

    return this.isValidGrammarPattern(partOfSpeech, words.length);
  }

  /**
   * 品詞情報を取得する
   * @param doc - compromiseで解析されたドキュメント
   * @returns 品詞の存在フラグ
   */
  private getPartOfSpeech(doc: any) {
    return {
      hasVerb: doc.verbs().length > 0,
      hasNoun: doc.nouns().length > 0,
      hasAdjective: doc.adjectives().length > 0,
      hasAdverb: doc.adverbs().length > 0,
    };
  }

  /**
   * 文法パターンが有効かチェックする
   * @param partOfSpeech - 品詞情報
   * @param wordCount - 単語数
   * @returns 有効な文法パターンの場合true
   */
  private isValidGrammarPattern(partOfSpeech: any, wordCount: number): boolean {
    return (
      this.hasValidCombination(partOfSpeech) ||
      this.isValidSingleWord(partOfSpeech, wordCount) ||
      this.isValidShortExpression(partOfSpeech, wordCount)
    );
  }

  /**
   * 有効な品詞の組み合わせをチェックする
   * @param partOfSpeech - 品詞情報
   * @returns 有効な組み合わせの場合true
   */
  private hasValidCombination(partOfSpeech: any): boolean {
    const { hasVerb, hasNoun, hasAdjective, hasAdverb } = partOfSpeech;

    return (hasVerb && hasNoun) || (hasAdjective && hasNoun) || (hasAdverb && hasAdjective);
  }

  /**
   * 単一単語が有効かチェックする
   * @param partOfSpeech - 品詞情報
   * @param wordCount - 単語数
   * @returns 単一単語として有効な場合true
   */
  private isValidSingleWord(partOfSpeech: any, wordCount: number): boolean {
    const { hasNoun, hasAdjective } = partOfSpeech;
    return wordCount === 1 && (hasNoun || hasAdjective);
  }

  /**
   * 短い表現が有効かチェックする
   * @param partOfSpeech - 品詞情報
   * @param wordCount - 単語数
   * @returns 短い表現として有効な場合true
   */
  private isValidShortExpression(partOfSpeech: any, wordCount: number): boolean {
    const { hasNoun, hasVerb, hasAdjective } = partOfSpeech;
    return wordCount < 5 && (hasNoun || hasVerb || hasAdjective);
  }

  /**
   * 文法エラーの詳細メッセージを取得する
   * @param words - チェックする単語の配列
   * @returns エラーメッセージ
   */
  getGrammarErrorMessage(words: string[]): string {
    if (!words || words.length === 0) {
      return 'equipment requires at least 1 word';
    }

    const invalidWordMessage = this.getInvalidWordMessage(words);
    if (invalidWordMessage) {
      return invalidWordMessage;
    }

    if (!this.checkBasicGrammar(words)) {
      return 'invalid english grammar';
    }

    return 'valid sentence';
  }

  /**
   * 無効な単語のエラーメッセージを取得する
   * @param words - チェックする単語の配列
   * @returns エラーメッセージ（問題がない場合はnull）
   */
  private getInvalidWordMessage(words: string[]): string | null {
    if (words.some(word => word == null)) {
      return 'invalid word found: null or undefined';
    }

    for (const word of words) {
      if (typeof word !== 'string' || word.trim() === '') {
        return 'invalid word found: empty string';
      }

      if (!/^[a-zA-Z]+$/.test(word)) {
        return `invalid word found: ${word}`;
      }
    }

    return null;
  }
}
