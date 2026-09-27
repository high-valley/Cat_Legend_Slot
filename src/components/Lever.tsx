import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from './theme';

export function Lever({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      disabled={disabled}
      onPressIn={onPress}
      style={({ pressed }) => [styles.btn, disabled && styles.disabled, pressed && styles.pressed]}
    >
      <Text style={styles.label}>レバー</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.gold,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ translateY: 3 }],
  },
  label: {
    fontFamily: undefined,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#2A1E05',
  },
});
