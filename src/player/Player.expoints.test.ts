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
});
