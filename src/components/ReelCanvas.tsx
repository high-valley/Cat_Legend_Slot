import React, { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { Canvas, Group, Line, Path, Rect, vec } from '@shopify/react-native-skia';
import { STRIPS, LINES, mod } from '../game/reels';
import { Flag, FLAG_TARGETS, SymbolId } from '../game/constants';
import { ReelVisual } from './useReelEngine';
import { SymbolGlyph } from './SymbolIcon';

export interface ReelCanvasProps {
  reels: ReelVisual[];
  /** 告知中のフラグ（狙う図柄以外を暗くする演出に使う） */
  activeFlag: Flag | null;
  /** 3本とも停止した直後、成立ラインの図柄→ライン番号（描画終了後にクリアされる） */
  winLive: Map<SymbolId, number[]> | null;
  pulse: number;
}

export function ReelCanvas({ reels, activeFlag, winLive, pulse }: ReelCanvasProps) {
  const [size, setSize] = useState({ w: 320, h: 180 });

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w <= 0) return;
    const rw = (w - 8 * 2) / 3;
    const rh = Math.round(rw * 0.6);
    setSize({ w, h: rh * 3 });
  };

  const RW = (size.w - 16) / 3;
  const RH = size.h / 3;
  const GAP = 8;

  const winCells = new Set<string>();
  if (winLive) {
    for (const lines of winLive.values()) {
      for (const li of lines) {
        LINES[li].forEach((row, r) => winCells.add(`${r},${row}`));
      }
    }
  }
  const focus = activeFlag ? FLAG_TARGETS[activeFlag] ?? null : null;

  return (
    <View style={{ width: '100%' }} onLayout={onLayout}>
      <Canvas style={{ width: size.w, height: size.h }}>
        {reels.map((rl, r) => {
          const x = r * (RW + GAP);
          const by = rl.bounce * RH * 0.08;
          const base = Math.floor(rl.pos);
          const cells = [];
          for (let k = -1; k <= 3; k++) {
            const i = base + k;
            const y = (i - rl.pos) * RH + by;
            if (y < -RH || y > size.h + RH) continue;
            const sym = STRIPS[r][mod(i, 20)];
            const cellRow = i - Math.round(rl.pos);
            const isWin = rl.phase === 'stop' && winCells.has(`${r},${cellRow}`);
            const dimmed = focus ? !focus.includes(sym) : false;
            cells.push(
              <Group key={i}>
                {isWin && (
                  <>
                    <Rect
                      x={x + 3}
                      y={y + 3}
                      width={RW - 6}
                      height={RH - 6}
                      color="rgba(255,210,31,0.28)"
                    />
                    <Rect
                      x={x + 4}
                      y={y + 4}
                      width={RW - 8}
                      height={RH - 8}
                      color="#FFD21F"
                      style="stroke"
                      strokeWidth={2}
                    />
                  </>
                )}
                <SymbolGlyph
                  sym={sym}
                  cx={x + RW / 2}
                  cy={y + RH / 2}
                  size={RH * 1.28}
                  opacity={dimmed ? 0.12 : 1}
                  pulse={!dimmed && focus ? pulse : undefined}
                />
              </Group>,
            );
          }
          return (
            <Group key={r}>
              <Rect x={x} y={0} width={RW} height={size.h} color="#12173A" />
              {cells}
              <Line
                p1={vec(x, RH)}
                p2={vec(x + RW, RH)}
                color="rgba(255,255,255,0.08)"
                strokeWidth={1}
              />
              <Line
                p1={vec(x, RH * 2)}
                p2={vec(x + RW, RH * 2)}
                color="rgba(255,255,255,0.08)"
                strokeWidth={1}
              />
            </Group>
          );
        })}
        {winLive &&
          Array.from(winLive.values()).flatMap((lines) =>
            lines.map((li) => {
              const pts = LINES[li].map((row, r) => vec(r * (RW + GAP) + RW / 2, row * RH + RH / 2));
              const path = `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y} L ${pts[2].x} ${pts[2].y}`;
              return (
                <Path
                  key={li}
                  path={path}
                  color="rgba(255,70,50,0.95)"
                  style="stroke"
                  strokeWidth={4}
                  strokeCap="round"
                />
              );
            }),
          )}
      </Canvas>
    </View>
  );
}
