import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius } from '../theme';

const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// Stores the available event categories used throughout the calendar
// each type contains an icon, colour and cafe themed label for display
const EVENT_TYPES = [
  { id: 'deadline', label: 'deadline', cafeLabel: 'espresso',  icon: '☕', color: '#b04040' },
  { id: 'exam', label: 'exam', cafeLabel: 'matcha', icon: '🍵', color: '#5a8a50' },
  { id: 'reminder', label: 'reminder', cafeLabel: 'latte', icon: '🥛', color: '#b07830' },
  { id: 'event', label: 'event', cafeLabel: 'cold brew', icon: '✦',  color: '#405890' },
];
// converts the EVENT_TYPES array into lookup objects for faster access
// instead of searching the array every time an event is displayed
const TYPE_MAP = Object.fromEntries(EVENT_TYPES.map(t => [t.id, t]));
const TYPE_COLOR = Object.fromEntries(EVENT_TYPES.map(t => [t.id, t.color]));

// Reusable decorative divider displayed throughout pop up windows
// to maintain the cafe receipt theme and improve visual consistency 
function Dashes({ color }) {
  return (
    <Text style={{ color: color || '#c0b4a4', fontSize: 10, letterSpacing: 0.5, textAlign: 'center', marginVertical: 8 }}>
      {'• • • • • • • • • • • • • • • •'}
    </Text>
  );
}

function TodayPopup({ events, onClose, onAdd, colors, border, ink, muted, accent }) {
  // Creates animated values used to fade and slide the popup
// into view when it is opened
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  // runs the open animation once when the popup is displayed
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start();
  }, []);

// plays the closing animation before removing the popup from the screen
  const dismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 30, duration: 200, useNativeDriver: true }),
    ]).start(onClose);
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss}>
      <TouchableOpacity style={pop.overlay} activeOpacity={1} onPress={dismiss} />
      <Animated.View style={[pop.sheet, { backgroundColor: colors.paper, borderColor: border, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={pop.punchRow}>
          {[0,1,2,3,4,5,6,7].map(i => (
            <View key={i} style={[pop.punch, { borderColor: border }]} />
          ))}
        </View>

        <Text style={[pop.title, { color: muted }]}>✦  today's orders  ✦</Text>
        <Text style={[pop.sub, { color: muted }]}>{format(new Date(), 'EEEE, d MMMM')}</Text>
        <Dashes color={border} />

{/* Displays all events scheduled for today, if no events exist, an empty state msg is shown instead */}

        {events.length > 0 ? (
          events.map(ev => {
            const t = TYPE_MAP[ev.type] || TYPE_MAP.event;
            return (
              <View key={ev.id} style={pop.evRow}>
                <Text style={[pop.evIcon, { color: t.color }]}>{t.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[pop.evTitle, { color: ink }]}>{ev.title}</Text>
                  <Text style={[pop.evMeta, { color: muted }]}>{t.cafeLabel} · {ev.subject || 'general'}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={[pop.empty, { color: muted }]}>nothing on today's menu</Text>
        )}

        <Dashes color={border} />

        <TouchableOpacity style={[pop.addBtn, { backgroundColor: accent }]} onPress={() => { dismiss(); onAdd(); }}>
          <Text style={pop.addBtnTxt}>+ place new order</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={dismiss} style={{ marginTop: 10, alignItems: 'center' }}>
          <Text style={[pop.closeHint, { color: muted }]}>tap outside to close</Text>
        </TouchableOpacity>

        <View style={pop.punchRow}>
          {[0,1,2,3,4,5,6,7].map(i => (
            <View key={i} style={[pop.punch, { borderColor: border }]} />
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}     

function EventModal({ initial, subjects, onSave, onDelete, onClose, colors, border, ink, muted, accent }) {
 // Stores the values entered by the user while creating or editing a calendar event
  const [title, setTitle] = useState(initial?.title || '');
  const [subject, setSubject] = useState(initial?.subject || '');
  const [date, setDate] = useState(initial?.date || format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(initial?.time || '');
  const [type, setType] = useState(initial?.type || 'deadline');

  // Validates that an event title has been entered before saving the event to the application state
  const save = () => {
    if (!title.trim()) { Alert.alert('Enter a title'); return; }
    onSave({ title, subject, date, time, type });
    onClose();
  };
  // Confirms the deletion request before permanently removing the selected event
  const del = () => Alert.alert('Delete?', '', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => { onDelete(); onClose(); } },
  ]);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={calS.overlay} activeOpacity={1} onPress={onClose} />
        <View style={[calS.sheet, { backgroundColor: colors.paper, borderTopColor: border }]}>
          <View style={[pop.punchRow, { marginBottom: 8 }]}>
            {[0,1,2,3,4,5,6,7].map(i => <View key={i} style={[pop.punch, { borderColor: border }]} />)}
          </View>

          <Text style={[calS.sheetTitle, { color: ink, fontFamily: 'SpecialElite_400Regular' }]}>
            {initial ? '✦  edit order' : '✦  place order'}
          </Text>
          <Dashes color={border} />

          <Text style={[calS.fieldLabel, { color: muted }]}>order name</Text>
          <TextInput
            style={[calS.fieldInput, { backgroundColor: colors.inputBg, borderColor: border, color: ink, fontFamily: 'SpecialElite_400Regular' }]}
            value={title} onChangeText={setTitle}
            placeholder="e.g. Maths SAC" placeholderTextColor={muted}
          />

          <Text style={[calS.fieldLabel, { color: muted }]}>category</Text>
          {/* Allows the user to select an event category, The selected category changes the event's icon and colour */}
          <View style={calS.typeRow}>
            {EVENT_TYPES.map(t => (
              <TouchableOpacity key={t.id} onPress={() => setType(t.id)}
                style={[calS.typeChip, { borderColor: border, backgroundColor: colors.chipBg },
                  type === t.id && { backgroundColor: t.color + '22', borderColor: t.color + '80' }]}>
                <Text style={{ fontSize: 12, marginRight: 4 }}>{t.icon}</Text>
                <Text style={[calS.typeChipTxt, { color: type === t.id ? t.color : muted }]}>{t.cafeLabel}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[calS.fieldLabel, { color: muted }]}>subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            <TouchableOpacity onPress={() => setSubject('')}
              style={[calS.typeChip, { borderColor: border, backgroundColor: colors.chipBg, marginRight: 8 },
                subject === '' && { backgroundColor: accent + '22', borderColor: accent + '60' }]}>
              <Text style={[calS.typeChipTxt, { color: subject === '' ? accent : muted }]}>none</Text>
            </TouchableOpacity>
            {/* Displays all available subjects so the user can associate an event with a specific study subject */}
            {(subjects || []).map(s => (


              <TouchableOpacity key={s.name || s} onPress={() => setSubject(s.name || s)}
                style={[calS.typeChip, { borderColor: border, backgroundColor: colors.chipBg, marginRight: 8 },
                  subject === (s.name || s) && { backgroundColor: (s.color || accent) + '22', borderColor: (s.color || accent) + '60' }]}>
                <Text style={[calS.typeChipTxt, { color: subject === (s.name || s) ? (s.color || accent) : muted }]}>
                  {s.name || s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[calS.fieldLabel, { color: muted }]}>pickup date (YYYY-MM-DD)</Text>
          <TextInput
            style={[calS.fieldInput, { backgroundColor: colors.inputBg, borderColor: border, color: ink, fontFamily: 'SpecialElite_400Regular' }]}
            value={date} onChangeText={setDate}
            placeholder="2026-06-15" placeholderTextColor={muted} keyboardType="numeric"
          />

          <Text style={[calS.fieldLabel, { color: muted }]}>time (optional)</Text>
          <TextInput
            style={[calS.fieldInput, { backgroundColor: colors.inputBg, borderColor: border, color: ink, fontFamily: 'SpecialElite_400Regular' }]}
            value={time} onChangeText={setTime}
            placeholder="09:00" placeholderTextColor={muted}
          />

          <Dashes color={border} />

          <View style={calS.modalActions}>
            <TouchableOpacity style={[calS.saveBtn, { backgroundColor: accent }]} onPress={save}>
              {/* Saves the new or edited event and updates the application's stored calendar data */}
              <Text style={[calS.saveBtnTxt]}>
                {initial ? 'save order' : 'place order  →'}
              </Text>
            </TouchableOpacity>
            {initial && (
              <TouchableOpacity style={[calS.delBtn, { backgroundColor: colors.chipBg, borderColor: border }]} onPress={del}>
                <Text style={[calS.delBtnTxt, { color: '#b04040' }]}>cancel order</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
// Global State Contexts
export default function CalendarScreen() {
  const { state, dispatch } = useApp(); // Event & subject global state
  const { isDark } = useTheme(); // Dark/Light mode theme state
  const { events, subjects } = state;
// Local Screen States
  const [month, setMonth] = useState(new Date()); // Currently displayed calendar month
  const [selected, setSelected] = useState(format(new Date(), 'yyyy-MM-dd')); // Selected date string
  const [showModal, setShowModal] = useState(false); // Add/Edit Modal visibility toggle
  const [editEv, setEditEv] = useState(null); // Holds target event object during edit operations
  const [showPopup, setShowPopup] = useState(true); // Today's summary popup visibility
// Helper Date Variable
  const today = format(new Date(), 'yyyy-MM-dd');
// Dynamic colour palette based on active theme 
  const bg  = isDark ? '#21201f': '#faf5ee';
  const paper = isDark ? '#2e2c2a': '#fffdf7';
  const ink = isDark ? '#d1c9bb': '#1e160a';
  const muted = isDark ? '#8a8078': '#6b5a45';
  const accent = isDark ? '#b8a882': '#7a5c38';
  const border = isDark ? '#3d3a36': '#c8bfb0';
  const inputBg = isDark ? '#1a1918': '#f5f0e8';
  const chipBg  = isDark ? '#2a2826': '#f0ece4';

  const themeColors = { paper, inputBg, chipBg };

// Calendar Date Computations
  const start = startOfMonth(month);
  const days = eachDayOfInterval({ start, end: endOfMonth(month) });
  const padDays = start.getDay();
// Filtering & queries 
  const eventDates = new Set(events.map(e => e.date)); // Quick existence lookup
  const selectedEvents = events.filter(e => e.date === selected);
  const todayEvents = events.filter(e => e.date === today && !e.done);
  const upcoming = events.filter(e => !e.done && e.date >= today).slice(0, 6);

  // Navigation Controls 
  /** Moves view to previous month */
  const prev = () => { const d = new Date(month); d.setMonth(d.getMonth() - 1); setMonth(d); };
  /** Moves view to next month */
  const next = () => { const d = new Date(month); d.setMonth(d.getMonth() + 1); setMonth(d); };
/*** Dispatches create or update operations to global reducer
   * Replaces existing event by deleting old payload first if editing */
  const handleSave = (data) => {
    if (editEv) dispatch({ type: 'DELETE_EVENT', payload: editEv.id });
    dispatch({ type: 'ADD_EVENT', payload: data });
  };
/**
   * Calculates relative days remaining for upcoming events
   * @param {string} date - ISO Date format (YYYY-MM-DD)
   * @returns {string} readable deadline proximity status */
  const daysLeftLabel = (date) => {
    const diff = Math.ceil((new Date(date) - new Date(today)) / 86400000) + 1;
    if (diff <= 0)  return 'overdue';
    if (diff === 1) return 'today';
    if (diff === 2) return 'tomorrow';
    return `${diff} days`;
  };

  return (
    <SafeAreaView style={[calS.safe, { backgroundColor: bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={calS.content} showsVerticalScrollIndicator={false}>
 {/* Screen Title Banner and Global "Add Event" Trigger */}
        <View style={calS.header}>
          <View>
            <Text style={[calS.storeName, { color: muted }]}>the study café</Text>
            <Text style={[calS.title, { color: ink }]}>café planner</Text>
          </View>
  {/* Opens Modal in "Create Mode" by clearing edit state */}
          <TouchableOpacity
            style={[calS.addBtn, { backgroundColor: accent }]}
            onPress={() => { setEditEv(null); setShowModal(true); }}
          >
            <Text style={calS.addBtnTxt}>+ order</Text>
          </TouchableOpacity>
        </View>

        <View style={[calS.receiptCard, { backgroundColor: paper, borderColor: border }]}>
          {/* Visual hole header decoration */}
          <View style={[pop.punchRow, { marginBottom: 12 }]}>
            {[0,1,2,3,4,5,6,7].map(i => <View key={i} style={[pop.punch, { borderColor: border }]} />)}
          </View>

          <Text style={[calS.receiptHeader, { color: muted }]}>☕  select your schedule  ☕</Text>
          <Dashes color={border} />
          <View style={calS.monthNav}>
            // * Decrements active month state 
            <TouchableOpacity style={[calS.navBtn, { backgroundColor: accent + '22', borderColor: accent + '40' }]} onPress={prev}>
              <Text style={[calS.navArrow, { color: accent }]}>←</Text>
              // * Increments active month state
            </TouchableOpacity>
            <Text style={[calS.monthTitle, { color: ink }]}>{format(month, 'MMMM yyyy').toUpperCase()}</Text>
            <TouchableOpacity style={[calS.navBtn, { backgroundColor: accent + '22', borderColor: accent + '40' }]} onPress={next}>
              <Text style={[calS.navArrow, { color: accent }]}>→</Text>
            </TouchableOpacity>
          </View>
// Day of the Week column headers 
          <View style={calS.dayHdrs}>
            {DAYS.map(d => (
              <Text key={d} style={[calS.dayHdr, { color: muted }]}>{d}</Text>
            ))}
          </View>
// Monthly date grid: renders padding cells + date buttons 
          <View style={calS.grid}>
            {Array.from({ length: padDays }, (_, i) => <View key={`p${i}`} style={calS.cell} />)}
            {days.map(day => {
              const ds    = format(day, 'yyyy-MM-dd');
              const isSel = ds === selected;
              const isTod = isToday(day);
              const dayEvs = events.filter(e => e.date === ds && !e.done);
              const hasEv  = eventDates.has(ds);
              const urgent = dayEvs.some(e => e.type === 'deadline' || e.type === 'exam');
              return (
              <TouchableOpacity key={ds}
              style={[calS.cell, isSel && { backgroundColor: accent, borderRadius: radius.sm }]}
              onPress={() => setSelected(ds)}
                >
               <Text style={[calS.cellNum, { color: ink }, isTod && { color: accent, fontWeight: '800' }, isSel && { color: '#fff', fontWeight: '800' }]}>
              {day.getDate()}
              </Text>
              {/* Urgent deadlines render 'Coffee' text; regular events render emoji */}
              {hasEv && (
              <Text style={{ fontSize: 7, color: urgent ? (isSel ? '#fff' : TYPE_COLOR.deadline) : (isSel ? '#fff' : accent) }}>
              {urgent ? 'Coffee' : '✦'}
                </Text>
                )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Dashes color={border} />
          
          {/* Section header for selected day's events */}

          <Text style={[calS.orderTitle, { color: muted }]}>
            {selected === today
              ? "TODAY'S ORDERS"
              : `ORDER #${format(parseISO(selected), 'd MMM').toUpperCase()}`}
          </Text>
//  List of events scheduled for the selected date 
          {selectedEvents.length > 0 ? (
            selectedEvents.map(ev => {
              const t = TYPE_MAP[ev.type] || TYPE_MAP.event;
              return (
                <TouchableOpacity key={ev.id}
                  style={[calS.evRow, { borderBottomColor: border }]}
                  onPress={() => { setEditEv(ev); setShowModal(true); }}
                >
                  <Text style={[calS.evIcon, { color: t.color }]}>{t.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[calS.evTitle, { color: ev.done ? muted : ink }, ev.done && { textDecorationLine: 'line-through' }]}>
                      {ev.title}
                    </Text>
                    <Text style={[calS.evMeta, { color: muted }]}>
                      {t.cafeLabel}{ev.subject ? ` · ${ev.subject}` : ''}{ev.time ? ` · ${ev.time}` : ''}
                    </Text>
                  </View>
                  {/* Completion toggle button */}
                  <TouchableOpacity
                    onPress={() => dispatch({ type: 'TOGGLE_EVENT_DONE', payload: ev.id })}
                    style={[calS.checkCircle, { borderColor: ev.done ? t.color : border, backgroundColor: ev.done ? t.color + '22' : 'transparent' }]}
                  >
                    {ev.done && <Text style={{ fontSize: 10, color: t.color }}>✓</Text>}
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          ) : (
            /* Empty state fallback when no items exist for the selected date */
            <View style={[calS.noEvs]}>
              <Text style={[calS.noEvsTxt, { color: muted }]}>nothing on the menu today</Text>
              <TouchableOpacity onPress={() => { setEditEv(null); setShowModal(true); }}>
                <Text style={[{ fontSize: 11, color: accent, fontFamily: 'SpecialElite_400Regular', textAlign: 'center', marginTop: 4 }]}>
                  + place an order →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Dashes color={border} />
{/* Bottom action button */}
          <TouchableOpacity style={[calS.placeBtn, { backgroundColor: accent }]} onPress={() => { setEditEv(null); setShowModal(true); }}>
            <Text style={calS.placeBtnTxt}>place new order  →</Text>
          </TouchableOpacity>
{/* Visual hole footer decoration */}
          <View style={[pop.punchRow, { marginTop: 16 }]}>
            {[0,1,2,3,4,5,6,7].map(i => <View key={i} style={[pop.punch, { borderColor: border }]} />)}
          </View>
        </View>

        {upcoming.length > 0 && (
          <View style={[calS.receiptCard, { backgroundColor: paper, borderColor: border }]}>
            <View style={[pop.punchRow, { marginBottom: 12 }]}>
              {[0,1,2,3,4,5,6,7].map(i => <View key={i} style={[pop.punch, { borderColor: border }]} />)}
            </View>
            <Text style={[calS.receiptHeader, { color: muted }]}>brewing soon</Text>
            <Dashes color={border} />

            {upcoming.map(ev => {
              const t = TYPE_MAP[ev.type] || TYPE_MAP.event;
              const l = daysLeftLabel(ev.date);
              const soon  = l === 'today' || l === 'tomorrow' || l === 'overdue';
              return (
                <TouchableOpacity key={ev.id}
                  style={[calS.upRow, { borderBottomColor: border }]}
                  onPress={() => { setSelected(ev.date); setEditEv(ev); setShowModal(true); }}
                >
                  <Text style={[calS.evIcon, { color: t.color }]}>{t.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[calS.evTitle, { color: ink }]}>{ev.title}</Text>
                    <Text style={[calS.evMeta, { color: muted }]}>
                      {format(parseISO(ev.date), 'EEE d MMM')}
                    </Text>
                  </View>
                  <View style={[calS.daysBadge, {
                    backgroundColor: soon ? t.color + '20' : accent + '15',
                    borderColor: soon ? t.color + '50' : border,
                  }]}>
                    <Text style={[calS.daysBadgeTxt, { color: soon ? t.color : accent }]}>
                      {l.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <Dashes color={border} />
            <View style={[pop.punchRow]}>
              {[0,1,2,3,4,5,6,7].map(i => <View key={i} style={[pop.punch, { borderColor: border }]} />)}
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {showPopup && (
        <TodayPopup
          events={todayEvents}
          onClose={() => setShowPopup(false)}
          onAdd={() => { setEditEv(null); setShowModal(true); }}
          colors={themeColors}
          border={border}
          ink={ink}
          muted={muted}
          accent={accent}
        />
      )}

      {showModal && (
        <EventModal
          initial={editEv}
          subjects={subjects || []}
          onSave={handleSave}
          onDelete={() => { if (editEv?.id) dispatch({ type: 'DELETE_EVENT', payload: editEv.id }); }}
          onClose={() => { setShowModal(false); setEditEv(null); }}
          colors={themeColors}
          border={border}
          ink={ink}
          muted={muted}
          accent={accent}
        />
      )}
    </SafeAreaView>
  );
}

const pop = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 16, right: 16,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderBottomWidth: 0,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32,
  },
  punchRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 4 },
  punch: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, backgroundColor: 'transparent' },
  title: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'SpecialElite_400Regular', textAlign: 'center', marginTop: 12 },
  sub: { fontSize: 11, fontFamily: 'SpecialElite_400Regular', textAlign: 'center', marginTop: 2, marginBottom: 4 },
  evRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  evIcon: { fontSize: 18, width: 24 },
  evTitle: { fontSize: 13, fontFamily: 'SpecialElite_400Regular' },
  evMeta: { fontSize: 10, fontFamily: 'SpecialElite_400Regular', marginTop: 2 },
  empty: { textAlign: 'center', fontSize: 12, fontFamily: 'SpecialElite_400Regular', paddingVertical: 12 },
  addBtn: { borderRadius: 8, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  addBtnTxt:{ color: '#fff', fontSize: 12, fontFamily: 'SpecialElite_400Regular', letterSpacing: 1 },
  closeHint:{ fontSize: 10, fontFamily: 'SpecialElite_400Regular', letterSpacing: 0.5 },
});

const calS = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  storeName: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'SpecialElite_400Regular', marginBottom: 2 },
  title: { fontSize: 28, fontFamily: 'SpecialElite_400Regular' },
  addBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addBtnTxt: { color: '#fff', fontSize: 12, fontFamily: 'SpecialElite_400Regular', letterSpacing: 0.5 },

  receiptCard: {
    borderTopWidth: 1, borderBottomWidth: 1, borderLeftWidth: 0, borderRightWidth: 0,
    borderStyle: 'dashed', paddingHorizontal: 16, paddingVertical: 16, marginBottom: 14,
    shadowColor: '#5a3a1a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10,
    shadowRadius: 6, elevation: 2,
  },
  receiptHeader: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'SpecialElite_400Regular', textAlign: 'center', marginBottom: 2 },

  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  navArrow: { fontSize: 16, fontFamily: 'SpecialElite_400Regular' },
  monthTitle: { fontSize: 14, fontFamily: 'SpecialElite_400Regular', letterSpacing: 1.5 },

  dayHdrs: { flexDirection: 'row', marginBottom: 4 },
  dayHdr: { flex: 1, fontSize: 9, textAlign: 'center', fontFamily: 'SpecialElite_400Regular', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: 1 },
  cellNum: { fontSize: 11, fontFamily: 'SpecialElite_400Regular' },

  orderTitle: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'SpecialElite_400Regular', textAlign: 'center', marginBottom: 8 },

  evRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  evIcon: { fontSize: 18, width: 28 },
  evTitle: { fontSize: 13, fontFamily: 'SpecialElite_400Regular' },
  evMeta: { fontSize: 10, fontFamily: 'SpecialElite_400Regular', marginTop: 2 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  noEvs: { paddingVertical: 16, alignItems: 'center' },
  noEvsTxt:{ fontSize: 12, fontFamily: 'SpecialElite_400Regular', textAlign: 'center' },

  placeBtn: { borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  placeBtnTxt: { color: '#fff', fontSize: 13, fontFamily: 'SpecialElite_400Regular', letterSpacing: 1 },

  upRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  daysBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1 },
  daysBadgeTxt: { fontSize: 9, fontFamily: 'SpecialElite_400Regular' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, borderTopWidth: 1 },
  sheetTitle: { fontSize: 20, marginBottom: 4 },
  fieldLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'SpecialElite_400Regular', marginBottom: 6, marginTop: spacing.md },
  fieldInput: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  typeChipTxt:{ fontSize: 11, fontFamily: 'SpecialElite_400Regular' },
  modalActions:{ flexDirection: 'row', gap: 12, marginTop: 8 },
  saveBtn: { flex: 1, borderRadius: 8, padding: 14, alignItems: 'center' },
  saveBtnTxt: { color: '#fff', fontSize: 14, fontFamily: 'SpecialElite_400Regular', letterSpacing: 0.5 },
  delBtn: { borderRadius: 8, padding: 14, alignItems: 'center', borderWidth: 1 },
  delBtnTxt: { fontSize: 13, fontFamily: 'SpecialElite_400Regular' },
});