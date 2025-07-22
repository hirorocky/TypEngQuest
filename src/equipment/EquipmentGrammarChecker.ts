/**
 * 装備アイテムの英文法チェッククラス
 * 5つの英単語で構成される英文の妥当性を検証する
 */
export class EquipmentGrammarChecker {
  // 基本的な動詞リスト
  private readonly VERBS = [
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'having',
    'do',
    'does',
    'did',
    'doing',
    'will',
    'would',
    'can',
    'could',
    'may',
    'might',
    'must',
    'should',
    'run',
    'runs',
    'ran',
    'running',
    'love',
    'loves',
    'loved',
    'loving',
    'play',
    'plays',
    'played',
    'playing',
    'work',
    'works',
    'worked',
    'working',
    'jump',
    'jumps',
    'jumped',
    'jumping',
    'walk',
    'walks',
    'walked',
    'walking',
    'talk',
    'talks',
    'talked',
    'talking',
    'eat',
    'eats',
    'ate',
    'eating',
    'sleep',
    'sleeps',
    'slept',
    'sleeping',
    'read',
    'reads',
    'reading',
    'write',
    'writes',
    'wrote',
    'writing',
    'learn',
    'learns',
    'learned',
    'learning',
    'teach',
    'teaches',
    'taught',
    'teaching',
    'make',
    'makes',
    'made',
    'making',
    'take',
    'takes',
    'took',
    'taking',
    'come',
    'comes',
    'came',
    'coming',
    'go',
    'goes',
    'went',
    'going',
    'get',
    'gets',
    'got',
    'getting',
    'give',
    'gives',
    'gave',
    'giving',
    'see',
    'sees',
    'saw',
    'seeing',
    'know',
    'knows',
    'knew',
    'knowing',
    'think',
    'thinks',
    'thought',
    'thinking',
    'say',
    'says',
    'said',
    'saying',
    'tell',
    'tells',
    'told',
    'telling',
    'ask',
    'asks',
    'asked',
    'asking',
    'help',
    'helps',
    'helped',
    'helping',
    'use',
    'uses',
    'used',
    'using',
    'find',
    'finds',
    'found',
    'finding',
    'look',
    'looks',
    'looked',
    'looking',
    'feel',
    'feels',
    'felt',
    'feeling',
    'become',
    'becomes',
    'became',
    'becoming',
    'try',
    'tries',
    'tried',
    'trying',
    'want',
    'wants',
    'wanted',
    'wanting',
    'need',
    'needs',
    'needed',
    'needing',
    'like',
    'likes',
    'liked',
    'liking',
    'start',
    'starts',
    'started',
    'starting',
    'stop',
    'stops',
    'stopped',
    'stopping',
    'open',
    'opens',
    'opened',
    'opening',
    'close',
    'closes',
    'closed',
    'closing',
    'live',
    'lives',
    'lived',
    'living',
    'die',
    'dies',
    'died',
    'dying',
    'buy',
    'buys',
    'bought',
    'buying',
    'sell',
    'sells',
    'sold',
    'selling',
    'build',
    'builds',
    'built',
    'building',
    'break',
    'breaks',
    'broke',
    'breaking',
    'fix',
    'fixes',
    'fixed',
    'fixing',
    'create',
    'creates',
    'created',
    'creating',
    'destroy',
    'destroys',
    'destroyed',
    'destroying',
    'change',
    'changes',
    'changed',
    'changing',
    'move',
    'moves',
    'moved',
    'moving',
    'turn',
    'turns',
    'turned',
    'turning',
    'call',
    'calls',
    'called',
    'calling',
    'send',
    'sends',
    'sent',
    'sending',
    'bring',
    'brings',
    'brought',
    'bringing',
    'carry',
    'carries',
    'carried',
    'carrying',
    'put',
    'puts',
    'putting',
    'set',
    'sets',
    'setting',
    'hold',
    'holds',
    'held',
    'holding',
    'catch',
    'catches',
    'caught',
    'catching',
    'throw',
    'throws',
    'threw',
    'throwing',
    'hit',
    'hits',
    'hitting',
    'cut',
    'cuts',
    'cutting',
    'pull',
    'pulls',
    'pulled',
    'pulling',
    'push',
    'pushes',
    'pushed',
    'pushing',
    'win',
    'wins',
    'won',
    'winning',
    'lose',
    'loses',
    'lost',
    'losing',
    'fight',
    'fights',
    'fought',
    'fighting',
    'attack',
    'attacks',
    'attacked',
    'attacking',
    'defend',
    'defends',
    'defended',
    'defending',
  ];

  // 基本的な名詞リスト
  private readonly NOUNS = [
    'cat',
    'dog',
    'bird',
    'fish',
    'horse',
    'cow',
    'pig',
    'sheep',
    'goat',
    'chicken',
    'man',
    'woman',
    'child',
    'baby',
    'boy',
    'girl',
    'person',
    'people',
    'family',
    'friend',
    'house',
    'home',
    'room',
    'door',
    'window',
    'wall',
    'floor',
    'roof',
    'garden',
    'yard',
    'car',
    'bike',
    'bus',
    'train',
    'plane',
    'boat',
    'ship',
    'truck',
    'taxi',
    'motorcycle',
    'book',
    'pen',
    'paper',
    'pencil',
    'computer',
    'phone',
    'television',
    'radio',
    'camera',
    'watch',
    'food',
    'water',
    'bread',
    'milk',
    'egg',
    'meat',
    'fish',
    'fruit',
    'vegetable',
    'rice',
    'school',
    'work',
    'job',
    'office',
    'store',
    'shop',
    'market',
    'bank',
    'hospital',
    'hotel',
    'tree',
    'flower',
    'grass',
    'mountain',
    'river',
    'sea',
    'sun',
    'moon',
    'star',
    'sky',
    'time',
    'day',
    'night',
    'morning',
    'afternoon',
    'evening',
    'week',
    'month',
    'year',
    'hour',
    'money',
    'price',
    'cost',
    'value',
    'number',
    'amount',
    'size',
    'color',
    'shape',
    'weight',
    'music',
    'song',
    'sound',
    'voice',
    'noise',
    'language',
    'word',
    'story',
    'news',
    'information',
    'game',
    'sport',
    'ball',
    'team',
    'player',
    'match',
    'competition',
    'race',
    'prize',
    'winner',
    'love',
    'peace',
    'war',
    'life',
    'death',
    'health',
    'illness',
    'pain',
    'happiness',
    'sadness',
    'idea',
    'thought',
    'dream',
    'hope',
    'fear',
    'worry',
    'problem',
    'solution',
    'answer',
    'question',
    'city',
    'town',
    'country',
    'world',
    'earth',
    'place',
    'area',
    'space',
    'land',
    'ground',
    'hand',
    'foot',
    'head',
    'eye',
    'ear',
    'nose',
    'mouth',
    'hair',
    'face',
    'body',
    'clothes',
    'shirt',
    'pants',
    'dress',
    'shoes',
    'hat',
    'coat',
    'jacket',
    'bag',
    'watch',
    'fire',
    'water',
    'air',
    'wind',
    'rain',
    'snow',
    'ice',
    'heat',
    'cold',
    'temperature',
    'programming',
    'language',
    'TypeScript',
    'JavaScript',
    'Python',
    'Java',
    'code',
    'software',
    'application',
    'system',
    'today',
    'tomorrow',
    'yesterday',
    'future',
    'past',
    'present',
    'moment',
    'second',
    'minute',
    'period',
    'fun',
  ];

  /**
   * 5つの単語が有効な英文を構成するかチェックする
   * @param words - チェックする単語の配列
   * @returns 有効な英文の場合true
   */
  isValidSentence(words: string[]): boolean {
    // 基本的なチェック
    if (!words || words.length !== 5) {
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

    // 基本的な文法チェック
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
   * 基本的な英文法構造をチェックする
   * @param words - チェックする単語の配列
   * @returns 基本的な文法を満たす場合true
   */
  checkBasicGrammar(words: string[]): boolean {
    if (!words || words.length !== 5) {
      return false;
    }

    const lowerWords = words.map(word => word.toLowerCase());

    // 動詞が含まれているかチェック
    const hasVerb = lowerWords.some(word => this.VERBS.includes(word));

    // 名詞が含まれているかチェック
    const hasNoun = lowerWords.some(word => this.NOUNS.includes(word));

    // 基本的な文法パターンをチェック
    // 動詞と名詞の両方が含まれている場合は有効とする
    if (hasVerb && hasNoun) {
      return true;
    }

    // より厳密な文法チェックが必要な場合はここに追加
    // 今回は基本的なパターンのみチェック
    return false;
  }

  /**
   * 文法エラーの詳細メッセージを取得する
   * @param words - チェックする単語の配列
   * @returns エラーメッセージ
   */
  getGrammarErrorMessage(words: string[]): string {
    // 単語数チェック
    if (!words || words.length !== 5) {
      return 'equipment requires exactly 5 words';
    }

    // null/undefinedチェック
    if (words.some(word => word == null)) {
      return 'invalid word found: null or undefined';
    }

    // 単語の妥当性チェック
    for (const word of words) {
      if (typeof word !== 'string' || word.trim() === '') {
        return 'invalid word found: empty string';
      }

      if (!/^[a-zA-Z]+$/.test(word)) {
        return `invalid word found: ${word}`;
      }
    }

    // 文法チェック
    if (!this.checkBasicGrammar(words)) {
      return 'invalid english grammar';
    }

    return 'valid sentence';
  }
}
