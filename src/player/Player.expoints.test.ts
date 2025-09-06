import { Player } from './Player';

describe('Player EXポイント', () => {
  test('初期値は0で加算・消費ができる', () => {
    const p = new Player('Hero');
    expect(p.getExPoints()).toBe(0);

    p.addExPoints(5);
    expect(p.getExPoints()).toBe(5);

    expect(p.consumeExPoints(10)).toBe(false);
    expect(p.getExPoints()).toBe(5);

    expect(p.consumeExPoints(3)).toBe(true);
    expect(p.getExPoints()).toBe(2);
  });

  test('fromJSON(legacy exPoints) を BodyStats に反映する', () => {
    const p = new Player('Hero');
    const restored = Player.fromJSON({
      name: 'Hero',
      bodyStats: p.getBodyStats().toJSON(),
      equipmentStats: p.getEquipmentStats().toJSON(),
      inventory: p.getInventory().toJSON(),
      exPoints: 12, // legacy field
    } as any);
    expect(restored.getExPoints()).toBe(12);
  });
});
