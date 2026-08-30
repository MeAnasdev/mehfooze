import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize } from '../constants/theme';

interface WeatherCardProps {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition?: string;
}

export default function WeatherCard({ temperature, humidity, windSpeed, condition = 'Haze' }: WeatherCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.condition}>{condition}</Text>
        <Text style={styles.temp}>{Math.round(temperature)}°</Text>
        <Text style={styles.detail}>Humidity {Math.round(humidity)}%</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.windLabel}>Wind</Text>
        <Text style={styles.windValue}>{windSpeed.toFixed(1)}</Text>
        <Text style={styles.windUnit}>km/h</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: { flex: 1 },
  condition: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.bodyMd,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  temp: {
    fontFamily: FontFamily.publicSans,
    fontSize: 48,
    fontWeight: '600',
    color: Colors.onSurface,
    lineHeight: 56,
  },
  detail: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelMd,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  right: { alignItems: 'flex-end' },
  windLabel: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelSm,
    color: Colors.onSurfaceVariant,
  },
  windValue: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.titleLg,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  windUnit: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelSm,
    color: Colors.onSurfaceVariant,
  },
});
