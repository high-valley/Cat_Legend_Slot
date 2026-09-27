import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export interface PartyStatusProps {
  hp: number;
  maxHp: number;
  sacred: boolean;
  guard: boolean;
  assaultTurns: number;
  vulnerableTurns: number;
}

export function PartyStatus({ hp, maxHp, sacred, guard, assaultTurns, vulnerableTurns }: PartyStatusProps) {
  const low = hp / maxHp < 0.3;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>味方HP</Text>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${Math.max(0, (hp / maxHp) * 100)}%`, backgroundColor: low ? '#F2764A' : '#7FD6A0' },
            ]}
          />
        </View>
        <Text style={styles.value}>
          {Math.max(0, hp)}/{maxHp}
        </Text>
      </View>
      <View style={styles.chips}>
        {sacred && <Chip color="#FFE08A" text="聖旗：次の攻撃を無効" />}
        {guard && <Chip color={colors.guard} text="盾：被ダメ70%カット" />}
        {assaultTurns > 0 && <Chip color="#F2764A" text={`突撃 あと${assaultTurns}`} />}
        {vulnerableTurns > 0 && <Chip color={colors.skill} text={`無知の知 あと${vulnerableTurns}`} />}
      </View>
    </View>
  );
}

function Chip({ color, text }: { color: string; text: string }) {
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      <Text style={[styles.chipText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: colors.text, fontSize: 12, fontWeight: '800' },
  track: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0B0E22',
    borderWidth: 1,
    borderColor: colors.cabEdge,
    overflow: 'hidden',
  },
  fill: { height: '100%' },
  value: { color: colors.text, fontSize: 12, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, minHeight: 20 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 1,
    backgroundColor: '#0F1330',
  },
  chipText: { fontSize: 11, fontWeight: '800' },
});
