import { SymbolId } from '../game/constants';

/** cx,cy中心・半径rx,ryの楕円をSVGパス文字列として返す（回転なし）。 */
function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
}

export interface SymbolShape {
  path: string;
  color: string;
}

export interface SymbolArt {
  /** 発光の中心色（RadialGradientに使う） */
  glow: string;
  /** 塗りつぶしの図形（重ね順） */
  fills: SymbolShape[];
  /** 線だけの図形 */
  strokes: (SymbolShape & { width: number })[];
}

/**
 * 図柄をcx,cyを中心とした一辺sの正方形に収まる大きさで描くためのパスを返す。
 * 試作品(prototype.html)のCanvas描画をSkiaのPathで再現したもの。
 */
export function getSymbolArt(sym: SymbolId, cx: number, cy: number, s: number): SymbolArt | null {
  switch (sym) {
    case 'Z': {
      const pad = ellipse(cx, cy + 0.12 * s, 0.19 * s, 0.155 * s);
      const toes = [
        [-0.21, -0.06, 0.075],
        [-0.08, -0.19, 0.08],
        [0.08, -0.19, 0.08],
        [0.21, -0.06, 0.075],
      ]
        .map(([dx, dy, r]) => ellipse(cx + dx * s, cy + dy * s, r * s, r * s * 1.18))
        .join(' ');
      return {
        glow: '#FF4F8B',
        fills: [{ path: `${pad} ${toes}`, color: '#FF5C8F' }],
        strokes: [],
      };
    }
    case 'H': {
      const tail = `M ${cx - 0.2 * s} ${cy} L ${cx - 0.38 * s} ${cy - 0.15 * s} L ${cx - 0.36 * s} ${cy + 0.15 * s} Z`;
      const body = `M ${cx + 0.32 * s} ${cy + 0.02 * s} Q ${cx + 0.05 * s} ${cy - 0.26 * s} ${cx - 0.22 * s} ${cy} Q ${cx + 0.05 * s} ${cy + 0.24 * s} ${cx + 0.32 * s} ${cy + 0.02 * s} Z`;
      const eye = ellipse(cx + 0.2 * s, cy - 0.03 * s, 0.04 * s, 0.04 * s);
      return {
        glow: '#FF8A1F',
        fills: [
          { path: `${tail} ${body}`, color: '#FF9A2E' },
          { path: eye, color: '#1D1B26' },
        ],
        strokes: [],
      };
    }
    case 'G': {
      const body = `M ${cx - 0.25 * s} ${cy - 0.28 * s} L ${cx + 0.25 * s} ${cy - 0.28 * s} L ${cx + 0.25 * s} ${cy - 0.02 * s} Q ${cx + 0.23 * s} ${cy + 0.22 * s} ${cx} ${cy + 0.34 * s} Q ${cx - 0.23 * s} ${cy + 0.22 * s} ${cx - 0.25 * s} ${cy - 0.02 * s} Z`;
      const cross = `M ${cx} ${cy - 0.2 * s} L ${cx} ${cy + 0.24 * s} M ${cx - 0.17 * s} ${cy - 0.04 * s} L ${cx + 0.17 * s} ${cy - 0.04 * s}`;
      return {
        glow: '#3D8BFF',
        fills: [{ path: body, color: '#2F7BFF' }],
        strokes: [{ path: cross, color: '#FFD21F', width: 0.06 * s }],
      };
    }
    case 'R': {
      const body = ellipse(cx, cy + 0.05 * s, 0.25 * s, 0.25 * s);
      const knob = ellipse(cx, cy + 0.14 * s, 0.05 * s, 0.05 * s);
      const highlight = ellipse(cx - 0.09 * s, cy - 0.06 * s, 0.06 * s, 0.035 * s);
      const line = `M ${cx - 0.24 * s} ${cy - 0.04 * s} L ${cx + 0.24 * s} ${cy - 0.04 * s} M ${cx} ${cy + 0.14 * s} L ${cx} ${cy + 0.28 * s}`;
      const top = `M ${cx - 0.2 * s} ${cy - 0.3 * s} Q ${cx} ${cy - 0.2 * s} ${cx + 0.2 * s} ${cy - 0.3 * s}`;
      return {
        glow: '#FFD21F',
        fills: [
          { path: body, color: '#FFD21F' },
          { path: knob, color: '#6A4A10' },
          { path: highlight, color: 'rgba(255,255,255,0.9)' },
        ],
        strokes: [
          { path: line, color: '#8A5E0C', width: 0.035 * s },
          { path: top, color: '#FF3030', width: 0.08 * s },
        ],
      };
    }
    case 'W': {
      const paper = `M ${cx - 0.26 * s} ${cy - 0.17 * s} L ${cx + 0.26 * s} ${cy - 0.17 * s} L ${cx + 0.26 * s} ${cy + 0.17 * s} L ${cx - 0.26 * s} ${cy + 0.17 * s} Z`;
      const rollL = `M ${cx - 0.35 * s} ${cy - 0.23 * s} L ${cx - 0.25 * s} ${cy - 0.23 * s} L ${cx - 0.25 * s} ${cy + 0.23 * s} L ${cx - 0.35 * s} ${cy + 0.23 * s} Z`;
      const rollR = `M ${cx + 0.25 * s} ${cy - 0.23 * s} L ${cx + 0.35 * s} ${cy - 0.23 * s} L ${cx + 0.35 * s} ${cy + 0.23 * s} L ${cx + 0.25 * s} ${cy + 0.23 * s} Z`;
      const seal = `M ${cx + 0.02 * s} ${cy + 0.17 * s} L ${cx + 0.06 * s} ${cy + 0.34 * s} L ${cx - 0.04 * s} ${cy + 0.3 * s} Z`;
      const lines = [-0.07, 0, 0.07]
        .map((dy) => `M ${cx - 0.16 * s} ${cy + dy * s} L ${cx + 0.16 * s} ${cy + dy * s}`)
        .join(' ');
      return {
        glow: '#C06BFF',
        fills: [
          { path: paper, color: '#FFF6DD' },
          { path: rollL, color: '#B45CFF' },
          { path: rollR, color: '#B45CFF' },
          { path: seal, color: '#FF3030' },
        ],
        strokes: [{ path: lines, color: '#5A3A2A', width: 0.03 * s }],
      };
    }
    case 'S': {
      const digit = `M ${cx - 0.22 * s} ${cy - 0.28 * s} L ${cx + 0.24 * s} ${cy - 0.28 * s} L ${cx - 0.02 * s} ${cy + 0.32 * s}`;
      return {
        glow: '#FF3030',
        fills: [],
        strokes: [
          { path: digit, color: '#FFE27A', width: 0.16 * s },
          { path: digit, color: '#FF2E2E', width: 0.11 * s },
        ],
      };
    }
    default:
      return null;
  }
}
