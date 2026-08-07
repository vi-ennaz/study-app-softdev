// HomeScreen.js
// This file contains the main home screen of the app, which displays the user's study progress, streaks, and upcoming events. 
// It uses React Native components and custom hooks for state management and theming.
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

// Get the width of the device window for responsive design
const { width } = Dimensions.get('window');

// Define a set of motivational quotes to display on the home screen
const QUOTES = [
  'small progress is still progress.',
  'the best way to learn is to begin.',
  'one page at a time.',
  'never give up',
  'when there no hope, create hope.',
  'keep going, keep growing.',
  "you don't have to be great to start.",
];

// Define a set of unlockable items that the user can earn by studying for a certain number of hours
const UNLOCKS = [
  { hours: 5, label: 'Cozy Plant', emoji: '🪴' },
  { hours: 15, label: 'Warm Lamp', emoji: '💡' },
  { hours: 30, label: 'Coffee Machine', emoji: '☕' },
  { hours: 50, label: 'Bookshelf', emoji: '📚' },
];
// Calculate the user's current streak of consecutive study days based on their session history
function calcStreak(sessions) {
  if (!sessions?.length) return 0;
  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    if ((new Date(dates[i - 1]) - new Date(dates[i])) / 86400000 === 1) streak++;
    else break;
  }
  return streak;
}
// Format a duration in minutes into a readable string 
function fmtMins(m) {
  if (!m || m <= 0) return '0m';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}
// Determine the current time slot based on the hour of the day
function getTimeSlot(h) {
  if (h >= 21 || h < 5) return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
// Define greeting words and emojis for different times of the day
const GREET_WORD = { night: 'good night', morning: 'good morning', afternoon: 'good afternoon', evening: 'good evening' };
// Define greeting emojis for different times of the day
const GREET_EMOJI = { night: '☾', morning: '☀', afternoon: '✦', evening: '☾⋆⁺₊' };

// visual separation
function Dashes({ color }) {
  return (
    <Text style={{ color: color || '#c0b4a4', fontSize: 10, letterSpacing: 0.5, textAlign: 'center', marginVertical: 8 }}>
      {'• • • • • • • • • • • • • • • •'}
    </Text>
  );
}
// displays a label-value pair in a row, with optional styling for bold text and muted colors
function Row({ label, value, valueColor, bold, ink, muted }) {
  return (
    <View style={rc.row}>
      <Text style={[rc.rowLabel, { color: muted }, bold && rc.rowBold]}>{label}</Text>
      <Text style={[rc.rowValue, { color: valueColor || ink }, bold && rc.rowBold]}>{value}</Text>
    </View>
  );
}
// The main HomeScreen component that renders the user's study progress, streaks, and upcoming events
// It uses the useApp and useTheme hooks to access the app state and theme settings, and displays various cards with information and actions for the user
export default function HomeScreen({ navigation }) {
  const { state = {} } = useApp() || {};
  const { isDark = true, colors = {}, toggle: toggleTheme } = useTheme() || {};

  // Destructure the relevant data from the app state, providing default values if they are not present
  const {
    sessions = [],
    events = [],
    notes = [],
    rewards = {},
    settings = {},
    profile = {},
  } = state;

  // Get the current hour and determine the time slot for greeting purposes
  const hour = new Date().getHours();
  const timeSlot = getTimeSlot(hour);
  const today = format(new Date(), 'yyyy-MM-dd');
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
// Filter the sessions to get only those that occurred today and calculate the total minutes studied today and overall
  const todaySessions = sessions.filter(s => s.date === today);
  const todayMins = todaySessions.reduce((a, s) => a + (s.durationMins || 0), 0);
  const totalMins = sessions.reduce((a, s) => a + (s.durationMins || 0), 0);
  const totalHours = totalMins / 60;
  const goalMins = settings?.dailyGoalMins || 120;
  const goalPct = Math.min(Math.round((todayMins / goalMins) * 100), 100);
  const streak = calcStreak(sessions);
  const quote = QUOTES[dayOfYear % QUOTES.length];

// Find the next unlockable item based on the total hours studied and calculate how many hours are left to unlock it
  const nextUnlock = UNLOCKS.find(u => u.hours > totalHours) || null;
  const hoursLeft = nextUnlock ? (nextUnlock.hours - totalHours).toFixed(1) : null;

  // Find the next upcoming event that is not done and is scheduled for today or later and calculate how many days are left until it occurs
  const upcomingEvent = events
    .filter(e => !e.done && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const daysLeft = upcomingEvent
    ? Math.max(0, Math.ceil((new Date(upcomingEvent.date) - new Date()) / 86400000))
    : null;

  // Calculate the progress bar representation based on the goal percentage and define colors for the theme
  const BAR_LEN = 18;
  const filled = Math.round((goalPct / 100) * BAR_LEN);
  const progress = '█'.repeat(filled) + '░'.repeat(BAR_LEN - filled);

  // Define colors for the background, paper, ink, muted text, accent, and border based on the current theme 
  const bg = isDark ? '#21201f' : '#faf5ee';
  const paper = isDark ? '#2e2c2a' : '#fffdf7';
  const ink = isDark ? '#d1c9bb' : '#1e160a';
  const muted = isDark ? '#8a8078' : '#6b5a45';
  const accent = isDark ? '#b8a882' : '#7a5c38';
  const border = isDark ? '#3d3a36' : '#c8bfb0';
  const receiptDate = format(new Date(), 'dd MMM yyyy  HH:mm');

  // navigate to different screens or perform action
  // It accepts children components and styles as props
  const Card = ({ onPress, children, style }) => {
    const inner = (
      <View style={[rc.card, { backgroundColor: paper, borderColor: border }, style]}>
        {children}
      </View>
    );
    return onPress
      ? <TouchableOpacity onPress={onPress} activeOpacity={0.78}>{inner}</TouchableOpacity>
      : inner;
  };
// Render the main home screen layout, including the header, cards for study progress, notes, study corner, upcoming orders and user stats
// Each card displays relevant information and actions for the user to interact with 
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <ScrollView contentContainerStyle={rc.scroll} showsVerticalScrollIndicator={false}>

        <View style={rc.storeHeader}>
          <Text style={[rc.storeTag, { color: muted }]}>the study café</Text>
          <Text style={[rc.greeting, { color: ink }]}>
            {GREET_WORD[timeSlot]} {GREET_EMOJI[timeSlot]}
          </Text>
          <Text style={[rc.receiptDate, { color: muted }]}>{receiptDate}</Text>
        </View>
{/* Render the header row with the user's profile picture or fallback avatar, streak information and theme toggle button */}
        <View style={rc.headerRow}>
          <TouchableOpacity onPress={() => navigation?.navigate?.('Profile')}>
            {profile?.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={[rc.avatar, { borderColor: border }]} />
            ) : (
              <View style={[rc.avatarFallback, { backgroundColor: isDark ? '#3a3632' : '#ede6da', borderColor: border }]}>
                <Text style={[rc.avatarLetter, { color: accent }]}>
                  {profile?.name?.[0]?.toUpperCase() || settings?.name?.[0]?.toUpperCase() || '♡'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{ flex: 1 }} />
{/* Render the streak pill if the user has a current streak of study days, displaying the number of days in the streak with a fire emoji */}
          {streak > 0 && (
            <View style={[rc.streakPill, { backgroundColor: isDark ? '#32302e' : '#f0e8da', borderColor: border }]}>
              <Text style={[rc.streakTxt, { color: accent }]}>🔥 {streak} day streak</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={toggleTheme}
            style={[rc.themeBtn, { backgroundColor: isDark ? '#32302e' : '#ede6da', borderColor: border }]}
          >
            <Text style={{ fontSize: 14 }}>{isDark ? '★' : '☾'}</Text>
          </TouchableOpacity>
        </View>

        <Card>
          <Text style={[rc.receiptTitle, { color: muted }]}>ORDER #001  ·  today's session</Text>
          <Dashes color={border} />
{/* Render rows for the amount of time studied today, the daily goals and the number of study sessions completed today */}
          <Row label="studied" value={fmtMins(todayMins)} valueColor={todayMins > 0 ? accent : muted} bold={todayMins > 0} ink={ink} muted={muted} />
          <Row label="daily goal" value={fmtMins(goalMins)} ink={ink} muted={muted} />
          <Row label="sessions" value={`${todaySessions.length}`} ink={ink} muted={muted} />

          <View style={{ marginTop: 12, marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={[rc.barLabel, { color: muted }]}>progress</Text>
              <Text style={[rc.barLabel, { color: goalPct >= 100 ? accent : muted }]}>{goalPct}%</Text>
            </View>
            <Text style={[rc.progressBar, { color: accent }]}>{progress}</Text>
          </View>

          <Dashes color={border} />
{/* Render a call to action button that navigates the user to the Timer screen to start or continue studying, with the button text changing based on whether the user has studied today */}
          <TouchableOpacity
            onPress={() => navigation?.navigate?.('Timer')}
            style={[rc.ctaBtn, { backgroundColor: accent }]}
          >
            <Text style={rc.ctaBtnTxt}>
              {todayMins > 0 ? '▶  continue studying' : '▶  start studying'}
            </Text>
          </TouchableOpacity>
        </Card>
{/* Render a card displaying a motivational quote from the barista, with the quote text styled and centered */}
        <Card>
          <Text style={[rc.receiptTitle, { color: muted }]}>╰┈➤  notes from the barista</Text>
          <Dashes color={border} />
          <Text style={[rc.quoteText, { color: ink }]}>"{quote}"</Text>
        </Card>
{/* Render a card that navigates the user to the Profile screen, displaying information about the user's study corner, including their room level, total hours studied */} 
{/* and the next unlockable item with the number of hours left to unlock it */}
        <Card onPress={() => navigation?.navigate?.('Profile')}>
          <Text style={[rc.receiptTitle, { color: muted }]}>★  study corner</Text>
          <Dashes color={border} />
          <Row label="room level" value={`lv. ${Math.floor(totalHours / 10) + 1}`} ink={ink} muted={muted} />
          <Row label="total studied" value={`${totalHours.toFixed(1)}h`} ink={ink} muted={muted} />
          {nextUnlock ? (
            <Row label={`next: ${nextUnlock.emoji} ${nextUnlock.label}`} value={`${hoursLeft}h to go`} valueColor={muted} ink={ink} muted={muted} />
          ) : (
            <Row label="all items" value="unlocked ✓" valueColor={accent} ink={ink} muted={muted} />
          )}
          <Dashes color={border} />
          <Text style={[rc.tapHint, { color: accent }]}>view room progress  →</Text>
        </Card>

        <Card onPress={() => navigation?.navigate?.('Calendar')}>
          <Text style={[rc.receiptTitle, { color: muted }]}>ᯓ★  upcoming orders</Text>
          <Dashes color={border} />
          {upcomingEvent ? (
            <>
              <Row
                label={upcomingEvent.title}
                value={daysLeft === 0 ? 'today!' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}
                valueColor={daysLeft <= 2 ? '#b04040' : ink}
                bold={daysLeft <= 2}
                ink={ink} muted={muted}
              />
              {/* Render the subject of the upcoming event if it exists, displaying it in a row with the label "subject" and the value being the subject of the event */}
              {upcomingEvent.subject && <Row label="subject" value={upcomingEvent.subject} ink={ink} muted={muted} />}
            </>
          ) : (
            <Text style={[rc.emptyHint, { color: muted }]}>nothing coming up · tap to add</Text>
          )}
          <Dashes color={border} />
          <Text style={[rc.tapHint, { color: accent }]}>open calendar  →</Text>
        </Card>
{/* Render a card that navigates the user to the Profile screen, displaying information about the user's stats, including total sessions, total time studied, current streak and number of badges unlocked */}
        <Card onPress={() => navigation?.navigate?.('Profile')}>
          <Text style={[rc.receiptTitle, { color: muted }]}>★  your stats</Text>
          <Dashes color={border} />
          <Row label="total sessions" value={`${sessions.length}`} ink={ink} muted={muted} />
          <Row label="total time" value={fmtMins(totalMins)} ink={ink} muted={muted} />
          <Row label="current streak" value={streak > 0 ? `🔥 ${streak} days` : '-'} ink={ink} muted={muted} />
          <Row label="badges" value={`★ ${rewards?.unlockedBadges?.length ?? 0}`} ink={ink} muted={muted} />
          <Dashes color={border} />
          <Text style={[rc.tapHint, { color: accent }]}>view profile  →</Text>
        </Card>

        <View style={rc.footer}>
          <Text style={[rc.footerTxt, { color: muted }]}>* * * thank you for studying  * * *</Text>
          <Text style={[rc.footerSub, { color: muted }]}>{sessions.length} sessions  ·  {fmtMins(totalMins)} total</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
// Define the styles for the HomeScreen component using StyleSheet.create, including styles for the scroll view, store header, greeting, receipt date, header row, avatar, streak pill, 
// theme button, card, rows, progress bar, call to action button, quote text, tap hint, empty hint and footer
const rc = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 10 },

  storeHeader: { alignItems: 'center', marginBottom: 14, marginTop: 2 },
  storeTag: { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'SpecialElite_400Regular', marginBottom: 4 },
  greeting: { fontSize: 26, fontFamily: 'SpecialElite_400Regular', marginBottom: 3 },
  receiptDate: { fontSize: 10, fontFamily: 'SpecialElite_400Regular', letterSpacing: 0.5 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2 },
  avatarFallback: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 15, fontFamily: 'SpecialElite_400Regular' },
  streakPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  streakTxt: { fontSize: 11, fontFamily: 'SpecialElite_400Regular' },
  themeBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    borderTopWidth: 1, borderBottomWidth: 1, borderLeftWidth: 0, borderRightWidth: 0,
    borderStyle: 'dashed', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12,
    shadowColor: '#5a3a1a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10,
    shadowRadius: 6, elevation: 2,
  },
  receiptTitle: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'SpecialElite_400Regular', textAlign: 'center', marginBottom: 2 },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowLabel: { fontSize: 12, fontFamily: 'SpecialElite_400Regular' },
  rowValue: { fontSize: 12, fontFamily: 'SpecialElite_400Regular' },
  rowBold: { fontWeight: '700' },

  barLabel: { fontSize: 10, fontFamily: 'SpecialElite_400Regular' },
  progressBar: { fontSize: 9, fontFamily: 'Courier', letterSpacing: 1 },

  ctaBtn: { borderRadius: 6, paddingVertical: 13, alignItems: 'center', marginTop: 2 },
  ctaBtnTxt: { color: '#fff', fontSize: 13, fontFamily: 'SpecialElite_400Regular', letterSpacing: 1 },

  quoteText: { fontSize: 14, fontFamily: 'SpecialElite_400Regular', textAlign: 'center', lineHeight: 22, paddingHorizontal: 6, paddingVertical: 4 },
  tapHint: { fontSize: 11, fontFamily: 'SpecialElite_400Regular', textAlign: 'center' },
  emptyHint: { fontSize: 12, fontFamily: 'SpecialElite_400Regular', textAlign: 'center', paddingVertical: 6 },

  footer: { alignItems: 'center', marginTop: 6, gap: 4 },
  footerTxt: { fontSize: 10, fontFamily: 'SpecialElite_400Regular', letterSpacing: 1 },
  footerSub: { fontSize: 9, fontFamily: 'SpecialElite_400Regular' },
});