import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

export const BADGES = [
  { id: 'first_drop', icon: '◇', title: 'First Drop', desc: 'Complete your first study session' },
  { id: 'flow_state', icon: '◈', title: 'Flow State', desc: 'Study for 2 hours in one session' },
  { id: 'deep_current', icon: '◉', title: 'Deep Current', desc: 'Study 5 days in a row' },
  { id: 'rising_tide', icon: '▲', title: 'Rising Tide', desc: 'Reach 10 total study hours' },
  { id: 'steady_stream',icon: '★', title: 'Steady Stream', desc: 'Complete 10 sessions' },
  { id: 'relentless', icon: '✦', title: 'Relentless', desc: 'Study 14 days in a row' },
  { id: 'ocean_mind', icon: '◈', title: 'Ocean Mind', desc: 'Reach 50 total study hours' },
  { id: 'ink_water', icon: '○', title: 'Ink & Water', desc: 'Create 10 notes' },
  { id: 'scriptorium', icon: '●', title: 'Scriptorium', desc: 'Create 25 notes' },
  { id: 'wave_rider', icon: '≋', title: 'Wave Rider', desc: 'Complete 5 wave sessions' },
  { id: 'tidekeeper', icon: '□', title: 'Tidekeeper', desc: 'Add 10 calendar events' },
  { id: 'still_water', icon: '◇', title: 'Still Water', desc: '30-day streak' },
  { id: 'deep_blue', icon: '❋', title: 'Deep Blue', desc: 'Reach 100 total study wurs' },
];

const DEFAULT_STATE = {
  sessions: [],
  notes: [],
  events: [],
  subjects: [],   
  rewards: {
    streak: 0,
    streakDates: [],
    unlockedBadges: [],
    waveCount: 0,
  },
  settings: {
    dailyGoalMins: 60,
    theme: 'dark',
  },
  profile: {
    name: '',
    username: '',
    bio: '',
    school: '',
    year: '',
    photoUri: null,
    isPrivate: false,
    connections: [],
    requests: [],
  },
};

function checkBadges(state) {
  const { sessions, notes, events, rewards } = state;
  const totalMins = sessions.reduce((s, x) => s + x.durationMins, 0);
  const totalHours = totalMins / 60;
  const waveCount = sessions.filter(s => s.type === 'wave').length;
  const streak = rewards.streak;
  const unlocked = new Set(rewards.unlockedBadges);

  const check = (id, cond) => { if (cond && !unlocked.has(id)) unlocked.add(id); };
  check('first_drop', sessions.length >= 1);
  check('flow_state', sessions.some(s => s.durationMins >= 120));
  check('deep_current', streak >= 5);
  check('rising_tide', totalHours >= 10);
  check('steady_stream', sessions.length >= 10);
  check('relentless', streak >= 14);
  check('ocean_mind', totalHours >= 50);
  check('ink_water', notes.length >= 10);
  check('scriptorium', notes.length >= 25);
  check('wave_rider', waveCount >= 5);
  check('tidekeeper', events.length >= 10);
  check('still_water', streak >= 30);
  check('deep_blue', totalHours >= 100);
  return [...unlocked];
}

function calcStreak(streakDates) {
  if (!streakDates || streakDates.length === 0) return 0;
  const sorted = [...new Set(streakDates)].sort().reverse();
  const today  = format(new Date(), 'yyyy-MM-dd');
  const yest   = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  if (sorted[0] !== today && sorted[0] !== yest) return 0;
  let streak = 0;
  let cur = new Date(sorted[0]);
  for (const d of sorted) {
    const diff = Math.round((new Date(sorted[0]) - new Date(d)) / 86400000);
    if (diff === streak) streak++;
    else break;
  }
  return streak;
}

function reducer(state, action) {
  switch (action.type) {

    case 'LOAD_STATE':
      return { ...DEFAULT_STATE, ...action.payload };

    case 'ADD_SESSION': {
      const today = format(new Date(), 'yyyy-MM-dd');
      const session = { ...action.payload, id: Date.now().toString(), date: today };
      const sessions = [...state.sessions, session];
      const waveCount = action.payload.type === 'wave'
        ? (state.rewards.waveCount || 0) + 1
        : (state.rewards.waveCount || 0);
      const streakDates = [...new Set([...(state.rewards.streakDates || []), today])];
      const streak = calcStreak(streakDates);
      const rewards = { ...state.rewards, streak, streakDates, waveCount };
      const newState = { ...state, sessions, rewards };
      const unlockedBadges = checkBadges(newState);
      return { ...newState, rewards: { ...rewards, unlockedBadges } };
    }

    case 'ADD_NOTE': {
      const note = {
        id: Date.now().toString(),
        title:     action.payload.title || 'Untitled',
        content:   action.payload.content || '',
        subject:   action.payload.subject || 'General',
        starred:   false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const notes = [note, ...state.notes];
      const newState = { ...state, notes };
      const unlockedBadges = checkBadges(newState);
      return { ...newState, rewards: { ...state.rewards, unlockedBadges } };
    }

    case 'UPDATE_NOTE': {
      const notes = state.notes.map(n =>
        n.id === action.payload.id
          ? { ...n, ...action.payload, updatedAt: new Date().toISOString() }
          : n
      );
      return { ...state, notes };
    }

    case 'DELETE_NOTE':
      return { ...state, notes: state.notes.filter(n => n.id !== action.payload) };

    case 'TOGGLE_STAR':
      return {
        ...state,
        notes: state.notes.map(n =>
          n.id === action.payload ? { ...n, starred: !n.starred } : n
        ),
      };

    case 'ADD_SUBJECT': {
      const exists = state.subjects.find(
        s => s.name.toLowerCase() === action.payload.name.toLowerCase()
      );
      if (exists) return state;
      return { ...state, subjects: [...state.subjects, action.payload] };
    }

    case 'DELETE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.filter(s => s.name !== action.payload),
      };

    case 'ADD_EVENT': {
      const event = { ...action.payload, id: Date.now().toString(), done: false };
      const events = [...state.events, event];
      const newState = { ...state, events };
      const unlockedBadges = checkBadges(newState);
      return { ...newState, rewards: { ...state.rewards, unlockedBadges } };
    }

    case 'DELETE_EVENT':
      return { ...state, events: state.events.filter(e => e.id !== action.payload) };

    case 'TOGGLE_EVENT_DONE':
      return {
        ...state,
        events: state.events.map(e =>
          e.id === action.payload ? { ...e, done: !e.done } : e
        ),
      };

    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };

    case 'TOGGLE_PRIVACY':
      return { ...state, profile: { ...state.profile, isPrivate: !state.profile.isPrivate } };

    case 'ACCEPT_REQUEST': {
      const username = action.payload;
      return {
        ...state,
        profile: {
          ...state.profile,
          connections: [...state.profile.connections, username],
          requests: state.profile.requests.filter(r => r !== username),
        },
      };
    }

    case 'DECLINE_REQUEST':
      return {
        ...state,
        profile: {
          ...state.profile,
          requests: state.profile.requests.filter(r => r !== action.payload),
        },
      };

    case 'REMOVE_CONNECTION':
      return {
        ...state,
        profile: {
          ...state.profile,
          connections: state.profile.connections.filter(c => c !== action.payload),
        },
      };

    case 'ADD_MOCK_REQUEST': {
      const username = action.payload;
      if (state.profile.connections.includes(username)) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          requests: [...state.profile.requests, username],
        },
      };
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('vv_state_v2');
        if (raw) dispatch({ type: 'LOAD_STATE', payload: JSON.parse(raw) });
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('vv_state_v2', JSON.stringify(state)).catch(() => {});
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}