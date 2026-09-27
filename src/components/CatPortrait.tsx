import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CharacterId } from '../game/characters';
import { CHAR_ACCENT, CHAR_FUR } from './theme';

/**
 * キャラクターの顔アイコン。
 * 現状はプレースホルダー（毛色 + アクセントカラーの円）で表現しているが、
 * 本実装で画像素材（3.4節）に差し替えられるよう、このコンポーネントの
 * 見た目だけを差し替えれば済むようにしている。
 */
export function CatPortrait({ id, size = 48 }: { id: CharacterId; size?: number }) {
  const fur = CHAR_FUR[id] ?? '#CCCCCC';
  const accent = CHAR_ACCENT[id] ?? '#888888';
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.ear,
          { left: size * 0.02, top: -size * 0.06, borderBottomColor: fur, borderBottomWidth: size * 0.32 },
        ]}
      />
      <View
        style={[
          styles.ear,
          { right: size * 0.02, top: -size * 0.06, borderBottomColor: fur, borderBottomWidth: size * 0.32 },
        ]}
      />
      <View
        style={[
          styles.face,
          { width: size * 0.86, height: size * 0.86, borderRadius: size * 0.43, backgroundColor: fur, left: size * 0.07, top: size * 0.12 },
        ]}
      >
        <View style={[styles.accentBadge, { backgroundColor: accent, width: size * 0.3, height: size * 0.14, borderRadius: size * 0.07 }]} />
        <View style={styles.eyesRow}>
          <View style={[styles.eye, { width: size * 0.09, height: size * 0.11 }]} />
          <View style={[styles.eye, { width: size * 0.09, height: size * 0.11 }]} />
        </View>
      </View>
    </View>
  );
}

export function RatPortrait({ variant, size = 64 }: { variant: 0 | 1 | 2; size?: number }) {
  const fur = ['#C4BDB1', '#6A6570', '#8A7D96'][variant];
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.8,
          height: size * 0.7,
          borderRadius: size * 0.35,
          backgroundColor: fur,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={styles.eyesRow}>
          <View style={[styles.eye, { width: size * 0.08, height: size * 0.1, backgroundColor: '#1A1A22' }]} />
          <View style={[styles.eye, { width: size * 0.08, height: size * 0.1, backgroundColor: '#1A1A22' }]} />
        </View>
        {variant === 2 && <Text style={styles.crown}>♛</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ear: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  face: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentBadge: {
    position: 'absolute',
    top: '8%',
  },
  eyesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  eye: {
    backgroundColor: '#1A1A22',
    borderRadius: 100,
  },
  crown: {
    position: 'absolute',
    top: -14,
    color: '#E3B34C',
    fontSize: 16,
  },
});
