// src/components/UI.js
// This file contains reusable UI components for the app, including Card, 
// GlowCard, SubjectTag, ProgressBar, Pill, EmptyState, DividerLine and SectionLabel.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius, shadow } from '../theme';

// Define the Card component, which renders a card-like container with optional onPress functionality
// If onPress is provided, the card becomes a TouchableOpacity, otherwise it is a simple View
export function Card({ children, style, onPress }) {
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={[styles.card,shadow.sm,style]}>{children}</TouchableOpacity>;
  return <View style={[styles.card,shadow.sm,style]}>{children}</View>;
}
// Define the GlowCard component, which renders a card-like container with a glowing shadow effect
// The glowColor prop allows customization of the glow color, defaulting to the primary colour from the theme
export function GlowCard({ children, style, onPress, glowColor=colors.primary }) {
  const glow={ shadowColor:glowColor, shadowOffset:{width:0,height:0}, shadowOpacity:0.22, shadowRadius:14, elevation:8 };
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={[styles.card,glow,{borderColor:glowColor+'28'},style]}>{children}</TouchableOpacity>;
  return <View style={[styles.card,glow,{borderColor:glowColor+'28'},style]}>{children}</View>;
}
// Define the SubjectTag component, which renders a small tag-like element displaying a subject name
// The subject prop determines the background and text color of the tag based on a predefined mapping
export function SubjectTag({ subject }) {
  const MAP={
    General:{bg:'#1e3248',text:'#7ab0cc'}, Maths:{bg:'#1e3a28',text:'#6ab888'},
    English:{bg:'#1e2a40',text:'#7898c8'}, Science:{bg:'#2a301e',text:'#a8b870'},
    History:{bg:'#301e2a',text:'#c880a8'}, Geography:{bg:'#1e3030',text:'#70b8b0'},
    Biology:{bg:'#1e3020',text:'#78c088'}, Chemistry:{bg:'#301e20',text:'#c88878'},
    Physics:{bg:'#1e2038',text:'#8088c8'},
  };
  const c=MAP[subject]||MAP.General;
  return <View style={[styles.subjTag,{backgroundColor:c.bg}]}><Text style={[styles.subjTagText,typography.caption,{color:c.text}]}>{subject}</Text></View>;
}
// Define the ProgressBar component, which renders a horizontal progress bar indicating completion percentage
// The progress prop determines the fill percentage, while color and height can be customised through props
export function ProgressBar({ progress, color=colors.primary, height=8, style }) {
  return (
    <View style={[styles.progTrack,{height},style]}>
      <View style={[styles.progFill,{width:`${Math.min(progress*100,100)}%`,backgroundColor:color,height}]} />
    </View>
  );
}
// Define the Pill component, which renders a pill-shaped button-like element with a label
// The active prop determines the styling of the pill, while onPress handles user interaction
export function Pill({ label, active, onPress, color=colors.primary }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.pill, active&&{backgroundColor:color+'22',borderColor:color+'70'}]}>
      <Text style={[styles.pillText,typography.subheading, active?{color}:{color:colors.textMuted}]}>{label}</Text>
    </TouchableOpacity>
  );
}
// Define the EmptyState component, which renders a placeholder view indicating an empty state in the UI
// It displays a symbol, title and optional subtitle to inform the user about the empty state
export function EmptyState({ symbol='◇', title, subtitle }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptySymbol}>{symbol}</Text>
      <Text style={[styles.emptyTitle,typography.heading]}>{title}</Text>
      {subtitle&&<Text style={[styles.emptySub,typography.body]}>{subtitle}</Text>}
    </View>
  );
}
// Define the DividerLine component, which renders a horizontal line 
// used to separate content sections in the UI
export function DividerLine() { return <View style={styles.divider} />; }
export function SectionLabel({ text, symbol='◆' }) {
  return (
    <View style={styles.secLabel}>
      <Text style={[styles.secSym,typography.caption]}>{symbol}</Text>
      <Text style={[styles.secText,typography.label]}>{text}</Text>
    </View>
  );
}
// Define the styles for the UI components using StyleSheet.create, including styles for card, 
// subject tag, progress bar, pill, empty state, divider line and section label
const styles=StyleSheet.create({
  card:{ backgroundColor:colors.card, borderRadius:radius.lg, padding:spacing.lg, borderWidth:1, borderColor:colors.border },
  subjTag:{ paddingHorizontal:9, paddingVertical:3, borderRadius:radius.full, alignSelf:'flex-start' },
  subjTagText:{ fontSize:10, fontWeight:'700' },
  progTrack:{ backgroundColor:colors.borderLight, borderRadius:radius.full, overflow:'hidden' },
  progFill:{ borderRadius:radius.full },
  pill:{ paddingHorizontal:13, paddingVertical:6, borderRadius:radius.full, borderWidth:1, borderColor:colors.border, backgroundColor:colors.card },
  pillText:{ fontSize:12 },
  empty:{ alignItems:'center', paddingVertical:48, gap:spacing.sm },
  emptySymbol:{ fontSize:38, color:colors.textLight, marginBottom:spacing.sm },
  emptyTitle:{ fontSize:18, color:colors.textMid },
  emptySub:{ fontSize:13, color:colors.textMuted, textAlign:'center', lineHeight:20 },
  divider:{ height:1, backgroundColor:colors.borderLight, marginVertical:spacing.xl },
  secLabel:{ flexDirection:'row', alignItems:'center', gap:7, marginBottom:spacing.md, marginTop:spacing.sm },
  secSym:{ fontSize:10, color:colors.primary, opacity:0.7 },
  secText:{ fontSize:10, color:colors.textMuted, letterSpacing:1.2 },
});
