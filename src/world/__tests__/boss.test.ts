import { Boss } from '../boss';

describe('Bossクラス', () => {
  let boss: Boss;

  beforeEach(() => {
    boss = new Boss('TestBoss', 'スタックオーバーフロードラゴン', 150, 25);
  });

  describe('基本プロパティ', () => {
    test('ボスIDを正しく設定できる', () => {
      expect(boss.getId()).toBe('TestBoss');
    });

    test('ボス名を正しく設定できる', () => {
      expect(boss.getName()).toBe('スタックオーバーフロードラゴン');
    });

    test('初期HPを正しく設定できる', () => {
      expect(boss.getMaxHealth()).toBe(150);
      expect(boss.getCurrentHealth()).toBe(150);
    });

    test('攻撃力を正しく設定できる', () => {
      expect(boss.getAttackPower()).toBe(25);
    });

    test('初期状態では未撃破', () => {
      expect(boss.isDefeated()).toBe(false);
      expect(boss.isAlive()).toBe(true);
    });
  });

  describe('戦闘システム', () => {
    test('ダメージを受けることができる', () => {
      boss.takeDamage(50);
      
      expect(boss.getCurrentHealth()).toBe(100);
      expect(boss.isAlive()).toBe(true);
      expect(boss.isDefeated()).toBe(false);
    });

    test('致命的ダメージで撃破される', () => {
      boss.takeDamage(150);
      
      expect(boss.getCurrentHealth()).toBe(0);
      expect(boss.isAlive()).toBe(false);
      expect(boss.isDefeated()).toBe(true);
    });

    test('最大HPを超えるダメージでもHPは0で止まる', () => {
      boss.takeDamage(200);
      
      expect(boss.getCurrentHealth()).toBe(0);
    });

    test('負のダメージは無視される', () => {
      boss.takeDamage(-10);
      
      expect(boss.getCurrentHealth()).toBe(150);
    });

    test('0ダメージは無視される', () => {
      boss.takeDamage(0);
      
      expect(boss.getCurrentHealth()).toBe(150);
    });
  });

  describe('回復システム', () => {
    test('ダメージを受けた後に回復できる', () => {
      boss.takeDamage(50);
      boss.heal(30);
      
      expect(boss.getCurrentHealth()).toBe(130);
    });

    test('最大HPを超える回復はできない', () => {
      boss.takeDamage(20);
      boss.heal(50);
      
      expect(boss.getCurrentHealth()).toBe(150);
    });

    test('撃破された後は回復できない', () => {
      boss.takeDamage(150);
      boss.heal(50);
      
      expect(boss.getCurrentHealth()).toBe(0);
      expect(boss.isDefeated()).toBe(true);
    });
  });

  describe('ステータス計算', () => {
    test('HPパーセンテージを正しく計算する', () => {
      expect(boss.getHealthPercentage()).toBe(1.0);
      
      boss.takeDamage(75);
      expect(boss.getHealthPercentage()).toBe(0.5);
      
      boss.takeDamage(75);
      expect(boss.getHealthPercentage()).toBe(0.0);
    });

    test('残りHPを取得できる', () => {
      boss.takeDamage(40);
      
      expect(boss.getRemainingHealth()).toBe(110);
    });
  });

  describe('特殊能力システム', () => {
    test('ボスに特殊能力を設定できる', () => {
      const abilities = ['デバッグブレス', 'メモリリーク攻撃', 'スタックオーバーフロー'];
      boss.setSpecialAbilities(abilities);
      
      expect(boss.getSpecialAbilities()).toEqual(abilities);
    });

    test('ランダムな特殊能力を選択できる', () => {
      const abilities = ['能力A', '能力B', '能力C'];
      boss.setSpecialAbilities(abilities);
      
      const selectedAbility = boss.getRandomAbility();
      
      expect(abilities).toContain(selectedAbility);
    });

    test('特殊能力が設定されていない場合はnullを返す', () => {
      expect(boss.getRandomAbility()).toBeNull();
    });
  });

  describe('戦闘フェーズシステム', () => {
    test('HP割合に応じて戦闘フェーズが変化する', () => {
      expect(boss.getBattlePhase()).toBe('normal');
      
      boss.takeDamage(50); // HP 66%
      expect(boss.getBattlePhase()).toBe('normal');
      
      boss.takeDamage(50); // HP 33%
      expect(boss.getBattlePhase()).toBe('critical');
      
      boss.takeDamage(25); // HP 16%
      expect(boss.getBattlePhase()).toBe('desperate');
    });

    test('撃破されたボスのフェーズはdefeated', () => {
      boss.takeDamage(150);
      
      expect(boss.getBattlePhase()).toBe('defeated');
    });
  });

  describe('レベル別ボス強化', () => {
    test('高レベルボスはより強力になる', () => {
      const levelTwoBoss = Boss.createForLevel(2, 'TestBoss2', 'レガシーコードゴーレム');
      
      expect(levelTwoBoss.getMaxHealth()).toBeGreaterThan(boss.getMaxHealth());
      expect(levelTwoBoss.getAttackPower()).toBeGreaterThan(boss.getAttackPower());
    });

    test('レベル1ボスの基本ステータスを確認', () => {
      const levelOneBoss = Boss.createForLevel(1, 'Level1Boss', 'バグキング');
      
      expect(levelOneBoss.getMaxHealth()).toBe(100);
      expect(levelOneBoss.getAttackPower()).toBe(20);
    });

    test('レベル5ボスは大幅に強化される', () => {
      const levelFiveBoss = Boss.createForLevel(5, 'Level5Boss', 'ラムダデストロイヤー');
      
      expect(levelFiveBoss.getMaxHealth()).toBeGreaterThan(200);
      expect(levelFiveBoss.getAttackPower()).toBeGreaterThan(40);
    });
  });

  describe('ボス情報表示', () => {
    test('ボスの状態情報を文字列で取得できる', () => {
      boss.takeDamage(50);
      const abilities = ['デバッグブレス', 'メモリリーク攻撃'];
      boss.setSpecialAbilities(abilities);
      
      const status = boss.getStatusString();
      
      expect(status).toContain('スタックオーバーフロードラゴン');
      expect(status).toContain('100/150');
      expect(status).toContain('66%');
      expect(status).toContain('normal');
    });

    test('撃破されたボスの状態表示', () => {
      boss.takeDamage(150);
      
      const status = boss.getStatusString();
      
      expect(status).toContain('DEFEATED');
      expect(status).toContain('0/150');
    });
  });
});