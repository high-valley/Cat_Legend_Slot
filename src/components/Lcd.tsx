import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { CharacterId } from '../game/characters';
import { CatPortrait, RatPortrait } from './CatPortrait';
import { colors } from './theme';

export interface Popup {
  id: number;
  text: string;
  heal: boolean;
}

export interface LcdProps {
  enemyName: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyVariant: 0 | 1 | 2;
  attackCount: number;
  attackInterval: number;
  angry: boolean;
  enemyAnim: 'idle' | 'hit' | 'attack' | 'dead';
  message: string;
  notice: { title: string } | null;
  popups: Popup[];
  cutin: CharacterId[] | null;
}

export function Lcd({
  enemyName,
  enemyHp,
  enemyMaxHp,
  enemyVariant,
  attackCount,
  attackInterval,
  angry,
  enemyAnim,
  message,
  notice,
  popups,
  cutin,
}: LcdProps) {
  const shakeX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (enemyAnim === 'hit') {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: -7, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    } else if (enemyAnim === 'attack') {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (enemyAnim === 'dead') {
      Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }).start();
    } else {
      opacity.setValue(1);
      scale.setValue(1);
    }
  }, [enemyAnim]);

  const pips = attackCount > 0 ? '●'.repeat(Math.max(0, attackCount)) + '○'.repeat(Math.max(0, attackInterval - attackCount)) : '!!';

  return (
    <View style={[styles.lcd, angry && styles.lcdAngry]}>
      <View style={styles.ehead}>
        <Text style={styles.eName}>{enemyName}</Text>
        <Text style={styles.eHpTxt}>
          HP {Math.max(0, enemyHp)}/{enemyMaxHp}
        </Text>
      </View>
      <View style={styles.ehpTrack}>
        <View style={[styles.ehpFill, { width: `${Math.max(0, (enemyHp / enemyMaxHp) * 100)}%` }]} />
      </View>
      <Animated.View
        style={[
          styles.enemyWrap,
          { transform: [{ translateX: shakeX }, { scale }], opacity },
        ]}
      >
        <RatPortrait variant={enemyVariant} size={84} />
      </Animated.View>
      <View style={styles.count}>
        <Text style={styles.countLabel}>攻撃まで</Text>
        <Text style={styles.pips}>{pips}</Text>
      </View>
      {notice && (
        <View style={styles.noticeWrap}>
          <Text style={styles.notice}>{notice.title}</Text>
        </View>
      )}
      {popups.map((p) => (
        <Text key={p.id} style={[styles.pop, p.heal && styles.popHeal]}>
          {p.text}
        </Text>
      ))}
      {cutin && (
        <View style={styles.cutin}>
          <View style={styles.cutinRow}>
            {cutin.map((id) => (
              <CatPortrait key={id} id={id} size={56} />
            ))}
          </View>
          <Text style={styles.cutinText}>必殺・天下三猫撃</Text>
        </View>
      )}
      <View style={styles.msg}>
        <Text style={styles.msgText} numberOfLines={1}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lcd: {
    aspectRatio: 16 / 11,
    width: '100%',
    backgroundColor: colors.lcd,
    borderRadius: 12,
    borderWidth: 6,
    borderColor: '#06080F',
    overflow: 'hidden',
    position: 'relative',
  },
  lcdAngry: {
    backgroundColor: colors.angryBg,
  },
  ehead: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eName: { color: colors.lcdGlow, fontWeight: '800', fontSize: 13 },
  eHpTxt: { color: colors.lcdGlow, fontSize: 12 },
  ehpTrack: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 30,
    height: 9,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.lcdDim,
    overflow: 'hidden',
  },
  ehpFill: { height: '100%', backgroundColor: '#F2B04A' },
  enemyWrap: {
    position: 'absolute',
    left: '50%',
    top: '48%',
    marginLeft: -42,
    marginTop: -42,
  },
  count: {
    position: 'absolute',
    right: 10,
    bottom: 36,
    alignItems: 'flex-end',
  },
  countLabel: { color: colors.lcdGlow, fontSize: 11 },
  pips: { color: '#F2B04A', fontSize: 15, letterSpacing: 2 },
  noticeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 44,
    alignItems: 'center',
  },
  notice: {
    color: '#FFE08A',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pop: {
    position: 'absolute',
    left: '50%',
    top: '38%',
    color: '#FFF2C0',
    fontSize: 26,
    fontWeight: '800',
    transform: [{ translateX: -20 }],
  },
  popHeal: { color: '#C8FFD9' },
  cutin: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#B42F1E',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cutinRow: { flexDirection: 'row', gap: 4 },
  cutinText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  msg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(143,232,214,0.25)',
    minHeight: 30,
  },
  msgText: { color: colors.lcdGlow, fontSize: 13 },
});
