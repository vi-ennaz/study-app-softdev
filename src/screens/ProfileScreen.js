// ProfileScreen.js
// This screen displays the user's profile information, including their name, username, bio, school, year level, privacy settings, study stats, badges and recent sessions
// It also allows the user to edit their profile information and manage their connections
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Image, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useApp, BADGES } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, radius } from '../theme';
import { format } from 'date-fns';

// Define the EditProfileModal component, which allows the user to edit their profile information such as name, username, bio, school and year
function EditProfileModal({ profile, onSave, onClose, colors }) {
  const [name, setName] = useState(profile.name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [school, setSchool] = useState(profile.school || '');
  const [year, setYear] = useState(profile.year|| '');
// Define the save function, which validates the name field and calls the onSave callback with the updated profile information, then closes the modal
  const save = () => {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    onSave({ name, username, bio, school, year });
    onClose();
  };
// Define the inputStyle variable, which combines the editInput style with typography and colour styles based on the current theme
  const inputStyle = [pStyles.editInput, typography.body, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[pStyles.editSafe, { backgroundColor: colors.bg }]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding': undefined}>
          <View style={[pStyles.editBar, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[pStyles.editBarCancel, typography.body, { color: colors.textMuted }]}>cancel</Text>
            </TouchableOpacity>
            <Text style={[pStyles.editBarTitle, typography.heading, { color: colors.text }]}>edit profile</Text>
            <TouchableOpacity onPress={save}>
              <Text style={[pStyles.editBarSave, typography.heading, { color: colors.primary }]}>save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={pStyles.editContent} keyboardDismissMode="on-drag">
            {[
              // Define an array of fields to be displayed in the edit profile modal, each with a label, value, 
              // setter function and placeholder text
              { label: 'display name', val: name, set: setName, ph: 'your name' },
              { label: 'username', val: username, set: setUsername, ph: '@handle' },
              { label: 'school', val: school, set: setSchool, ph: 'school name' },
              { label: 'year level', val: year, set: setYear, ph: 'e.g. Year 12' },
            ].map(f => (
              <View key={f.label} style={pStyles.editField}>
                <Text style={[pStyles.editLabel, typography.caption, { color: colors.textMuted }]}>{f.label}</Text>
                <TextInput style={inputStyle} value={f.val} onChangeText={f.set} placeholder={f.ph} placeholderTextColor={colors.textLight} />
              </View>
            ))}
            <View style={pStyles.editField}>
              <Text style={[pStyles.editLabel, typography.caption, { color: colors.textMuted }]}>bio</Text>
              <TextInput
                style={[inputStyle, pStyles.editBio]}
                value={bio} onChangeText={setBio}
                placeholder="write something..." placeholderTextColor={colors.textLight}
                multiline numberOfLines={4} textAlignVertical="top" maxLength={150}
              />
              <Text style={[pStyles.charCount, typography.caption, { color: colors.textLight }]}>{bio.length}/150</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// Define the ConnectionsModal component, which allows the user to view and manage their connections, 
// requests and suggested connections
function ConnectionsModal({ profile, dispatch, onClose, tab: initTab, colors }) {
  const [tab, setTab] = useState(initTab || 'connections');
// Define the removeConnection function, which displays a confirmation alert 
// before dispatching an action to remove a connection from the user's profile
  const removeConnection = (username) => {
    Alert.alert('Remove connection?', `Remove ${username}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => dispatch({ type: 'REMOVE_CONNECTION', payload: username }) },
    ]);
  };
// Define the MOCK_USERS array, which contains some sample user data for testing purposes
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[pStyles.editSafe, { backgroundColor: colors.bg }]}>
        <View style={[pStyles.editBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={{ width: 60 }}>
            <Text style={[pStyles.editBarCancel, typography.body, { color: colors.textMuted }]}>close</Text>
          </TouchableOpacity>
          <Text style={[pStyles.editBarTitle, typography.heading, { color: colors.text }]}>connections</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={[pStyles.connTabs, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {['connections','requests','find'].map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              style={[pStyles.connTab, tab === t && { backgroundColor: colors.primaryPale }]}>
              <Text style={[pStyles.connTabTxt, typography.subheading, { color: tab === t ? colors.primaryLight : colors.textMuted }]}>
                {t === 'requests' ? `requests${profile.requests.length > 0 ? ` (${profile.requests.length})` : ''}` : t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
{/* Define the main content of the ConnectionsModal, */}
{/* which displays different views based on the selected tab (connections, requests or find) */}
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {tab === 'connections' && (
            profile.connections.length === 0 ? (
              <View style={pStyles.connEmpty}>
                <Text style={[pStyles.connEmptyIcon, { color: colors.textLight }]}>○</Text>
                <Text style={[pStyles.connEmptyTxt, typography.body, { color: colors.textMid }]}>no connections yet</Text>
              </View>
            ) : profile.connections.map(username => {
              const user = MOCK_USERS.find(u => u.username === username) || { username, name: username };
              return (
                <View key={username} style={[pStyles.userRow, { borderBottomColor: colors.borderLight }]}>
                  <View style={[pStyles.userAvatar, { backgroundColor: colors.primaryDeep, borderColor: colors.borderGlow }]}>
                    <Text style={[pStyles.userAvatarTxt, { color: colors.primaryLight }]}>{(user.name || username)[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[pStyles.userName, typography.subheading, { color: colors.text }]}>{user.name || username}</Text>
                    <Text style={[pStyles.userHandle, typography.caption, { color: colors.textMuted }]}>{username}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeConnection(username)}
                    style={[pStyles.connectedBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[pStyles.connectedBtnTxt, typography.caption, { color: colors.textMuted }]}>connected</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
{/* Define the content for the 'requests' tab, which displays pending connection requests .*/}
{/* and allows the user to accept or decline them */}
          {tab === 'requests' && (
            profile.requests.length === 0 ? (
              <View style={pStyles.connEmpty}>
                <Text style={[pStyles.connEmptyTxt, typography.body, { color: colors.textMid }]}>no pending requests</Text>
              </View>
            ) : profile.requests.map(username => {
              const user = MOCK_USERS.find(u => u.username === username) || { username, name: username };
              return (
                <View key={username} style={[pStyles.userRow, { borderBottomColor: colors.borderLight }]}>
                  <View style={[pStyles.userAvatar, { backgroundColor: colors.primaryDeep, borderColor: colors.borderGlow }]}>
                    <Text style={[pStyles.userAvatarTxt, { color: colors.primaryLight }]}>{(user.name || username)[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[pStyles.userName, typography.subheading, { color: colors.text }]}>{user.name || username}</Text>
                    <Text style={[pStyles.userHandle, typography.caption, { color: colors.textMuted }]}>{username}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => dispatch({ type: 'ACCEPT_REQUEST', payload: username })}
                      style={[pStyles.acceptBtn, { backgroundColor: colors.primary }]}>
                      <Text style={[pStyles.acceptBtnTxt, typography.caption, { color: '#fff' }]}>accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => dispatch({ type: 'DECLINE_REQUEST', payload: username })}
                      style={[pStyles.declineBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[pStyles.declineBtnTxt, typography.caption, { color: colors.textMuted }]}>decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
{/* Define the content for the 'find' tab, which displays suggested connections that the user can send connection requests to */}
          {tab === 'find' && (
            <>
              <Text style={[pStyles.findTitle, typography.caption, { color: colors.textMuted }]}>suggested connections</Text>
              {MOCK_USERS.filter(u => !profile.connections.includes(u.username) && !profile.requests.includes(u.username)).map(user => (
                <View key={user.username} style={[pStyles.userRow, { borderBottomColor: colors.borderLight }]}>
                  <View style={[pStyles.userAvatar, { backgroundColor: colors.primaryDeep, borderColor: colors.borderGlow }]}>
                    <Text style={[pStyles.userAvatarTxt, { color: colors.primaryLight }]}>{user.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[pStyles.userName, typography.subheading, { color: colors.text }]}>{user.name}</Text>
                    <Text style={[pStyles.userHandle, typography.caption, { color: colors.textMuted }]}>{user.username}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => { dispatch({ type: 'ADD_MOCK_REQUEST', payload: user.username }); Alert.alert('Request sent ◆', `Sent to ${user.name}`); }}
                    style={[pStyles.connectBtn, { backgroundColor: colors.primaryPale, borderColor: colors.borderGlow }]}>
                    <Text style={[pStyles.connectBtnTxt, typography.caption, { color: colors.primaryLight }]}>+ connect</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Define the main ProfileScreen component, which displays the user's profile information 
// and allows them to edit it or manage their connections
export default function ProfileScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const { colors }= useTheme();
  const { profile, sessions, notes, rewards } = state;

  const [showEdit, setShowEdit] = useState(false);
  const [showConns, setShowConns] = useState(false);
  const [connsTab, setConnsTab]  = useState('connections');

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]?.uri) {
      dispatch({ type: 'UPDATE_PROFILE', payload: { photoUri: result.assets[0].uri } });
    }
  };

  // Calculate today's date and the total minutes studied today and overall, as well as the total hours studied
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayMins = sessions.filter(s => s.date === today).reduce((sum, s) => sum + s.durationMins, 0);
  const totalMins = sessions.reduce((sum, s) => sum + s.durationMins, 0);
  const totalH = Math.floor(totalMins / 60);
  const openConns = (tab) => { setConnsTab(tab); setShowConns(true); };

  return (
    <SafeAreaView style={[pStyles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={pStyles.content} showsVerticalScrollIndicator={false}>

        <View style={[pStyles.topBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[pStyles.backTxt, typography.body, { color: colors.primary }]}>‹ home</Text>
          </TouchableOpacity>
          <Text style={[pStyles.topBarTitle, typography.heading, { color: colors.text }]}>profile</Text>
          <TouchableOpacity onPress={() => setShowEdit(true)}>
            <Text style={[pStyles.editBtnTxt, typography.body, { color: colors.primary }]}>edit</Text>
          </TouchableOpacity>
        </View>
{/* Define the top section of the profile screen, which displays the user's avatar, name, username, school and year level */}
        <View style={pStyles.profileTop}>
          <TouchableOpacity onPress={pickPhoto} style={pStyles.avatarWrap}>
            {profile.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={[pStyles.avatar, { borderColor: colors.primary }]} />
            ) : (
              <View style={[pStyles.avatarFallback, { backgroundColor: colors.primaryDeep, borderColor: colors.primary }]}>
                <Text style={[pStyles.avatarLetter, typography.display, { color: colors.primaryLight }]}>
                  {profile.name?.[0]?.toUpperCase() || 'V'}
                </Text>
              </View>
            )}
            <View style={[pStyles.avatarEditBadge, { backgroundColor: colors.primary, borderColor: colors.bg }]}>
              <Text style={pStyles.avatarEditTxt}>+</Text>
            </View>
          </TouchableOpacity>
          <View style={pStyles.profileInfo}>
            <Text style={[pStyles.profileName, typography.display, { color: colors.text }]}>{profile.name || 'Your Name'}</Text>
            <Text style={[pStyles.profileHandle, typography.caption, { color: colors.textMuted }]}>{profile.username || '@username'}</Text>
            {profile.school ? (
              <Text style={[pStyles.profileSchool, typography.caption, { color: colors.textMuted }]}>
                ○  {profile.school}{profile.year ? ` · ${profile.year}` : ''}
              </Text>
            ) : null}
          </View>
        </View>
{/* Define the bio section of the profile screen, which displays the user's bio if it exists or a prompt to add a bio if it doesn't */}
        {profile.bio ? (
          <Text style={[pStyles.bio, typography.body, { color: colors.textMid }]}>{profile.bio}</Text>
        ) : (
          <TouchableOpacity onPress={() => setShowEdit(true)}>
            <Text style={[pStyles.bioEmpty, typography.body, { color: colors.textLight }]}>+ add a bio...</Text>
          </TouchableOpacity>
        )}
{/* Define the privacy settings section of the profile screen, which displays whether the user's account is private 
or public and allows them to toggle the setting */}
        <View style={[pStyles.privacyRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View>
            <Text style={[pStyles.privacyLabel, typography.subheading, { color: colors.text }]}>
              {profile.isPrivate ? '◆  private account' : '○  public account'}
            </Text>
            <Text style={[pStyles.privacySub, typography.caption, { color: colors.textMuted }]}>
              {profile.isPrivate ? 'only connections see your stats' : 'anyone can view your profile'}
            </Text>
          </View>
          <Switch
            value={profile.isPrivate}
            onValueChange={() => dispatch({ type: 'TOGGLE_PRIVACY' })}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={profile.isPrivate ? colors.primary : colors.textMuted}
          />
        </View>
{/* Define the stats section of the profile screen, which displays the user's number of connections, 
pending requests and current day streak */}
        <View style={[pStyles.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={pStyles.statItem} onPress={() => openConns('connections')}>
            <Text style={[pStyles.statNum, typography.display, { color: colors.text }]}>{profile.connections.length}</Text>
            <Text style={[pStyles.statLabel, typography.caption, { color: colors.textMuted }]}>connections</Text>
          </TouchableOpacity>
          <View style={[pStyles.statDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={pStyles.statItem} onPress={() => openConns('requests')}>
            <Text style={[pStyles.statNum, typography.display, { color: colors.text }]}>
              {profile.requests.length}{profile.requests.length > 0 ? <Text style={{ color: colors.danger }}> ●</Text> : ''}
            </Text>
            <Text style={[pStyles.statLabel, typography.caption, { color: colors.textMuted }]}>requests</Text>
          </TouchableOpacity>
          <View style={[pStyles.statDivider, { backgroundColor: colors.border }]} />
          <View style={pStyles.statItem}>
            <Text style={[pStyles.statNum, typography.display, { color: colors.text }]}>{rewards.streak}</Text>
            <Text style={[pStyles.statLabel, typography.caption, { color: colors.textMuted }]}>day streak</Text>
          </View>
        </View>
{/* Define the action buttons section of the profile screen, which allows the user to edit their profile or find new connections */}
        <View style={pStyles.actionRow}>
          <TouchableOpacity style={[pStyles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowEdit(true)}>
            <Text style={[pStyles.actionBtnTxt, typography.subheading, { color: colors.textMid }]}>edit profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[pStyles.actionBtn, pStyles.actionBtnSecondary, { backgroundColor: colors.primaryPale, borderColor: colors.primary + '60' }]} onPress={() => openConns('find')}>
            <Text style={[pStyles.actionBtnTxt, typography.subheading, { color: colors.primaryLight }]}>+ find connections</Text>
          </TouchableOpacity>
        </View>

        <Text style={[pStyles.sectionHeader, typography.caption, { color: colors.textMuted }]}>◆  study stats</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={pStyles.highlightsRow}>
          {[
            { label: 'total', value: totalH > 0 ? `${totalH}h` : '0m', sub: 'hours studied' },
            { label: 'today', value: todayMins > 0 ? `${Math.floor(todayMins/60) > 0 ? Math.floor(todayMins/60)+'h ' : ''}${todayMins%60}m` : '0m', sub: 'today' },
            { label: 'sessions', value: String(sessions.length), sub: 'sessions'},
            { label: 'notes', value: String(notes.length),    sub: 'notes' },
            { label: 'badges', value: `${rewards.unlockedBadges.length}/13`, sub: 'unlocked'},
            { label: 'waves', value: String(rewards.waveCount), sub: 'wave sessions'},
          ].map(h => (
            <View key={h.label} style={pStyles.highlight}>
              <View style={[pStyles.highlightCircle, { borderColor: colors.primary, backgroundColor: colors.primaryPale }]}>
                <Text style={[pStyles.highlightVal, typography.display, { color: colors.text }]}>{h.value}</Text>
              </View>
              <Text style={[pStyles.highlightLabel, typography.caption, { color: colors.textMuted }]}>{h.label}</Text>
            </View>
          ))}
        </ScrollView>
{/* Define the badges section of the profile screen, which displays the user's unlocked badges */} 
{/* or a prompt to start studying if they have none */}
        <Text style={[pStyles.sectionHeader, typography.caption, { color: colors.textMuted }]}>★  badges</Text>
        {rewards.unlockedBadges.length === 0 ? (
          <View style={[pStyles.emptyBadges, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[pStyles.emptyBadgesTxt, typography.body, { color: colors.textMuted }]}>
              no badges yet — start studying to unlock them
            </Text>
          </View>
        ) : (
          <View style={pStyles.badgesGrid}>
            {rewards.unlockedBadges.slice(0, 9).map(id => {
              const badge = BADGES?.find?.(b => b.id === id) || { icon: '◆', title: id };
              return (
                <View key={id} style={pStyles.badgeItem}>
                  <View style={[pStyles.badgeItemCircle, { backgroundColor: colors.waterPale, borderColor: colors.borderGlow }]}>
                    <Text style={pStyles.badgeItemIcon}>{badge.icon}</Text>
                  </View>
                  <Text style={[pStyles.badgeItemLabel, typography.caption, { color: colors.textMuted }]}>{badge.title}</Text>
                </View>
              );
            })}
          </View>
        )}
{/* Define the recent sessions section of the profile screen, which displays the user's most recent study sessions */}
{/* or a prompt to start studying if they have none */}
        <Text style={[pStyles.sectionHeader, typography.caption, { color: colors.textMuted }]}>≋  recent sessions</Text>
        {sessions.length === 0 ? (
          <View style={pStyles.emptyPosts}>
            <Text style={[pStyles.emptyPostsIcon, { color: colors.textLight }]}>◇</Text>
            <Text style={[pStyles.emptyPostsTxt, typography.body, { color: colors.textMid }]}>no sessions yet</Text>
          </View>
        ) : (
          <View style={pStyles.sessionsGrid}>
            {sessions.slice(-9).reverse().map(s => (
              <View key={s.id} style={[pStyles.sessionTile, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[pStyles.sessionTileMins, typography.display, { color: colors.text }]}>{s.durationMins}m</Text>
                <Text style={[pStyles.sessionTileSubj, typography.caption, { color: colors.textMuted }]} numberOfLines={1}>{s.subject}</Text>
                <Text style={[pStyles.sessionTileType, typography.caption, { color: colors.textLight }]}>
                  {s.type === 'wave' ? '≋' : '◆'}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
{/* Render the EditProfileModal and ConnectionsModal components conditionally based on the showEdit 
and showConns state variables, passing the necessary props to each modal */}
      {showEdit && (
        <EditProfileModal
          profile={profile}
          onSave={(data) => dispatch({ type: 'UPDATE_PROFILE', payload: data })}
          onClose={() => setShowEdit(false)}
          colors={colors}
        />
      )}
      {showConns && (
        <ConnectionsModal
          profile={profile}
          dispatch={dispatch}
          onClose={() => setShowConns(false)}
          tab={connsTab}
          colors={colors}
        />
      )}
    </SafeAreaView>
  );
}
// Define the styles for the ProfileScreen component using StyleSheet.create, 
// including styles for the safe area, content, top bar, profile top section, avatar, profile info, bio, privacy row, stats row, action buttons, 
// highlights row, badges grid and recent sessions grid
const pStyles = StyleSheet.create({
  safe: {flex: 1 },
  content: {paddingBottom: 40 },
  topBar: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  backTxt: {fontSize: 15 },
  topBarTitle: { fontSize: 17 },
  editBtnTxt: { fontSize: 15 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  avatarWrap: { position: 'relative' },
  avatar: { width: 86, height: 86, borderRadius: 43, borderWidth: 3 },
  avatarFallback: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  avatarLetter: { fontSize: 34 },
  avatarEditBadge:{ position: 'absolute', bottom: 2, right: 2, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  avatarEditTxt: { fontSize: 16, color: '#fff', fontFamily: 'Nunito_700Bold', lineHeight: 20 },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 22 },
  profileHandle: { fontSize: 13 },
  profileSchool: { fontSize: 12, marginTop: 2 },
  bio: { fontSize: 14, lineHeight: 22, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  bioEmpty: { fontSize: 14, paddingHorizontal: spacing.lg, marginBottom: spacing.md, fontStyle: 'italic' },
  privacyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1 },
  privacyLabel: { fontSize: 14 },
  privacySub: { fontSize: 11, marginTop: 3 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, marginBottom: spacing.md },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statNum: { fontSize: 22 },
  statLabel: { fontSize: 10, marginTop: 3 },
  statDivider: { width: 1 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, alignItems: 'center' },
  actionBtnSecondary: {},
  actionBtnTxt: { fontSize: 13 },
  sectionHeader:{ fontSize: 11, letterSpacing: 1, paddingHorizontal: spacing.lg, marginBottom: spacing.md, textTransform: 'uppercase' },
  highlightsRow:{ paddingLeft: spacing.lg, marginBottom: spacing.xl },
  highlight: { alignItems: 'center', marginRight: spacing.md, width: 72 },
  highlightCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  highlightVal: { fontSize: 14, textAlign: 'center' },
  highlightLabel: { fontSize: 10, textAlign: 'center' },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: 12, marginBottom: spacing.xl },
  badgeItem: { alignItems: 'center', width: 60 },
  badgeItemCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  badgeItemIcon: { fontSize: 22, color: '#6aaff0' },
  badgeItemLabel: { fontSize: 9, textAlign: 'center' },
  emptyBadges: { marginHorizontal: spacing.lg, marginBottom: spacing.xl, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderStyle: 'dashed' },
  emptyBadgesTxt: { fontSize: 13, textAlign: 'center' },
  sessionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: 2 },
  sessionTile: { width: '33%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, gap: 3 },
  sessionTileMins: { fontSize: 20 },
  sessionTileSubj: { fontSize: 10, maxWidth: '80%', textAlign: 'center' },
  sessionTileType: { fontSize: 12 },
  emptyPosts: { alignItems: 'center', paddingVertical: 60, gap: spacing.sm },
  emptyPostsIcon:{ fontSize: 48 },
  emptyPostsTxt: { fontSize: 16 },
  editSafe: { flex: 1 },
  editBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1 },
  editBarCancel: { fontSize: 15 },
  editBarTitle: { fontSize: 17 },
  editBarSave: { fontSize: 15 },
  editContent: { padding: spacing.lg },
  editField: { marginBottom: spacing.lg },
  editLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  editInput: { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15 },
  editBio: { height: 100, paddingTop: spacing.sm },
  charCount: { fontSize: 10, textAlign: 'right', marginTop: 4 },
  connTabs: { flexDirection: 'row', borderRadius: radius.md, padding: 3, margin: spacing.lg, borderWidth: 1 },
  connTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.sm },
  connTabTxt: { fontSize: 11 },
  connEmpty: { alignItems: 'center', paddingVertical: 60, gap: spacing.sm },
  connEmptyIcon: { fontSize: 40 },
  connEmptyTxt: { fontSize: 16 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  userAvatarTxt: { fontSize: 18, fontFamily: 'Nunito_700Bold' },
  userName: { fontSize: 14 },
  userHandle: { fontSize: 12 },
  connectedBtn: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1 },
  connectedBtnTxt:{ fontSize: 11 },
  connectBtn: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1 },
  connectBtnTxt: { fontSize: 11 },
  acceptBtn: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  acceptBtnTxt: { fontSize: 11 },
  declineBtn: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1 },
  declineBtnTxt: { fontSize: 11 },
  findTitle: { fontSize: 11, letterSpacing: 1, marginBottom: spacing.md, textTransform: 'uppercase' },
});