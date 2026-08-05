import 'react-native-gesture-handler';
import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';

import { supabase } from './src/lib/supabase';

import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { SpecialElite_400Regular } from '@expo-google-fonts/special-elite';
import { VT323_400Regular } from '@expo-google-fonts/vt323';

import { AppProvider } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import TabNavigator from './src/navigation/TabNavigator';
import AuthScreen from './src/screens/AuthScreen';
import NotificationScreen from './src/screens/NotificationPermissionScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppInner() {
  const themeContext = useTheme();
  
  // Safe Fallback so undefined colors never crash the app
  const isDark = themeContext?.isDark ?? true;
  const colors = themeContext?.colors || {
    bg: '#111111',
    primary: '#4a90d9',
    surface: '#1a1a1a',
    text: '#f0f0f0',
    border: '#2e2e2e',
  };

  const [initializing, setInitializing] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [notifDone, setNotifDone] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Inter_400Regular,
    Inter_600SemiBold,
    SpecialElite_400Regular,
    VT323_400Regular,
  });

  useEffect(() => {
    async function checkInitialState() {
      try {
        const { data } = await supabase.auth.getSession();
        setAuthed(!!data?.session);

        const n = await AsyncStorage.getItem('vv_notif_done');
        setNotifDone(n === 'true');
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setInitializing(false);
      }
    }

    checkInitialState();
  }, []);

  const onLayout = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  const handleAuth = async () => {
    await AsyncStorage.setItem('vv_notif_done', 'false');
    setAuthed(true);
  };

  const handleNotifDone = async () => {
    await AsyncStorage.setItem('vv_notif_done', 'true');
    setNotifDone(true);
  };

  if ((!fontsLoaded && !fontError) || initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90d9" />
        <Text style={styles.loadingText}>Loading app...</Text>
      </View>
    );
  }

  // 1. Auth Flow
  if (!authed) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]} onLayout={onLayout}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.bg} />
        <AuthScreen onAuth={handleAuth} />
      </View>
    );
  }

  // 2. Notification Permission Gate
  if (!notifDone) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]} onLayout={onLayout}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.bg} />
        <NotificationScreen onDone={handleNotifDone} />
      </View>
    );
  }

  // 3. Main Authenticated Flow
  return (
    <AppProvider>
      <NavigationContainer
        theme={{
          dark: isDark,
          colors: {
            primary: colors.primary,
            background: colors.bg,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            notification: colors.primary,
          },
        }}
      >
        <View style={[styles.root, { backgroundColor: colors.bg }]} onLayout={onLayout}>
          <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.bg} />
          <TabNavigator />
        </View>
      </NavigationContainer>
    </AppProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppInner />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 14,
  },
});