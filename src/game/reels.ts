import { REEL_STRIP_LENGTH, SymbolId } from './constants';

/** 5.2 リール配列（各20コマ）。インデックス0から順に並べる。 */
export const STRIPS: SymbolId[][] = [
  'S B Z R H B G Z R W B H G R Z B H R G W'.split(' ') as SymbolId[],
  'Z B H R G W B Z R H S B G R Z W B H R G'.split(' ') as SymbolId[],
  'R G B Z W R H B G Z R B H S G R Z B W H'.split(' ') as SymbolId[],
];

/** 5.3 有効ライン（5ライン）。各要素はリール1〜3で見る行番号（0=上段,1=中段,2=下段）。 */
export const LINES: [number, number, number][] = [
  [0, 0, 0],
  [1, 1, 1],
  [2, 2, 2],
  [0, 1, 2],
  [2, 1, 0],
];

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * リール reelIndex の topIndex（盤面の上段にあたるコマの位置）から見える
 * 上段・中段・下段の3コマを返す。
 */
export function rowsAt(reelIndex: number, topIndex: number): SymbolId[] {
  const strip = STRIPS[reelIndex];
  return [0, 1, 2].map((k) => strip[mod(topIndex + k, REEL_STRIP_LENGTH)]);
}

export type PlacedRows = (SymbolId[] | null)[];

/**
 * 各ラインの成立状況を判定する。
 * 戻り値は成立している図柄 -> 成立ライン番号の配列（Mapの挿入順は
 * ライン評価順＝LINESの順で最初に見つかった図柄順になる）。
 * placed に null が含まれるリール（まだ止まっていない）はそのラインを未評価とする。
 * ブランクを含むライン、または一部リールがまだ止まっていないラインは成立しない。
 */
export function evaluateLines(placed: PlacedRows): Map<SymbolId, number[]> {
  const live = new Map<SymbolId, number[]>();
  LINES.forEach((line, lineIndex) => {
    let sym: SymbolId | null = null;
    let ok = true;
    let count = 0;
    for (let r = 0; r < 3; r++) {
      const rowSyms = placed[r];
      if (!rowSyms) continue;
      count++;
      const s = rowSyms[line[r]];
      if (s === 'B') {
        ok = false;
        break;
      }
      if (sym === null) sym = s;
      else if (sym !== s) {
        ok = false;
        break;
      }
    }
    if (ok && sym && count > 0) {
      if (!live.has(sym)) live.set(sym, []);
      live.get(sym)!.push(lineIndex);
    }
  });
  return live;
}
