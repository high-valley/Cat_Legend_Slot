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

interface Frame {
  reels: ReelVisual[];
  /** このフレームの時刻（ms）。告知中の脈動演出に使う */
  now: number;
}

function createInitialReels(): ReelVisual[] {
  return [0, 1, 2].map(() => ({
    phase: 'stop',
    pos: Math.floor(Math.random() * 20) + 200,
    targetTopIndex: 0,
    startT: 0,
    bounce: 0,
  }));
}

const snapshot = (reels: ReelVisual[], now: number): Frame => ({
  reels: reels.map((r) => ({ ...r })),
  now,
});

export interface UseReelEngineParams {
  /** リール1〜3の速度（1秒あたりのコマ数、リーダースキル適用後） */
  reelSpeeds: [number, number, number];
  socrLeader: boolean;
  onAllStopped: (rows: [SymbolId[], SymbolId[], SymbolId[]], flag: Flag) => void;
  onReelStopSound?: () => void;
}

/**
 * リールの回転・停止をフレーム単位で進める。
 * 物理状態は ref で更新し、描画にはフレームごとのコピー（state）を渡す。
 */
export function useReelEngine({
  reelSpeeds,
  socrLeader,
  onAllStopped,
  onReelStopSound,
}: UseReelEngineParams) {
  const [frame, setFrame] = useState<Frame>(() => ({ reels: createInitialReels(), now: 0 }));
  const reelsRef = useRef<ReelVisual[]>(frame.reels.map((r) => ({ ...r })));
  const flagRef = useRef<Flag | null>(null);
  const resolvedRef = useRef(false);
  const speedsRef = useRef(reelSpeeds);
  const onAllStoppedRef = useRef(onAllStopped);
  const onReelStopSoundRef = useRef(onReelStopSound);

  useEffect(() => {
    speedsRef.current = reelSpeeds;
    onAllStoppedRef.current = onAllStopped;
    onReelStopSoundRef.current = onReelStopSound;
  });

  const lever = useCallback((flag: Flag) => {
    if (reelsRef.current.some((r) => r.phase !== 'stop')) return;
    flagRef.current = flag;
    resolvedRef.current = false;
    const now = performance.now();
    reelsRef.current.forEach((r) => {
      r.phase = 'accel';
      r.startT = now;
    });
    setFrame(snapshot(reelsRef.current, now));
  }, []);

  const stopReel = useCallback(
    (index: number) => {
      const flag = flagRef.current;
      if (!flag) return;
      const r = reelsRef.current[index];
      const now = performance.now();
      if (r.phase !== 'spin') return;
      if (now - r.startT < REEL_STOP_LOCK_MS) return;

      const otherPlacedRows: PlacedRows = reelsRef.current.map((o, k) =>
        k !== index && (o.phase === 'stop' || o.phase === 'stopping')
          ? rowsAt(k, o.targetTopIndex)
          : null,
      );
      const result = decideStop({
        reelIndex: index,
        pressTopIndex: Math.floor(r.pos),
        flag,
        otherPlacedRows,
        isLastReel: otherPlacedRows.filter(Boolean).length === 2,
        socrLeader,
      });
      r.phase = 'stopping';
      r.targetTopIndex = result.finalTopIndex;
      setFrame(snapshot(reelsRef.current, now));
    },
    [socrLeader],
  );

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let dirty = false;
      const rs = reelsRef.current;
      rs.forEach((r, i) => {
        const maxSpeed = speedsRef.current[i];
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

      if (dirty) setFrame(snapshot(rs, now));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const isReelLive = (index: number) => {
    const phase = frame.reels[index].phase;
    return phase === 'accel' || phase === 'spin';
  };

  return {
    reels: frame.reels,
    frameTime: frame.now,
    lever,
    stopReel,
    isReelLive,
  };
}
