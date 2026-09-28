import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { SfxName } from '../game/sound';

const SOUND_FILES: Record<SfxName, number> = {
  lever: require('../assets/sounds/lever.wav'),
  stop: require('../assets/sounds/stop.wav'),
  win: require('../assets/sounds/win.wav'),
  hit: require('../assets/sounds/hit.wav'),
  heal: require('../assets/sounds/heal.wav'),
  guard: require('../assets/sounds/guard.wav'),
  fanfare: require('../assets/sounds/fanfare.wav'),
  damage: require('../assets/sounds/damage.wav'),
};

/**
 * 効果音の再生。効果音ごとにプレイヤーを事前に作っておき、
 * 鳴らすたびに先頭へ戻して再生する（停止音の遅延を減らすため）。
 */
export function useSound() {
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const playersRef = useRef<Partial<Record<SfxName, AudioPlayer>>>({});

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const players: Partial<Record<SfxName, AudioPlayer>> = {};
    (Object.keys(SOUND_FILES) as SfxName[]).forEach((name) => {
      const player = createAudioPlayer(SOUND_FILES[name]);
      player.volume = 0.7;
      players[name] = player;
    });
    playersRef.current = players;
    return () => {
      Object.values(players).forEach((p) => p?.remove());
      playersRef.current = {};
    };
  }, []);

  const play = useCallback((name: SfxName) => {
    if (mutedRef.current) return;
    const player = playersRef.current[name];
    if (!player) return;
    player.seekTo(0).catch(() => {});
    player.play();
  }, []);

  const toggleMuted = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
  }, []);

  return { play, muted, toggleMuted };
}
