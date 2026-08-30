import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize } from '../constants/theme';

interface RioCardProps {
  message: string;
  subtitle?: string;
}

export default function RioCard({ message, subtitle }: RioCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.accent} />
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>🌿</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Rio's Advisory</Text>
        <Text style={styles.message}>{message}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '4d',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: Colors.primary + '0d',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  icon: { fontSize: 22 },
  content: { flex: 1, zIndex: 1 },
  title: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.titleMd,
    fontWeight: '500',
    color: Colors.primary,
    marginBottom: 4,
  },
  message: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.bodyMd,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  subtitle: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.bodyMd,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
});
