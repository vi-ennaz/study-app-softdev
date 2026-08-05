import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius, shadow } from '../theme';

export function Card({ children, style, onPress }) {
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={[styles.card,shadow.sm,style]}>{children}</TouchableOpacity>;
  return <View style={[styles.card,shadow.sm,style]}>{children}</View>;
}
export function GlowCard({ children, style, onPress, glowColor=colors.primary }) {
  const glow={ shadowColor:glowColor, shadowOffset:{width:0,height:0}, shadowOpacity:0.22, shadowRadius:14, elevation:8 };
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={[styles.card,glow,{borderColor:glowColor+'28'},style]}>{children}</TouchableOpacity>;
  return <View style={[styles.card,glow,{borderColor:glowColor+'28'},style]}>{children}</View>;
}
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
export function ProgressBar({ progress, color=colors.primary, height=8, style }) {
  return (
    <View style={[styles.progTrack,{height},style]}>
      <View style={[styles.progFill,{width:`${Math.min(progress*100,100)}%`,backgroundColor:color,height}]} />
    </View>
  );
}
export function Pill({ label, active, onPress, color=colors.primary }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.pill, active&&{backgroundColor:color+'22',borderColor:color+'70'}]}>
      <Text style={[styles.pillText,typography.subheading, active?{color}:{color:colors.textMuted}]}>{label}</Text>
    </TouchableOpacity>
  );
}
export function EmptyState({ symbol='◇', title, subtitle }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptySymbol}>{symbol}</Text>
      <Text style={[styles.emptyTitle,typography.heading]}>{title}</Text>
      {subtitle&&<Text style={[styles.emptySub,typography.body]}>{subtitle}</Text>}
    </View>
  );
}
export function DividerLine() { return <View style={styles.divider} />; }
export function SectionLabel({ text, symbol='◆' }) {
  return (
    <View style={styles.secLabel}>
      <Text style={[styles.secSym,typography.caption]}>{symbol}</Text>
      <Text style={[styles.secText,typography.label]}>{text}</Text>
    </View>
  );
}

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
