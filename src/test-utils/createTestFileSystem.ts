/**
 * テスト用のFileSystemを生成するヘルパー関数
 */
import { FileSystem } from '../world/FileSystem';
import { FileNode, NodeType } from '../world/FileNode';
import * as testConfig from './test-filesystem-config.json';

interface FileNodeConfig {
  name: string;
  type: 'file' | 'directory';
  children?: FileNodeConfig[];
}

/**
 * JSONから再帰的にFileNodeを構築
 */
function buildFileNodeFromConfig(config: FileNodeConfig): FileNode {
  const nodeType = config.type === 'directory' ? NodeType.DIRECTORY : NodeType.FILE;
  const node = new FileNode(config.name, nodeType);

  if (config.children) {
    for (const childConfig of config.children) {
      const childNode = buildFileNodeFromConfig(childConfig);
      node.addChild(childNode);
    }
  }

  return node;
}

/**
 * テスト用のFileSystemを生成
 */
export function createTestFileSystem(): FileSystem {
  const rootNode = buildFileNodeFromConfig(testConfig.structure as FileNodeConfig);
  return new FileSystem(rootNode);
}
