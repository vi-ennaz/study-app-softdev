// App.js
// This is the main entry point of the app, responsible for initializing the app, handling authentication, 
// notification permissions and rendering the main navigation flow. It uses React Navigation for navigation 
// and manages the app's theme and state using context providers.
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
// Import custom fonts from Google Fonts using Expo's font loading utility
import { supabase } from './src/lib/supabase';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
// Import custom fonts from Google Fonts using Expo's font loading utility
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { SpecialElite_400Regular } from '@expo-google-fonts/special-elite';
import { VT323_400Regular } from '@expo-google-fonts/vt323';

// Import context providers for managing app state and theme
import { AppProvider } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import TabNavigator from './src/navigation/TabNavigator';
import AuthScreen from './src/screens/AuthScreen';
import NotificationScreen from './src/screens/NotificationPermissionScreen';

// Prevent the splash screen from auto-hiding, allowing to control when it is 
// hidden after fonts and initial state are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

// Define the AppInner component, which handles the main logic of the app, including authentication,
// notification permissions and rendering the appropriate screens based on the app's state
function AppInner() {
const themeContext = useTheme();
  
// Determine if the app is in dark mode and 
// retrieve the appropriate color palette from the theme context
  const isDark = themeContext?.isDark ?? true;
  const colors = themeContext?.colors || {
    bg: '#111111',
    primary: '#4a90d9',
    surface: '#1a1a1a',
    text: '#f0f0f0',
    border: '#2e2e2e',
  };

  // Define state variables for managing the app's initialisation, 
  // authentication and notification permission status
  const [initializing, setInitializing] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [notifDone, setNotifDone] = useState(false);

  // Load custom fonts using the useFonts hook, which returns a boolean indicating 
  // if the fonts are loaded and any font loading errors
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

// Use the useEffect hook to check the initial state of the app, 
// including authentication and notification permission status
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

// Call the checkInitialState function to retrieve the initial state of the app,
// including authentication and notification permission status and update the state variables accordingly
    checkInitialState();
  }, []);

  // Use the useCallback hook to define the onLayout function, which is called when the app's layout is rendered.
  // checks if the fonts are loaded or if there was a font loading error and hides the splash screen accordingly
  const onLayout = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Define the handleAuth function, which is called when the user successfully authenticates.
  // It sets the 'vv_notif_done' key in AsyncStorage to 'false' and updates the authed state variable to true
  const handleAuth = async () => {
    await AsyncStorage.setItem('vv_notif_done', 'false');
    setAuthed(true);
  };

  // Define the handleNotifDone function, which is called when the user has completed the notification permission flow.
  // It sets the 'vv_notif_done' key in AsyncStorage to 'true' and updates the notifDone state variable to true
  const handleNotifDone = async () => {
    await AsyncStorage.setItem('vv_notif_done', 'true');
    setNotifDone(true);
  };

  // Render the appropriate screens based on the app's state, including a loading screen while fonts are loading,
  // an authentication screen if the user is not authenticated, a notification permission screen if the user has not completed the notification flow
  // and the main app navigation if the user is authenticated and has completed the notification flow
  if ((!fontsLoaded && !fontError) || initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90d9" />
        <Text style={styles.loadingText}>Loading app...</Text>
      </View>
    );
  }

  // Render the authentication screen if the user is not authenticated, passing the handleAuth function 
  // as a prop to handle successful authentication
  if (!authed) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]} onLayout={onLayout}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.bg} />
        <AuthScreen onAuth={handleAuth} />
      </View>
    );
  }

 // Render the notification permission screen if the user has not completed the notification flow,
 // passing the handleNotifDone function as a prop to handle completion of the notification flow
  if (!notifDone) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]} onLayout={onLayout}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.bg} />
        <NotificationScreen onDone={handleNotifDone} />
      </View>
    );
  }

  // Render the main app navigation if the user is authenticated and has completed the notification flow,
  // passing the appropriate theme colours to the NavigationContainer for consistent theming throughout the app
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
// Define the main App component, which wraps the AppInner component 
// with necessary context providers for gesture handling, safe area management and theming
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
// Define the styles for the App component using StyleSheet.create,
// including styles for the root container, loading container and loading text
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