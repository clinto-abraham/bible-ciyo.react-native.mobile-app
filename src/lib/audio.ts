import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LANGUAGE_LOCALES: Record<string, { bcp47: string[]; label: string }> = {
  hebrew: { bcp47: ['he-IL', 'he', 'iw-IL', 'iw'], label: 'Hebrew' },
  english: { bcp47: ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'en'], label: 'English (KJV)' },
  'english-bsb': { bcp47: ['en-US', 'en-GB', 'en-AU', 'en'], label: 'English (BSB)' },
  'english-ylt': { bcp47: ['en-GB', 'en-US', 'en'], label: 'English (YLT)' },
  malayalam: { bcp47: ['ml-IN', 'ml', 'hi-IN', 'en-IN'], label: 'Malayalam' },
  greek: { bcp47: ['el-GR', 'el'], label: 'Koine Greek' },
  aramaic: { bcp47: ['syr', 'ar-XA', 'ar-SY', 'ar-SA', 'he-IL'], label: 'Syriac Aramaic' },
  latin: { bcp47: ['it-IT', 'la', 'es-ES'], label: 'Latin' },
  german: { bcp47: ['de-DE', 'de-AT', 'de'], label: 'German' },
  french: { bcp47: ['fr-FR', 'fr-CA', 'fr'], label: 'French' },
  spanish: { bcp47: ['es-ES', 'es-MX', 'es-US', 'es'], label: 'Spanish' },
  russian: { bcp47: ['ru-RU', 'ru'], label: 'Russian' },
  chinese: { bcp47: ['zh-CN', 'zh-TW', 'zh-HK', 'zh'], label: 'Chinese' },
  burmese: { bcp47: ['my-MM', 'my'], label: 'Burmese' },
  slavic: { bcp47: ['ru-RU', 'uk-UA', 'bg-BG'], label: 'Church Slavonic' },
};

export const NOVELTY_VOICE_NAMES = [
  'whisper', 'deranged', 'zarvox', 'trinoids', 'bad news', 'good news',
  'hysterical', 'pipe organ', 'bubbles', 'bells', 'boing', 'cellos',
  'albert', 'bahh', 'fred', 'junior', 'ralph', 'princess', 'organ', 'wobble',
];

const FEMALE_VOICE_PATTERNS = [
  'female', 'woman', 'girl', 'samantha', 'karen', 'victoria', 'moira',
  'tessa', 'serena', 'ava', 'allison', 'kate', 'susan', 'zira', 'jenny',
  'aria', 'carmit', 'lekha', 'helena', 'laura', 'monica', 'paulina',
  'milena', 'alva', 'klara', 'mariya', 'elena', 'damayanti', 'kanya',
  'kyoko', 'yuna', 'ting-ting', 'sin-ji', 'meijia', 'veena', 'ananya',
  'priya', 'nita', 'kavya', 'shreya', 'fiona',
];

const MALE_VOICE_PATTERNS = [
  'male', 'man', 'boy', 'alex', 'daniel', 'oliver', 'tom', 'jamie',
  'george', 'david', 'guy', 'mark', 'richard', 'diego', 'jorge',
  'thomas', 'yannick', 'martin', 'stefan', 'mikhail', 'yuri',
  'kazuhiro', 'tarik', 'rishi', 'anil', 'ravi', 'asaf',
];

export type VoiceGender = 'auto' | 'female' | 'male';

export interface AudioSettings {
  gender: VoiceGender;
  rate: number;
  preferredVoiceIdentifier?: string | null;
}

const SETTINGS_STORAGE_KEY = 'bible_audio_settings';
const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  gender: 'auto',
  rate: 0.92,
  preferredVoiceIdentifier: null,
};

let cachedAudioSettings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
const settingsListeners = new Set<(s: AudioSettings) => void>();

export function subscribeAudioSettings(listener: (s: AudioSettings) => void): () => void {
  settingsListeners.add(listener);
  return () => settingsListeners.delete(listener);
}

export async function getStoredAudioSettings(): Promise<AudioSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AudioSettings>;
      cachedAudioSettings = {
        gender: parsed.gender || 'auto',
        rate: parsed.rate || 0.92,
        preferredVoiceIdentifier: parsed.preferredVoiceIdentifier || null,
      };
      return cachedAudioSettings;
    }
  } catch {
    // ignore
  }
  return cachedAudioSettings;
}

export async function saveAudioSettings(settings: Partial<AudioSettings>): Promise<AudioSettings> {
  const current = await getStoredAudioSettings();
  const updated: AudioSettings = { ...current, ...settings };
  cachedAudioSettings = updated;
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  settingsListeners.forEach((fn) => fn(updated));
  return updated;
}

export function detectVoiceGender(voice: Speech.Voice): 'female' | 'male' | 'unknown' {
  const lowerName = (voice.name || '').toLowerCase();
  for (const f of FEMALE_VOICE_PATTERNS) {
    if (lowerName.includes(f)) return 'female';
  }
  for (const m of MALE_VOICE_PATTERNS) {
    if (lowerName.includes(m)) return 'male';
  }
  return 'unknown';
}

export function isNoveltyVoice(voice: Speech.Voice): boolean {
  const lowerName = (voice.name || '').toLowerCase();
  return NOVELTY_VOICE_NAMES.some((n) => lowerName.includes(n));
}

export function isNativeVoiceForLanguage(voice: Speech.Voice, langId: string): boolean {
  const l = (voice.language || '').toLowerCase().replace(/_/g, '-');
  const n = (voice.name || '').toLowerCase();

  if (langId === 'hebrew') {
    return l.startsWith('he') || l.startsWith('iw') || n.includes('carmit') || n.includes('hebrew');
  }
  if (langId === 'greek') {
    return l.startsWith('el') || n.includes('greek') || n.includes('melina') || n.includes('nikos');
  }
  if (langId === 'aramaic') {
    return l.startsWith('syr') || l.startsWith('ar') || n.includes('syriac') || n.includes('arabic');
  }

  const mapping = LANGUAGE_LOCALES[langId];
  if (!mapping) return false;

  return mapping.bcp47.some((code) => {
    const clean = code.toLowerCase().replace(/_/g, '-');
    return l === clean || l.startsWith(clean.split('-')[0]);
  });
}

export async function getAvailableVoicesForLang(langId: string): Promise<Speech.Voice[]> {
  try {
    const allVoices = await Speech.getAvailableVoicesAsync();
    return allVoices.filter((v) => !isNoveltyVoice(v) && isNativeVoiceForLanguage(v, langId));
  } catch {
    return [];
  }
}

export async function getBestVoice(
  langId: string,
  customSettings?: Partial<AudioSettings>
): Promise<Speech.Voice | null> {
  try {
    const allVoices = await Speech.getAvailableVoicesAsync();
    if (!allVoices || allVoices.length === 0) return null;

    const stored = await getStoredAudioSettings();
    const settings = { ...stored, ...customSettings };

    if (settings.preferredVoiceIdentifier) {
      const preferred = allVoices.find(
        (v) => v.identifier === settings.preferredVoiceIdentifier
      );
      if (preferred && !isNoveltyVoice(preferred)) return preferred;
    }

    const candidates = allVoices.filter((v) => !isNoveltyVoice(v) && isNativeVoiceForLanguage(v, langId));
    if (candidates.length > 0) {
      if (settings.gender === 'female') {
        const f = candidates.find((v) => detectVoiceGender(v) === 'female');
        if (f) return f;
      }
      if (settings.gender === 'male') {
        const m = candidates.find((v) => detectVoiceGender(v) === 'male');
        if (m) return m;
      }
      return candidates[0];
    }

    const enCandidates = allVoices.filter(
      (v) => !isNoveltyVoice(v) && (v.language || '').toLowerCase().startsWith('en')
    );
    if (settings.gender === 'female') {
      const f = enCandidates.find((v) => detectVoiceGender(v) === 'female');
      if (f) return f;
    } else if (settings.gender === 'male') {
      const m = enCandidates.find((v) => detectVoiceGender(v) === 'male');
      if (m) return m;
    }
    return enCandidates[0] || null;
  } catch {
    return null;
  }
}

const HEBREW_TRANSLIT_MAP: Record<string, string> = {
  'א': '', 'ב': 'v', 'בּ': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v',
  'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'kh', 'כּ': 'k', 'ך': 'kh',
  'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': '',
  'פ': 'f', 'פּ': 'p', 'ף': 'f', 'צ': 'ts', 'ץ': 'ts', 'ק': 'k', 'ר': 'r',
  'ש': 'sh', 'שׁ': 'sh', 'שׂ': 's', 'ת': 't',
  '\u05B0': 'e', '\u05B1': 'e', '\u05B2': 'a', '\u05B3': 'o', '\u05B4': 'i',
  '\u05B5': 'e', '\u05B6': 'e', '\u05B7': 'a', '\u05B8': 'a', '\u05B9': 'o',
  '\u05BA': 'o', '\u05BB': 'u', '\u05BC': '', '\u05C1': '', '\u05C2': '',
};

export function transliterateHebrew(heb: string): string {
  const t = heb
    .replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C4\u05C5]/g, '')
    .replace(/שׁ/g, 'sh')
    .replace(/שׂ/g, 's')
    .replace(/בּ/g, 'b')
    .replace(/כּ/g, 'k')
    .replace(/פּ/g, 'p')
    .replace(/\u05C3/g, '.')
    .replace(/\u05BE/g, ' ');

  let out = '';
  for (const ch of t) {
    if (HEBREW_TRANSLIT_MAP[ch] !== undefined) {
      out += HEBREW_TRANSLIT_MAP[ch];
    } else if (/[a-zA-Z0-9\s.,!?;:]/.test(ch)) {
      out += ch;
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

const GREEK_TRANSLIT_MAP: Record<string, string> = {
  'α': 'a', 'ά': 'a', 'ὰ': 'a', 'ᾶ': 'a', 'ἀ': 'a', 'ἁ': 'ha', 'ἄ': 'a', 'ἅ': 'ha', 'ἆ': 'a', 'ἇ': 'ha', 'ᾳ': 'a', 'ᾴ': 'a', 'ᾷ': 'a',
  'β': 'v', 'γ': 'g', 'δ': 'd',
  'ε': 'e', 'έ': 'e', 'ὲ': 'e', 'ἐ': 'e', 'ἑ': 'he', 'ἔ': 'e', 'ἕ': 'he', 'ζ': 'z',
  'η': 'i', 'ή': 'i', 'ὴ': 'i', 'ῆ': 'i', 'ἠ': 'i', 'ἡ': 'hi', 'ἤ': 'i', 'ἥ': 'hi', 'ἦ': 'i', 'ἧ': 'hi', 'ῃ': 'i', 'ῄ': 'i', 'ῇ': 'i',
  'θ': 'th',
  'ι': 'i', 'ί': 'i', 'ὶ': 'i', 'ῖ': 'i', 'ἰ': 'i', 'ἱ': 'hi', 'ἴ': 'i', 'ἵ': 'hi', 'ἶ': 'i', 'ἷ': 'hi', 'ϊ': 'i', 'ΐ': 'i',
  'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x',
  'ο': 'o', 'ό': 'o', 'ὸ': 'o', 'ὀ': 'o', 'ὁ': 'ho', 'ὄ': 'o', 'ὅ': 'ho',
  'π': 'p', 'ρ': 'r', 'ῤ': 'r', 'ῥ': 'rh', 'σ': 's', 'ς': 's', 'τ': 't',
  'υ': 'y', 'ύ': 'y', 'ὺ': 'y', 'ῦ': 'y', 'ὐ': 'y', 'ὑ': 'hy', 'ὔ': 'y', 'ὕ': 'hy', 'ὖ': 'y', 'ὗ': 'hy', 'ϋ': 'y', 'ΰ': 'y',
  'φ': 'ph', 'χ': 'ch', 'ψ': 'ps',
  'ω': 'o', 'ώ': 'o', 'ὼ': 'o', 'ῶ': 'o', 'ὠ': 'o', 'ὡ': 'ho', 'ὤ': 'o', 'ὥ': 'ho', 'ὦ': 'o', 'ὧ': 'ho', 'ῳ': 'o', 'ῴ': 'o', 'ῷ': 'o',
};

const GREEK_DIPHTHONGS: Array<[string, string]> = [
  ['ου', 'ou'], ['ού', 'ou'], ['οὺ', 'ou'], ['οῦ', 'ou'],
  ['αι', 'ai'], ['αί', 'ai'], ['αὶ', 'ai'], ['αῖ', 'ai'],
  ['ει', 'ei'], ['εί', 'ei'], ['εὶ', 'ei'], ['εῖ', 'ei'],
  ['οι', 'oi'], ['οί', 'oi'], ['οὶ', 'oi'], ['οῖ', 'oi'],
  ['υι', 'ui'], ['υί', 'ui'], ['υὶ', 'ui'], ['υῖ', 'ui'],
  ['αυ', 'av'], ['αύ', 'av'], ['αὺ', 'av'], ['αῦ', 'av'],
  ['ευ', 'ev'], ['εύ', 'ev'], ['εὺ', 'ev'], ['εῦ', 'ev'],
  ['γγ', 'ng'], ['γκ', 'nk'], ['γχ', 'nch'], ['μπ', 'mp'], ['ντ', 'nt'],
];

export function transliterateGreek(greek: string): string {
  let s = greek.toLowerCase();
  for (const [diph, repl] of GREEK_DIPHTHONGS) {
    s = s.replaceAll(diph, repl);
  }
  let out = '';
  for (const ch of s) {
    if (GREEK_TRANSLIT_MAP[ch] !== undefined) {
      out += GREEK_TRANSLIT_MAP[ch];
    } else if (/[a-zA-Z0-9\s.,!?;:]/.test(ch)) {
      out += ch;
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

const SYRIAC_TRANSLIT_MAP: Record<string, string> = {
  'ܐ': 'a', 'ܒ': 'b', 'ܓ': 'g', 'ܕ': 'd', 'ܗ': 'h', 'ו': 'w', 'ܘ': 'w',
  'ܙ': 'z', 'ܚ': 'kh', 'ܛ': 't', 'ܝ': 'y', 'ܟ': 'k', 'ܠ': 'l', 'ܡ': 'm',
  'ܢ': 'n', 'ܣ': 's', 'ܤ': 's', 'ܥ': 'e', 'ܦ': 'p', 'ܧ': 'p', 'ܨ': 'ts',
  'ܩ': 'q', 'ܪ': 'r', 'ܫ': 'sh', 'ܬ': 't',
};

export function transliterateAramaic(aramaic: string): string {
  let out = '';
  for (const ch of aramaic) {
    if (SYRIAC_TRANSLIT_MAP[ch] !== undefined) {
      out += SYRIAC_TRANSLIT_MAP[ch];
    } else if (/[a-zA-Z0-9\s.,!?;:]/.test(ch)) {
      out += ch;
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

export function sanitizeTextForSpeech(
  text: string,
  langId: string,
  hasNativeVoice: boolean
): string {
  let cleaned = text
    .replace(/\[\d+\]/g, '')
    .replace(/[()]/g, '')
    .trim();

  if (langId === 'hebrew') {
    if (hasNativeVoice) {
      cleaned = cleaned
        .replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C4\u05C5]/g, '')
        .replace(/\u05C3/g, '.')
        .replace(/\u05BE/g, ' ')
        .normalize('NFC');
    } else {
      cleaned = transliterateHebrew(cleaned);
    }
  } else if (langId === 'greek') {
    cleaned = hasNativeVoice ? cleaned.normalize('NFC') : transliterateGreek(cleaned);
  } else if (langId === 'aramaic') {
    if (hasNativeVoice) {
      cleaned = cleaned.replace(/[\u0700-\u070D]/g, ' ').normalize('NFC');
    } else {
      cleaned = transliterateAramaic(cleaned);
    }
  } else if (langId === 'malayalam') {
    cleaned = cleaned.replace(/\u0D4E/g, 'ർ').replace(/[;:]/g, ',').normalize('NFC');
  } else {
    cleaned = cleaned.replace(/[—–]/g, ', ');
  }

  return cleaned;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  gender?: VoiceGender;
  voiceIdentifier?: string | null;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

export async function speakText(text: string, langId: string, options?: SpeakOptions) {
  await stopAudio();

  const settings = await getStoredAudioSettings();
  const effectiveGender = options?.gender || settings.gender;
  const effectiveVoiceId = options?.voiceIdentifier ?? settings.preferredVoiceIdentifier;

  const voice = await getBestVoice(langId, {
    gender: effectiveGender,
    preferredVoiceIdentifier: effectiveVoiceId,
  });

  const hasNativeVoice = voice ? isNativeVoiceForLanguage(voice, langId) : false;
  const cleanText = sanitizeTextForSpeech(text, langId, hasNativeVoice);
  if (!cleanText) {
    options?.onEnd?.();
    return;
  }

  let pitch = options?.pitch ?? 1.0;
  if (!options?.pitch) {
    if (effectiveGender === 'male') {
      const isFemale = voice ? detectVoiceGender(voice) === 'female' : true;
      pitch = isFemale ? 0.82 : 0.92;
    } else if (effectiveGender === 'female') {
      const isMale = voice ? detectVoiceGender(voice) === 'male' : false;
      pitch = isMale ? 1.15 : 1.05;
    }
  }

  const mapping = LANGUAGE_LOCALES[langId] || { bcp47: ['en-US'] };
  const speechLang =
    !hasNativeVoice && (langId === 'hebrew' || langId === 'greek' || langId === 'aramaic')
      ? voice?.language || 'en-US'
      : voice?.language || mapping.bcp47[0] || 'en-US';

  Speech.speak(cleanText, {
    language: speechLang,
    voice: voice?.identifier,
    rate: options?.rate ?? settings.rate ?? 0.92,
    pitch,
    onStart: () => options?.onStart?.(),
    onDone: () => options?.onEnd?.(),
    onStopped: () => options?.onEnd?.(),
    onError: (err) => options?.onError?.(err),
  });
}

export async function stopAudio(): Promise<void> {
  try {
    await Speech.stop();
  } catch {
    // ignore
  }
}

export async function isAudioSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}
