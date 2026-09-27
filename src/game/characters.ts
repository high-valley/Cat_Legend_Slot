export type CharacterId = 'nobu' | 'napo' | 'jean' | 'himi' | 'newt' | 'socr';

export type Rarity = 'SSR' | 'SR' | 'R';

export interface CharacterSkill {
  name: string;
  description: string;
}

export interface CharacterLeaderSkill {
  name: string;
  description: string;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  origin: string;
  rarity: Rarity;
  atk: number;
  hp: number;
  /** 1秒あたりに通過するコマ数 */
  reelSpeed: number;
  skill: CharacterSkill;
  leaderSkill: CharacterLeaderSkill;
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'nobu',
    name: 'ノブニャガ',
    origin: '黒猫 × 織田信長',
    rarity: 'SSR',
    atk: 34,
    hp: 90,
    reelSpeed: 20,
    skill: { name: '三段撃ち', description: '自分の攻撃力 × 3 のダメージ' },
    leaderSkill: { name: '天下布武', description: '全員の攻撃力 1.5倍' },
  },
  {
    id: 'napo',
    name: 'ナポニャオン',
    origin: 'ペルシャ × ナポレオン',
    rarity: 'SSR',
    atk: 30,
    hp: 100,
    reelSpeed: 19,
    skill: { name: '突撃命令', description: '3ターンの間、肉球と7のダメージ2倍' },
    leaderSkill: { name: '余の辞書', description: '7の当選確率 2倍' },
  },
  {
    id: 'jean',
    name: 'ニャンヌ',
    origin: '白猫 × ジャンヌ・ダルク',
    rarity: 'SR',
    atk: 22,
    hp: 125,
    reelSpeed: 17,
    skill: { name: '聖旗の加護', description: '次の敵の攻撃を無効化＋最大HPの10%回復' },
    leaderSkill: { name: '救国の旗', description: '最大HP 1.3倍' },
  },
  {
    id: 'himi',
    name: 'ヒミコ',
    origin: '三毛猫 × 卑弥呼',
    rarity: 'SR',
    atk: 18,
    hp: 110,
    reelSpeed: 16,
    skill: { name: '鬼道', description: '最大HPの35%回復' },
    leaderSkill: { name: 'まじない', description: '回復量 1.5倍' },
  },
  {
    id: 'newt',
    name: 'ニュートニャン',
    origin: '茶トラ × ニュートン',
    rarity: 'R',
    atk: 16,
    hp: 100,
    reelSpeed: 14,
    skill: { name: '万有引力', description: '敵の攻撃カウント +2、自分の攻撃力 × 1 のダメージ' },
    leaderSkill: { name: 'ゆっくり落ちるリンゴ', description: '全リールの速度 25%ダウン' },
  },
  {
    id: 'socr',
    name: 'ソクラニャス',
    origin: 'スコティッシュ × ソクラテス',
    rarity: 'R',
    atk: 14,
    hp: 95,
    reelSpeed: 13,
    skill: { name: '無知の知', description: '3ターンの間、敵の被ダメージ1.5倍' },
    leaderSkill: {
      name: '問答法',
      description: '7と巻物の告知時に最大5コマ滑る。全リールの速度 15%ダウン',
    },
  },
];

const CHARACTER_MAP: Record<CharacterId, CharacterDef> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
) as Record<CharacterId, CharacterDef>;

export function getCharacter(id: CharacterId): CharacterDef {
  const c = CHARACTER_MAP[id];
  if (!c) throw new Error(`unknown character id: ${id}`);
  return c;
}

export interface LeaderEffects {
  /** 全員の攻撃力倍率（ノブニャガ） */
  atkMult: number;
  /** 最大HP倍率（ニャンヌ） */
  hpMult: number;
  /** 回復量倍率（ヒミコ） */
  healMult: number;
  /** 全リールの速度倍率（ニュートニャン・ソクラニャス） */
  reelSpeedMult: number;
  /** 7の当選確率2倍（ナポニャオン） */
  sevenBoost: boolean;
  /** 7・巻物告知時の最大滑りコマ数への追加分（ソクラニャス） */
  aimExtraSlip: number;
}

export function getLeaderEffects(leaderId: CharacterId): LeaderEffects {
  return {
    atkMult: leaderId === 'nobu' ? 1.5 : 1,
    hpMult: leaderId === 'jean' ? 1.3 : 1,
    healMult: leaderId === 'himi' ? 1.5 : 1,
    reelSpeedMult: leaderId === 'newt' ? 0.75 : leaderId === 'socr' ? 0.85 : 1,
    sevenBoost: leaderId === 'napo',
    aimExtraSlip: leaderId === 'socr' ? 1 : 0,
  };
}
