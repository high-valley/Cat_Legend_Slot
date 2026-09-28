import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { CharacterDef } from '../game/characters';
import { CatPortrait } from './CatPortrait';
import { colors } from './theme';

export interface StopButtonProps {
  character: CharacterDef;
  isLeader: boolean;
  live: boolean;
  onPress: () => void;
}

/** 押した瞬間(onPressIn)に反応させる。実機での入力遅延を最小にするため。 */
export function StopButton({ character, isLeader, live, onPress }: StopButtonProps) {
  return (
    <Pressable
      onPressIn={onPress}
      style={({ pressed }) => [styles.btn, live && styles.live, pressed && styles.pressed]}
    >
      <CatPortrait id={character.id} size={36} />
      <Text style={[styles.name, live && styles.nameLive]}>{character.name}</Text>
      {isLeader && <Text style={styles.leaderTag}>リーダー</Text>}
      <Text style={[styles.stopLabel, live && styles.nameLive]}>STOP</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    backgroundColor: '#262B52',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 2,
  },
  live: {
    backgroundColor: colors.verm,
  },
  pressed: {
    transform: [{ translateY: 2 }],
  },
  name: { color: colors.text, fontSize: 11, fontWeight: '800' },
  nameLive: { color: '#fff' },
  leaderTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2A1E05',
    backgroundColor: colors.gold,
    borderRadius: 4,
    paddingHorizontal: 5,
  },
  stopLabel: { fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 1 },
});
