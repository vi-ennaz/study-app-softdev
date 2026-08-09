// RewardsScreen.js
// This screen displays the user's rewards, including their streak, badges
// and progress along the milestone path. 
// It provides an overview of the user's achievements and allows them to view details about their unlocked badges.

// Import necessary modules from React and React Native, including View, Text, ScrollView, StyleSheet, TouchableOpacity, 
// Modal, Dimensions and Animated
import { Image } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import {
View, Text, ScrollView, StyleSheet, TouchableOpacity,
Modal, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useApp, BADGES } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, radius } from '../theme';

// Define the RewardsScreen component, which displays the user's rewards, 
// including their streak, badges and progress along the milestone path
const { width } = Dimensions.get('window');
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// Define the XPBar component, which displays a progress bar 
// indicating the user's current experience points (XP) relative to the maximum XP required for the next milestone
function XPBar({ current, max, color }) {
  const pct = Math.min(current / Math.max(max, 1), 1);
  return (
    <View style={xp.track}>
      <View style={[xp.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}
const xp = StyleSheet.create({
  track: { height: 14, borderRadius: 7, backgroundColor: '#ddd', overflow: 'hidden', width: '100%' },
  fill: { height: '100%', borderRadius: 7 },
});

// Define the StreakCalendar component, which displays a calendar view of the user's study streak for the current month
function StreakCalendar({ streakDates, colors }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const dim = new Date(year, month + 1, 0).getDate();
  const first = new Date(year, month, 1).getDay();
  const done = new Set(streakDates);
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) {
    const ds = format(new Date(year, month, d), 'yyyy-MM-dd');
    const today = format(now, 'yyyy-MM-dd');
    cells.push({ d, ds, done: done.has(ds), today: ds === today });
  }
  return (
    <View>
      {/* Define the header row of the calendar, which displays the days of the week */}
      <View style={cal.dayRow}>
        {DAYS.map(d => <Text key={d} style={[cal.dayHdr, { color: colors.textMuted }]}>{d}</Text>)}
      </View>
      <View style={cal.grid}>
        {cells.map((c, i) => (
          <View key={i} style={cal.cellWrap}>
            {c && (
              <View style={[
                cal.cell,
                { backgroundColor: colors.borderLight },
                c.done  && { backgroundColor: colors.primary },
                c.today && !c.done && { borderWidth: 2, borderColor: colors.primary, backgroundColor: 'transparent' },
                c.today && c.done  && { backgroundColor: colors.primaryDark },
              ]}>
                <Text style={[cal.cellNum, { color: c.done ? '#fff' : colors.textMuted },
                  c.today && !c.done && { color: colors.primary, fontFamily: 'Nunito_700Bold' }]}>
                  {c.d}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
// Define the styles for the StreakCalendar component using StyleSheet.create, 
// including styles for the day row, day header, grid, cell wrapper, cell and cell number
const cal = StyleSheet.create({
  dayRow: { flexDirection: 'row', marginBottom: 4 },
  dayHdr: { flex: 1, fontSize: 9, textAlign: 'center', fontFamily: 'Nunito_700Bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellWrap: { width: `${100/7}%`, aspectRatio: 1, padding: 1.5 },
  cell: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  cellNum: { fontSize: 10 },
});

// Define the MilestonePath component, which displays the user's progress along 
// the milestone path based on their total study hours
function MilestonePath({ sessions, colors }) {
  const totalMins = sessions.reduce((s, x) => s + x.durationMins, 0);
  const totalH    = Math.floor(totalMins / 60);
  const milestones = [
    { h: 0, label: 'Drops', color: '#aaa', icon: '◇' },
    { h: 5, label: 'Stream', color: '#4a90d9', icon: '○' },
    { h: 10, label: 'Current', color: '#2a7ad9', icon: '◆' },
    { h: 25, label: 'Wave', color: '#1a5fa8', icon: '≋' },
    { h: 50, label: 'Ocean', color: '#0f4080', icon: '★' },
    { h: 100, label: 'Abyss', color: '#4a90d9', icon: '❋' },
  ];
  const cur = milestones.filter(m => totalH >= m.h).length - 1;
  const nxt = milestones[Math.min(cur + 1, milestones.length - 1)];

  // Define the render function for the MilestonePath component, 
  // which returns a view containing the milestone nodes, labels and progress bar
  return (
    <View>
      <View style={path.row}>
        {milestones.map((m, i) => {
          const reached = totalH >= m.h;
          const active  = i === cur;
          return (
            <View key={m.h} style={path.step}>
              <View style={[
                path.node,
                { backgroundColor: reached ? m.color + '22' : colors.cardAlt, borderColor: reached ? m.color : colors.border },
                active && { borderWidth: 3 },
              ]}>
                <Text style={{ fontSize: 18, color: reached ? m.color : colors.textLight, opacity: reached ? 1 : 0.3 }}>
                  {m.icon}
                </Text>
              </View>
              <Text style={[path.lbl, { color: reached ? colors.textMid : colors.textLight }]}>{m.label}</Text>
              <Text style={[path.h, { color: colors.textLight }]}>{m.h}h</Text>
            </View>
          );
        })}
      </View>
      <Text style={[path.total, typography.heading, { color: colors.text }]}>{totalH}h studied total</Text>
      <XPBar current={totalH} max={nxt.h || 1} color={milestones[cur].color} />
      <Text style={[path.next, typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
        {nxt.h > totalH ? `${nxt.h - totalH}h until ${nxt.label}` : `${nxt.label} reached ◆`}
      </Text>
    </View>
  );
}
// Define the styles for the MilestonePath component using StyleSheet.create,
// including styles for the row, step, node, label, hours, total and next text
const path = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  step: { alignItems: 'center', flex: 1 },
  node: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  lbl: { fontSize: 8, textAlign: 'center', fontFamily: 'Nunito_400Regular' },
  h: { fontSize: 7, textAlign: 'center', fontFamily: 'Nunito_400Regular' },
  total: { fontSize: 14, marginBottom: 5 },
  next: { fontSize: 10 },
});
// Define the BadgeModal component, which displays information about a specific badge
// It is shown as a modal overlay when the user taps on a badge in the RewardsScreen
// The modal includes the badge's icon, title, description and an "unlocked" pill if the badge has been unlocked
function BadgeModal({ badge, onClose, colors }) {
  if (!badge) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' }}
        activeOpacity={1} onPress={onClose}
      >
        <View style={[bm.card, { backgroundColor: colors.surface, borderColor: colors.borderGlow }]}>
          <Text style={bm.icon}>{badge.icon}</Text>
          <Text style={[bm.title, typography.display, { color: colors.text }]}>{badge.title}</Text>
          <Text style={[bm.desc, typography.body, { color: colors.textMuted }]}>{badge.desc}</Text>
          <View style={[bm.pill, { backgroundColor: colors.primaryPale, borderColor: colors.borderGlow }]}>
            <Text style={[bm.pillTxt, typography.subheading, { color: colors.primaryLight }]}>◆ unlocked</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
// Define the styles for the BadgeModal component using StyleSheet.create,
// including styles for the card, icon, title, description, pill and pill text
// The card style includes a border radius, padding, alignment and width, 
// while the icon style sets the font size and colour. 
const bm = StyleSheet.create({
  card: { borderRadius: 28, padding: 36, alignItems: 'center', width: width * 0.78, borderWidth: 1 },
  icon: { fontSize: 56, color: '#6aaff0', marginBottom: 12 },
  title: { fontSize: 22, marginBottom: 8 },
  desc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  pill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  pillTxt: { fontSize: 14 },
});

// Define the RewardsScreen component, which displays the user's rewards and progress
export default function RewardsScreen() {
  const { state } = useApp();
  const { colors } = useTheme();
  const { rewards, sessions, settings } = state;

  const [tab,setTab] = useState('overview');
  const [badge, setBadge] = useState(null);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayMins = sessions.filter(s => s.date === today).reduce((s, x) => s + x.durationMins, 0);
  const goalMins = settings.dailyGoalMins || 60;
  const totalMins = sessions.reduce((s, x) => s + x.durationMins, 0);
  const totalH = Math.floor(totalMins / 60);
  const fmtM = m => m >= 60 ? `${Math.floor(m/60)}h${m%60>0?' '+m%60+'m':''}` : m+'m';

  const unlocked = BADGES.filter(b => rewards.unlockedBadges.includes(b.id));
  const locked = BADGES.filter(b => !rewards.unlockedBadges.includes(b.id));

  const streak = rewards.streak || 0;
  const bearMood = streak >= 30 ? 'fire' : streak >= 7 ? 'proud' : streak >= 1 ? 'happy' : 'idle';

  const leagueName = totalH < 5 ? 'Bronze' : totalH < 10 ? 'Silver' : totalH < 25 ? 'Gold' : totalH < 50 ? 'Sapphire' : 'Diamond';
  const leagueColor = { Bronze: '#cd7f32', Silver: '#9e9e9e', Gold: '#f5a623', Sapphire: '#4a90d9', Diamond: '#00bcd4' }[leagueName];

  return (
    <SafeAreaView style={[rw.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={rw.content} showsVerticalScrollIndicator={false}>

        <View style={[rw.banner, { backgroundColor: colors.primary }]}>
          
          <Image
  source={require('../../assets/iconreward.png')}
  style={{
    width: 72,
    height: 72,
    resizeMode: 'contain',
  }}
/>
{/* Define the center section of the banner, which displays the user's current streak, */}
{/* league and progress towards their daily goal */}
          <View style={rw.bannerCenter}>
            <Text style={[rw.bannerTitle, { color: '#fff' }]}>
              {streak > 0 ? `${streak} day streak!` : 'Start your streak!'}
            </Text>
            <View style={[rw.leagueBadge, { backgroundColor: leagueColor }]}>
              <Text style={[rw.leagueTxt, { color: '#fff' }]}>⭐ {leagueName} league</Text>
            </View>
            <View style={{ width: '100%', marginTop: 8 }}>
              <View style={rw.xpTrackBanner}>
                <View style={[rw.xpFillBanner, {
                  width: `${Math.round(Math.min(todayMins / goalMins, 1) * 100)}%`,
                  backgroundColor: '#ffe066',
                }]} />
              </View>
              <Text style={[rw.xpCaption, { color: 'rgba(255,255,255,0.75)' }]}>
                {fmtM(todayMins)} / {fmtM(goalMins)} daily goal
              </Text>
            </View>
          </View>

          <View style={rw.bannerRight}>
            <Text style={[rw.bigStreak, { color: '#ffe066' }]}>{streak}</Text>
            <Text style={[rw.bigStreakLabel, { color: 'rgba(255,255,255,0.8)' }]}>days</Text>
          </View>
        </View>
{/* Define the stats row, which displays the user's total study hours, streak, number of unlocked badges and number of study sessions */}
        <View style={[rw.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { val: `${totalH}h`, lbl: 'total', color: colors.water    },
            { val: String(streak), lbl: 'streak', color: '#e08030'       },
            { val: String(unlocked.length),lbl: 'badges', color: '#f5a623'       },
            { val: String(sessions.length),lbl: 'sessions', color: colors.success  },
          ].map((s, i) => (
            <React.Fragment key={s.lbl}>
              {i > 0 && <View style={[rw.statDiv, { backgroundColor: colors.border }]} />}
              <View style={rw.statItem}>
                <Text style={[rw.statNum, typography.display, { color: s.color }]}>{s.val}</Text>
                <Text style={[rw.statLbl, typography.caption, { color: colors.textMuted }]}>{s.lbl}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
{/* Define the tabs section, which allows the user to switch between the "Overview", "Badges" and "Path" tabs */}
        <View style={[rw.tabs, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { id: 'overview', label: 'OVERVIEW'},
            { id: 'badges', label: 'BADGES'},
            { id: 'path', label: 'PATH'},
          ].map(t => (
            <TouchableOpacity key={t.id} onPress={() => setTab(t.id)}
              style={[rw.tab, tab === t.id && { backgroundColor: colors.primaryPale }]}>
              <Text style={[rw.tabTxt, typography.subheading, { color: tab === t.id ? colors.primaryLight : colors.textMuted }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
{/* Define the content section of the RewardsScreen, which displays different content based on the selected tab */}
        {tab === 'overview' && (
          <>
            <View style={[rw.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={rw.cardHeader}>
                <Text style={[rw.cardTitle, typography.heading, { color: colors.text }]}>
                  streak  {format(new Date(), 'MMMM')} streak
                </Text>
                <View style={[rw.streakPill, { backgroundColor: colors.primaryPale }]}>
                  <Text style={[rw.streakPillTxt, { color: colors.primaryLight }]}>{streak} days</Text>
                </View>
              </View>

    {/* Render the StreakCalendar component, passing in the user's streak dates and theme colors as props */}
              <StreakCalendar streakDates={rewards.streakDates || []} colors={colors} />
              <View style={rw.calLegend}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />
                  <Text style={[{ fontSize: 9, color: colors.textMuted }, typography.caption]}>studied</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.borderLight }} />
                  <Text style={[{ fontSize: 9, color: colors.textMuted }, typography.caption]}>missed</Text>
                </View>
              </View>
            </View>
{/* Render the MilestonePath component, passing in the user's study sessions and theme colors as props */}
            <View style={[rw.bearMsg, { backgroundColor: colors.card, borderColor: colors.borderGlow }]}>
              <Image
                source={require('../../assets/iconreward.png')}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                }}
              />
              <Text style={[rw.bearTxt, typography.body, { color: colors.textMid }]}>
                {streak === 0
                  ? "Let's get started!"
                  : streak < 3
                  ? `${streak} day streak!`
                  : streak < 7
                  ? `${streak} days streak`
                  : streak < 14
                  ? `${streak}-day streak!`
                  : `${streak}-day streak ◆`}
              </Text>
            </View>

        {/* Render the Streak Freeze section if the user's streak is 7 days or more, 
        // indicating that their streak is protected for one missed day */}
            {streak >= 7 && (
              <View style={[rw.freeze, { backgroundColor: colors.waterPale, borderColor: colors.borderGlow }]}>
                <Text style={{ fontSize: 22 }}>Cold</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 13, color: colors.waterGlow }, typography.subheading]}>Streak Freeze</Text>
                  <Text style={[{ fontSize: 11, color: colors.textMuted }, typography.caption]}>Your streak is protected for 1 missed day</Text>
                </View>
                <View style={[rw.freezeBadge, { backgroundColor: colors.water }]}>
                  <Text style={[{ fontSize: 10, color: '#fff' }, typography.label]}>active</Text>
                </View>
              </View>
            )}

            <View style={[rw.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[rw.cardTitle, typography.heading, { color: colors.text, marginBottom: spacing.md }]}>
                  This week
              </Text>
              {(() => {
                // Calculate the total study minutes for each of the last 7 days 
                // and create an array of objects containing the day label, total minutes and whether it is today
                const days7 = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (6 - i));
                  const ds = format(d, 'yyyy-MM-dd');
                  const mins = sessions.filter(s => s.date === ds).reduce((sum, s) => sum + s.durationMins, 0);
                  return { label: DAYS[d.getDay()], mins, isToday: ds === today };
                });
                // Calculate the maximum study minutes for the last 7 days, 
                // ensuring a minimum of 60 minutes for scaling the bar heights
                const maxM = Math.max(...days7.map(d => d.mins), 60);
                return (
                  <View style={{ flexDirection: 'row', height: 60, alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    {days7.map((d, i) => (
                      <View key={i} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
                        <View style={{ height: 44, width: 16, backgroundColor: colors.borderLight, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' }}>
                          <View style={{
                            width: '100%',
                            height: `${Math.round((d.mins / maxM) * 100)}%`,
                            backgroundColor: d.isToday ? colors.primary : colors.slate,
                            borderRadius: 8,
                            minHeight: d.mins > 0 ? 3 : 0,
                          }} />
                        </View>
                        <Text style={[{ fontSize: 8, color: d.isToday ? colors.primary : colors.textMuted },
                          d.isToday && typography.heading]}>{d.label}</Text>
                      </View>
                    ))}
                  </View>
                );
              })()}
            </View>
          </>
        )}
 {/* Define the content for the "Badges" tab, which displays the user's unlocked and locked badges */}
        {tab === 'badges' && (
          <>

            {unlocked.length > 0 && (
              <>
                <Text style={[rw.groupLbl, typography.caption, { color: colors.textMuted }]}>
                  ⭐  UNLOCKED ({unlocked.length})
                </Text>
                <View style={rw.badgeGrid}>
                  {unlocked.map(b => (
                    <TouchableOpacity key={b.id} onPress={() => setBadge(b)}
                      style={[rw.badgeCard, { backgroundColor: colors.card, borderColor: colors.borderGlow }]}>
                      <View style={[rw.badgeCircle, { backgroundColor: colors.primaryPale, borderColor: colors.borderGlow }]}>
                        <Text style={rw.badgeIcon}>{b.icon}</Text>
                      </View>
                      <Text style={[rw.badgeName, typography.subheading, { color: colors.text }]}>{b.title}</Text>
                      <Text style={[rw.badgeDesc, typography.caption, { color: colors.textMuted }]}>{b.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
{/* Render the locked badges section if there are any locked badges, displaying them with a lock icon and reduced opacity */}
            {locked.length > 0 && (
              <>
                <Text style={[rw.groupLbl, typography.caption, { color: colors.textMuted, marginTop: spacing.lg }]}>
                  LOCKED ({locked.length})
                </Text>
                <View style={rw.badgeGrid}>
                  {locked.map(b => (
                    <View key={b.id} style={[rw.badgeCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.45 }]}>
                      <View style={[rw.badgeCircle, { backgroundColor: colors.borderLight }]}>
                        <Text style={[rw.badgeIcon, { color: colors.textLight }]}>🔒</Text>
                      </View>
                      <Text style={[rw.badgeName, typography.subheading, { color: colors.textMuted }]}>{b.title}</Text>
                      <Text style={[rw.badgeDesc, typography.caption, { color: colors.textLight }]}>{b.desc}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
{/* Render a message indicating that there are no unlocked badges if the user has not unlocked any badges yet */}
            {unlocked.length === 0 && (
              <View style={[rw.emptyBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Image
                  source={require('../../assets/iconreward.png')}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                  }}
                />
                <Text style={[{ fontSize: 16, color: colors.textMid, marginTop: spacing.md }, typography.body]}>
                  no badges yet
                </Text>
                <Text style={[{ fontSize: 12, color: colors.textMuted, textAlign: 'center' }, typography.caption]}>
                  complete study sessions to earn your first badge!
                </Text>
              </View>
            )}
          </>
        )}
{/* Define the content for the "Path" tab, which displays the user's progress along the milestone path and their session history */}
        {tab === 'path' && (
          <>
            <View style={[rw.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[rw.cardTitle, typography.heading, { color: colors.text, marginBottom: spacing.lg }]}>
                🗺️  study journey
              </Text>
              <MilestonePath sessions={sessions} colors={colors} />
            </View>

{/* Render the session history section, displaying the user's last 10 study sessions with details such as subject, date and duration */}
            <View style={[rw.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[rw.cardTitle, typography.heading, { color: colors.text, marginBottom: spacing.md }]}>
                 session history
              </Text>
              {sessions.length === 0 ? (
                <View style={{ alignItems: 'center', padding: spacing.lg }}>
                  <Text style={[{ fontSize: 13, color: colors.textMuted }, typography.body]}>no sessions yet</Text>
                </View>
              ) : sessions.slice(-10).reverse().map(s => (
                <View key={s.id} style={[rw.histRow, { borderBottomColor: colors.borderLight }]}>
                  <View style={[rw.histDot, { backgroundColor: s.type === 'wave' ? '#6B4226' + '33' : colors.primaryPale }]}>
                    <Text style={{ fontSize: 11, color: s.type === 'wave' ? '#8B5A2B' : colors.primary }}>
                      {s.type === 'wave' ? 'Coffee' : '◆'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[rw.histSubj, typography.subheading, { color: colors.text }]}>{s.subject}</Text>
                    <Text style={[rw.histMeta, typography.caption, { color: colors.textMuted }]}>{s.date}</Text>
                  </View>
                  <Text style={[rw.histMins, typography.heading, { color: colors.primary }]}>{s.durationMins}m</Text>
                </View>
              ))}
            </View>
          </>
        )}
{/* Add some spacing at the bottom of the ScrollView to ensure that the content is not cut off */}
        <View style={{ height: 90 }} />
      </ScrollView>

      <BadgeModal badge={badge} onClose={() => setBadge(null)} colors={colors} />
    </SafeAreaView>
  );
}
// Define the styles for the RewardsScreen component using StyleSheet.create,
// including styles for the safe area, content, banner, stats row, tabs, cards, badges and session history
// The styles include properties such as flex direction, padding, margin, font size, font family, border radius and colours 
const rw = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: 0 },

  banner: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, marginHorizontal: -spacing.lg, marginBottom: spacing.lg, gap: 12 },
  bannerCenter: { flex: 1, alignItems: 'flex-start' },
  bannerTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold', marginBottom: 4 },
  leagueBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  leagueTxt: { fontSize: 11, fontFamily: 'Nunito_700Bold' },
  xpTrackBanner:{ height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', width: '100%' },
  xpFillBanner: { height: '100%', borderRadius: 5 },
  xpCaption: { fontSize: 9, marginTop: 3, fontFamily: 'Nunito_400Regular' },
  bannerRight: { alignItems: 'center' },
  bigStreak: { fontSize: 36, fontFamily: 'Nunito_800ExtraBold', lineHeight: 40 },
  bigStreakLabel:{ fontSize: 11, fontFamily: 'Nunito_400Regular' },

  statsRow: { flexDirection: 'row', borderRadius: radius.xl, borderWidth: 1, padding: spacing.md, marginBottom: spacing.lg },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statNum: { fontSize: 20 },
  statLbl: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDiv: { width: 1, marginVertical: 4 },

  tabs: { flexDirection: 'row', borderRadius: radius.md, padding: 3, marginBottom: spacing.lg, borderWidth: 1 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.sm },
  tabTxt: { fontSize: 11 },

  card: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { fontSize: 15 },
  streakPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  streakPillTxt:{ fontSize: 11, fontFamily: 'Nunito_700Bold' },
  calLegend: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },

  bearMsg: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.xl, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.md },
  bearTxt: { flex: 1, fontSize: 13, lineHeight: 20 },

  freeze: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.xl, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md },
  freezeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },

  groupLbl: { fontSize: 10, letterSpacing: 1, marginBottom: spacing.md, textTransform: 'uppercase' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: spacing.md },
  badgeCard: { width: (width - spacing.lg * 2 - 18) / 3, borderRadius: radius.md, borderWidth: 1, padding: spacing.sm + 2, alignItems: 'center', gap: 4 },
  badgeCircle:{ width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  badgeIcon: { fontSize: 20, color: '#6aaff0' },
  badgeName: { fontSize: 10, textAlign: 'center' },
  badgeDesc: { fontSize: 8, textAlign: 'center', lineHeight: 12 },
  emptyBadge:{ borderRadius: radius.xl, borderWidth: 1, padding: spacing.xxl, alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, borderStyle: 'dashed' },

  histRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 8, borderBottomWidth: 1 },
  histDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  histSubj: { fontSize: 13 },
  histMeta: { fontSize: 10, marginTop: 2 },
  histMins: { fontSize: 16 },
});