import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { speakText, stopAudio } from '@/lib/audio';
import { Palette } from '@/constants/palette';
import AudioSettingsModal from './AudioSettingsModal';

interface AudioPlayButtonProps {
  text: string;
  lang: string;
  label?: string;
  compact?: boolean;
  showSettings?: boolean;
}

export default function AudioPlayButton({
  text,
  lang,
  label,
  compact = false,
  showSettings = false,
}: AudioPlayButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleToggle = async () => {
    if (isPlaying) {
      await stopAudio();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      await speakText(text, lang, {
        onStart: () => setIsPlaying(true),
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => [
          styles.btn,
          compact && styles.btnCompact,
          isPlaying && styles.btnPlaying,
          pressed && { opacity: 0.8 },
        ]}
        accessibilityLabel={isPlaying ? 'Stop audio' : 'Listen to audio'}
      >
        <Ionicons
          name={isPlaying ? 'stop-circle' : 'volume-high-outline'}
          size={compact ? 16 : 15}
          color={isPlaying ? Palette.amberLight : Palette.textSlate300}
        />
        {label ? (
          <Text style={[styles.label, isPlaying && styles.labelPlaying]}>
            {isPlaying ? 'Stop' : label}
          </Text>
        ) : null}
      </Pressable>

      {showSettings && (
        <Pressable
          onPress={() => setIsSettingsOpen(true)}
          style={styles.settingsBtn}
          accessibilityLabel="Audio Settings"
        >
          <Ionicons name="options-outline" size={15} color={Palette.textMuted} />
        </Pressable>
      )}

      {showSettings && (
        <AudioSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentLang={lang}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: Palette.borderHover,
  },
  btnCompact: {
    width: 34,
    height: 34,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'center',
    borderRadius: 11,
  },
  btnPlaying: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: Palette.amber,
  },
  label: {
    color: Palette.textSlate200,
    fontSize: 11,
    fontWeight: '600',
  },
  labelPlaying: {
    color: Palette.amberLight,
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
