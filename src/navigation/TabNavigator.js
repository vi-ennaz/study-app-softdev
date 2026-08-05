import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import TimerScreen from '../screens/TimerScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TABS = {
  Home: { icon: '⌂', label: 'home' },
  Timer: { icon: '◷', label: 'focus' },
  Calendar: { icon: '□', label: 'calendar' },
  Profile: { icon: '○', label: 'profile' },
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

export default function TabNavigator() {
  const theme = useTheme();
  const colors = theme?.colors || {
    surface: '#1a1a1a',
    border: '#2e2e2e',
    primary: '#4a90d9',
    textMuted: '#888888',
  };
  
  const insets = useSafeAreaInsets();

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
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}