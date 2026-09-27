import { CharacterId, getCharacter, getLeaderEffects } from './characters';
import {
  ASSAULT_BUFF_TURNS,
  ASSAULT_DAMAGE_MULT,
  BOSS_ANGRY_INTERVAL,
  ENEMIES,
  ENEMY_DAMAGE_RANDOM_MAX,
  ENEMY_DAMAGE_RANDOM_MIN,
  FISH_HEAL_RATIO,
  Flag,
  GUARD_DAMAGE_CUT,
  PAW_EXTRA_LINE_BONUS,
  SEVEN_DAMAGE_MULT,
  STAGE_CLEAR_HEAL_RATIO,
  SymbolId,
  VULNERABLE_DAMAGE_MULT,
  VULNERABLE_DEBUFF_TURNS,
} from './constants';
import { evaluateLines } from './reels';
import { Rng } from './lottery';

export interface BattlePartyConfig {
  /** リール1〜3に配置したキャラID（重複不可） */
  slots: [CharacterId, CharacterId, CharacterId];
  leaderIndex: 0 | 1 | 2;
}

export interface StatusEffects {
  /** 盾（G）：次の敵の攻撃のダメージを70%カット */
  guard: boolean;
  /** 聖旗の加護（jeanの技）：次の敵の攻撃を無効化 */
  sacred: boolean;
  /** 突撃命令の残りターン */
  assaultTurns: number;
  /** 無知の知の残りターン */
  vulnerableTurns: number;
}

export interface EnemyState {
  stageIndex: number;
  name: string;
  maxHp: number;
  hp: number;
  atk: number;
  interval: number;
  count: number;
  angry: boolean;
}

export type BattleResult = 'ongoing' | 'win' | 'lose';

export interface BattleState {
  party: BattlePartyConfig;
  maxHp: number;
  hp: number;
  enemy: EnemyState;
  status: StatusEffects;
  turn: number;
  aimTry: number;
  aimHit: number;
  totalDamage: number;
  result: BattleResult;
}

export type BattleEvent =
  | { type: 'miss'; flag: Flag }
  | { type: 'followUpPaw'; flag: Flag }
  | { type: 'lineWin'; symbol: SymbolId; lineCount: number }
  | { type: 'hit'; amount: number; cutin: boolean }
  | { type: 'heal'; amount: number; source: 'fish' | CharacterId }
  | { type: 'guard' }
  | { type: 'replay' }
  | { type: 'skillChainStart' }
  | { type: 'skill'; charId: CharacterId; name: string }
  | { type: 'enemyDefeated' }
  | { type: 'stageClear'; nextStageIndex: number }
  | { type: 'victory' }
  | { type: 'enemyAttack'; amount: number; nullified: boolean }
  | { type: 'bossAngry' }
  | { type: 'defeat' };

function spawnEnemy(stageIndex: number): EnemyState {
  const def = ENEMIES[stageIndex];
  return {
    stageIndex,
    name: def.name,
    maxHp: def.hp,
    hp: def.hp,
    atk: def.atk,
    interval: def.interval,
    count: def.interval,
    angry: false,
  };
}

export function createBattleState(party: BattlePartyConfig): BattleState {
  const leaderEffects = getLeaderEffects(party.slots[party.leaderIndex]);
  const totalHp = party.slots.reduce((a, id) => a + getCharacter(id).hp, 0);
  const maxHp = Math.round(totalHp * leaderEffects.hpMult);
  return {
    party,
    maxHp,
    hp: maxHp,
    enemy: spawnEnemy(0),
    status: { guard: false, sacred: false, assaultTurns: 0, vulnerableTurns: 0 },
    turn: 0,
    aimTry: 0,
    aimHit: 0,
    totalDamage: 0,
    result: 'ongoing',
  };
}

export function sumAtk(party: BattlePartyConfig): number {
  return party.slots.reduce((a, id) => a + getCharacter(id).atk, 0);
}

const isBossStage = (stageIndex: number) => stageIndex === ENEMIES.length - 1;

/**
 * 8.4 1ターンの流れ。すでに3本とも停止したあとの盤面 (rows) を渡して、
 * 役の判定から敵の攻撃までを一括で処理する。入力の state は変更しない。
 */
export function processTurn(
  state: BattleState,
  flag: Flag,
  rows: [SymbolId[], SymbolId[], SymbolId[]],
  rng: Rng,
): { state: BattleState; events: BattleEvent[] } {
  if (state.result !== 'ongoing') return { state, events: [] };

  const events: BattleEvent[] = [];
  const status: StatusEffects = { ...state.status };
  const enemy: EnemyState = { ...state.enemy };
  let hp = state.hp;
  let aimTry = state.aimTry;
  let aimHit = state.aimHit;
  let totalDamage = state.totalDamage;

  const live = evaluateLines(rows);
  const aimed = flag === 'S' || flag === 'W';
  if (aimed) {
    aimTry++;
    if (live.has(flag)) aimHit++;
  }

  if (live.size === 0) {
    events.push({ type: 'miss', flag });
  } else if (aimed && !live.has(flag)) {
    events.push({ type: 'followUpPaw', flag });
  }

  const leaderEffects = getLeaderEffects(state.party.slots[state.party.leaderIndex]);
  const atkSum = sumAtk(state.party);

  const mult = (big: boolean) =>
    leaderEffects.atkMult *
    (big && status.assaultTurns > 0 ? ASSAULT_DAMAGE_MULT : 1) *
    (status.vulnerableTurns > 0 ? VULNERABLE_DAMAGE_MULT : 1);

  const hit = (dmg: number, cutin: boolean) => {
    const d = Math.round(dmg);
    enemy.hp -= d;
    totalDamage += d;
    events.push({ type: 'hit', amount: d, cutin });
  };
  const heal = (ratio: number, source: 'fish' | CharacterId) => {
    const v = Math.round(state.maxHp * ratio * leaderEffects.healMult);
    hp = Math.min(state.maxHp, hp + v);
    events.push({ type: 'heal', amount: v, source });
  };

  let replay = false;

  for (const [sym, lines] of live) {
    const lineCount = lines.length;
    if (sym === 'Z') {
      events.push({ type: 'lineWin', symbol: 'Z', lineCount });
      hit(atkSum * mult(true) * (1 + PAW_EXTRA_LINE_BONUS * (lineCount - 1)), false);
    } else if (sym === 'S') {
      events.push({ type: 'lineWin', symbol: 'S', lineCount });
      hit(atkSum * SEVEN_DAMAGE_MULT * mult(true), true);
    } else if (sym === 'H') {
      events.push({ type: 'lineWin', symbol: 'H', lineCount });
      heal(FISH_HEAL_RATIO * lineCount, 'fish');
    } else if (sym === 'G') {
      status.guard = true;
      events.push({ type: 'guard' });
    } else if (sym === 'R') {
      replay = true;
      events.push({ type: 'replay' });
    } else if (sym === 'W') {
      events.push({ type: 'skillChainStart' });
      for (const charId of state.party.slots) {
        if (enemy.hp <= 0) break;
        const def = getCharacter(charId);
        events.push({ type: 'skill', charId, name: def.skill.name });
        switch (charId) {
          case 'nobu':
            hit(def.atk * 3 * mult(false), false);
            break;
          case 'napo':
            status.assaultTurns = ASSAULT_BUFF_TURNS;
            break;
          case 'jean':
            status.sacred = true;
            heal(0.1, 'jean');
            break;
          case 'himi':
            heal(0.35, 'himi');
            break;
          case 'newt':
            enemy.count += 2;
            hit(def.atk * mult(false), false);
            break;
          case 'socr':
            status.vulnerableTurns = VULNERABLE_DEBUFF_TURNS;
            break;
        }
      }
    }
    if (enemy.hp <= 0) break;
  }

  if (enemy.hp <= 0) {
    enemy.hp = 0;
    events.push({ type: 'enemyDefeated' });
    if (isBossStage(enemy.stageIndex)) {
      events.push({ type: 'victory' });
      return {
        state: {
          ...state,
          hp,
          enemy,
          status,
          turn: state.turn + 1,
          aimTry,
          aimHit,
          totalDamage,
          result: 'win',
        },
        events,
      };
    }
    const nextStageIndex = enemy.stageIndex + 1;
    hp = Math.min(state.maxHp, hp + Math.round(state.maxHp * STAGE_CLEAR_HEAL_RATIO));
    events.push({ type: 'stageClear', nextStageIndex });
    return {
      state: {
        ...state,
        hp,
        enemy: spawnEnemy(nextStageIndex),
        status: { guard: false, sacred: false, assaultTurns: 0, vulnerableTurns: 0 },
        turn: state.turn + 1,
        aimTry,
        aimHit,
        totalDamage,
        result: 'ongoing',
      },
      events,
    };
  }

  if (!replay) {
    enemy.count -= 1;
    if (enemy.count <= 0) {
      if (status.sacred) {
        status.sacred = false;
        events.push({ type: 'enemyAttack', amount: 0, nullified: true });
      } else {
        const dmg = Math.round(
          enemy.atk *
            (status.guard ? 1 - GUARD_DAMAGE_CUT : 1) *
            (ENEMY_DAMAGE_RANDOM_MIN + rng() * (ENEMY_DAMAGE_RANDOM_MAX - ENEMY_DAMAGE_RANDOM_MIN)),
        );
        hp -= dmg;
        status.guard = false;
        events.push({ type: 'enemyAttack', amount: dmg, nullified: false });
      }
      if (isBossStage(enemy.stageIndex) && !enemy.angry && enemy.hp < enemy.maxHp / 2) {
        enemy.angry = true;
        events.push({ type: 'bossAngry' });
      }
      enemy.count = enemy.angry ? BOSS_ANGRY_INTERVAL : enemy.interval;
    }

    if (hp <= 0) {
      events.push({ type: 'defeat' });
      return {
        state: {
          ...state,
          hp: 0,
          enemy,
          status,
          turn: state.turn + 1,
          aimTry,
          aimHit,
          totalDamage,
          result: 'lose',
        },
        events,
      };
    }

    if (status.assaultTurns > 0) status.assaultTurns--;
    if (status.vulnerableTurns > 0) status.vulnerableTurns--;
  }

  return {
    state: {
      ...state,
      hp,
      enemy,
      status,
      turn: state.turn + 1,
      aimTry,
      aimHit,
      totalDamage,
      result: 'ongoing',
    },
    events,
  };
}
