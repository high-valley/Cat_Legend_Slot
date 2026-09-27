/** 純粋なゲームロジックの調整値。バランス調整はここを変更する。 */

export type SymbolId = 'Z' | 'H' | 'G' | 'R' | 'W' | 'S' | 'B';

export interface SymbolDef {
  id: SymbolId;
  name: string;
  effect: string;
  glowColor: string;
}

export const SYMBOLS: Record<SymbolId, SymbolDef> = {
  Z: { id: 'Z', name: '肉球', effect: '攻撃', glowColor: '#FF4F8B' },
  H: { id: 'H', name: '魚', effect: '回復', glowColor: '#FF8A1F' },
  G: { id: 'G', name: '盾', effect: '防御', glowColor: '#3D8BFF' },
  R: { id: 'R', name: '鈴', effect: 'リプレイ', glowColor: '#FFD21F' },
  W: { id: 'W', name: '巻物', effect: '連携技', glowColor: '#C06BFF' },
  S: { id: 'S', name: '7', effect: '必殺', glowColor: '#FF3030' },
  B: { id: 'B', name: 'ブランク', effect: 'なし', glowColor: '' },
};

/** フラグ（内部抽選の結果）。ZG＝肉球か盾のどちらでもよい、N＝ハズレ。 */
export type Flag = 'ZG' | 'H' | 'W' | 'S' | 'R' | 'N';

/** フラグごとに狙うべき図柄。ZGのみ2択、Rはblankで自動、Nは無し。 */
export const FLAG_TARGETS: Partial<Record<Flag, SymbolId[]>> = {
  ZG: ['Z', 'G'],
  H: ['H'],
  W: ['W'],
  S: ['S'],
  R: ['R'],
};

export const FLAG_NOTICE: Partial<Record<Flag, { title: string; sub: string }>> = {
  ZG: { title: '肉球か盾を狙え！', sub: '攻めるか守るか、好きな方を狙おう' },
  H: { title: '魚を狙え！', sub: 'オレンジの魚を狙って止めよう' },
  W: { title: '巻物を狙え！', sub: 'レア役！ 紫の巻物を狙おう' },
  S: { title: '7を狙え！', sub: '激レア！ 赤い7をよく見て止めよう' },
};

/** 6.1 抽選の基本確率（%）。ナポニャオンがリーダーのときは lotteryWeightsNapo を使う。 */
export const LOTTERY_WEIGHTS_DEFAULT: Record<Flag, number> = {
  ZG: 52,
  H: 11,
  W: 5,
  S: 3,
  R: 13,
  N: 16,
};

/** ナポニャオンリーダー時の上書き（余の辞書：7の当選確率2倍） */
export const LOTTERY_WEIGHTS_NAPO: Record<Flag, number> = {
  ...LOTTERY_WEIGHTS_DEFAULT,
  S: 6,
  ZG: 49,
};

/** 7.1 リール制御：最大滑りコマ数 */
export const MAX_SLIP_DEFAULT = 4;
export const MAX_SLIP_SOCR_RARE = 5;

/** 5.4 回転・停止のタイミング（ミリ秒） */
export const REEL_ACCEL_MS = 250;
export const REEL_STOP_LOCK_MS = 380;

export const REEL_STRIP_LENGTH = 20;

export interface EnemyDef {
  name: string;
  hp: number;
  atk: number;
  interval: number;
}

export const ENEMIES: EnemyDef[] = [
  { name: '子分ネズミ チュー太', hp: 320, atk: 28, interval: 3 },
  { name: '鉄鼠（てっそ）', hp: 750, atk: 42, interval: 3 },
  { name: 'ラットキング', hp: 1300, atk: 50, interval: 3 },
];

/** 撃破後、次の戦いに進むときの回復割合 */
export const STAGE_CLEAR_HEAL_RATIO = 0.3;

/** ボスの怒り状態の攻撃間隔 */
export const BOSS_ANGRY_INTERVAL = 2;

/** 盾（G）の被ダメージカット率 */
export const GUARD_DAMAGE_CUT = 0.7;

/** 敵の攻撃ダメージのランダム幅 */
export const ENEMY_DAMAGE_RANDOM_MIN = 0.9;
export const ENEMY_DAMAGE_RANDOM_MAX = 1.1;

/**
 * 突撃命令・無知の知の残りターンの初期値。
 * 仕様上は「3ターンの間」効果があるが、8.4節よりターン終了時に1減らすため、
 * 発動したそのターン分を含めて3ターン持続させるには4を設定する（試作品と同じ）。
 */
export const ASSAULT_BUFF_TURNS = 4;
export const VULNERABLE_DEBUFF_TURNS = 4;

/** 肉球の複数ライン成立時の倍率係数（1ライン超過ごとに+0.5） */
export const PAW_EXTRA_LINE_BONUS = 0.5;

/** 7の固定倍率 */
export const SEVEN_DAMAGE_MULT = 5;

/** 突撃命令中の肉球・7の追加倍率 */
export const ASSAULT_DAMAGE_MULT = 2;

/** 無知の知中の被ダメージ倍率 */
export const VULNERABLE_DAMAGE_MULT = 1.5;

/** 魚（回復）の基本回復割合（最大HPに対して、ライン数倍） */
export const FISH_HEAL_RATIO = 0.2;
