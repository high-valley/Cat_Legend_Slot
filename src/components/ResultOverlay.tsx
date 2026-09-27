import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export interface ResultOverlayProps {
  won: boolean;
  stageReached: number;
  turns: number;
  aimHit: number;
  aimTry: number;
  totalDamage: number;
  onBackToParty: () => void;
  onRetry: () => void;
}

export function ResultOverlay({
  won,
  stageReached,
  turns,
  aimHit,
  aimTry,
  totalDamage,
  onBackToParty,
  onRetry,
}: ResultOverlayProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={[styles.title, !won && styles.titleLose]}>{won ? '全勝！' : '敗北…'}</Text>
        <View style={styles.stats}>
          <StatRow label="到達" value={`第${stageReached}戦`} />
          <StatRow label="ターン数" value={String(turns)} />
          <StatRow label="目押し成功" value={`${aimHit} / ${aimTry}`} />
          <StatRow label="与えたダメージ" value={String(totalDamage)} />
        </View>
        <View style={styles.btns}>
          <Pressable style={styles.btn} onPress={onBackToParty}>
            <Text style={styles.btnText}>編成を変える</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onRetry}>
            <Text style={[styles.btnText, styles.btnTextPrimary]}>もう一度</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6,8,18,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.cab,
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  title: { fontSize: 34, fontWeight: '800', color: colors.gold, textAlign: 'center' },
  titleLose: { color: '#9FA6D6' },
  stats: { gap: 6 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { color: colors.muted },
  statValue: { color: colors.text, fontWeight: '800' },
  btns: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.cabEdge,
    backgroundColor: '#0F1330',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: colors.gold, borderColor: colors.gold },
  btnText: { color: colors.text, fontWeight: '800' },
  btnTextPrimary: { color: '#2A1E05' },
});
