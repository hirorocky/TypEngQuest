/**
 * ワールド生成システム
 */

import { FileNode, NodeType } from './FileNode';
import { FileSystem } from './FileSystem';
import { World } from './World';
import {
  DomainData,
  DomainType,
  getDomainData,
  getRandomDomain,
  getRandomDirectoryName,
  getRandomFileName,
} from './domains';

/**
 * ワールド生成クラス
 * 指定されたドメインとレベルに基づいてワールドとファイルシステムを生成する
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

    const fileSystem = this.generateFileSystem(domain, level);
    const world = new World(domain, level, fileSystem);

    this.placeSpecialItems(world);

    return world;
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

    const fileSystem = FileSystem.createTestStructure();
    const world = new World(domain, 1, fileSystem);

    // 固定の配置でボスと鍵を設定
    world.setBossLocation('/game-studio');
    world.setKeyLocation('/tech-startup/api/package.json');

    return world;
  }

  /**
   * 指定されたドメインとレベルでファイルシステムを生成する
   * @param domain ドメインデータ
   * @param level ワールドレベル
   * @returns 生成されたファイルシステム
   * @throws {Error} 無効なドメインまたはレベルの場合
   */
  public generateFileSystem(domain: DomainData, level: number): FileSystem {
    if (!domain) {
      throw new Error('ドメインデータが必要です');
    }

    if (level < 1) {
      throw new Error('ワールドレベルは1以上である必要があります');
    }

    const maxDepth = Math.min(3 + level, 10);
    const root = new FileNode(domain.name, NodeType.DIRECTORY);

    // ルートの下にディレクトリ構造を生成
    this.generateDirectoryStructure(root, domain, 1, maxDepth);

    return new FileSystem(root);
  }

  /**
   * ディレクトリ構造を再帰的に生成する
   * @param parentNode 親ディレクトリノード
   * @param domain ドメインデータ
   * @param currentDepth 現在の深度
   * @param maxDepth 最大深度
   */
  private generateDirectoryStructure(
    parentNode: FileNode,
    domain: DomainData,
    currentDepth: number,
    maxDepth: number
  ): void {
    if (currentDepth >= maxDepth) {
      return;
    }

    // 各深度でのディレクトリ数を決定（深くなるほど少なく）
    const dirCount = Math.max(1, Math.ceil(Math.random() * (4 - currentDepth)));

    for (let i = 0; i < dirCount; i++) {
      const dirName = getRandomDirectoryName(domain, currentDepth);
      const dirNode = new FileNode(dirName, NodeType.DIRECTORY);
      parentNode.addChild(dirNode);

      // 各ディレクトリにファイルを追加
      this.generateFiles(dirNode, domain, currentDepth);

      // 再帰的に子ディレクトリを生成
      if (currentDepth + 1 < maxDepth && Math.random() < 0.7) {
        this.generateDirectoryStructure(dirNode, domain, currentDepth + 1, maxDepth);
      }
    }
  }

  /**
   * 指定されたディレクトリにファイルを生成する
   * @param parentNode 親ディレクトリノード
   * @param domain ドメインデータ
   * @param depth 現在の深度
   */
  private generateFiles(parentNode: FileNode, domain: DomainData, depth: number): void {
    // 各ファイルタイプを最低1つずつ、最大3つまで生成
    const fileTypes: ('monster' | 'treasure' | 'event' | 'savepoint')[] = [
      'monster',
      'treasure',
      'event',
      'savepoint',
    ];

    fileTypes.forEach(fileType => {
      const fileCount = Math.max(1, Math.ceil(Math.random() * 3));

      for (let i = 0; i < fileCount; i++) {
        const fileName = getRandomFileName(domain, fileType, depth);
        const fileNode = new FileNode(fileName, NodeType.FILE);
        parentNode.addChild(fileNode);
      }
    });
  }

  /**
   * ワールドに鍵とボスを配置する
   * @param world 対象のワールド
   */
  private placeSpecialItems(world: World): void {
    const fileSystem = world.fileSystem;

    // 全ノードを取得
    const allNodes = fileSystem.find('');

    // ディレクトリ（ボス配置用）を取得（ルートは除く）
    const directories = allNodes.filter(
      node => node.isDirectory() && node.getPath() !== '/' && node.getPath() !== '/projects'
    );

    // ボスを配置
    if (directories.length === 0) {
      throw new Error('no directories available for boss placement');
    }
    const bossDir = directories[Math.floor(Math.random() * directories.length)];
    world.setBossLocation(bossDir.getPath());

    // 宝箱ファイル（鍵配置用）を取得（ボスディレクトリ内は除外）
    let treasureFiles = allNodes.filter(
      node =>
        node.isFile() &&
        node.fileType === 'treasure' &&
        !node.getPath().startsWith(bossDir.getPath())
    );

    // ボスディレクトリ外に宝箱がない場合は、全宝箱ファイルを対象にする
    if (treasureFiles.length === 0) {
      treasureFiles = allNodes.filter(node => node.isFile() && node.fileType === 'treasure');
    }

    // 鍵を配置
    if (treasureFiles.length === 0) {
      throw new Error('no treasure files available for key placement');
    }
    const keyFile = treasureFiles[Math.floor(Math.random() * treasureFiles.length)];
    world.setKeyLocation(keyFile.getPath());
  }
}
