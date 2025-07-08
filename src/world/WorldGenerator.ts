/**
 * ワールド生成システム
 */

import { FileSystem } from './FileSystem';
import { World } from './World';
import { DomainType, getDomainData, getRandomDomain } from './domains';

/**
 * ワールド生成クラス
 * 指定されたドメインとレベルに基づいてワールドを生成する
 */
export class WorldGenerator {
  /**
   * 指定されたドメインとレベルでワールドを生成する
   * @param domainType ドメインタイプ
   * @param level ワールドレベル
   * @returns 生成されたワールド
   * @throws {Error} 無効なドメインタイプまたはレベルの場合
   */
  public generateWorld(domainType: DomainType, level: number): World {
    if (level < 1) {
      throw new Error('ワールドレベルは1以上である必要があります');
    }

    const domain = getDomainData(domainType);
    if (!domain) {
      throw new Error(`無効なドメインタイプです: ${domainType}`);
    }

    return new World(domain, level);
  }

  /**
   * ランダムなドメインでワールドを生成する
   * @param level ワールドレベル
   * @returns 生成されたワールド
   * @throws {Error} 無効なレベルの場合
   */
  public generateRandomWorld(level: number): World {
    if (level < 1) {
      throw new Error('ワールドレベルは1以上である必要があります');
    }

    const domain = getRandomDomain();
    return this.generateWorld(domain.type, level);
  }

  /**
   * テスト用の固定ファイル構造でワールドを生成する
   * @returns 生成されたワールド
   */
  public generateTestWorld(): World {
    const domain = getDomainData('tech-startup');
    if (!domain) {
      throw new Error('tech-startup domain not found');
    }

    const world = new World(domain, 1);

    // テスト用の固定ファイルシステムで上書き
    world.fileSystem = FileSystem.createTestStructure();

    // 固定の配置でボスと鍵を設定
    world.setBossLocation('/game-studio');
    world.setKeyLocation('/tech-startup/package.json');

    return world;
  }
}
