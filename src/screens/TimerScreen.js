import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, radius } from '../theme';
import { Audio } from 'expo-av';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  TextInput,
  Animated,
  Easing,
  Image,
} from 'react-native';

const { width } = Dimensions.get('window');

function pad(n) { return String(n).padStart(2, '0'); }

const XP_PER_MINUTE = 2;
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 6000, 9000];
function getLevel(xp) {
  let lv = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) lv = i + 1; else break;
  }
  return lv;
}
function xpForNextLevel(xp) {
  const lv = getLevel(xp);
  return LEVEL_THRESHOLDS[lv] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
}

const ACHIEVEMENTS = [
  { id: 'first_brew',  icon: '♡ ', label: 'First Brew', desc: 'Complete your first session',       check: (s) => s.sessions.length >= 1 },
  { id: 'five_hours',  icon: '˚꩜｡⋆.', label: '5 Hours', desc: 'Study for 5 total hours',           check: (s) => s.totalMins >= 300 },
  { id: 'twenty_five', icon: '☆', label: '25 Sessions', desc: 'Complete 25 study sessions',        check: (s) => s.sessions.length >= 25 },
  { id: 'hundred_hrs', icon: '𐙚', label: '100 Hours', desc: 'Study for 100 total hours',         check: (s) => s.totalMins >= 6000 },
  { id: 'streak_7', icon: 'ꕁ𐂐 ჻₊˚.჻', label: 'Week Warrior', desc: '7-day study streak',                check: (s) => s.streak >= 7 },
  { id: 'night_owl', icon: '₍ᐢ..ᐢ₎⊹', label: 'Night Owl', desc: 'Study after 10pm',                  check: (s) => s.studiedLate },
  { id: 'smiski_fan', icon: '˚✧｡°⋆° ｡୨୧˚', label: 'Smiski Master', desc: 'Collect all Smiski moods',          check: (s) => s.totalMins >= 100 },
  { id: 'cafe_pro', icon: '❀', label: 'Cafe Pro', desc: 'Complete 10 Cafe Focus sessions',  check: (s) => s.cafeSessions >= 10 },
];

const ROOM_ITEMS = [
  { sessions: 1, emoji: '♡', label: 'coffee cup' },
  { sessions: 5, emoji: '˚꩜｡⋆.', label: 'bookshelf' },
  { sessions: 10, emoji: '☆', label: 'plant' },
  { sessions: 25, emoji: '𐙚', label: 'lamp' },
  { sessions: 50, emoji: 'ꕁ𐂐 ჻₊˚.჻', label: 'cat' },
  { sessions: 100, emoji: '❀', label: 'full café' },
];

const CAFE_BREWS = [
  { id: 'espresso', name: 'Espresso', emoji: '☕︎', mins: 10, desc: '10 min focus', color: '#493c33' },
  { id: 'latte', name: 'Latte', emoji: '𐃯', mins: 25, desc: '25 min focus', color: '#645a52' },
  { id: 'matcha', name: 'Matcha', emoji: '𓎩', mins: 50, desc: '50 min focus', color: '#769580' },
  { id: 'cold', name: 'Cold Brew', emoji: '☃︎', mins: 90, desc: '90 min focus', color: '#395877' },
];

const PRESET_COLORS = [
  '#4a90d9','#5ba85c','#e06060','#d4a030','#9b59b6',
  '#1abc9c','#e91e8c','#00bcd4','#ff7043','#607d8b',
  '#f06292','#aed581','#ffd54f','#4db6ac','#9575cd',
];

 const CAFE_AMBIENCE = [
  { key: 'chatter', label: '☕︎ Café',  file: require('../../assets/audio/cafe.mp3') },
  { key: 'rain', label: '🌧 Rain',  file: require('../../assets/audio/rain.mp3') },
  { key: 'jazz', label: '♬ Jazz',  file: require('../../assets/audio/jazz.mp3') },
];

const SMISKI_AMBIENCE = [
  { key: 'forest', label: '𓆟 Forest 𓆞',  file: require('../../assets/audio/forest.mp3') },
  { key: 'library', label: '🕮 Library', file: require('../../assets/audio/library.mp3') },
  { key: 'lofi', label: '♫ Lofi', file: require('../../assets/audio/lofi.mp3') },
];

const SMISKI_MESSAGES = {
  idle: ['ready to study?', 'let\'s get started!', 'i believe in you 𐙚', 'take a deep breath...'],
  focus: ['keep going...', 'you\'re doing great!', 'stay focused -`♡´-', 'almost there...', 'one more minute ༝༚༝༚!'],
  happy: ['great job!', 'i\'m proud of you!', 'you crushed it!', 'amazing work! ₍⑅ᐢ..ᐢ₎'],
  sleep: ['zzz... rest up', 'taking a nap...', 'i\'ll be here...', 'sweet dreams ⎚-⎚'],
};

function calcStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0;
  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
  const today = format(new Date(), 'yyyy-MM-dd');
  if (dates[0] !== today && dates[0] !== format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev - curr) / 86400000;
    if (diff === 1) streak++; else break;
  }
  return streak;
}

function useAmbientSound() {
  const soundRef = useRef(null);
  const [activeKey, setActiveKey] = useState(null);
  const [volume, setVolume] = useState(0.7);

  const play = useCallback(async (key, file) => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (activeKey === key) { setActiveKey(null); return; }
      if (!file) { setActiveKey(key); return; } 
      const { sound } = await Audio.Sound.createAsync(file, { isLooping: true, volume });
      soundRef.current = sound;
      await sound.playAsync();
      setActiveKey(key);
    } catch (e) { console.log('Audio error:', e); setActiveKey(key); }
  }, [activeKey, volume]);

  const setVol = useCallback(async (v) => {
    setVolume(v);
    if (soundRef.current) await soundRef.current.setVolumeAsync(v);
  }, []);

  useEffect(() => () => { soundRef.current?.unloadAsync(); }, []);

  return { activeKey, volume, play, setVol };
}

function ProgressRing({ progress, size = 160, strokeWidth = 8, color = '#5a8ab0', bgColor = 'rgba(255,255,255,0.1)' }) {
  const animVal = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    Animated.timing(animVal, { toValue: progress, duration: 800, useNativeDriver: false }).start();
  }, [progress]);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const strokeDash = animVal.interpolate({ inputRange: [0, 1], outputRange: [0, circ] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth, borderColor: bgColor }} />
      <Animated.View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth, borderColor: color,
        borderTopColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'transparent',
        transform: [{ rotate: '-90deg' }],
      }} />
    </View>
  );
}

function XPBar({ xp, color }) {
  const level = getLevel(xp);
  const next = xpForNextLevel(xp);
  const prev = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const pct = next > prev ? (xp - prev) / (next - prev) : 1;
  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, { toValue: pct, duration: 1000, useNativeDriver: false }).start();
  }, [pct]);
  return (
    <View style={{ marginBottom: 8, alignItems: 'center' }}>
      <Text style={{ fontSize: 11, color, marginBottom: 3, fontFamily: 'SpecialElite_400Regular' }}>
        LV {level}  ·  {xp} XP
      </Text>
      <View style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
        <Animated.View style={{ height: '100%', backgroundColor: color, borderRadius: 3, width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
      </View>
    </View>
  );
}

function AmbienceModal({ visible, onClose, options, ambient, accentColor, bgColor, textColor }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={onClose} />
      <View style={{ backgroundColor: bgColor, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 16 }} />
        <Text style={{ fontSize: 14, fontFamily: 'SpecialElite_400Regular', color: textColor, marginBottom: 16, letterSpacing: 2 }}>AMBIENCE</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => ambient.play(opt.key, opt.file)}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                backgroundColor: ambient.activeKey === opt.key ? accentColor : 'rgba(255,255,255,0.08)',
                borderWidth: 1, borderColor: ambient.activeKey === opt.key ? accentColor : 'rgba(255,255,255,0.15)',
              }}
            >
              <Text style={{ fontSize: 11, color: ambient.activeKey === opt.key ? '#fff' : textColor, fontFamily: 'SpecialElite_400Regular' }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ fontSize: 11, color: textColor, opacity: 0.6, marginBottom: 8, fontFamily: 'SpecialElite_400Regular' }}>
          VOLUME  {Math.round(ambient.volume * 100)}%
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[0.2, 0.4, 0.6, 0.8, 1.0].map(v => (
            <TouchableOpacity key={v} onPress={() => ambient.setVol(v)}
              style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: ambient.volume >= v ? accentColor : 'rgba(255,255,255,0.15)' }} />
          ))}
        </View>
      </View>
    </Modal>
  );
}

function AchievementsModal({ visible, onClose, appState, bgColor, textColor, accentColor }) {
  const totalMins = (appState.sessions || []).reduce((s, x) => s + x.durationMins, 0);
  const cafeSessions = (appState.sessions || []).filter(s => s.type === 'wave').length;
  const streak = calcStreak(appState.sessions || []);
  const hour = new Date().getHours();
  const ctx = { sessions: appState.sessions || [], totalMins, cafeSessions, streak, studiedLate: hour >= 22 || hour <= 4 };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={onClose} />
      <View style={{ backgroundColor: bgColor, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '70%' }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 16 }} />
        <Text style={{ fontSize: 14, fontFamily: 'SpecialElite_400Regular', color: textColor, marginBottom: 16, letterSpacing: 2 }}>ACHIEVEMENTS</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {ACHIEVEMENTS.map(a => {
            const unlocked = a.check(ctx);
            return (
              <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, opacity: unlocked ? 1 : 0.35 }}>
                <Text style={{ fontSize: 28 }}>{a.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontFamily: 'SpecialElite_400Regular', color: unlocked ? accentColor : textColor }}>{a.label}</Text>
                  <Text style={{ fontSize: 11, color: textColor, opacity: 0.6, marginTop: 2 }}>{a.desc}</Text>
                </View>
                {unlocked && <Text style={{ fontSize: 18 }}>✓</Text>}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

function CafeRoomModal({ visible, onClose, sessionCount, bgColor, textColor, accentColor }) {
  const unlocked = ROOM_ITEMS.filter(r => sessionCount >= r.sessions);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }} activeOpacity={1} onPress={onClose} />
      <View style={{ position: 'absolute', top: '20%', left: 24, right: 24, backgroundColor: bgColor, borderRadius: 24, padding: 24 }}>
        <Text style={{ fontSize: 16, fontFamily: 'SpecialElite_400Regular', color: textColor, letterSpacing: 2, marginBottom: 4, textAlign: 'center' }}>MY CAFÉ ROOM</Text>
        <Text style={{ fontSize: 11, color: textColor, opacity: 0.5, textAlign: 'center', marginBottom: 20, fontFamily: 'SpecialElite_400Regular' }}>
          {sessionCount} sessions completed
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
          {ROOM_ITEMS.map(r => {
            const got = sessionCount >= r.sessions;
            return (
              <View key={r.sessions} style={{ alignItems: 'center', opacity: got ? 1 : 0.25 }}>
                <Text style={{ fontSize: 36 }}>{r.emoji}</Text>
                <Text style={{ fontSize: 9, color: got ? accentColor : textColor, marginTop: 2, fontFamily: 'SpecialElite_400Regular' }}>{r.label}</Text>
                {!got && <Text style={{ fontSize: 9, color: textColor, opacity: 0.5 }}>{r.sessions} sessions</Text>}
              </View>
            );
          })}
        </View>
        <TouchableOpacity onPress={onClose} style={{ alignItems: 'center', paddingVertical: 10 }}>
          <Text style={{ color: accentColor, fontFamily: 'SpecialElite_400Regular', fontSize: 12, letterSpacing: 2 }}>CLOSE</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function CafeFocusTimer({ onSave, subjects, onAddSubject, onDeleteSubject, appState }) {
  const { colors, isDark } = useTheme();
  const ambient = useAmbientSound();

  const C = {
    bg: isDark ? '#5241357a' : '#f9f6f0',
    surface: isDark ? '#5c4e3e' : '#d1cbc2',
    card: isDark ? '#41352c' : '#efe7dc',
    border: isDark ? '#4d3b2d' : '#b3aa9e',
    accent: '#6b554568',
    accentLt: isDark ? '#71553a' : '#594d42',
    text: isDark ? '#daccae' : '#3a2510',
    textMid: isDark ? '#c0a080' : '#3f3a33',
    textMute: isDark ? '#987b5ecf' : '#7d7060',
    green: '#4a7c59',
    greenLt: '#9ebb9f',
  };

  const [screen, setScreen] = useState('order');
  const [brew, setBrew] = useState(CAFE_BREWS[2]);
  const [phase, setPhase] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [block, setBlock] = useState(1);
  const [completed, setCompleted] = useState(0);
  const [totalBlks, setTotalBlks] = useState(4);
  const [breakLen, setBreakLen] = useState(5);
  const [subject, setSubject] = useState(subjects[0] || null);
  const [showSubj, setShowSubj] = useState(false);
  const [showAmbience, setShowAmbience] = useState(false);
  const [showRoom, setShowRoom] = useState(false);
  const [showAchieve, setShowAchieve] = useState(false);
  const intRef = useRef(null);

  const coffeeAnim = useRef(new Animated.Value(0)).current;

  const steam1 = useRef(new Animated.Value(0)).current;
  const steam2 = useRef(new Animated.Value(0)).current;
  const steam3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animSteam = (val, delay) => Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
    if (phase === 'focus') {
      animSteam(steam1, 0);
      animSteam(steam2, 700);
      animSteam(steam3, 1400);
    } else {
      steam1.setValue(0); steam2.setValue(0); steam3.setValue(0);
    }
  }, [phase]);

  useEffect(() => {
    if (subjects.length > 0 && (!subject || !subjects.find(s => s.name === subject.name))) {
      setSubject(subjects[0]);
    }
    if (subjects.length === 0) setSubject(null);
  }, [subjects]);

  const phaseDur = phase === 'focus' ? brew.mins * 60 : breakLen * 60;
  const progress = phase === 'idle' ? 0 : Math.max(0, 1 - seconds / phaseDur);
  const fillH    = Math.round(progress * 56);

  useEffect(() => {
    Animated.timing(coffeeAnim, { toValue: phase === 'idle' ? 28 : fillH, duration: 1000, useNativeDriver: false }).start();
  }, [fillH, phase]);

  useEffect(() => {
    clearInterval(intRef.current);
    if (phase !== 'idle') {
      intRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) { clearInterval(intRef.current); handlePhaseEnd(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intRef.current);
  }, [phase, block]);

  const handlePhaseEnd = () => {
    if (phase === 'focus') {
      const nc = completed + 1;
      setCompleted(nc);
      const xpEarned = brew.mins * XP_PER_MINUTE;
      onSave({ subject: subject?.name || 'General', subjectColor: subject?.color || C.accent, durationMins: brew.mins, type: 'wave', xpEarned });
      if (nc >= totalBlks) {
        setPhase('idle'); setBlock(1); setCompleted(0);
        Alert.alert(`All ${totalBlks} brews done! ☕`, `You studied ${totalBlks * brew.mins} minutes. +${totalBlks * xpEarned} XP!`);
      } else {
        Alert.alert('Brew complete ☕', `Take a ${breakLen} min break! +${xpEarned} XP`, [
          { text: 'Start break', onPress: () => { setPhase('break'); setSeconds(breakLen * 60); } },
          { text: 'Skip break',  onPress: () => { setBlock(b => b + 1); setPhase('focus'); setSeconds(brew.mins * 60); } },
        ]);
      }
    } else {
      setBlock(b => b + 1);
      setPhase('focus');
      setSeconds(brew.mins * 60);
    }
  };

  const startBrew = () => { setSeconds(brew.mins * 60); setPhase('focus'); };
  const placeOrder = () => { setScreen('timer'); setPhase('idle'); setBlock(1); setCompleted(0); setSeconds(brew.mins * 60); };
  const takeBreak = () => { clearInterval(intRef.current); setPhase('break'); setSeconds(breakLen * 60); };
  const endSession = () => { clearInterval(intRef.current); setPhase('idle'); setScreen('order'); setBlock(1); setCompleted(0); };

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const display = `${pad(m)}:${pad(s)}`;
  const progressPct = Math.round(progress * 100);

  const totalSessions = (appState?.sessions || []).length;
  const xp = (appState?.sessions || []).reduce((sum, s) => sum + (s.xpEarned || s.durationMins * XP_PER_MINUTE), 0);
  const streak = calcStreak(appState?.sessions || []);

  const SteamPuff = ({ animVal, offsetX = 0 }) => (
    <Animated.View style={{
      position: 'absolute', top: -30, left: '50%', marginLeft: offsetX - 10,
      opacity: animVal.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.7, 0.5, 0] }),
      transform: [{ translateY: animVal.interpolate({ inputRange: [0, 1], outputRange: [0, -28] }) }],
    }}>
      <Text style={{ fontSize: 16, color: C.textMute }}>☁</Text>
    </Animated.View>
  );

  if (screen === 'order') {
    return (
      <View style={[cf.screen, { backgroundColor: C.bg }]}>
        <ScrollView contentContainerStyle={cf.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[cf.header, { backgroundColor: C.accent }]}>
            <Text style={[cf.headerTitle, { color: '#f9f0e0' }]}>CAFÉ FOCUS</Text>
            <View style={[cf.cafeTag, { backgroundColor: C.accentLt }]}>
              <Text style={[cf.cafeTagTxt, { color: '#f9f0e0' }]}>☕ Café</Text>
            </View>
          </View>

          <View style={cf.orderBody}>
            <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginBottom: 14 }}>
              <View style={[cf.statChip, { backgroundColor: C.card, borderColor: C.border, flex: 1 }]}>
                <Text style={{ fontSize: 18 }}>❀</Text>
                <Text style={[cf.statChipTxt, { color: C.text }]}>{streak} day streak</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAchieve(true)} style={[cf.statChip, { backgroundColor: C.card, borderColor: C.border, flex: 1 }]}>
                <Text style={{ fontSize: 18 }}>★</Text>
                <Text style={[cf.statChipTxt, { color: C.text }]}>badges</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowRoom(true)} style={[cf.statChip, { backgroundColor: C.card, borderColor: C.border, flex: 1 }]}>
                <Text style={{ fontSize: 18 }}>★</Text>
                <Text style={[cf.statChipTxt, { color: C.text }]}>room</Text>
              </TouchableOpacity>
            </View>

            <XPBar xp={xp} color={C.accent} />

            <Text style={[cf.orderTitle, { color: C.text }]}>✦ CAFÉ ORDER ✦</Text>
            <Text style={[cf.orderSub, { color: C.textMute }]}>select your brew</Text>

            <View style={[cf.dividerDot, { borderColor: C.border }]} />

            {CAFE_BREWS.map(b => (
              <TouchableOpacity
                key={b.id}
                onPress={() => setBrew(b)}
                style={[
                  cf.brewRow,
                  { backgroundColor: C.card, borderColor: C.border },
                  brew.id === b.id && { backgroundColor: C.surface, borderColor: C.accent, borderWidth: 2 },
                ]}
                activeOpacity={0.85}
              >
                <Text style={cf.brewEmoji}>{b.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[cf.brewName, { color: C.text }]}>{b.name}</Text>
                  <Text style={[cf.brewDesc, { color: C.textMute }]}>{b.desc}</Text>
                </View>
                {brew.id === b.id && <Text style={[cf.brewCheck, { color: C.accent }]}>✓</Text>}
              </TouchableOpacity>
            ))}

            <View style={[cf.dividerDotRow, { borderColor: C.border }]}>
              <Text style={[cf.dots, { color: C.border }]}>• • • • • • • • •</Text>
            </View>

            {subjects.length > 0 && (
              <TouchableOpacity onPress={() => setShowSubj(true)} style={[cf.subjRow, { backgroundColor: C.card, borderColor: C.border }]}>
                {subject && <View style={[cf.subjDot, { backgroundColor: subject.color }]} />}
                <Text style={[cf.subjName, { color: subject?.color || C.textMute }]}>{subject?.name || 'select subject'}</Text>
                <Text style={[cf.subjArrow, { color: C.textMute }]}>▾</Text>
              </TouchableOpacity>
            )}

            <Text style={[cf.brewCount, { color: C.textMute }]}>
              waves: {[2,3,4,6].map(n => (
                <Text key={n} onPress={() => setTotalBlks(n)}
                  style={[cf.brewCountNum, { color: totalBlks === n ? C.accent : C.textMute }]}>
                  {n}{'  '}
                </Text>
              ))}
            </Text>

            <TouchableOpacity onPress={() => setShowAmbience(true)}
              style={[cf.ambienceBtn, { backgroundColor: C.card, borderColor: ambient.activeKey ? C.accent : C.border }]}>
              <Text style={{ fontSize: 14 }}>{ambient.activeKey ? '⏸' : '▶'}</Text>
              <Text style={[cf.ambienceBtnTxt, { color: ambient.activeKey ? C.accent : C.textMute }]}>
                {ambient.activeKey ? `${CAFE_AMBIENCE.find(a => a.key === ambient.activeKey)?.label} playing` : 'music off'}
              </Text>
              <Text style={[{ fontSize: 11, color: C.textMute }]}>▾</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[cf.orderBtn, { backgroundColor: C.accent }]} onPress={placeOrder}>
              <Text style={[cf.orderBtnTxt, { color: '#f9f0e0' }]}>PLACE ORDER →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {showSubj && (
          <SubjectSheet subjects={subjects} selected={subject}
            onSelect={(s) => { setSubject(s); setShowSubj(false); }}
            onClose={() => setShowSubj(false)}
            onAdd={onAddSubject} onDelete={onDeleteSubject} colors={colors} />
        )}
        <AmbienceModal visible={showAmbience} onClose={() => setShowAmbience(false)}
          options={CAFE_AMBIENCE} ambient={ambient} accentColor={C.accent} bgColor={C.card} textColor={C.text} />
        <AchievementsModal visible={showAchieve} onClose={() => setShowAchieve(false)}
          appState={appState} bgColor={C.card} textColor={C.text} accentColor={C.accent} />
        <CafeRoomModal visible={showRoom} onClose={() => setShowRoom(false)}
          sessionCount={totalSessions} bgColor={C.card} textColor={C.text} accentColor={C.accent} />
      </View>
    );
  }

  return (
    <View style={[cf.screen, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={cf.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[cf.header, { backgroundColor: C.accent }]}>
          <Text style={[cf.headerTitle, { color: '#f9f0e0' }]}>CAFÉ FOCUS</Text>
        </View>

        <View style={cf.timerBody}>
          <View style={[cf.cupWrap, { position: 'relative', overflow: 'visible' }]}>
            {phase === 'focus' && (
              <View style={{ position: 'relative', height: 36, width: 80 }}>
                <SteamPuff animVal={steam1} offsetX={15} />
                <SteamPuff animVal={steam2} offsetX={35} />
                <SteamPuff animVal={steam3} offsetX={55} />
              </View>
            )}
            <View style={[cf.cupOuter, { borderColor: C.textMid, backgroundColor: C.card }]}>
              <Animated.View style={[cf.cupLiquid, {
                height: coffeeAnim,
                backgroundColor: phase === 'break' ? '#a5d6a7' : brew.color,
                bottom: 0,
              }]} />
              <Text style={[cf.cupLabel, { color: C.text }]}>{brew.emoji}</Text>
            </View>
            <View style={[cf.saucer, { backgroundColor: C.textMid }]} />
          </View>

          {phase !== 'idle' && (
            <Text style={{ fontSize: 12, fontFamily: 'SpecialElite_400Regular', color: C.accent, marginBottom: 4 }}>
              {progressPct}% complete
            </Text>
          )}

          <Text style={[cf.timerNum, { color: C.text }]}>{display}</Text>
          <Text style={[cf.timerStatus, { color: C.textMute }]}>
            {phase === 'idle'  ? ` Ready to brew ${brew.name}` :
             phase === 'focus' ? `${brew.emoji} ${brew.name} brewing` :
             '○ Break time'}
          </Text>

          <View style={[cf.divLine, { backgroundColor: C.border }]} />

          {phase === 'idle' && (
            <TouchableOpacity style={[cf.ctrlBtn, { backgroundColor: C.accent }]} onPress={startBrew}>
              <Text style={[cf.ctrlBtnTxt, { color: '#f9f0e0' }]}>▶ Start Brewing</Text>
            </TouchableOpacity>
          )}
          {phase === 'focus' && (
            <TouchableOpacity style={[cf.ctrlBtn, { backgroundColor: C.card, borderWidth: 1, borderColor: C.accent }]} onPress={takeBreak}>
              <Text style={[cf.ctrlBtnTxt, { color: C.accentLt }]}>Take a break</Text>
            </TouchableOpacity>
          )}
          {phase === 'break' && (
            <TouchableOpacity style={[cf.ctrlBtn, { backgroundColor: C.accent }]}
              onPress={() => { setPhase('focus'); setBlock(b => b + 1); setSeconds(brew.mins * 60); }}>
              <Text style={[cf.ctrlBtnTxt, { color: '#fff' }]}>▶ Back to brewing</Text>
            </TouchableOpacity>
          )}

          <Text style={[cf.waveLabel, { color: C.textMute }]}>
            {phase !== 'idle' ? `Wave ${block} of ${totalBlks}` : `${totalBlks} waves · ${brew.mins} min each`}
          </Text>
          <View style={cf.waveRow}>
            {Array.from({ length: totalBlks }, (_, i) => (
              <View key={i} style={[
                cf.waveNode, { backgroundColor: C.card, borderColor: C.border },
                i < completed  && { backgroundColor: C.accent, borderColor: C.accent },
                i === block - 1 && phase === 'focus' && { borderColor: C.accent, borderWidth: 2 },
              ]}>
                <Text style={[cf.waveNodeTxt, { color: i < completed ? '#f9f0e0' : C.textMute }]}>
                  {i < completed ? '✓' : brew.emoji}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={endSession} style={[cf.endBtn, { borderColor: C.border }]}>
            <Text style={[cf.endBtnTxt, { color: C.textMute }]}>✕ end session</Text>
          </TouchableOpacity>

          <Text style={[cf.footer, { color: C.textMute }]}>CAFÉ FOCUS · STUDY TIMER</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function StudySmiskiTimer({ onSave, subjects, onAddSubject, onDeleteSubject, appState }) {
  const { colors, isDark } = useTheme();
  const ambient = useAmbientSound();
  const hour = new Date().getHours();
  const isNight = hour >= 18 || hour <= 6;

  const S = {
    bg: isDark ? '#2f3b4a8a' : '#f0f4f8',
    surface: isDark ? '#152030' : '#e8eef5',
    card: isDark ? '#1e2d3e' : '#d8e8f5',
    border: isDark ? '#2a4060' : '#517693',
    accent: '#26415c',
    accentLt:'#5a8ab0',
    text: isDark ? '#c8e0f5' : '#1a3050',
    textMid: isDark ? '#8aaac8' : '#3a5a7a',
    textMute:isDark ? '#436581' : '#6a8aaa',
  };

  const [targetMinutes, setTargetMinutes] = useState(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [subject, setSubject] = useState(subjects[0] || null);
  const [showSubj, setShowSubj]  = useState(false);
  const [smiskiMood, setSmiskiMood] = useState('idle');
  const [showAmbience, setShowAmbience] = useState(false);
  const [showAchieve,  setShowAchieve]  = useState(false);
  const [msgIdx,     setMsgIdx]     = useState(0);
  const startRef = useRef(null);
  const intRef = useRef(null);


  const floatAnim = useRef(new Animated.Value(0)).current;

  const breathAnim = useRef(new Animated.Value(1)).current;

  const particles = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const msgs = SMISKI_MESSAGES[smiskiMood] || SMISKI_MESSAGES.idle;
    setMsgIdx(Math.floor(Math.random() * msgs.length));
    const t = setInterval(() => setMsgIdx(i => (i + 1) % msgs.length), 4000);
    return () => clearInterval(t);
  }, [smiskiMood]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -8, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0,  duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(breathAnim, { toValue: 1.04, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(breathAnim, { toValue: 1.0,  duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    particles.forEach((p, i) => {
      if (running) {
        Animated.loop(Animated.sequence([
          Animated.delay(i * 600),
          Animated.timing(p, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(p, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])).start();
      } else { p.setValue(0); }
    });
  }, [running]);

  useEffect(() => {
    if (subjects.length > 0 && (!subject || !subjects.find(s => s.name === subject.name))) setSubject(subjects[0]);
    if (subjects.length === 0) setSubject(null);
  }, [subjects]);

  useEffect(() => {
    if (running && targetMinutes && elapsed >= targetMinutes * 60) {
      setRunning(false);
      Alert.alert('Time finished!', `${targetMinutes} minute session complete.`);
    }
  }, [elapsed, running, targetMinutes]);

  useEffect(() => {
    if (running) {
      setSmiskiMood('focus');
      startRef.current = Date.now() - elapsed * 1000;
      intRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 500);
    } else {
      clearInterval(intRef.current);
      setSmiskiMood(elapsed > 0 ? 'happy' : 'idle');
    }
    return () => clearInterval(intRef.current);
  }, [running]);

  const handleSave = () => {
    setRunning(false);
    clearInterval(intRef.current);
    const mins = Math.round(elapsed / 60);
    if (mins >= 1) {
      const xpEarned = mins * XP_PER_MINUTE;
      onSave({ subject: subject?.name || 'General', subjectColor: subject?.color || S.accent, durationMins: mins, type: 'standard', xpEarned });
      setSmiskiMood('happy');
      Alert.alert('Session saved! 🎉', `${mins} min of ${subject?.name || 'General'} logged. +${xpEarned} XP!`);
    } else {
      Alert.alert('Too short', 'Study for at least 1 minute to save.');
    }
    setElapsed(0);
  };

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const display = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;

  const xp = (appState?.sessions || []).reduce((sum, s) => sum + (s.xpEarned || s.durationMins * XP_PER_MINUTE), 0);
  const streak = calcStreak(appState?.sessions || []);
  const msgs = SMISKI_MESSAGES[smiskiMood] || SMISKI_MESSAGES.idle;
  const currentMsg = msgs[msgIdx % msgs.length];

  const displayMood = (!running && elapsed > 0) ? 'sleep' : smiskiMood;

  const smiskiImage = displayMood === 'focus'
    ? require('../../assets/study.png')
    : displayMood === 'happy'
    ? require('../../assets/happy.png')
    : require('../../assets/idle.png');

  return (
    <Animated.View style={[ss.screen, { backgroundColor: S.bg, transform: [{ translateY: slideAnim }], opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={ss.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[ss.header, { backgroundColor: S.accent }]}>
          <Text style={[ss.headerTitle, { color: '#b8d4f0', letterSpacing: 2, fontFamily: 'SpecialElite_400Regular' }]}>StudySmiski</Text>
        </View>

        <View style={ss.body}>

          <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginBottom: 12 }}>
            <View style={[cf.statChip, { backgroundColor: S.card, borderColor: S.border, flex: 1 }]}>
              <Text style={{ fontSize: 18 }}> ★ </Text>
              <Text style={[cf.statChipTxt, { color: S.text }]}>{streak}d streak</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAchieve(true)} style={[cf.statChip, { backgroundColor: S.card, borderColor: S.border, flex: 1 }]}>
              <Text style={{ fontSize: 18 }}>♕</Text>
              <Text style={[cf.statChipTxt, { color: S.text }]}>badges</Text>
            </TouchableOpacity>
          </View>

          <XPBar xp={xp} color={S.accentLt} />

          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 8, height: 200 }}>
            {running && elapsed > 0 && targetMinutes && (
              <View style={{ position: 'absolute' }}>
                <ProgressRing
                  progress={Math.min(elapsed / (targetMinutes * 60), 1)}
                  size={170} strokeWidth={5} color={S.accentLt} bgColor={`${S.border}55`}
                />
              </View>
            )}

            {particles.map((p, i) => (
              <Animated.View key={i} style={{
                position: 'absolute',
                left: 60 + i * 30,
                opacity: p.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.9, 0] }),
                transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [20, -50] }) }],
              }}>
                <Text style={{ fontSize: 14 }}>✨</Text>
              </Animated.View>
            ))}

            <View style={[ss.bubble, { backgroundColor: S.card, borderColor: S.border }]}>
              <Text style={{ fontSize: 11, color: S.textMid, fontFamily: 'SpecialElite_400Regular' }}>{currentMsg}</Text>
              <View style={[ss.bubbleTail, { borderTopColor: S.card }]} />
            </View>

            <Animated.View style={{
              transform: [{ translateY: floatAnim }, { scale: breathAnim }],
              shadowColor: '#b6ff8a',
              shadowOpacity: isDark ? 0.9 : 0,
              shadowRadius: isDark ? 35 : 0,
              shadowOffset: { width: 0, height: 0 },
            }}>
              <Image
                source={smiskiImage}
                style={{ width: 130, height: 130, borderRadius: 65 }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {isNight && <Text style={{ fontSize: 11, color: S.textMute, marginBottom: 4 }}>🌙 night mode</Text>}

          <Text style={[ss.workLabel, { color: S.textMute }]}>Work Time</Text>
          <Text style={[ss.clock, { color: running ? S.text : S.textMid, fontFamily: 'SpecialElite_400Regular' }]}>{display}</Text>

          {subjects.length > 0 ? (
            <TouchableOpacity onPress={() => setShowSubj(true)} style={[ss.subjBtn, { backgroundColor: S.card, borderColor: S.border }]}>
              {subject && <View style={[ss.subjDot, { backgroundColor: subject.color }]} />}
              <Text style={[ss.subjTxt, { color: subject?.color || S.textMute, fontFamily: 'SpecialElite_400Regular' }]}>
                {subject?.name || 'select subject'} ▾
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[ss.noSubjHint, { color: S.textMute, fontFamily: 'SpecialElite_400Regular' }]}>
              + create subjects in the timer tab
            </Text>
          )}

          <View style={ss.durationRow}>
            {[null, 20, 30, 45, 60].map((n, i) => (
              <TouchableOpacity key={i} onPress={() => setTargetMinutes(n)}
                style={[ss.durPill, { backgroundColor: targetMinutes === n ? S.accent : S.card, borderColor: S.border }]}>
                <Text style={{ color: targetMinutes === n ? '#fff' : S.textMid, fontSize: 11, fontFamily: 'SpecialElite_400Regular' }}>
                  {n ? `${n}m` : '∞'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={() => setShowAmbience(true)}
            style={[cf.ambienceBtn, { backgroundColor: S.card, borderColor: ambient.activeKey ? S.accentLt : S.border, marginBottom: 12, width: '100%' }]}>
            <Text style={{ fontSize: 14 }}>{ambient.activeKey ? '⏸' : '▶'}</Text>
            <Text style={[cf.ambienceBtnTxt, { color: ambient.activeKey ? S.accentLt : S.textMute }]}>
              {ambient.activeKey ? `${SMISKI_AMBIENCE.find(a => a.key === ambient.activeKey)?.label} playing` : 'music off'}
            </Text>
            <Text style={{ fontSize: 11, color: S.textMute }}>▾</Text>
          </TouchableOpacity>

          <View style={ss.controls}>
            {!running ? (
              <TouchableOpacity style={[ss.startBtn, { backgroundColor: S.accent }]} onPress={() => setRunning(true)}>
                <Text style={[ss.startBtnTxt, { color: '#b8d4f0', fontFamily: 'VT323_400Regular', fontSize: 22 }]}>
                  ▶ {elapsed > 0 ? 'Resume' : 'Start'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[ss.pauseBtn, { backgroundColor: S.card, borderColor: S.border }]} onPress={() => setRunning(false)}>
                <Text style={[ss.pauseBtnTxt, { color: S.accentLt, fontFamily: 'VT323_400Regular', fontSize: 22 }]}>𓊕 Pause</Text>
              </TouchableOpacity>
            )}
            {elapsed > 0 && !running && (
              <TouchableOpacity style={[ss.resetBtn, { backgroundColor: S.card, borderColor: S.border }]} onPress={() => setElapsed(0)}>
                <Text style={[ss.resetBtnTxt, { color: S.textMute, fontFamily: 'SpecialElite_400Regular' }]}>↺ Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          {elapsed > 0 && !running && (
            <TouchableOpacity style={[ss.saveBtn, { backgroundColor: S.accentLt }]} onPress={handleSave}>
              <Text style={[ss.saveBtnTxt, { color: '#fff', fontFamily: 'VT323_400Regular', fontSize: 22 }]}>◆ Save Session</Text>
            </TouchableOpacity>
          )}

          <Text style={[ss.footerTxt, { color: S.textMute, fontFamily: 'SpecialElite_400Regular' }]}>STUDYSMISKI · FOCUS TIMER</Text>
        </View>
      </ScrollView>

      {showSubj && (
        <SubjectSheet subjects={subjects} selected={subject}
          onSelect={(s) => { setSubject(s); setShowSubj(false); }}
          onClose={() => setShowSubj(false)}
          onAdd={onAddSubject} onDelete={onDeleteSubject} colors={colors} />
      )}
      <AmbienceModal visible={showAmbience} onClose={() => setShowAmbience(false)}
        options={SMISKI_AMBIENCE} ambient={ambient} accentColor={S.accentLt} bgColor={S.card} textColor={S.text} />
      <AchievementsModal visible={showAchieve} onClose={() => setShowAchieve(false)}
        appState={appState} bgColor={S.card} textColor={S.text} accentColor={S.accentLt} />
    </Animated.View>
  );
}

function SubjectSheet({ subjects, selected, onSelect, onClose, onAdd, onDelete, colors }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const handleAdd = () => {
    const t = newName.trim();
    if (!t) return;
    if (subjects.find(s => s.name.toLowerCase() === t.toLowerCase())) { Alert.alert('Already exists'); return; }
    onAdd({ name: t, color: newColor });
    setNewName(''); setNewColor(PRESET_COLORS[0]); setAdding(false);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sh.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[sh.sheet, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={[sh.handle, { backgroundColor: colors.border }]} />
        <View style={sh.sheetHeader}>
          <Text style={[sh.sheetTitle, typography.heading, { color: colors.text }]}>choose subject</Text>
          <TouchableOpacity onPress={() => setAdding(!adding)} style={[sh.addBtn, { backgroundColor: colors.primaryPale }]}>
            <Text style={[sh.addBtnTxt, { color: colors.primary }]}>{adding ? 'cancel' : '+ new'}</Text>
          </TouchableOpacity>
        </View>
        {adding && (
          <View style={[sh.addForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[sh.nameInput, typography.body, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="subject name..." placeholderTextColor={colors.textLight}
              value={newName} onChangeText={setNewName} maxLength={20} autoFocus
            />
            <View style={sh.colorRowWrap}>
              {PRESET_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => setNewColor(c)}
                  style={[sh.colorDot, { backgroundColor: c }, newColor === c && { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.2 }] }]} />
              ))}
            </View>
            <TouchableOpacity style={[sh.saveBtn, { backgroundColor: colors.primary }, !newName.trim() && { opacity: 0.4 }]}
              onPress={handleAdd} disabled={!newName.trim()}>
              <Text style={[sh.saveBtnTxt, { color: '#fff' }]}>add subject</Text>
            </TouchableOpacity>
          </View>
        )}
        {subjects.length === 0 && !adding && (
          <View style={{ padding: spacing.lg, alignItems: 'center' }}>
            <Text style={[{ fontSize: 13, color: colors.textMuted, textAlign: 'center' }, typography.body]}>
              No subjects yet. Tap + new to create one.
            </Text>
          </View>
        )}
        <ScrollView showsVerticalScrollIndicator={false}>
          {subjects.map(s => (
            <View key={s.name} style={[sh.subjRow, { borderBottomColor: colors.borderLight }]}>
              <TouchableOpacity style={sh.subjRowInner} onPress={() => onSelect(s)}>
                <View style={[sh.pip, { backgroundColor: s.color }]} />
                <Text style={[sh.subjRowTxt, typography.body, { color: selected?.name === s.name ? s.color : colors.text },
                  selected?.name === s.name && { fontWeight: '700' }]}>
                  {s.name}
                </Text>
                {selected?.name === s.name && <Text style={{ fontSize: 14, color: s.color }}>✓</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Delete?', `Remove "${s.name}"?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(s.name) },
              ])} style={sh.delBtn}>
                <Text style={[sh.delBtnTxt, { color: colors.textMuted }]}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}


export default function TimerScreen() {
  const { state, dispatch } = useApp();
  const { colors } = useTheme();
  const [mode, setMode] = useState('cafe');

  const tabSlide = useRef(new Animated.Value(0)).current;

  const switchMode = (m) => {
    if (m === mode) return;
    const dir = m === 'smiski' ? -1 : 1;
    tabSlide.setValue(dir * 30);
    setMode(m);
    Animated.timing(tabSlide, { toValue: 0, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };

  const subjects = state.subjects || [];
  const handleSave = (payload) => dispatch({ type: 'ADD_SESSION', payload });
  const handleAddSubject = (subj) => dispatch({ type: 'ADD_SUBJECT', payload: subj });
  const handleDeleteSubject = (name) => dispatch({ type: 'DELETE_SUBJECT', payload: name });

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayMins = state.sessions.filter(s => s.date === today).reduce((sum, s) => sum + s.durationMins, 0);
  const streak = calcStreak(state.sessions || []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={[mainStyles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[mainStyles.tab, mode === 'cafe' && { borderBottomWidth: 2, borderBottomColor: '#4e433c' }]}
          onPress={() => switchMode('cafe')}
        >
          <Text style={[mainStyles.tabTxt, { color: mode === 'cafe' ? '#513d30' : colors.textMuted }]}>
            ⋆☕︎ ˖︎  café focus
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[mainStyles.tab, mode === 'smiski' && { borderBottomWidth: 2, borderBottomColor: '#2a4a6a' }]}
          onPress={() => switchMode('smiski')}
        >
          <Text style={[mainStyles.tabTxt, { color: mode === 'smiski' ? '#2a4a6a' : colors.textMuted }]}>
            ⋆˚✿˖°  studysmiski
          </Text>
        </TouchableOpacity>
      </View>

      {/* Today badge */}
      {todayMins > 0 && (
        <View style={[mainStyles.todayBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[mainStyles.todayTxt, typography.caption, { color: colors.textMuted }]}>
            ◆ {todayMins}m studied today  {streak > 1 ? `· ❀ ${streak} day streak` : ''}
          </Text>
        </View>
      )}

      <Animated.View style={{ flex: 1, transform: [{ translateX: tabSlide }] }}>
        {mode === 'cafe' ? (
          <CafeFocusTimer
            onSave={handleSave} subjects={subjects}
            onAddSubject={handleAddSubject} onDeleteSubject={handleDeleteSubject}
            appState={state}
          />
        ) : (
          <StudySmiskiTimer
            onSave={handleSave} subjects={subjects}
            onAddSubject={handleAddSubject} onDeleteSubject={handleDeleteSubject}
            appState={state}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const mainStyles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabTxt: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  todayBar:{ paddingHorizontal: 20, paddingVertical: 6, borderBottomWidth: 1 },
  todayTxt:{ fontSize: 11 },
});

const cf = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent:{ paddingBottom: 80 },
  header: { paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontFamily: 'SpecialElite_400Regular', letterSpacing: 4, fontWeight: '700' },
  cafeTag: { marginTop: 6, paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20 },
  cafeTagTxt: { fontSize: 12, fontFamily: 'SpecialElite_400Regular' },
  orderBody: { padding: 20, alignItems: 'center' },
  orderTitle: { fontSize: 14, fontFamily: 'SpecialElite_400Regular', letterSpacing: 3, marginBottom: 4 },
  orderSub: { fontSize: 11, fontFamily: 'SpecialElite_400Regular', marginBottom: 12 },
  dividerDot: { width: '100%', borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 8 },
  dividerDotRow:{ marginVertical: 8, alignItems: 'center' },
  dots: { fontSize: 12, letterSpacing: 4 },
  brewRow: { width: '100%', flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  brewEmoji: { fontSize: 24, marginRight: 14, width: 36, textAlign: 'center' },
  brewName: { fontSize: 14, fontFamily: 'SpecialElite_400Regular', fontWeight: '700' },
  brewDesc: { fontSize: 11, fontFamily: 'SpecialElite_400Regular', marginTop: 2 },
  brewCheck: { fontSize: 18 },
  subjRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  subjDot: { width: 9, height: 9, borderRadius: 5 },
  subjName: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  subjArrow: { fontSize: 12 },
  brewCount: { fontSize: 13, fontFamily: 'SpecialElite_400Regular', marginBottom: 12, alignSelf: 'flex-start' },
  brewCountNum: { fontSize: 14, fontFamily: 'SpecialElite_400Regular', fontWeight: '700' },
  orderBtn: { width: '100%', paddingVertical: 16, borderRadius: 28, alignItems: 'center', marginTop: 4 },
  orderBtnTxt: { fontSize: 24, fontFamily: 'VT323_400Regular', letterSpacing: 2 },
  timerBody: { padding: 24, alignItems: 'center' },
  cupWrap: { alignItems: 'center', marginBottom: 10 },
  steamRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 2 },
  steam: { fontSize: 18, letterSpacing: 8 },
  cupOuter: { width: 90, height: 70, borderRadius: 8, borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  cupLiquid: { position: 'absolute', left: 0, right: 0, borderRadius: 4 },
  cupLabel: { fontSize: 28, zIndex: 1 },
  saucer: { width: 110, height: 6, borderRadius: 3, marginTop: 4 },
  timerNum: { fontSize: 56, fontFamily: 'SpecialElite_400Regular', fontWeight: '700', letterSpacing: -1, marginBottom: 6 },
  timerStatus: { fontSize: 12, fontFamily: 'SpecialElite_400Regular', marginBottom: 12 },
  divLine: { width: '80%', height: 1, marginBottom: 16 },
  ctrlBtn: { width: '100%', paddingVertical: 14, borderRadius: 28, alignItems: 'center', marginBottom: 14 },
  ctrlBtnTxt: { fontSize: 24, fontFamily: 'VT323_400Regular', fontWeight: '700' },
  waveLabel: { fontSize: 11, fontFamily: 'SpecialElite_400Regular', marginBottom: 8 },
  waveRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  waveNode: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  waveNodeTxt: { fontSize: 14 },
  endBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  endBtnTxt: { fontSize: 12, fontFamily: 'SpecialElite_400Regular' },
  footer: { fontSize: 10, fontFamily: 'SpecialElite_400Regular', letterSpacing: 2, marginTop: 8 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  statChipTxt: { fontSize: 11, fontFamily: 'SpecialElite_400Regular' },
  ambienceBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 10, width: '100%' },
  ambienceBtnTxt:{ flex: 1, fontSize: 12, fontFamily: 'SpecialElite_400Regular' },
  soundRow: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 12 },
  soundBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
});

const ss = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent:{ paddingBottom: 80 },
  header: { paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  body: { padding: 20, alignItems: 'center' },
  bubble: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, borderWidth: 1, marginBottom: 8, position: 'relative' },
  bubbleTail: { position: 'absolute', bottom: -7, left: '50%', marginLeft: -6, width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  workLabel: { fontSize: 12, letterSpacing: 2, marginBottom: 6, fontFamily: 'SpecialElite_400Regular' },
  clock: { fontSize: 52, fontWeight: '700', letterSpacing: 3, marginBottom: 12 },
  subjBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, width: '100%' },
  subjDot: { width: 9, height: 9, borderRadius: 5 },
  subjTxt: { fontSize: 13 },
  noSubjHint: { fontSize: 11, marginBottom: 10 },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  durPill: { fontSize: 11, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, overflow: 'hidden', alignItems: 'center' },
  controls: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 10 },
  startBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  startBtnTxt: { fontSize: 15, fontWeight: '700' },
  pauseBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  pauseBtnTxt: { fontSize: 14 },
  resetBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  resetBtnTxt: { fontSize: 14 },
  saveBtn: { width: '100%', paddingVertical: 13, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  saveBtnTxt: { fontSize: 14, fontWeight: '700' },
  footerTxt:{ fontSize: 10, letterSpacing: 2, marginTop: 12 },
});

const sh = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '70%', borderTopWidth: 1 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontSize: 18 },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  addBtnTxt: { fontSize: 13 },
  addForm: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1 },
  nameInput: { borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: spacing.sm, borderWidth: 1 },
  colorRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  colorDot: { width: 26, height: 26, borderRadius: 13 },
  saveBtn: { borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  saveBtnTxt: { fontSize: 13, color: '#fff' },
  subjRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  subjRowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, paddingVertical: 13, paddingHorizontal: spacing.sm },
  pip: { width: 10, height: 10, borderRadius: 5 },
  subjRowTxt:{ fontSize: 15, flex: 1 },
  delBtn: { padding: 12 },
  delBtnTxt:{ fontSize: 22 },
});