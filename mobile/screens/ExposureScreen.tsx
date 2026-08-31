import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, FontFamily, FontSize, Spacing } from '../constants/theme';
import AqiDial from '../components/AqiDial';
import { fetchLahoreAqi, fetchExposure } from '../services/api';
import { AqiReading } from '../types';

interface HourData {
  hour: number;
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
}

const WHO_LIMITS = {
  pm25: 15,
  pm10: 45,
  o3: 100,
  no2: 25,
};

function aqiColor(aqi: number): string {
  if (aqi <= 50) return '#4caf50';
  if (aqi <= 100) return '#ff9800';
  if (aqi <= 150) return '#f44336';
  return '#9c27b0';
}

export default function ExposureScreen() {
  const [zones, setZones] = useState<AqiReading[]>([]);
  const [hours, setHours] = useState<HourData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchLahoreAqi().catch(() => []),
      fetchExposure('gulberg').catch(() => ({ hours: [] })),
    ]).then(([zoneData, exposureData]) => {
      setZones(zoneData);
      setHours(exposureData.hours ?? []);
      setLoading(false);
    });
  }, []);

  const avgAqi = zones.length > 0 ? Math.round(zones.reduce((s, z) => s + z.aqi, 0) / zones.length) : 0;
  const avgPm25 = zones.length > 0 ? +(zones.reduce((s, z) => s + (z.pm25 ?? 0), 0) / zones.length).toFixed(1) : 0;
  const avgPm10 = zones.length > 0 ? +(zones.reduce((s, z) => s + (z.pm10 ?? 0), 0) / zones.length).toFixed(1) : 0;
  const avgO3 = zones.length > 0 ? +(zones.reduce((s, z) => s + (z.o3 ?? 0), 0) / zones.length).toFixed(1) : 0;
  const avgNo2 = zones.length > 0 ? +(zones.reduce((s, z) => s + (z.no2 ?? 0), 0) / zones.length).toFixed(1) : 0;

  const PM_DATA = [
    { label: 'PM2.5', value: avgPm25, unit: 'µg/m³', pct: Math.min(Math.round((avgPm25 / WHO_LIMITS.pm25) * 100), 100), color: '#ff9800' },
    { label: 'PM10', value: avgPm10, unit: 'µg/m³', pct: Math.min(Math.round((avgPm10 / WHO_LIMITS.pm10) * 100), 100), color: '#f44336' },
    { label: 'O₃', value: avgO3, unit: 'µg/m³', pct: Math.min(Math.round((avgO3 / WHO_LIMITS.o3) * 100), 100), color: '#4caf50' },
    { label: 'NO₂', value: avgNo2, unit: 'µg/m³', pct: Math.min(Math.round((avgNo2 / WHO_LIMITS.no2) * 100), 100), color: '#4caf50' },
  ];

  const riskPct = Math.min(Math.round((avgAqi / 150) * 100), 100);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading exposure data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Exposure</Text>
      <Text style={styles.subtitle}>Your environmental exposure analysis</Text>

      <View style={styles.dialRow}>
        <AqiDial aqi={avgAqi} size={160} />
        <View style={styles.dialInfo}>
          <Text style={styles.dialLabel}>Today's Risk</Text>
          <Text style={[styles.dialPercent, { color: aqiColor(avgAqi) }]}>{riskPct}%</Text>
          <Text style={styles.dialSub}>{riskPct < 33 ? 'Low risk' : riskPct < 66 ? 'Moderate risk' : 'High risk'}</Text>
          <View style={styles.riskBar}>
            <View style={[styles.riskFill, { width: `${riskPct}%`, backgroundColor: aqiColor(avgAqi) }]} />
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
          {zones.map((z, i) => (
            <View key={i} style={styles.zoneRow}>
              <View style={[styles.zoneDot, { backgroundColor: aqiColor(z.aqi) }]} />
              <Text style={styles.zoneName}>{z.station ?? `Zone ${i + 1}`}</Text>
              <Text style={[styles.zoneAqi, { color: aqiColor(z.aqi) }]}>{z.aqi}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>24h Trend</Text>
        <View style={[styles.card, styles.trendCard]}>
          <View style={styles.trendBars}>
            {(hours.length > 0 ? hours : Array.from({ length: 24 }, (_, i) => ({ hour: i, aqi: avgAqi }))).slice(0, 12).map((h, i) => (
              <View key={i} style={styles.trendBarItem}>
                <View style={[styles.trendBar, { height: Math.max(h.aqi / 3, 12), backgroundColor: aqiColor(h.aqi) }]} />
                <Text style={styles.trendDay}>{h.hour}h</Text>
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
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontFamily: FontFamily.inter, fontSize: FontSize.bodyMd, color: Colors.onSurfaceVariant },
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
  riskFill: { height: '100%', borderRadius: 3 },
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
    width: 20,
    borderRadius: 4,
  },
  trendDay: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelSm,
    color: Colors.onSurfaceVariant,
  },
});
