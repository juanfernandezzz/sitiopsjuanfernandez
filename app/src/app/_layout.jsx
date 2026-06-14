import { useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashAnimado from '../components/SplashAnimado';
import { useFonts, Fraunces_500Medium, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Karla_400Regular, Karla_500Medium, Karla_700Bold } from '@expo-google-fonts/karla';
import { EBGaramond_600SemiBold } from '@expo-google-fonts/eb-garamond';
import { COLORS } from '../theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Karla_400Regular,
    Karla_500Medium,
    Karla_700Bold,
    EBGaramond_600SemiBold,
  });

  // El splash nativo se mantiene hasta que SplashAnimado esta pintado: esa capa
  // lo oculta en su onLayout, asi el relevo entre el splash del sistema y la
  // capa animada no muestra ningun salto. Mientras las fuentes no esten listas,
  // devolvemos null y el splash nativo sigue cubriendo la pantalla.
  const [splashListo, setSplashListo] = useState(false);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.cream },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
      {!splashListo && <SplashAnimado onDone={() => setSplashListo(true)} />}
    </SafeAreaProvider>
  );
}
