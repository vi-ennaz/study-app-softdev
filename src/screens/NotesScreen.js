import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Modal, Alert, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, radius } from '../theme';

// Format an ISO date string to a more readable format 
function fmt(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}
// NoteEditor component for creating and editing notes, with title, content, subject selection
// and save/delete functionality
function NoteEditor({ note, subjects, onSave, onDelete, onClose, colors }) {
  const [title, setTitle] = useState(note?.title   || '');
  const [content, setContent] = useState(note?.content || '');
  const [subject, setSubject] = useState(note?.subject || subjects[0]?.name || 'General');
  const [showSubjs, setShowSubjs] = useState(false);
  const contentRef = useRef(null);

  // Determine the accent color based on the selected subject, defaulting to the primary color if no subject is selected
  const selectedSubject = subjects.find(s => s.name === subject);
  const accent = selectedSubject?.color || colors.primary;

// Save the note by calling the onSave callback with the title, content and subject, then close the editor
  const save = () => {
    onSave({ title: title || 'Untitled', content, subject });
    onClose();
  };
// Prompt the user with a confirmation alert before deleting the note, calling the onDelete callback if confirmed
  const del = () => {
    Alert.alert('Delete note?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { onDelete(); onClose(); } },
    ]);
  };
// Render the NoteEditor modal with a top bar for actions, subject selection
// and text inputs for title and content, along with a footer displaying word count and last edited date
  return (
    <Modal visible animationType="slide" onRequestClose={save}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, borderTopWidth: 3, borderTopColor: accent }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Top bar */}
          <View style={[edStyles.edBar, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={save} style={edStyles.edBarBtn}>
              <Text style={[edStyles.edBarTxt, typography.heading, { color: colors.primary }]}>done</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSubjs(!showSubjs)} style={edStyles.edSubjBtn}>
              <View style={[edStyles.edSubjDot, { backgroundColor: accent }]} />
              <Text style={[edStyles.edSubjTxt, typography.caption, { color: accent }]}>{subject} ▾</Text>
            </TouchableOpacity>
            {note && (
              <TouchableOpacity onPress={del} style={edStyles.edBarBtn}>
                <Text style={[edStyles.edBarTxt, typography.body, { color: colors.danger }]}>delete</Text>
              </TouchableOpacity>
            )}
          </View>
{/* Render the subject selection scroll view if showSubjs is true, allowing the user to select a subject for the note */}
          {showSubjs && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={[edStyles.subjScroll, { borderBottomColor: colors.border }]}>
              {subjects.length === 0 ? (
                <Text style={[edStyles.noSubjMsg, { color: colors.textMuted }]}>Create subjects in Timer tab</Text>
              ) : subjects.map(s => (
                <TouchableOpacity
                  key={s.name}
                  onPress={() => { setSubject(s.name); setShowSubjs(false); }}
                  style={[
                    edStyles.subjChip,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    subject === s.name && { backgroundColor: s.color + '18', borderColor: s.color + '80' },
                  ]}
                >
                  <View style={[edStyles.subjDot, { backgroundColor: s.color }]} />
                  <Text style={[edStyles.subjChipTxt, typography.caption,
                    { color: subject === s.name ? s.color : colors.textMuted }]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
{/* Render an accent line below the subject selection, using the accent color with reduced opacity */}
          <View style={[edStyles.accentLine, { backgroundColor: accent + '50' }]} />

          <ScrollView style={edStyles.edScroll} keyboardDismissMode="on-drag">
            <TextInput
              style={[edStyles.titleInput, typography.display, { color: colors.text, borderBottomColor: accent + '30' }]}
              value={title}
              onChangeText={setTitle}
              placeholder="note title..."
              placeholderTextColor={colors.textLight}
              returnKeyType="next"
              onSubmitEditing={() => contentRef.current?.focus()}
              multiline
            />
            <TextInput
              ref={contentRef}
              style={[edStyles.contentInput, typography.body, { color: colors.text }]}
              value={content}
              onChangeText={setContent}
              placeholder="start writing..."
              placeholderTextColor={colors.textLight}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={[edStyles.edFooter, { borderTopColor: colors.border }]}>
            <Text style={[edStyles.edMeta, typography.caption, { color: colors.textMuted }]}>
              {content.split(/\s+/).filter(Boolean).length} words
            </Text>
            <Text style={[edStyles.edMeta, typography.caption, { color: colors.textMuted }]}>
              {note ? `edited ${fmt(new Date().toISOString())}` : 'new note'}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
// displaying a section of content that can be expanded or collapsed, 
// with a header showing the title, symbol, count and an arrow indicating the state
function CollapsibleSection({ title, symbol, count, children, colors, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <TouchableOpacity
        onPress={() => setOpen(v => !v)}
        style={[csStyles.header, { borderBottomColor: colors.border }]}
      >
        <Text style={[csStyles.symbol, { color: colors.primary }]}>{symbol}</Text>
        <Text style={[csStyles.title, typography.subheading, { color: colors.textMuted }]}>{title}</Text>
        {count > 0 && (
          <View style={[csStyles.countBadge, { backgroundColor: colors.primaryPale }]}>
            <Text style={[csStyles.countTxt, { color: colors.primaryLight }]}>{count}</Text>
          </View>
        )}
        <Text style={[csStyles.arrow, { color: colors.textLight }]}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && <View style={{ paddingTop: spacing.xs }}>{children}</View>}
    </View>
  );
}
// Define the styles for the CollapsibleSection and NoteEditor components using StyleSheet.create, 
// including styles for the header, symbol, title, count badge, arrow, editor bar, buttons, text inputs, subject selection and footer
const csStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: spacing.sm, borderBottomWidth: 1, marginBottom: spacing.sm },
  symbol: { fontSize: 11 },
  title: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 },
  countBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full },
  countTxt: { fontSize: 10 },
  arrow: { fontSize: 10 },
});

// Define the styles for the NoteEditor component using StyleSheet.create, including styles for the editor bar, buttons, text inputs, subject selection and footer
const edStyles = StyleSheet.create({
  edBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  edBarBtn: { padding: spacing.xs },
  edBarTxt: { fontSize: 16 },
  edSubjBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  edSubjDot: { width: 8, height: 8, borderRadius: 4 },
  edSubjTxt: { fontSize: 13 },
  subjScroll: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  subjChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1, marginRight: 8 },
  subjDot: { width: 7, height: 7, borderRadius: 4 },
  subjChipTxt:{ fontSize: 11 },
  noSubjMsg: { fontSize: 12, paddingVertical: 8, paddingHorizontal: 4 },
  accentLine: { height: 1 },
  edScroll: { flex: 1, paddingHorizontal: spacing.lg },
  titleInput: { fontSize: 26, paddingTop: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1 },
  contentInput:{ fontSize: 15, lineHeight: 26, minHeight: 360, paddingBottom: 80, paddingTop: spacing.md },
  edFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderTopWidth: 1 },
  edMeta: { fontSize: 11 },
});

// NotesScreen component for displaying and managing notes, with search, filtering and note editing functionality
export default function NotesScreen() {
  const { state, dispatch } = useApp();
  const { colors } = useTheme();
  const { notes, subjects } = state;

  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState(null);

  const openNew  = () => { setEditing(null); setShowEditor(true); };
  const openEdit = (note) => { setEditing(note); setShowEditor(true); };

  const handleSave = ({ title, content, subject }) => {
    if (editing?.id) {
      dispatch({ type: 'UPDATE_NOTE', payload: { id: editing.id, title, content, subject } });
    } else {
      dispatch({ type: 'ADD_NOTE', payload: { title, content, subject } });
    }
  };
  const handleDelete = () => {
    if (editing?.id) dispatch({ type: 'DELETE_NOTE', payload: editing.id });
  };
  const toggleStar = (id) => dispatch({ type: 'TOGGLE_STAR', payload: id });

  const filtered = notes.filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
  );
// Sort the filtered notes by updatedAt in descending order and take the first 5 as recentNotes, then separate the other notes into starredNotes and otherNotes
  const recentNotes = [...filtered].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);
  const otherNotes = filtered.filter(n => !n.starred);
  const starredNotes  = filtered.filter(n => n.starred);

  // Render a single note card with title, content preview, subject and date, allowing the user to open the note for editing or toggle its starred status
  const renderNote = (note) => {
    const subjectObj = subjects.find(s => s.name === note.subject);
    const accent = subjectObj?.color || colors.primary;
    return (
      <TouchableOpacity
        key={note.id}
        style={[nStyles.noteCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: accent }]}
        onPress={() => openEdit(note)}
        activeOpacity={0.85}
      >
        <View style={nStyles.noteBody}>
          <View style={nStyles.noteTopRow}>
            <Text style={[nStyles.noteTitle, typography.heading, { color: colors.text }]} numberOfLines={1}>{note.title}</Text>
            <TouchableOpacity onPress={() => toggleStar(note.id)} hitSlop={{ top:8,right:8,bottom:8,left:8 }}>
              <Text style={[nStyles.starBtn, { color: note.starred ? colors.warning : colors.textMuted }]}>
                {note.starred ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[nStyles.notePreview, typography.caption, { color: colors.textMuted }]} numberOfLines={2}>
            {note.content || 'no content...'}
          </Text>
          <View style={nStyles.noteFoot}>
            <View style={[nStyles.subjectPill, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
              <View style={[nStyles.subjectDot, { backgroundColor: accent }]} />
              <Text style={[nStyles.subjectTxt, { color: accent }]}>{note.subject}</Text>
            </View>
            <Text style={[nStyles.noteDate, typography.caption, { color: colors.textLight }]}>{fmt(note.updatedAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
// Render the main NotesScreen component with a header, search bar, collapsible sections for recent, starred and all notes and a floating action button for creating new notes
  return (
    <SafeAreaView style={[nStyles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={nStyles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={nStyles.header}>
          <View>
            <Text style={[nStyles.title, typography.display, { color: colors.text }]}>notes</Text>
            <Text style={[nStyles.count, typography.caption, { color: colors.textMuted }]}>
              {notes.length} note{notes.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={[nStyles.newBtn, { backgroundColor: colors.primaryPale, borderColor: colors.borderGlow }]}
            onPress={openNew}
          >
            <Text style={[nStyles.newBtnTxt, typography.heading, { color: colors.primaryLight }]}>+ new</Text>
          </TouchableOpacity>
        </View>
{/* Render a message and button for creating a new note if there are no notes, otherwise render the search bar and collapsible sections for recent, starred and all notes */}
        {notes.length === 0 && (
          <View style={nStyles.bigEmpty}>
            <Text style={[nStyles.bigEmptySymbol, { color: colors.textLight }]}>○</Text>
            <Text style={[nStyles.bigEmptyTitle, typography.display, { color: colors.textMid }]}>no notes yet</Text>
            <Text style={[nStyles.bigEmptySub, typography.body, { color: colors.textMuted }]}>
              tap + to write your first note
            </Text>
            <TouchableOpacity
              style={[nStyles.bigEmptyBtn, { backgroundColor: colors.primaryPale, borderColor: colors.borderGlow }]}
              onPress={openNew}
            >
              <Text style={[nStyles.bigEmptyBtnTxt, typography.heading, { color: colors.primaryLight }]}>+ create note</Text>
            </TouchableOpacity>
          </View>
        )}

        {notes.length > 0 && (
          <>
            <View style={[nStyles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[nStyles.searchIcon, { color: colors.textMuted }]}>◇</Text>
              <TextInput
                style={[nStyles.searchInput, typography.body, { color: colors.text }]}
                value={search}
                onChangeText={setSearch}
                placeholder="search notes..."
                placeholderTextColor={colors.textLight}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={[{ fontSize: 13, padding: 4 }, { color: colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <CollapsibleSection
              title="recent"
              symbol="◷"
              count={recentNotes.length}
              colors={colors}
              defaultOpen={true}
            >
              {recentNotes.map(renderNote)}
            </CollapsibleSection>

            {starredNotes.length > 0 && (
              <CollapsibleSection
                title="favourites"
                symbol="★"
                count={starredNotes.length}
                colors={colors}
                defaultOpen={true}
              >
                {starredNotes.map(renderNote)}
              </CollapsibleSection>
            )}

            <CollapsibleSection
              title="all notes"
              symbol="○"
              count={otherNotes.length}
              colors={colors}
              defaultOpen={false}
            >
              {otherNotes.length === 0 ? (
                <Text style={[{ fontSize: 12, color: colors.textLight, paddingVertical: 8 }, typography.body]}>
                  no notes here
                </Text>
              ) : otherNotes.map(renderNote)}
            </CollapsibleSection>

            {filtered.length === 0 && (
              <View style={[nStyles.bigEmpty, { paddingTop: 30 }]}>
                <Text style={[{ fontSize: 13, color: colors.textMuted }, typography.body]}>no results found</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {notes.length > 0 && (
        <TouchableOpacity
          style={[nStyles.fab, { backgroundColor: colors.primary }]}
          onPress={openNew}
        >
          <Text style={nStyles.fabTxt}>+</Text>
        </TouchableOpacity>
      )}

      {showEditor && (
        <NoteEditor
          note={editing}
          subjects={subjects}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => { setShowEditor(false); setEditing(null); }}
          colors={colors}
        />
      )}
    </SafeAreaView>
  );
}
// Define the styles for the NotesScreen component using StyleSheet.create, including styles for the safe area, content, header, title, count, 
// new button, big empty state, search bar, note card and floating action button  
const nStyles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.lg },
  title: { fontSize: 30 },
  count: { fontSize: 12, marginTop: 2 },
  newBtn: { paddingHorizontal: spacing.lg, paddingVertical: 9, borderRadius: radius.full, borderWidth: 1 },
  newBtnTxt:{ fontSize: 14 },

  bigEmpty: { alignItems: 'center', paddingTop: 80, paddingBottom: 40, gap: spacing.md },
  bigEmptySymbol: { fontSize: 64, marginBottom: spacing.sm },
  bigEmptyTitle: { fontSize: 28 },
  bigEmptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  bigEmptyBtn: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: 12, borderRadius: radius.full, borderWidth: 1 },
  bigEmptyBtnTxt: { fontSize: 15 },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, height: 42, marginBottom: spacing.lg },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14 },

  noteCard: { borderLeftWidth: 4, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm, overflow: 'hidden' },
  noteBody: { padding: spacing.md },
  noteTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  noteTitle: { fontSize: 14, flex: 1, marginRight: 8 },
  starBtn: { fontSize: 16 },
  notePreview: { fontSize: 12, lineHeight: 18, marginBottom: spacing.sm },
  noteFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteDate: { fontSize: 10 },
  subjectPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1 },
  subjectDot: { width: 6, height: 6, borderRadius: 3 },
  subjectTxt: { fontSize: 10, fontFamily: 'Nunito_600SemiBold' },

  fab: { position: 'absolute', bottom: 24, right: 24, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  fabTxt: { fontSize: 28, color: '#fff', marginTop: -2 },
});