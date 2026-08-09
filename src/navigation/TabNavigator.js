// This file defines the TabNavigator component, 
// which sets up a bottom tab navigation structure for the app using React Navigation
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

// Import the necessary screens for the tab navigation, including HomeScreen, TimerScreen, CalendarScreen and ProfileScreen
import HomeScreen from '../screens/HomeScreen';
import TimerScreen from '../screens/TimerScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Define the TABS object, which maps each tab name to its corresponding icon and label for display in the tab bar
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Define the TABS object, which maps each tab name to its corresponding icon and label for display in the tab bar
const TABS = {
  Home: { icon: '⌂', label: 'home' },
  Timer: { icon: '◷', label: 'focus' },
  Calendar: { icon: '□', label: 'calendar' },
  Profile: { icon: '○', label: 'profile' },
};

// Define the HomeStack component, which sets up a stack navigator for the Home tab,
// allowing navigation between the HomeScreen and ProfileScreen within the Home tab
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
// Define the TabNavigator component, which sets up the bottom tab navigation structure for the app,
// including the Home, Timer, Calendar and Profile tabs, also applies theming and safe area insets for consistent styling
export default function TabNavigator() {
  const theme = useTheme();
  const colors = theme?.colors || {
    surface: '#1a1a1a',
    border: '#2e2e2e',
    primary: '#4a90d9',
    textMuted: '#888888',
  };
  // Use the useSafeAreaInsets hook to get the safe area insets for proper padding and spacing of the tab bar
  const insets = useSafeAreaInsets();

  // Render the Tab.Navigator component, which defines the bottom tab navigation structure for the app,
  // including the Home, Timer, Calendar and Profile tabs and applies theming and safe area insets for consistent styling
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 52 + (insets.bottom || 0),
          paddingBottom: insets.bottom || 0,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabel: ({ color }) => (
          <Text style={{ fontSize: 9, color, fontWeight: '600', marginBottom: 2 }}>
            {TABS[route.name]?.label || route.name.toLowerCase()}
          </Text>
        ),
        tabBarIcon: ({ color }) => (
          <Text style={{ fontSize: 18, color, marginTop: 2 }}>
            {TABS[route.name]?.icon || '•'}
          </Text>
        ),
      })}
    >
      {/* Define the individual Tab.Screen components for each tab in the bottom tab navigation,
      {/* including the Home, Timer, Calendar and Profile tabs and specify the corresponding component for each tab */}
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}