import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, FontFamily, FontSize, Spacing } from '../constants/theme';
import AqiDial from '../components/AqiDial';
import WeatherCard from '../components/WeatherCard';
import RioCard from '../components/RioCard';
import { fetchLahoreAqi, fetchTip } from '../services/api';
import { AqiReading } from '../types';

function aqiColor(aqi: number): string {
  if (aqi <= 50) return '#4caf50';
  if (aqi <= 100) return '#ff9800';
  if (aqi <= 150) return '#f44336';
  if (aqi <= 200) return '#9c27b0';
  return '#7e0023';
}

function aqiLabel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  return 'Very Unhealthy';
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const [zones, setZones] = useState<AqiReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [tip, setTip] = useState<string>('');

  useEffect(() => {
    fetchLahoreAqi()
      .then((data) => {
        setZones(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetchTip('citizen', 100)
      .then((res) => setTip(res.tip))
      .catch(() => {});
  }, []);

  const primary = zones[0];
  const maxZone = zones.reduce((max, z) => (z.aqi > max.aqi ? z : max), zones[0] ?? { aqi: 0, pm25: 0, pm10: 0 });

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading air quality data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>{getGreeting()}, User</Text>
      <Text style={styles.subtitle}>Let's check the air quality today</Text>

      {primary && (
        <WeatherCard
          temperature={primary.temperature ?? 0}
          humidity={primary.humidity ?? 0}
          windSpeed={primary.wind_speed ?? 0}
        />
      )}

      <View style={styles.dialSection}>
        <AqiDial aqi={primary?.aqi ?? 0} size={180} />
        {primary && (
          <Text style={[styles.aqiLabel, { color: aqiColor(primary.aqi) }]}>
            {aqiLabel(primary.aqi)}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Zone Overview</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
          {zones.map((z, i) => (
            <View key={i} style={styles.forecastItem}>
              <Text style={styles.forecastHour}>{z.station?.split(' ')[0] ?? `Zone ${i + 1}`}</Text>
              <View style={[styles.forecastBar, { height: Math.max(z.aqi / 3, 20), backgroundColor: aqiColor(z.aqi) }]} />
              <Text style={[styles.forecastAqi, { color: aqiColor(z.aqi) }]}>
                {z.aqi}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exposure Snapshot</Text>
        <View style={styles.snapshotGrid}>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotLabel}>AQI Now</Text>
            <Text style={[styles.snapshotValue, { color: aqiColor(maxZone.aqi) }]}>{maxZone.aqi}</Text>
            <Text style={styles.snapshotSub}>{aqiLabel(maxZone.aqi)}</Text>
          </View>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotLabel}>PM2.5</Text>
            <Text style={styles.snapshotValue}>{maxZone.pm25?.toFixed(1) ?? '--'}</Text>
            <Text style={styles.snapshotSub}>µg/m³</Text>
          </View>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotLabel}>PM10</Text>
            <Text style={styles.snapshotValue}>{maxZone.pm10?.toFixed(1) ?? '--'}</Text>
            <Text style={styles.snapshotSub}>µg/m³</Text>
          </View>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotLabel}>Zones</Text>
            <Text style={[styles.snapshotValue, { color: Colors.primary }]}>{zones.length}</Text>
            <Text style={styles.snapshotSub}>Monitored</Text>
          </View>
        </View>
      </View>

      {tip && (
        <RioCard
          message={tip}
          subtitle="Rio's proactive tip for you"
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontFamily: FontFamily.inter, fontSize: FontSize.bodyMd, color: Colors.onSurfaceVariant },
  content: { padding: Spacing.containerPadding, paddingBottom: 100, gap: Spacing.cardGap },
  greeting: {
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
    marginBottom: 4,
  },
  dialSection: { alignItems: 'center', paddingVertical: 16 },
  aqiLabel: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelMd,
    fontWeight: '600',
    marginTop: 8,
  },
  section: { marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.titleMd,
    fontWeight: '500',
    color: Colors.onSurface,
  },
  forecastScroll: { marginHorizontal: -Spacing.containerPadding, paddingHorizontal: Spacing.containerPadding },
  forecastItem: {
    alignItems: 'center',
    width: 56,
    marginRight: 8,
    gap: 6,
  },
  forecastHour: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelSm,
    color: Colors.onSurfaceVariant,
  },
  forecastBar: {
    width: 32,
    borderRadius: 6,
    backgroundColor: Colors.primaryContainer,
  },
  forecastAqi: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelMd,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.cardGap,
  },
  snapshotCard: {
    width: '47%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  snapshotLabel: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelSm,
    color: Colors.onSurfaceVariant,
  },
  snapshotValue: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.titleLg,
    fontWeight: '600',
    color: Colors.onSurface,
    marginTop: 4,
  },
  snapshotSub: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelSm,
    color: Colors.onSurfaceVariant,
  },
});
