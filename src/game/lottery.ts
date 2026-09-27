import { CharacterId } from './characters';
import { Flag, LOTTERY_WEIGHTS_DEFAULT, LOTTERY_WEIGHTS_NAPO } from './constants';

export type Rng = () => number;

export function getLotteryWeights(leaderId: CharacterId): Record<Flag, number> {
  return leaderId === 'napo' ? LOTTERY_WEIGHTS_NAPO : LOTTERY_WEIGHTS_DEFAULT;
}

/**
 * 6.1 内部抽選。rng() は [0,1) を返す関数（テストでは固定値を注入する）。
 * 累積確率の境界は Object.keys の順（ZG,H,W,S,R,N）で判定する。
 */
export function drawFlag(rng: Rng, leaderId: CharacterId): Flag {
  const weights = getLotteryWeights(leaderId);
  const order: Flag[] = ['ZG', 'H', 'W', 'S', 'R', 'N'];
  const total = order.reduce((a, k) => a + weights[k], 0);
  let x = rng() * total;
  for (const k of order) {
    x -= weights[k];
    if (x < 0) return k;
  }
  return order[order.length - 1];
}
