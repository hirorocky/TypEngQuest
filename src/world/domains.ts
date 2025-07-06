/**
 * ドメインタイプ
 */
export type DomainType = 'tech-startup' | 'game-studio' | 'web-agency';

/**
 * ドメインデータインターフェース
 */
export interface DomainData {
  type: DomainType;
  name: string;
  description: string;
  directoryNames: string[];
  fileNames: {
    monster: string[];
    treasure: string[];
    event: string[];
    savepoint: string[];
  };
}

/**
 * 利用可能なドメイン一覧
 */
export const DOMAINS: DomainData[] = [
  {
    type: 'tech-startup',
    name: 'Tech Startup',
    description: 'A fast-paced technology startup environment',
    directoryNames: [
      'src',
      'lib',
      'api',
      'config',
      'tests',
      'utils',
      'services',
      'components',
      'models',
      'controllers',
    ],
    fileNames: {
      monster: [
        'app',
        'index',
        'main',
        'server',
        'client',
        'router',
        'controller',
        'service',
        'model',
        'helper',
      ],
      treasure: [
        'config',
        'settings',
        'package',
        'tsconfig',
        'env',
        'credentials',
        'secrets',
        'options',
      ],
      event: ['build', 'deploy', 'setup', 'install', 'migrate', 'seed', 'compile', 'test-runner'],
      savepoint: ['README', 'CHANGELOG', 'TODO', 'NOTES', 'DOCUMENTATION', 'GUIDE', 'TUTORIAL'],
    },
  },
  {
    type: 'game-studio',
    name: 'Game Studio',
    description: 'A creative game development studio',
    directoryNames: [
      'assets',
      'scripts',
      'levels',
      'builds',
      'shaders',
      'sounds',
      'prefabs',
      'materials',
      'scenes',
      'plugins',
    ],
    fileNames: {
      monster: [
        'player',
        'enemy',
        'gameManager',
        'levelLoader',
        'physics',
        'input',
        'camera',
        'ai',
        'animator',
        'spawner',
      ],
      treasure: [
        'level',
        'save',
        'items',
        'characters',
        'dialogue',
        'quests',
        'achievements',
        'stats',
      ],
      event: ['build-game', 'pack-assets', 'optimize', 'export', 'run-tests', 'profile', 'debug'],
      savepoint: ['GDD', 'DESIGN', 'ROADMAP', 'CREDITS', 'PATCH_NOTES', 'FEATURES', 'BUGS'],
    },
  },
  {
    type: 'web-agency',
    name: 'Web Agency',
    description: 'A bustling web development agency',
    directoryNames: [
      'client',
      'server',
      'public',
      'deploy',
      'docs',
      'design',
      'database',
      'migrations',
      'static',
      'templates',
    ],
    fileNames: {
      monster: [
        'homepage',
        'contact',
        'about',
        'portfolio',
        'blog',
        'admin',
        'dashboard',
        'analytics',
        'forms',
        'auth',
      ],
      treasure: [
        'sitemap',
        'robots',
        'manifest',
        'htaccess',
        'nginx',
        'apache',
        'docker-compose',
        'database',
      ],
      event: ['backup', 'restore', 'sync', 'publish', 'optimize-images', 'minify', 'cache-clear'],
      savepoint: [
        'BRIEF',
        'REQUIREMENTS',
        'WIREFRAMES',
        'STYLEGUIDE',
        'CONTENT',
        'SEO',
        'MAINTENANCE',
      ],
    },
  },
];

/**
 * 指定されたドメインタイプのデータを取得する
 * @param type ドメインタイプ
 * @returns ドメインデータ、見つからない場合はundefined
 */
export function getDomainData(type: DomainType): DomainData | undefined {
  return DOMAINS.find(domain => domain.type === type);
}

/**
 * ランダムなドメインを取得する
 * @returns ランダムに選ばれたドメインデータ
 */
export function getRandomDomain(): DomainData {
  const index = Math.floor(Math.random() * DOMAINS.length);
  return DOMAINS[index];
}

/**
 * ドメインに応じたディレクトリ名を取得する
 * @param domain ドメインデータ
 * @param depth 階層の深さ（深い階層では変化を加える）
 * @returns ディレクトリ名
 */
export function getRandomDirectoryName(domain: DomainData, depth: number = 0): string {
  const baseName = domain.directoryNames[Math.floor(Math.random() * domain.directoryNames.length)];

  // 深い階層では時々サフィックスを付ける
  if (depth >= 3 && Math.random() < 0.3) {
    const suffixes = ['-core', '-impl', '-utils', '-helpers', '-internal', '-legacy', '-v2'];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return baseName + suffix;
  }

  return baseName;
}

/**
 * ファイルタイプに応じた拡張子を取得する
 * @param fileType ファイルタイプ
 * @returns 拡張子の配列
 */
function getExtensionsForType(fileType: 'monster' | 'treasure' | 'event' | 'savepoint'): string[] {
  switch (fileType) {
    case 'monster':
      return ['.js', '.ts', '.py'];
    case 'treasure':
      return ['.json', '.yaml', '.yml'];
    case 'event':
      return ['.exe', '.bin', '.sh'];
    case 'savepoint':
      return ['.md'];
    default:
      return [];
  }
}

/**
 * ドメインとファイルタイプに応じたファイル名を生成する
 * @param domain ドメインデータ
 * @param fileType ファイルタイプ
 * @param depth 階層の深さ
 * @returns ファイル名（拡張子付き）
 */
export function getRandomFileName(
  domain: DomainData,
  fileType: 'monster' | 'treasure' | 'event' | 'savepoint',
  depth: number = 0
): string {
  const baseNames = domain.fileNames[fileType];
  const baseName = baseNames[Math.floor(Math.random() * baseNames.length)];
  const extensions = getExtensionsForType(fileType);
  const extension = extensions[Math.floor(Math.random() * extensions.length)];

  // 深い階層では番号を付けることがある
  let fileName = baseName;
  if (depth >= 2 && Math.random() < 0.4) {
    fileName = `${baseName}${Math.floor(Math.random() * 10)}`;
  }

  // 隠しファイルにする（10%の確率）
  if (Math.random() < 0.1 && (fileType === 'monster' || fileType === 'treasure')) {
    fileName = '.' + fileName;
  }

  return fileName + extension;
}
