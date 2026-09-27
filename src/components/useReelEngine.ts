import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Flag,
  REEL_ACCEL_MS,
  REEL_STOP_LOCK_MS,
  SymbolId,
} from '../game/constants';
import { decideStop } from '../game/control';
import { PlacedRows, rowsAt } from '../game/reels';

export type ReelPhase = 'accel' | 'spin' | 'stopping' | 'stop';

export interface ReelVisual {
  phase: ReelPhase;
  /** 連続的に減少していく「上段位置」 */
  pos: number;
  targetTopIndex: number;
  startT: number;
  /** 停止時の小さなバウンド量（0〜1） */
  bounce: number;
}

function randomStartPos() {
  return Math.floor(Math.random() * 20) + 200;
}

export interface UseReelEngineParams {
  /** リール1〜3の速度（1秒あたりのコマ数、リーダースキル適用後） */
  reelSpeeds: [number, number, number];
  socrLeader: boolean;
  onAllStopped: (rows: [SymbolId[], SymbolId[], SymbolId[]], flag: Flag) => void;
  onReelStopSound?: () => void;
}

export function useReelEngine({
  reelSpeeds,
  socrLeader,
  onAllStopped,
  onReelStopSound,
}: UseReelEngineParams) {
  const [, forceRender] = useState(0);
  const reelsRef = useRef<ReelVisual[]>([0, 1, 2].map(() => ({
    phase: 'stop',
    pos: randomStartPos(),
    targetTopIndex: 0,
    startT: 0,
    bounce: 0,
  })));
  const flagRef = useRef<Flag | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const resolvedRef = useRef(false);
  const onAllStoppedRef = useRef(onAllStopped);
  onAllStoppedRef.current = onAllStopped;
  const onReelStopSoundRef = useRef(onReelStopSound);
  onReelStopSoundRef.current = onReelStopSound;

  const isSpinning = () => reelsRef.current.some((r) => r.phase !== 'stop');

  const lever = useCallback((flag: Flag) => {
    if (isSpinning()) return;
    flagRef.current = flag;
    resolvedRef.current = false;
    const now = performance.now();
    reelsRef.current = reelsRef.current.map((r) => ({ ...r, phase: 'accel', startT: now }));
    forceRender((n) => n + 1);
  }, []);

  const stopReel = useCallback(
    (index: number) => {
      const flag = flagRef.current;
      if (!flag) return;
      const r = reelsRef.current[index];
      if (r.phase !== 'spin') return;
      if (performance.now() - r.startT < REEL_STOP_LOCK_MS) return;

      const pressTopIndex = Math.floor(r.pos);
      const otherPlacedRows: PlacedRows = reelsRef.current.map((o, k) =>
        k !== index && (o.phase === 'stop' || o.phase === 'stopping')
          ? rowsAt(k, o.targetTopIndex)
          : null,
      );
      const alreadyStopped = otherPlacedRows.filter(Boolean).length;
      const isLastReel = alreadyStopped === 2;
      const result = decideStop({
        reelIndex: index,
        pressTopIndex,
        flag,
        otherPlacedRows,
        isLastReel,
        socrLeader,
      });
      reelsRef.current[index] = { ...r, phase: 'stopping', targetTopIndex: result.finalTopIndex };
      forceRender((n) => n + 1);
    },
    [socrLeader],
  );

  useEffect(() => {
    lastRef.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastRef.current) / 1000);
      lastRef.current = now;
      let dirty = false;
      const rs = reelsRef.current;
      rs.forEach((r, i) => {
        const maxSpeed = reelSpeeds[i];
        if (r.phase === 'accel') {
          const t = Math.min(1, (now - r.startT) / REEL_ACCEL_MS);
          r.pos -= maxSpeed * t * dt;
          if (now - r.startT >= REEL_ACCEL_MS) r.phase = 'spin';
          dirty = true;
        } else if (r.phase === 'spin') {
          r.pos -= maxSpeed * dt;
          dirty = true;
        } else if (r.phase === 'stopping') {
          r.pos -= maxSpeed * dt;
          if (r.pos <= r.targetTopIndex) {
            r.pos = r.targetTopIndex;
            r.phase = 'stop';
            r.bounce = 1;
            onReelStopSoundRef.current?.();
          }
          dirty = true;
        }
        if (r.bounce > 0) {
          r.bounce = Math.max(0, r.bounce - dt * 8);
          dirty = true;
        }
      });

      if (!resolvedRef.current && flagRef.current && rs.every((r) => r.phase === 'stop')) {
        resolvedRef.current = true;
        const flag = flagRef.current;
        const rows = rs.map((r, i) => rowsAt(i, r.targetTopIndex)) as [
          SymbolId[],
          SymbolId[],
          SymbolId[],
        ];
        onAllStoppedRef.current(rows, flag);
      }

      if (dirty) forceRender((n) => n + 1);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reelSpeeds[0], reelSpeeds[1], reelSpeeds[2], socrLeader]);

  return {
    reels: reelsRef.current,
    lever,
    stopReel,
    isSpinning: isSpinning(),
    isReelLive: (index: number) => {
      const phase = reelsRef.current[index].phase;
      return phase === 'accel' || phase === 'spin';
    },
  };
}
