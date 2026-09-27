import React from 'react';
import { Canvas, Circle, Group, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { SymbolId } from '../game/constants';
import { getSymbolArt } from './symbolGeometry';

export interface SymbolGlyphProps {
  sym: SymbolId;
  cx: number;
  cy: number;
  size: number;
  /** 告知中、狙っていない図柄を暗くするための不透明度（0〜1） */
  opacity?: number;
  /** 告知中、狙っている図柄の後ろを金色に光らせるための脈動量（0〜1） */
  pulse?: number;
}

/**
 * リール盤面の1コマ分の図柄を描画する（Canvas内のGroupとして使う想定）。
 * ブランク（B）の場合は何も描かない。
 */
export function SymbolGlyph({ sym, cx, cy, size, opacity = 1, pulse }: SymbolGlyphProps) {
  const art = getSymbolArt(sym, cx, cy, size);
  if (!art) return null;
  return (
    <Group opacity={opacity}>
      <Circle cx={cx} cy={cy} r={size * 0.42}>
        <RadialGradient
          c={vec(cx, cy)}
          r={size * 0.42}
          colors={[`${art.glow}66`, `${art.glow}00`]}
        />
      </Circle>
      {pulse !== undefined && (
        <Circle cx={cx} cy={cy} r={size * 0.55} opacity={0.3 + pulse * 0.5}>
          <RadialGradient
            c={vec(cx, cy)}
            r={size * 0.55}
            colors={['rgba(255,240,160,0.9)', 'rgba(255,200,60,0.4)', 'rgba(255,200,60,0)']}
          />
        </Circle>
      )}
      {art.fills.map((f, i) => (
        <Path key={`f${i}`} path={f.path} color={f.color} style="fill" />
      ))}
      {art.strokes.map((s, i) => (
        <Path
          key={`s${i}`}
          path={s.path}
          color={s.color}
          style="stroke"
          strokeWidth={s.width}
          strokeJoin="round"
          strokeCap="round"
        />
      ))}
    </Group>
  );
}

/** 凡例やキャラカードで単体表示するための小さなアイコン */
export function SymbolIcon({ sym, size = 30 }: { sym: SymbolId; size?: number }) {
  return (
    <Canvas style={{ width: size, height: size }}>
      <SymbolGlyph sym={sym} cx={size / 2} cy={size / 2} size={size * 1.3} />
    </Canvas>
  );
}
