import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, Spacing } from '../constants/theme';
import AqiDial from '../components/AqiDial';

const PM_DATA = [
  { label: 'PM2.5', value: 43.2, unit: 'µg/m³', pct: 58, color: '#ff9800' },
  { label: 'PM10', value: 78.5, unit: 'µg/m³', pct: 72, color: '#f44336' },
  { label: 'O₃', value: 28.1, unit: 'ppb', pct: 32, color: '#4caf50' },
  { label: 'NO₂', value: 15.3, unit: 'ppb', pct: 22, color: '#4caf50' },
];

const ZONES = [
  { name: 'Gulberg', aqi: 125, color: '#f44336' },
  { name: 'Johar Town', aqi: 110, color: '#ff9800' },
  { name: 'DHA', aqi: 95, color: '#ff9800' },
  { name: 'Model Town', aqi: 88, color: '#4caf50' },
];

const TREND_DATA = [120, 135, 110, 95, 80, 70, 65];

export default function ExposureScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Exposure</Text>
      <Text style={styles.subtitle}>Your environmental exposure analysis</Text>

      <View style={styles.dialRow}>
        <AqiDial aqi={120} size={160} />
        <View style={styles.dialInfo}>
          <Text style={styles.dialLabel}>Today's Risk</Text>
          <Text style={styles.dialPercent}>42%</Text>
          <Text style={styles.dialSub}>Moderate risk</Text>
          <View style={styles.riskBar}>
            <View style={[styles.riskFill, { width: '42%' }]} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PM Breakdown</Text>
        <View style={styles.card}>
          {PM_DATA.map((pm, i) => (
            <View key={i} style={styles.pmRow}>
              <View style={styles.pmLeft}>
                <Text style={styles.pmLabel}>{pm.label}</Text>
                <Text style={styles.pmValue}>{pm.value} {pm.unit}</Text>
              </View>
              <View style={styles.pmBarWrap}>
                <View style={styles.pmBarBg}>
                  <View style={[styles.pmBarFill, { width: `${pm.pct}%`, backgroundColor: pm.color }]} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zone Breakdown</Text>
        <View style={styles.card}>
          {ZONES.map((z, i) => (
            <View key={i} style={styles.zoneRow}>
              <View style={styles.zoneDot} />
              <Text style={styles.zoneName}>{z.name}</Text>
              <Text style={[styles.zoneAqi, { color: z.color }]}>{z.aqi}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7-Day Trend</Text>
        <View style={[styles.card, styles.trendCard]}>
          <View style={styles.trendBars}>
            {TREND_DATA.map((v, i) => (
              <View key={i} style={styles.trendBarItem}>
                <View style={[styles.trendBar, { height: Math.max(v / 3, 12) }]} />
                <Text style={styles.trendDay}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.containerPadding, paddingBottom: 100, gap: Spacing.cardGap },
  title: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.headlineMd,
    fontWeight: '600',
    color: Colors.onBackground,
    marginTop: 56,
  },
  subtitle: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  dialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  dialInfo: { flex: 1 },
  dialLabel: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelSm,
    color: Colors.onSurfaceVariant,
  },
  dialPercent: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.headlineMd,
    fontWeight: '600',
    color: '#ff9800',
  },
  dialSub: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelMd,
    color: Colors.onSurfaceVariant,
  },
  riskBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceContainerHighest,
    marginTop: 8,
    overflow: 'hidden',
  },
  riskFill: { height: '100%', borderRadius: 3, backgroundColor: '#ff9800' },
  section: { marginTop: 8 },
  sectionTitle: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.titleMd,
    fontWeight: '500',
    color: Colors.onSurface,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    gap: 14,
  },
  pmRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pmLeft: { width: 70 },
  pmLabel: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelMd,
    color: Colors.onSurfaceVariant,
  },
  pmValue: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.bodyMd,
    fontWeight: '500',
    color: Colors.onSurface,
  },
  pmBarWrap: { flex: 1 },
  pmBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  pmBarFill: { height: '100%', borderRadius: 4 },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryContainer,
  },
  zoneName: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.bodyMd,
    color: Colors.onSurface,
    flex: 1,
  },
  zoneAqi: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.titleMd,
    fontWeight: '600',
  },
  trendCard: { paddingVertical: 20 },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
  },
  trendBarItem: { alignItems: 'center', gap: 6 },
  trendBar: {
    width: 28,
    borderRadius: 6,
    backgroundColor: Colors.primaryContainer,
  },
  trendDay: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelSm,
    color: Colors.onSurfaceVariant,
  },
});
