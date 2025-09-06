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

  test('toJSON/fromJSONでexPointsを保持する', () => {
    const p = new Player('Hero');
    p.addExPoints(12);
    const data = p.toJSON();
    expect(data.exPoints).toBe(12);

    const restored = Player.fromJSON({
      ...data,
      bodyStats: data.bodyStats,
      equipmentStats: data.equipmentStats,
      inventory: data.inventory,
    } as any);
    expect(restored.getExPoints()).toBe(12);
  });
});
