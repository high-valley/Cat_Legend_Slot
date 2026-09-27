import { STRIPS, LINES, evaluateLines, rowsAt, mod } from '../reels';
import { REEL_STRIP_LENGTH } from '../constants';

describe('reels: リール配列', () => {
  it('各リールは20コマである', () => {
    STRIPS.forEach((strip) => {
      expect(strip).toHaveLength(REEL_STRIP_LENGTH);
    });
  });

  it('図柄の内訳が仕様どおり（肉球3・盾3・魚3・鈴4・巻物2・7が1・ブランク4）', () => {
    STRIPS.forEach((strip) => {
      const count = (id: string) => strip.filter((s) => s === id).length;
      expect(count('Z')).toBe(3);
      expect(count('G')).toBe(3);
      expect(count('H')).toBe(3);
      expect(count('R')).toBe(4);
      expect(count('W')).toBe(2);
      expect(count('S')).toBe(1);
      expect(count('B')).toBe(4);
    });
  });

  it('mod は負の数でも正しく巡回する', () => {
    expect(mod(-1, 20)).toBe(19);
    expect(mod(20, 20)).toBe(0);
    expect(mod(21, 20)).toBe(1);
  });

  it('rowsAt は上段・中段・下段の3コマを返す', () => {
    expect(rowsAt(0, 0)).toEqual(['S', 'B', 'Z']);
    expect(rowsAt(0, 19)).toEqual(['W', 'S', 'B']);
  });
});

describe('reels: ライン判定', () => {
  it('5ラインすべてを判定できる', () => {
    expect(LINES).toHaveLength(5);
    // 全リールとも同じ図柄で埋めれば5ラインすべて成立する
    const placed = [
      ['Z', 'Z', 'Z'],
      ['Z', 'Z', 'Z'],
      ['Z', 'Z', 'Z'],
    ] as const;
    const live = evaluateLines(placed as any);
    expect(live.get('Z')).toHaveLength(5);
  });

  it('ブランクを含むラインは成立しない', () => {
    const placed = [
      ['Z', 'Z', 'Z'],
      ['Z', 'B', 'Z'],
      ['Z', 'Z', 'Z'],
    ] as const;
    const live = evaluateLines(placed as any);
    // 中段(1)はブランクを含むので成立しない。上段(0)・下段(2)は成立する。
    expect(live.get('Z')).toEqual([0, 2]);
  });

  it('図柄が異なる場合は成立しない', () => {
    const placed = [
      ['Z', 'B', 'B'],
      ['H', 'B', 'B'],
      ['G', 'B', 'B'],
    ] as const;
    const live = evaluateLines(placed as any);
    expect(live.size).toBe(0);
  });

  it('右下がり・右上がりラインを判定できる', () => {
    // 右下がり: リール1の上段, リール2の中段, リール3の下段
    const placed = [
      ['R', 'B', 'B'],
      ['B', 'R', 'B'],
      ['B', 'B', 'R'],
    ] as const;
    const live = evaluateLines(placed as any);
    expect(live.get('R')).toEqual([3]);
  });

  it('未停止のリール（null）を含むラインは未評価だが、テンパイ中の判定には使える', () => {
    const placed = [['Z', 'B', 'Z'], null, null] as const;
    const live = evaluateLines(placed as any);
    // リール1だけでも、そのコマを参照するライン（上段・下段・斜め2本）は
    // 「テンパイ中」として成立扱いになる。中段はブランクなので不成立。
    expect(live.get('Z')).toEqual([0, 2, 3, 4]);
  });
});
