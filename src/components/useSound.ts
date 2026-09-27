import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
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
 * 効果音の再生。同時再生に対応するため、鳴らすたびに新しい Sound を作り、
 * 再生完了後に解放する。ミュート中は再生自体をスキップする。
 */
export function useSound() {
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const soundsRef = useRef<Audio.Sound[]>([]);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
    return () => {
      soundsRef.current.forEach((s) => {
        s.unloadAsync().catch(() => {});
      });
      soundsRef.current = [];
    };
  }, []);

  const play = useCallback((name: SfxName) => {
    if (mutedRef.current) return;
    Audio.Sound.createAsync(SOUND_FILES[name], { shouldPlay: true, volume: 0.7 })
      .then(({ sound }) => {
        soundsRef.current.push(sound);
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
            soundsRef.current = soundsRef.current.filter((s) => s !== sound);
          }
        });
      })
      .catch(() => {
        // 実機で音声デバイスが使えない場合などは無視する
      });
  }, []);

  const toggleMuted = useCallback(() => setMuted((m) => !m), []);

  return { play, muted, toggleMuted };
}
