import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors, FontFamily, FontSize } from '../constants/theme';

interface AqiDialProps {
  aqi: number;
  size?: number;
  label?: string;
}

function getAqiColor(aqi: number): string {
  if (aqi <= 50) return '#4caf50';
  if (aqi <= 100) return '#ff9800';
  if (aqi <= 150) return '#f44336';
  if (aqi <= 200) return '#9c27b0';
  return '#7e0023';
}

function getAqiLabel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  return 'Hazardous';
}

export default function AqiDial({ aqi, size = 180, label }: AqiDialProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(aqi / 300, 1);
  const strokeDashoffset = circumference * (1 - progress * 0.75);
  const color = getAqiColor(aqi);
  const displayLabel = label ?? getAqiLabel(aqi);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="135" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.surfaceContainerHighest}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeLinecap="round"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.inner}>
        <Text style={[styles.aqiValue, { color }]}>{aqi}</Text>
        <Text style={styles.aqiLabel}>{displayLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  inner: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  aqiValue: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.headlineLg,
    fontWeight: '600',
  },
  aqiLabel: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelMd,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
});
