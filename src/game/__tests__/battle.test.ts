import { createBattleState, processTurn, BattleState } from '../battle';
import { SymbolId } from '../constants';
import { CharacterId } from '../characters';

const slots: [CharacterId, CharacterId, CharacterId] = ['nobu', 'napo', 'jean'];
// sumAtk = 34 + 30 + 22 = 86
const SUM_ATK = 86;

function rows(a: SymbolId[], b: SymbolId[], c: SymbolId[]): [SymbolId[], SymbolId[], SymbolId[]] {
  return [a, b, c];
}

describe('battle: 役の効果', () => {
  it('肉球2ライン成立で、成立ライン数に応じたダメージが入る', () => {
    // 上段・下段のみ肉球一致（中段はばらばら、斜めも不一致になるよう調整）
    const board = rows(['Z', 'H', 'Z'], ['Z', 'G', 'Z'], ['Z', 'R', 'Z']);
    const state = createBattleState({ slots, leaderIndex: 2 }); // jean: atkMult=1
    const { state: next } = processTurn(state, 'ZG', board, () => 0.5);
    const expectedDamage = Math.round(SUM_ATK * 1 * (1 + 0.5 * (2 - 1))); // 129
    expect(next.enemy.hp).toBe(next.enemy.maxHp - expectedDamage);
    expect(next.totalDamage).toBe(expectedDamage);
    expect(next.hp).toBe(state.maxHp); // 敵は反撃していない
  });

  it('突撃命令と無知の知を重ね掛けすると、肉球ダメージが2×1.5倍になる', () => {
    const board = rows(['Z', 'H', 'G'], ['Z', 'R', 'W'], ['Z', 'B', 'B']);
    let state: BattleState = createBattleState({ slots, leaderIndex: 1 }); // napo: atkMult=1
    state = { ...state, status: { ...state.status, assaultTurns: 2, vulnerableTurns: 2 } };
    const { state: next } = processTurn(state, 'ZG', board, () => 0.5);
    const expectedDamage = Math.round(SUM_ATK * 1 * 2 * 1.5); // 258 (1ライン)
    expect(next.enemy.hp).toBe(next.enemy.maxHp - expectedDamage);
  });

  it('盾が有効なとき、敵の攻撃ダメージが70%カットされる', () => {
    let state: BattleState = createBattleState({ slots, leaderIndex: 2 });
    state = {
      ...state,
      status: { ...state.status, guard: true },
      enemy: { ...state.enemy, count: 1 },
    };
    const board = rows(['H', 'B', 'B'], ['G', 'B', 'B'], ['R', 'B', 'B']); // ハズレ盤面
    const { state: next, events } = processTurn(state, 'N', board, () => 0);
    // atk=28（第1戦）、乱数0 → 倍率0.9、盾で0.3倍 → round(28*0.3*0.9)=8
    expect(next.hp).toBe(state.maxHp - 8);
    expect(next.status.guard).toBe(false);
    expect(events).toContainEqual({ type: 'enemyAttack', amount: 8, nullified: false });
  });

  it('聖旗の加護が有効なとき、敵の攻撃は無効化される', () => {
    let state: BattleState = createBattleState({ slots, leaderIndex: 2 });
    state = {
      ...state,
      status: { ...state.status, sacred: true },
      enemy: { ...state.enemy, count: 1 },
    };
    const board = rows(['H', 'B', 'B'], ['G', 'B', 'B'], ['R', 'B', 'B']);
    const { state: next, events } = processTurn(state, 'N', board, () => 0);
    expect(next.hp).toBe(state.maxHp);
    expect(next.status.sacred).toBe(false);
    expect(events).toContainEqual({ type: 'enemyAttack', amount: 0, nullified: true });
  });

  it('ボスのHPが50%を切ると怒り状態になり、攻撃間隔が2ターンになる', () => {
    let state: BattleState = createBattleState({ slots, leaderIndex: 2 });
    state = {
      ...state,
      enemy: { ...state.enemy, stageIndex: 2, name: 'ラットキング', maxHp: 1300, hp: 700, atk: 50, interval: 3, count: 1, angry: false },
    };
    // 1ラインだけ肉球成立 → ダメージ86 → 700-86=614 < 650(半分)
    const board = rows(['Z', 'H', 'G'], ['Z', 'R', 'W'], ['Z', 'B', 'B']);
    const { state: next, events } = processTurn(state, 'ZG', board, () => 0.5);
    expect(next.enemy.hp).toBe(700 - SUM_ATK); // 敵のHPは味方の攻撃分だけ減る
    expect(next.hp).toBe(state.maxHp - 50); // 敵の反撃（乱数0.5→倍率1.0）で50ダメージ
    expect(next.enemy.angry).toBe(true);
    expect(next.enemy.count).toBe(2);
    expect(events).toContainEqual({ type: 'bossAngry' });
  });
});
