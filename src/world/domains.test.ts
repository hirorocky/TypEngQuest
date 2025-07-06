/**
 * domains.tsのテスト
 */

import {
  DomainType,
  DOMAINS,
  getDomainData,
  getRandomDomain,
  getRandomDirectoryName,
  getRandomFileName,
} from './domains';

describe('domains', () => {
  describe('定数とインターフェース', () => {
    test('ドメインタイプが定義されている', () => {
      expect(DOMAINS).toBeDefined();
      expect(DOMAINS.length).toBeGreaterThan(0);
    });

    test('各ドメインが必要なプロパティを持つ', () => {
      DOMAINS.forEach(domain => {
        expect(domain.type).toBeDefined();
        expect(domain.name).toBeDefined();
        expect(domain.description).toBeDefined();
        expect(domain.directoryNames).toBeDefined();
        expect(domain.directoryNames.length).toBeGreaterThan(0);
        expect(domain.fileNames).toBeDefined();
        expect(domain.fileNames.monster).toBeDefined();
        expect(domain.fileNames.treasure).toBeDefined();
        expect(domain.fileNames.event).toBeDefined();
        expect(domain.fileNames.savepoint).toBeDefined();
      });
    });
  });

  describe('getDomainData', () => {
    test('存在するドメインタイプでドメインデータを取得できる', () => {
      const domain = getDomainData('tech-startup');
      expect(domain).toBeDefined();
      expect(domain?.type).toBe('tech-startup');
      expect(domain?.name).toBe('Tech Startup');
    });

    test('存在しないドメインタイプでundefinedを返す', () => {
      const domain = getDomainData('invalid-domain' as DomainType);
      expect(domain).toBeUndefined();
    });
  });

  describe('getRandomDomain', () => {
    test('ランダムなドメインを取得できる', () => {
      // Math.randomをモック
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0);

      const domain = getRandomDomain();
      expect(domain).toBeDefined();
      expect(DOMAINS).toContainEqual(domain);

      mockRandom.mockRestore();
    });

    test('異なる乱数で異なるドメインを返す', () => {
      const mockRandom = jest.spyOn(Math, 'random');

      // 最初のドメインを取得
      mockRandom.mockReturnValue(0);
      const domain1 = getRandomDomain();

      // 最後のドメインを取得
      mockRandom.mockReturnValue(0.99);
      const domain2 = getRandomDomain();

      // ドメインが複数ある場合は異なるはず
      if (DOMAINS.length > 1) {
        expect(domain1).not.toBe(domain2);
      }

      mockRandom.mockRestore();
    });
  });

  describe('getRandomDirectoryName', () => {
    test('指定したドメインのディレクトリ名を取得できる', () => {
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0);

      const domain = getDomainData('tech-startup')!;
      const dirName = getRandomDirectoryName(domain);

      expect(dirName).toBeDefined();
      expect(domain.directoryNames).toContain(dirName);

      mockRandom.mockRestore();
    });

    test('深い階層では適切なサフィックスが付く', () => {
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0);

      const domain = getDomainData('tech-startup')!;
      const dirName = getRandomDirectoryName(domain, 3);

      expect(dirName).toBeDefined();
      // 深い階層では元の名前かサフィックス付きの名前になる
      const baseName = domain.directoryNames[0];
      expect([baseName, `${baseName}-core`, `${baseName}-impl`, `${baseName}-utils`]).toContain(
        dirName
      );

      mockRandom.mockRestore();
    });
  });

  describe('getRandomFileName', () => {
    test('モンスターファイル名を取得できる', () => {
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0);

      const domain = getDomainData('tech-startup')!;
      const fileName = getRandomFileName(domain, 'monster');

      expect(fileName).toBeDefined();
      expect(fileName).toMatch(/\.(js|ts|py)$/);
      const baseFileName = fileName.replace(/\.(js|ts|py)$/, '').replace(/^\./, '');
      expect(
        domain.fileNames.monster.some(
          name => baseFileName.includes(name) || name.includes(baseFileName)
        )
      ).toBe(true);

      mockRandom.mockRestore();
    });

    test('宝箱ファイル名を取得できる', () => {
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0);

      const domain = getDomainData('game-studio')!;
      const fileName = getRandomFileName(domain, 'treasure');

      expect(fileName).toBeDefined();
      expect(fileName).toMatch(/\.(json|yaml|yml)$/);

      mockRandom.mockRestore();
    });

    test('イベントファイル名を取得できる', () => {
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0);

      const domain = getDomainData('web-agency')!;
      const fileName = getRandomFileName(domain, 'event');

      expect(fileName).toBeDefined();
      expect(fileName).toMatch(/\.(exe|bin|sh)$/);

      mockRandom.mockRestore();
    });

    test('セーブポイントファイル名を取得できる', () => {
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0);

      const domain = getDomainData('tech-startup')!;
      const fileName = getRandomFileName(domain, 'savepoint');

      expect(fileName).toBeDefined();
      expect(fileName).toMatch(/\.md$/);

      mockRandom.mockRestore();
    });

    test('深い階層では適切な番号が付く', () => {
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0);

      const domain = getDomainData('tech-startup')!;
      const fileName = getRandomFileName(domain, 'monster', 3);

      expect(fileName).toBeDefined();
      // 深い階層では番号付きの名前になることがある
      expect(fileName).toMatch(/\.(js|ts|py)$/);

      mockRandom.mockRestore();
    });

    test('隠しファイルとして生成される場合がある', () => {
      const mockRandom = jest.spyOn(Math, 'random');

      // 隠しファイル生成条件を満たすよう設定
      mockRandom.mockReturnValueOnce(0); // baseName選択用
      mockRandom.mockReturnValueOnce(0); // extension選択用
      mockRandom.mockReturnValueOnce(0.05); // 隠しファイル判定（0.1未満で隠しファイル）

      const domain = getDomainData('tech-startup')!;
      const fileName = getRandomFileName(domain, 'monster');

      expect(fileName.startsWith('.')).toBe(true);

      mockRandom.mockRestore();
    });
  });
});
