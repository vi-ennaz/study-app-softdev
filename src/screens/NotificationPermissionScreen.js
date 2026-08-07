// NotificationPermissionScreen.js
// This screen is displayed to the user when the app needs to request notification permissions
// It provides a brief explanation of why notifications are important and offers buttons to allow or skip notifications
// The onDone callback is called when the user makes a choice, allowing the parent component to handle the result

// Import necessary modules from React and React Native, including View, Text, TouchableOpacity, StyleSheet and SafeAreaView
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define the NotificationPermissionScreen component, which takes an onDone prop to handle the user's choice
export default function NotificationPermissionScreen({ onDone }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.icon}>Notification</Text>
        <Text style={styles.heading}>Stay on track</Text>
        <Text style={styles.body}>
        </Text>
        <TouchableOpacity style={styles.allowBtn} onPress={onDone}>
          <Text style={styles.allowTxt}>Allow notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={onDone}>
          <Text style={styles.skipTxt}>Not now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
// Define the styles for the NotificationPermissionScreen component using StyleSheet.create, including styles for the safe area, content, icon, heading, body, allow button and skip button
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  icon: { fontSize: 56, marginBottom: 24 },
  heading: { fontSize: 26, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 14 },
  body: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 23, marginBottom: 40 },
  allowBtn: { width: '100%', backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  allowTxt: { fontSize: 16, color: '#fff', fontWeight: '600' },
  skipBtn: { paddingVertical: 10 },
  skipTxt: { fontSize: 14, color: '#555', textDecorationLine: 'underline' },
});