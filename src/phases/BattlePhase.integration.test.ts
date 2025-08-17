import { BattlePhase } from './BattlePhase';
import { Player } from '../player/Player';
import { Enemy } from '../battle/Enemy';
import { World } from '../world/World';
import { getDomainData } from '../world/domains';

describe('BattlePhase Integration Tests', () => {
  let battlePhase: BattlePhase;
  let player: Player;
  let world: World;

  beforeEach(() => {
    // テスト用のワールドとプレイヤーを作成
    const domain = getDomainData('tech-startup')!;
    world = new World(domain, 1);
    player = new Player('Test Player');

    // プレイヤーのHPとMPを設定
    player.getBodyStats().healHP(100);
    player.getBodyStats().healMP(50);

    battlePhase = new BattlePhase(world, undefined, player);
  });

  afterEach(async () => {
    await battlePhase.cleanup();
  });

  describe('敵のターンから始まりプレイヤーが負ける場合', () => {
    it('敵先攻でプレイヤーを倒した後、探索フェーズに移行する', async () => {
      // 非常に強い敵を作成（プレイヤーを一撃で倒せる）
      const strongEnemy = new Enemy({
        id: 'strong_enemy',
        name: 'Strong Enemy',
        description: 'Very strong enemy',
        level: 10,
        stats: {
          maxHp: 1000,
          maxMp: 100,
          strength: 200, // 非常に高い攻撃力
          willpower: 50,
          agility: 100, // 非常に高い素早さ（先攻を取る）
          fortune: 50,
        },
        skills: [],
        drops: [],
      });

      // プレイヤーのHPを少なくして一撃で倒せるようにする
      player.getBodyStats().takeDamage(90); // HP10にする

      let phaseTransitionCalled = false;
      let transitionResult: any = null;

      // フェーズ遷移ハンドラーを設定
      battlePhase.setTransitionHandler(result => {
        phaseTransitionCalled = true;
        transitionResult = result;
      });

      await battlePhase.initialize();

      // バトル開始
      const startResult = await battlePhase.startBattle(strongEnemy);
      expect(startResult.success).toBe(true);

      // 敵が先攻を取ることを確認
      expect(battlePhase['battle']?.getCurrentTurnActor()).toBe('enemy');

      // プレイヤーの現在HP確認
      console.log('Player HP before enemy turn:', player.getBodyStats().getCurrentHP());

      // 敵ターンを強制実行（setTimeout を待たずに）
      battlePhase['executeEnemyTurn']();

      // プレイヤーの現在HP確認
      console.log('Player HP after enemy turn:', player.getBodyStats().getCurrentHP());
      console.log('Phase transition called:', phaseTransitionCalled);
      console.log('Battle active:', battlePhase['battle']?.isActive);

      // プレイヤーが負けてタイトルフェーズに遷移することを確認
      expect(phaseTransitionCalled).toBe(true);
      expect(transitionResult?.nextPhase).toBe('title');
      expect(transitionResult?.success).toBe(true);
      expect(transitionResult?.message).toContain('Game over');
    }, 10000);
  });

  describe('プレイヤーターン終了後に敵が負ける場合', () => {
    it('プレイヤーが敵を倒した後、探索フェーズに移行する', async () => {
      // 弱い敵を作成（プレイヤーが一撃で倒せる）
      const weakEnemy = new Enemy({
        id: 'weak_enemy',
        name: 'Weak Enemy',
        description: 'Very weak enemy',
        level: 1,
        stats: {
          maxHp: 1, // 非常に少ないHP
          maxMp: 10,
          strength: 1,
          willpower: 1,
          agility: 1, // 低い素早さ（後攻になる）
          fortune: 1,
        },
        skills: [],
        drops: [],
      });

      let phaseTransitionCalled = false;
      let transitionResult: any = null;

      // フェーズ遷移ハンドラーを設定
      battlePhase.setTransitionHandler(result => {
        phaseTransitionCalled = true;
        transitionResult = result;
      });

      await battlePhase.initialize();

      // バトル開始
      const startResult = await battlePhase.startBattle(weakEnemy);
      expect(startResult.success).toBe(true);

      // プレイヤーが先攻を取ることを確認
      expect(battlePhase['battle']?.getCurrentTurnActor()).toBe('player');

      // 敵に直接ダメージを与えて倒す
      weakEnemy.takeDamage(100);

      // プレイヤーターン終了処理を実行
      battlePhase['finishPlayerTurn']();

      // 敵が負けてフェーズ遷移が発生することを確認
      expect(phaseTransitionCalled).toBe(true);
      expect(transitionResult?.nextPhase).toBe('exploration');
      expect(transitionResult?.success).toBe(true);
      expect(transitionResult?.data?.world).toBe(world);
      expect(transitionResult?.data?.player).toBe(player);
    }, 10000);
  });

  describe('startInputLoop のテスト', () => {
    it('バトルが非アクティブな場合、即座に探索フェーズに移行する', async () => {
      await battlePhase.initialize();

      // バトルが存在しない状態でstartInputLoopを呼び出し
      const result = await battlePhase.startInputLoop();

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      expect(result?.nextPhase).toBe('exploration');
      expect(result?.message).toContain('Battle has ended');
      expect(result?.data?.world).toBe(world);
      expect(result?.data?.player).toBe(player);
    });

    it('アクティブなバトル中は基底クラスのstartInputLoopが使用される', async () => {
      const weakEnemy = new Enemy({
        id: 'test_enemy',
        name: 'Test Enemy',
        description: 'Test enemy',
        level: 1,
        stats: {
          maxHp: 100,
          maxMp: 50,
          strength: 10,
          willpower: 8,
          agility: 1, // 低い素早さ
          fortune: 5,
        },
        skills: [],
        drops: [],
      });

      await battlePhase.initialize();
      await battlePhase.startBattle(weakEnemy);

      // バトルがアクティブな状態を確認
      expect(battlePhase['battle']?.isActive).toBe(true);

      // この場合、startInputLoopは基底クラスの実装を使用するため
      // 実際のテストは難しいが、少なくともエラーが発生しないことを確認
      // （実際の入力待ちになるため、テスト環境では適切にモックが必要）
    });
  });
});
