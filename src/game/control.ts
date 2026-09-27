import { Flag, FLAG_TARGETS, MAX_SLIP_DEFAULT, MAX_SLIP_SOCR_RARE, SymbolId } from './constants';
import { evaluateLines, PlacedRows, rowsAt } from './reels';

export interface DecideStopInput {
  reelIndex: number;
  /** ストップを押した瞬間の、そのリールの上段位置（任意の整数、内部でmod20される） */
  pressTopIndex: number;
  flag: Flag;
  /** 既に停止している他リールの3コマ（このリールは null）。長さ3の配列。 */
  otherPlacedRows: PlacedRows;
  /** これが最後に停止するリールかどうか */
  isLastReel: boolean;
  /** リーダーが問答法（ソクラニャス）かどうか */
  socrLeader: boolean;
}

export interface DecideStopResult {
  slip: number;
  finalTopIndex: number;
  rows: SymbolId[];
}

/**
 * 7.1 リール制御アルゴリズム。
 * ストップ押下時、滑りコマ数 s=0〜最大値の各候補について
 * 「すでに止まっているリール＋この候補」で各ラインの状態を評価し、
 * スコアが最も高い候補を選ぶ（同点なら滑りが少ない方）。
 */
export function decideStop(input: DecideStopInput): DecideStopResult {
  const { reelIndex, pressTopIndex, flag, otherPlacedRows, isLastReel, socrLeader } = input;
  const rare = flag === 'S' || flag === 'W';
  const maxSlip = MAX_SLIP_DEFAULT + (rare && socrLeader ? MAX_SLIP_SOCR_RARE - MAX_SLIP_DEFAULT : 0);
  const targets: SymbolId[] = FLAG_TARGETS[flag] ?? [];

  let best = 0;
  let bestScore = -Infinity;

  for (let s = 0; s <= maxSlip; s++) {
    const placed: PlacedRows = [...otherPlacedRows];
    placed[reelIndex] = rowsAt(reelIndex, pressTopIndex - s);
    const live = evaluateLines(placed);

    let score: number;
    if (flag === 'N') {
      if (isLastReel) {
        score = live.size === 0 ? 100 : 0;
      } else {
        let lineCount = 0;
        for (const lines of live.values()) lineCount += lines.length;
        score = 60 - lineCount * 4;
      }
    } else if (targets.some((t) => live.has(t))) {
      score = 100;
    } else if (live.has('Z')) {
      score = 50;
    } else if (isLastReel) {
      score = live.size > 0 ? 15 : 20;
    } else {
      score = 10;
    }
    score -= s * 0.1;

    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }

  const finalTopIndex = pressTopIndex - best;
  return { slip: best, finalTopIndex, rows: rowsAt(reelIndex, finalTopIndex) };
}
