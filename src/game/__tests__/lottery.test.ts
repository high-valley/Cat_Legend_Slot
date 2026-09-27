import { drawFlag } from '../lottery';
import { LOTTERY_WEIGHTS_DEFAULT, LOTTERY_WEIGHTS_NAPO } from '../constants';

// 抽選順は ZG,H,W,S,R,N。累積境界（%）: ZG 0-52, H 52-63, W 63-68, S 68-71, R 71-84, N 84-100
describe('lottery: 内部抽選', () => {
  it('通常時、乱数の境界どおりにフラグが決まる', () => {
    const total = Object.values(LOTTERY_WEIGHTS_DEFAULT).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
    const at = (pct: number) => drawFlag(() => pct / 100, 'nobu');
    expect(at(0)).toBe('ZG');
    expect(at(51.9)).toBe('ZG');
    expect(at(52)).toBe('H');
    expect(at(62.9)).toBe('H');
    expect(at(63)).toBe('W');
    expect(at(67.9)).toBe('W');
    expect(at(68)).toBe('S');
    expect(at(70.9)).toBe('S');
    expect(at(71)).toBe('R');
    expect(at(83.9)).toBe('R');
    expect(at(84)).toBe('N');
    expect(at(99.9)).toBe('N');
  });

  it('ナポニャオンがリーダーのとき、Sを6%・ZGを49%にする', () => {
    const total = Object.values(LOTTERY_WEIGHTS_NAPO).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
    const at = (pct: number) => drawFlag(() => pct / 100, 'napo');
    expect(at(0)).toBe('ZG');
    expect(at(48.9)).toBe('ZG');
    expect(at(49)).toBe('H');
    expect(at(59.9)).toBe('H');
    expect(at(60)).toBe('W');
    expect(at(64.9)).toBe('W');
    expect(at(65)).toBe('S');
    expect(at(70.9)).toBe('S');
    expect(at(71)).toBe('R');
    expect(at(83.9)).toBe('R');
    expect(at(84)).toBe('N');
  });
});
