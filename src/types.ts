export type AppTab = 'home' | 'chat' | 'games' | 'draw' | 'magic';

export type LanguageCode = 'es' | 'en' | 'pt';

export interface Letter {
  id: string;
  sender: 'me' | 'partner';
  title: string;
  content: string;
  paperStyle: string; // 'parchment' | 'midnight' | 'rose' | 'minimal'
  timestamp: string;
}

export interface Gift {
  id: string;
  sender: 'me' | 'partner';
  title: string;
  desc: string;
  image: string;
  boxStyle: string; // 'gold' | 'red' | 'galaxy'
  timestamp: string;
  unwrapped: boolean;
}

export interface CoupleState {
  meName: string;
  meAvatar: string;
  partnerName: string;
  partnerAvatar: string;
  warmth: number;
  streak: number;
  lastPlayedSongTime: string;
  songPlaying: boolean;
  whispersCount: number;
  chatMessages: ChatMessage[];
  lastInteractionType: 'nudge' | 'kiss' | 'share' | null;
  lastInteractionTime: string | null;
  letters?: Letter[];
  gifts?: Gift[];
  mePoints?: number;
  partnerPoints?: number;
  linkedSpotifyUrl?: string;
  commonItems?: {
    id: string;
    category: string;
    text: string;
    matched: boolean;
    addedBy?: string;
    userTasteId?: string;
    partnerTasteId?: string;
  }[];
  memories?: SharedMemory[];
  meBirthday?: string;
  partnerBirthday?: string;
  partnerLat?: number;
  partnerLng?: number;
  partnerLocationUpdatedAt?: number;
  partnerEmail?: string;
  meLat?: number;
  meLng?: number;
  meGpsConsent?: boolean;
  partnerGpsConsent?: boolean;
  coupleId?: string;
  chatTheme?: string;
  celebrations?: {
    id: string;
    title: string;
    date: string; // MM-DD
    type: 'birthday' | 'holiday' | 'custom';
    owner?: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'partner' | 'system';
  text: string;
  timestamp: string;
  isAudio?: boolean;
  audioUrl?: string; // Base64 or ObjectURL
  audioDuration?: number;
  isPhoto?: boolean;
  photoUrl?: string; // Base64 string etc.
  emoji?: string;
  seen?: boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number; // Partner's answer
}

export interface TruthDareCard {
  id: string;
  type: 'truth' | 'dare';
  text: string;
}

export interface SharedMemory {
  id: string;
  titleKey: string;
  titleDefault: string;
  image: string;
  style: string;
  date: string;
  isUpload?: boolean;
  desc?: string;
}

export interface DateIdea {
  id: string;
  titleKey: string;
  titleDefault: string;
  icon: string;
  descKey: string;
  descDefault: string;
  image: string;
  isNew?: boolean;
  titleEs?: string;
  titleEn?: string;
  descEs?: string;
  descEn?: string;
}
