import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, Spacing } from '../constants/theme';
import AqiDial from '../components/AqiDial';
import WeatherCard from '../components/WeatherCard';
import RioCard from '../components/RioCard';

const FORECAST_DATA = [
  { hour: '12 PM', aqi: 120 },
  { hour: '3 PM', aqi: 135 },
  { hour: '6 PM', aqi: 110 },
  { hour: '9 PM', aqi: 95 },
  { hour: '12 AM', aqi: 80 },
  { hour: '3 AM', aqi: 70 },
  { hour: '6 AM', aqi: 65 },
  { hour: '9 AM', aqi: 85 },
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Good afternoon, User</Text>
      <Text style={styles.subtitle}>Let's check the air quality today</Text>

      <WeatherCard temperature={38} humidity={45} windSpeed={12} />

      <View style={styles.dialSection}>
        <AqiDial aqi={120} size={180} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>7-Day Forecast</Text>
          <Text style={styles.sectionLink}>Details</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
          {FORECAST_DATA.map((item, i) => (
            <View key={i} style={styles.forecastItem}>
              <Text style={styles.forecastHour}>{item.hour}</Text>
              <View style={[styles.forecastBar, { height: Math.max(item.aqi / 3, 20) }]} />
              <Text style={[styles.forecastAqi, item.aqi > 100 && { color: '#f44336' }]}>
                {item.aqi}
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
            <Text style={[styles.snapshotValue, { color: '#f44336' }]}>120</Text>
            <Text style={styles.snapshotSub}>Unhealthy</Text>
          </View>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotLabel}>PM2.5</Text>
            <Text style={styles.snapshotValue}>43.2</Text>
            <Text style={styles.snapshotSub}>µg/m³</Text>
          </View>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotLabel}>PM10</Text>
            <Text style={styles.snapshotValue}>78.5</Text>
            <Text style={styles.snapshotSub}>µg/m³</Text>
          </View>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotLabel}>Risk Score</Text>
            <Text style={[styles.snapshotValue, { color: '#ff9800' }]}>42%</Text>
            <Text style={styles.snapshotSub}>Moderate</Text>
          </View>
        </View>
      </View>

      <RioCard
        message="Today is an indoor activity day."
        subtitle="Air quality is deteriorating. Limit outdoor exertion."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  sectionLink: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelMd,
    color: Colors.primary,
    fontWeight: '500',
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
