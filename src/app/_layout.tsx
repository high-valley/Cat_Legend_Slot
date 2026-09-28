import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../components/theme';
import { loadSkia } from '../components/loadSkia';

export default function RootLayout() {
  const [skiaState, setSkiaState] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    loadSkia().then(
      () => setSkiaState('ready'),
      () => setSkiaState('failed'),
    );
  }, []);

  if (skiaState !== 'ready') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {skiaState === 'loading' ? (
          <ActivityIndicator color={colors.gold} />
        ) : (
          <Text style={{ color: colors.text, textAlign: 'center', lineHeight: 22 }}>
            リールの描画エンジンを読み込めませんでした。{'\n'}ページを再読み込みしてください。
          </Text>
        )}
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.night },
        }}
      />
    </>
  );
}
