import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CHARACTERS, CharacterId, getCharacter } from '../game/characters';
import { SYMBOLS } from '../game/constants';
import { usePartyStore } from '../store/partyStore';
import { CatPortrait } from '../components/CatPortrait';
import { SymbolIcon } from '../components/SymbolIcon';
import { colors } from '../components/theme';

const RARITY_COLORS: Record<string, string> = {
  SSR: '#E3B34C',
  SR: '#B8C0D8',
  R: '#8C6A48',
};

export default function PartyScreen() {
  const router = useRouter();
  const { slots, leaderIndex, setSlot, setLeader } = usePartyStore();
  const [selectedSlot, setSelectedSlot] = useState<0 | 1 | 2>(0);

  const leader = getCharacter(slots[leaderIndex]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.marquee}>
        <Text style={styles.logo}>ニャンスロ戦記</Text>
        <Text style={styles.logoSub}>猫と偉人の目押しスロットRPG</Text>
      </View>

      <Text style={styles.panelTitle}>編成　<Text style={styles.panelHint}>リールを選んでから、下のキャラをタップ</Text></Text>

      <View style={styles.slots}>
        {slots.map((id, i) => {
          const c = getCharacter(id);
          const isSel = selectedSlot === i;
          return (
            <Pressable
              key={i}
              style={[styles.slot, isSel && styles.slotSel]}
              onPress={() => setSelectedSlot(i as 0 | 1 | 2)}
            >
              <Text style={styles.slotLabel}>リール{i + 1}</Text>
              <CatPortrait id={id} size={56} />
              <Text style={styles.slotName}>{c.name}</Text>
              <Pressable
                style={[styles.crown, leaderIndex === i && styles.crownOn]}
                onPress={() => setLeader(i as 0 | 1 | 2)}
              >
                <Text style={[styles.crownText, leaderIndex === i && styles.crownTextOn]}>
                  {leaderIndex === i ? '★ リーダー' : 'リーダーにする'}
                </Text>
              </Pressable>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.leaderBox}>
        <Text style={styles.leaderBoxText}>
          リーダースキル <Text style={styles.leaderBoxName}>「{leader.leaderSkill.name}」</Text>
          {leader.leaderSkill.description}
        </Text>
      </View>

      <View style={styles.roster}>
        {CHARACTERS.map((c) => {
          const atSlot = slots.indexOf(c.id);
          return (
            <Pressable
              key={c.id}
              style={[styles.card, atSlot >= 0 && styles.cardInUse]}
              onPress={() => {
                setSlot(selectedSlot, c.id);
                setSelectedSlot(((selectedSlot + 1) % 3) as 0 | 1 | 2);
              }}
            >
              {atSlot >= 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>リール{atSlot + 1}</Text>
                </View>
              )}
              <View style={styles.cardHead}>
                <CatPortrait id={c.id} size={44} />
                <View style={{ flex: 1 }}>
                  <View style={[styles.rarity, { backgroundColor: RARITY_COLORS[c.rarity] }]}>
                    <Text style={styles.rarityText}>{c.rarity}</Text>
                  </View>
                  <Text style={styles.cardName}>{c.name}</Text>
                  <Text style={styles.cardBase}>{c.origin}</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.statText}>攻撃 {c.atk}</Text>
                <Text style={styles.statText}>HP {c.hp}</Text>
                <Text style={styles.statText}>速度 {c.reelSpeed}</Text>
              </View>
              <Text style={styles.skillText}>
                <Text style={styles.skillName}>技「{c.skill.name}」</Text> {c.skill.description}
              </Text>
              <Text style={styles.skillText}>
                <Text style={styles.leaderSkillName}>リーダー「{c.leaderSkill.name}」</Text> {c.leaderSkill.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.howto}>
        <HowToLine text="レバーで3本のリールが回ります。各リールは20コマ、盤面には3コマ見えています。" />
        <View style={styles.howtoRow}>
          <Text style={styles.howtoText}>
            図柄は最大4コマすべって引き込みます。押す位置が遠いとこぼすことがあります。
          </Text>
        </View>
        <View style={styles.legendRow}>
          {(['Z', 'H', 'G', 'R'] as const).map((s) => (
            <View key={s} style={styles.legendItem}>
              <SymbolIcon sym={s} size={20} />
              <Text style={styles.legendText}>{SYMBOLS[s].effect}</Text>
            </View>
          ))}
        </View>
        <HowToLine text="リプレイとハズレ以外は、液晶に「〇〇を狙え！」が出ます。狙う図柄だけが光って見えます。" />
        <HowToLine text="「肉球か盾を狙え！」はどちらか好きな方を狙えます。魚は「魚を狙え！」のときだけです。" />
        <HowToLine text="7と巻物は低確率のレア役です。7は各リールに1個、巻物は2個だけなので、しっかり目押ししましょう。" />
        <HowToLine text="5ライン（横3本・斜め2本）のどれかでそろえば成立。敵の攻撃カウントが0になる前に倒しましょう。" />
      </View>

      <Pressable style={styles.bigBtn} onPress={() => router.push('/battle')}>
        <Text style={styles.bigBtnText}>出陣する</Text>
      </Pressable>
    </ScrollView>
  );
}

function HowToLine({ text }: { text: string }) {
  return (
    <View style={styles.howtoRow}>
      <Text style={styles.howtoDot}>・</Text>
      <Text style={styles.howtoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  marquee: { alignItems: 'center', paddingVertical: 6 },
  logo: { fontSize: 28, fontWeight: '800', color: colors.gold, letterSpacing: 1 },
  logoSub: { fontSize: 11, color: colors.muted, letterSpacing: 2, marginTop: 4 },
  panelTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  panelHint: { fontSize: 11, color: colors.muted, fontWeight: '400' },
  slots: { flexDirection: 'row', gap: 8 },
  slot: {
    flex: 1,
    backgroundColor: '#0F1330',
    borderWidth: 2,
    borderColor: colors.cabEdge,
    borderRadius: 14,
    padding: 8,
    alignItems: 'center',
    gap: 4,
  },
  slotSel: { borderColor: colors.gold },
  slotLabel: { fontSize: 10, fontWeight: '800', color: colors.muted, letterSpacing: 1 },
  slotName: { fontSize: 12, fontWeight: '800', color: colors.text },
  crown: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.cabEdge,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  crownOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  crownText: { fontSize: 10, fontWeight: '800', color: colors.muted },
  crownTextOn: { color: '#2A1E05' },
  leaderBox: {
    backgroundColor: 'rgba(227,179,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(227,179,76,0.35)',
    borderRadius: 12,
    padding: 10,
  },
  leaderBoxText: { color: colors.text, fontSize: 13 },
  leaderBoxName: { color: colors.gold, fontWeight: '800' },
  roster: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    width: '48%',
    backgroundColor: '#12173A',
    borderWidth: 1.5,
    borderColor: colors.cabEdge,
    borderRadius: 14,
    padding: 10,
    gap: 6,
  },
  cardInUse: { borderColor: 'rgba(227,179,76,0.6)' },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.gold,
    borderRadius: 6,
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#2A1E05' },
  cardHead: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rarity: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6 },
  rarityText: { fontSize: 10, fontWeight: '800', color: '#3A2600' },
  cardName: { fontSize: 13, fontWeight: '800', color: colors.text },
  cardBase: { fontSize: 10, color: colors.muted },
  statsRow: { flexDirection: 'row', gap: 10 },
  statText: { fontSize: 11, color: colors.text, fontWeight: '700' },
  skillText: { fontSize: 11, color: colors.text, lineHeight: 15 },
  skillName: { color: colors.skill, fontWeight: '800' },
  leaderSkillName: { color: colors.gold, fontWeight: '800' },
  howto: {
    backgroundColor: '#0F1330',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  howtoRow: { flexDirection: 'row', gap: 4 },
  howtoDot: { color: colors.gold, fontWeight: '800' },
  howtoText: { flex: 1, fontSize: 12, color: colors.muted, lineHeight: 17 },
  legendRow: { flexDirection: 'row', gap: 12, paddingLeft: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legendText: { fontSize: 11, color: colors.muted, fontWeight: '700' },
  bigBtn: {
    backgroundColor: colors.gold,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bigBtnText: { fontSize: 20, fontWeight: '800', letterSpacing: 2, color: '#2A1E05' },
});
