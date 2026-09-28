import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  BattleEvent,
  BattleState,
  CharacterId,
  Flag,
  FLAG_NOTICE,
  SymbolId,
  SYMBOLS,
  createBattleState,
  drawFlag,
  evaluateLines,
  getCharacter,
  getLeaderEffects,
  processTurn,
} from '../game';
import { usePartyStore } from '../store/partyStore';
import { ReelCanvas } from '../components/ReelCanvas';
import { useReelEngine } from '../components/useReelEngine';
import { Lcd, Popup } from '../components/Lcd';
import { PartyStatus } from '../components/PartyStatus';
import { StopButton } from '../components/StopButton';
import { Lever } from '../components/Lever';
import { SymbolIcon } from '../components/SymbolIcon';
import { ResultOverlay } from '../components/ResultOverlay';
import { useSound } from '../components/useSound';
import { colors } from '../components/theme';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const LEGEND: { sym: SymbolId; label: string }[] = [
  { sym: 'Z', label: '攻撃' },
  { sym: 'H', label: '回復' },
  { sym: 'G', label: '防御' },
  { sym: 'R', label: '再回転' },
  { sym: 'W', label: '連携技' },
  { sym: 'S', label: '必殺' },
];

export default function BattleScreen() {
  const router = useRouter();
  const { slots, leaderIndex, setLastResult } = usePartyStore();
  const partyConfig = useMemo(() => ({ slots, leaderIndex }), [slots, leaderIndex]);
  const leaderId = slots[leaderIndex];
  const leaderEffects = useMemo(() => getLeaderEffects(leaderId), [leaderId]);
  const reelSpeeds = useMemo(
    () => slots.map((id) => getCharacter(id).reelSpeed * leaderEffects.reelSpeedMult) as [number, number, number],
    [slots, leaderEffects],
  );

  const [battleState, setBattleState] = useState<BattleState>(() => createBattleState(partyConfig));
  const [phase, setPhase] = useState<'idle' | 'spin' | 'resolving'>('idle');
  const [flag, setFlag] = useState<Flag | null>(null);
  const [notice, setNotice] = useState<{ title: string } | null>(null);
  const [message, setMessage] = useState('レバーを押してスタート');
  const [popups, setPopups] = useState<Popup[]>([]);
  const [cutin, setCutin] = useState<CharacterId[] | null>(null);
  const [enemyAnim, setEnemyAnim] = useState<'idle' | 'hit' | 'attack' | 'dead'>('idle');
  const [winLive, setWinLive] = useState<Map<SymbolId, number[]> | null>(null);
  const [displayEnemyHp, setDisplayEnemyHp] = useState(battleState.enemy.hp);
  const [displayPartyHp, setDisplayPartyHp] = useState(battleState.hp);

  const battleStateRef = useRef(battleState);
  useEffect(() => {
    battleStateRef.current = battleState;
  }, [battleState]);
  const rngRef = useRef(Math.random);
  const popupIdRef = useRef(0);
  const [shakeX] = useState(() => new Animated.Value(0));
  const sound = useSound();

  const pushPopup = (text: string, heal = false) => {
    const id = popupIdRef.current++;
    setPopups((p) => [...p, { id, text, heal }]);
    setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 900);
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 5, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const healLabel = (source: 'fish' | CharacterId) =>
    source === 'fish' ? '魚' : `${getCharacter(source).name}「${getCharacter(source).skill.name}」`;

  async function runEvents(events: BattleEvent[], partySlots: CharacterId[]) {
    for (const ev of events) {
      switch (ev.type) {
        case 'miss':
          setMessage(ev.flag === 'S' ? '7をこぼした…' : ev.flag === 'W' ? '巻物をこぼした…' : 'ハズレ…');
          await sleep(600);
          break;
        case 'followUpPaw':
          setMessage(ev.flag === 'S' ? '7はこぼしたが、肉球でフォロー！' : '巻物はこぼしたが、肉球でフォロー！');
          await sleep(550);
          break;
        case 'lineWin':
          if (ev.symbol === 'S') {
            setMessage('目押し成功！ 7揃い！');
            setCutin(partySlots);
            sound.play('fanfare');
            await sleep(1250);
            setCutin(null);
          } else {
            const lb = ev.lineCount > 1 ? `（${ev.lineCount}ライン）` : '';
            setMessage(`${SYMBOLS[ev.symbol].name} 揃い！${lb}`);
          }
          break;
        case 'hit':
          sound.play('hit');
          setEnemyAnim('hit');
          setDisplayEnemyHp((h) => h - ev.amount);
          pushPopup(String(ev.amount));
          await sleep(650);
          setEnemyAnim('idle');
          break;
        case 'heal':
          sound.play('heal');
          setDisplayPartyHp((h) => Math.min(battleStateRef.current.maxHp, h + ev.amount));
          pushPopup(`+${ev.amount}`, true);
          setMessage(`${healLabel(ev.source)} HPが${ev.amount}回復`);
          await sleep(650);
          break;
        case 'guard':
          sound.play('guard');
          setMessage('盾 揃い！ 次の攻撃のダメージを70%カット');
          await sleep(700);
          break;
        case 'replay':
          sound.play('win');
          setMessage('鈴 揃い！ リプレイ、敵は動けない');
          await sleep(700);
          break;
        case 'skillChainStart':
          sound.play('win');
          setMessage('目押し成功！ 巻物 揃い！ 連携技発動');
          await sleep(650);
          break;
        case 'skill':
          setMessage(`${getCharacter(ev.charId).name}「${ev.name}」`);
          await sleep(650);
          break;
        case 'enemyDefeated':
          setEnemyAnim('dead');
          setMessage(`${battleStateRef.current.enemy.name}を倒した！`);
          sound.play('fanfare');
          await sleep(1100);
          break;
        case 'stageClear':
          setMessage('HPが30%回復。次の戦いへ！');
          break;
        case 'victory':
          break;
        case 'enemyAttack':
          setEnemyAnim('attack');
          await sleep(450);
          if (ev.nullified) {
            setMessage('聖旗の加護で攻撃を無効化！');
            sound.play('win');
          } else {
            setDisplayPartyHp((h) => h - ev.amount);
            setMessage(`${ev.amount}のダメージを受けた`);
            sound.play('damage');
            triggerShake();
          }
          setEnemyAnim('idle');
          await sleep(700);
          break;
        case 'bossAngry':
          setMessage('ラットキングが怒っている！ 攻撃が速くなった');
          break;
        case 'defeat':
          break;
      }
    }
  }

  async function runTurn(rows: [SymbolId[], SymbolId[], SymbolId[]], usedFlag: Flag) {
    setNotice(null);
    setWinLive(evaluateLines(rows));
    const { state: next, events } = processTurn(battleStateRef.current, usedFlag, rows, rngRef.current);
    await runEvents(events, battleStateRef.current.party.slots);
    setDisplayEnemyHp(next.enemy.hp);
    setDisplayPartyHp(next.hp);
    setBattleState(next);
    setWinLive(null);
    setFlag(null);
    if (next.result === 'ongoing') {
      setMessage('レバーを押そう');
      setPhase('idle');
    } else {
      setLastResult({
        won: next.result === 'win',
        stageReached: next.enemy.stageIndex + 1,
        turns: next.turn,
        aimHit: next.aimHit,
        aimTry: next.aimTry,
        totalDamage: next.totalDamage,
      });
      setPhase('idle');
    }
  }

  const reelEngine = useReelEngine({
    reelSpeeds,
    socrLeader: leaderId === 'socr',
    onAllStopped: (rows, usedFlag) => {
      setPhase('resolving');
      runTurn(rows, usedFlag);
    },
    onReelStopSound: () => sound.play('stop'),
  });

  const pullLever = () => {
    if (phase !== 'idle' || battleState.result !== 'ongoing') return;
    const f = drawFlag(rngRef.current, leaderId);
    setFlag(f);
    setPhase('spin');
    const noticeInfo = FLAG_NOTICE[f];
    setNotice(noticeInfo ? { title: noticeInfo.title } : null);
    setMessage(noticeInfo ? noticeInfo.sub : 'ストップで止めよう');
    sound.play('lever');
    reelEngine.lever(f);
  };

  const enemyVariant = (battleState.enemy.stageIndex % 3) as 0 | 1 | 2;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Animated.View style={[styles.body, { transform: [{ translateX: shakeX }] }]}>
        <View style={styles.topbar}>
          <Pressable style={styles.smallBtn} onPress={() => router.back()}>
            <Text style={styles.smallBtnText}>編成へ</Text>
          </Pressable>
          <Text style={styles.stageLbl}>第{battleState.enemy.stageIndex + 1}戦 / 3</Text>
          <Pressable style={styles.smallBtn} onPress={sound.toggleMuted}>
            <Text style={styles.smallBtnText}>音 {sound.muted ? 'OFF' : 'ON'}</Text>
          </Pressable>
        </View>

        <Lcd
          enemyName={battleState.enemy.name}
          enemyHp={displayEnemyHp}
          enemyMaxHp={battleState.enemy.maxHp}
          enemyVariant={enemyVariant}
          attackCount={battleState.enemy.count}
          attackInterval={battleState.enemy.angry ? 2 : battleState.enemy.interval}
          angry={battleState.enemy.angry}
          enemyAnim={enemyAnim}
          message={message}
          notice={notice}
          popups={popups}
          cutin={cutin}
        />

        <PartyStatus
          hp={displayPartyHp}
          maxHp={battleState.maxHp}
          sacred={battleState.status.sacred}
          guard={battleState.status.guard}
          assaultTurns={battleState.status.assaultTurns}
          vulnerableTurns={battleState.status.vulnerableTurns}
        />

        <View style={styles.reelBox}>
          <ReelCanvas
            reels={reelEngine.reels}
            activeFlag={phase === 'spin' ? flag : null}
            winLive={winLive}
            pulse={0.7 + 0.3 * Math.sin(reelEngine.frameTime / 90)}
          />
        </View>

        <View style={styles.legend}>
          {LEGEND.map((l) => (
            <View key={l.sym} style={styles.legendItem}>
              <SymbolIcon sym={l.sym} size={18} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.stops}>
          {slots.map((id, i) => (
            <StopButton
              key={id}
              character={getCharacter(id)}
              isLeader={leaderIndex === i}
              live={phase === 'spin' && reelEngine.isReelLive(i)}
              onPress={() => reelEngine.stopReel(i)}
            />
          ))}
        </View>

        <Lever disabled={phase !== 'idle' || battleState.result !== 'ongoing'} onPress={pullLever} />
      </Animated.View>

      {battleState.result !== 'ongoing' && (
        <ResultOverlay
          won={battleState.result === 'win'}
          stageReached={battleState.enemy.stageIndex + 1}
          turns={battleState.turn}
          aimHit={battleState.aimHit}
          aimTry={battleState.aimTry}
          totalDamage={battleState.totalDamage}
          onBackToParty={() => router.back()}
          onRetry={() => {
            const fresh = createBattleState(partyConfig);
            setBattleState(fresh);
            setDisplayEnemyHp(fresh.enemy.hp);
            setDisplayPartyHp(fresh.hp);
            setMessage('レバーを押してスタート');
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night },
  content: { padding: 12 },
  body: { gap: 8 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallBtn: {
    borderWidth: 1.5,
    borderColor: colors.cabEdge,
    backgroundColor: '#0F1330',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  smallBtnText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  stageLbl: { color: colors.gold, fontWeight: '800', fontSize: 14 },
  reelBox: {
    backgroundColor: '#0A0C1C',
    borderRadius: 14,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.goldDeep,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  legendText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  stops: { flexDirection: 'row', gap: 8 },
});
