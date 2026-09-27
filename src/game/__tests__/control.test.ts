import { decideStop } from '../control';
import { evaluateLines, PlacedRows } from '../reels';
import { MAX_SLIP_DEFAULT, MAX_SLIP_SOCR_RARE } from '../constants';

// mulberry32: シード付き擬似乱数（テストを再現可能にするため）
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('control: リール制御（目押し）', () => {
  it('フラグSで7から遠い位置を押すと7はそろわないが、届く位置に肉球があれば肉球でフォローする', () => {
    const result = decideStop({
      reelIndex: 0,
      pressTopIndex: 10,
      flag: 'S',
      otherPlacedRows: [null, null, null],
      isLastReel: false,
      socrLeader: false,
    });
    expect(result.rows).not.toContain('S');
    expect(result.rows).toContain('Z');
    expect(result.slip).toBe(3);
  });

  it('フラグSで7に近い位置を押すと7がそろう', () => {
    const result = decideStop({
      reelIndex: 0,
      pressTopIndex: 0,
      flag: 'S',
      otherPlacedRows: [null, null, null],
      isLastReel: false,
      socrLeader: false,
    });
    expect(result.rows).toContain('S');
    expect(result.slip).toBe(0);
  });

  it('フラグZGで肉球に近い位置を押すと肉球がそろう', () => {
    const result = decideStop({
      reelIndex: 0,
      pressTopIndex: 2,
      flag: 'ZG',
      otherPlacedRows: [null, null, null],
      isLastReel: false,
      socrLeader: false,
    });
    expect(result.rows).toContain('Z');
    expect(result.rows).not.toContain('G');
  });

  it('フラグZGで盾に近い位置を押すと盾がそろう', () => {
    const result = decideStop({
      reelIndex: 0,
      pressTopIndex: 18,
      flag: 'ZG',
      otherPlacedRows: [null, null, null],
      isLastReel: false,
      socrLeader: false,
    });
    expect(result.rows).toContain('G');
    expect(result.rows).not.toContain('Z');
  });

  it('滑りは最大4コマ（通常時）', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 500; i++) {
      const result = decideStop({
        reelIndex: 0,
        pressTopIndex: Math.floor(rng() * 20),
        flag: 'S',
        otherPlacedRows: [null, null, null],
        isLastReel: false,
        socrLeader: false,
      });
      expect(result.slip).toBeLessThanOrEqual(MAX_SLIP_DEFAULT);
    }
  });

  it('ソクラニャスがリーダーでフラグS・Wのときだけ最大5コマまで滑る', () => {
    // pressTopIndex=5 は通常なら4コマ以内で肉球(Z)止まりだが、5コマ許容なら7(S)まで届く
    const normal = decideStop({
      reelIndex: 0,
      pressTopIndex: 5,
      flag: 'S',
      otherPlacedRows: [null, null, null],
      isLastReel: false,
      socrLeader: false,
    });
    expect(normal.slip).toBeLessThanOrEqual(MAX_SLIP_DEFAULT);
    expect(normal.rows).not.toContain('S');

    const withSocr = decideStop({
      reelIndex: 0,
      pressTopIndex: 5,
      flag: 'S',
      otherPlacedRows: [null, null, null],
      isLastReel: false,
      socrLeader: true,
    });
    expect(withSocr.slip).toBe(MAX_SLIP_SOCR_RARE);
    expect(withSocr.rows).toContain('S');

    // レア役でないフラグ（H）では、ソクラニャスがリーダーでも最大4コマのまま
    const nonRareWithSocr = decideStop({
      reelIndex: 0,
      pressTopIndex: 5,
      flag: 'H',
      otherPlacedRows: [null, null, null],
      isLastReel: false,
      socrLeader: true,
    });
    expect(nonRareWithSocr.slip).toBeLessThanOrEqual(MAX_SLIP_DEFAULT);
  });

  function simulateSpin(flag: 'R' | 'N', rng: () => number) {
    const placed: PlacedRows = [null, null, null];
    for (let reelIndex = 0; reelIndex < 3; reelIndex++) {
      const isLastReel = reelIndex === 2;
      const pressTopIndex = Math.floor(rng() * 20);
      const result = decideStop({
        reelIndex,
        pressTopIndex,
        flag,
        otherPlacedRows: placed,
        isLastReel,
        socrLeader: false,
      });
      placed[reelIndex] = result.rows;
    }
    return evaluateLines(placed);
  }

  it('フラグRのとき、ランダムな位置で押しても95%以上で鈴がそろう', () => {
    const rng = mulberry32(1);
    const trials = 3000;
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      const live = simulateSpin('R', rng);
      if (live.has('R')) hits++;
    }
    expect(hits / trials).toBeGreaterThanOrEqual(0.95);
  });

  it('フラグNのとき、成立ラインが出ない', () => {
    const rng = mulberry32(7);
    const trials = 3000;
    for (let i = 0; i < trials; i++) {
      const live = simulateSpin('N', rng);
      expect(live.size).toBe(0);
    }
  });
});
