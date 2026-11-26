import { useEffect } from 'react';
import { DarkTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Palette } from '@/constants/palette';
import { initializeBibleDatabase } from '@/lib/bible';

SplashScreen.preventAutoHideAsync();

const CosmicDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Palette.bgBase,
    card: Palette.bgSurface,
    text: Palette.textWhite,
    border: Palette.borderSubtle,
    primary: Palette.sky,
  },
};

export default function RootLayout() {
  useEffect(() => {
    initializeBibleDatabase().catch(() => {});
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={CosmicDarkTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Palette.bgBase },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="reader/[book]/[chapter]" />
        <Stack.Screen name="about" />
      </Stack>
    </ThemeProvider>
  );
}
