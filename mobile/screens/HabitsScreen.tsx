import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants/theme';
import RioCard from '../components/RioCard';
import { fetchTip, fetchLahoreAqi } from '../services/api';

interface ChecklistItem {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

function getChecklistForAqi(aqi: number): ChecklistItem[] {
  if (aqi <= 50) {
    return [
      { id: '1', label: 'Enjoy outdoor activities', icon: 'sunny' },
      { id: '2', label: 'Open windows for fresh air', icon: 'open-outline' },
      { id: '3', label: 'Exercise outdoors', icon: 'bicycle' },
    ];
  }
  if (aqi <= 100) {
    return [
      { id: '1', label: 'Wear mask if sensitive', icon: 'medkit' },
      { id: '2', label: 'Limit prolonged outdoor exertion', icon: 'walk' },
      { id: '3', label: 'Keep windows partially closed', icon: 'lock-closed' },
    ];
  }
  return [
    { id: '1', label: 'Wear N95 mask', icon: 'medkit' },
    { id: '2', label: 'Keep windows closed', icon: 'lock-closed' },
    { id: '3', label: 'Delay outdoor commute', icon: 'car' },
  ];
}

const ARTICLES = [
  { title: 'Understanding PM2.5', readTime: '3 min read' },
  { title: 'Air Purifier Tips', readTime: '5 min read' },
  { title: 'N95 Mask Guide', readTime: '2 min read' },
];

export default function HabitsScreen() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [tip, setTip] = useState('');
  const [aqi, setAqi] = useState(0);
  const [loading, setLoading] = useState(true);

  const toggle = (id: string) => setChecked((p) => ({ ...p, [id]: !p[id] }));
  const completedCount = Object.values(checked).filter(Boolean).length;

  useEffect(() => {
    fetchLahoreAqi()
      .then((zones) => {
        const max = zones.reduce((m, z) => (z.aqi > m.aqi ? z : m), zones[0]);
        setAqi(max.aqi);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetchTip('citizen', 100)
      .then((res) => setTip(res.tip))
      .catch(() => {});
  }, []);

  const checklist = getChecklistForAqi(aqi);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Safe Habits</Text>
      <Text style={styles.subtitle}>Your personalized environmental action plan.</Text>

      {tip && <RioCard message={tip} subtitle="Rio's advice for current conditions" />}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Daily Checklist</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{completedCount}/{checklist.length} Completed</Text>
          </View>
        </View>
        {checklist.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.checkItem}
            onPress={() => toggle(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, checked[item.id] && styles.checkboxActive]}>
              {checked[item.id] && <Ionicons name="checkmark" size={14} color={Colors.onPrimary} />}
            </View>
            <Text style={styles.checkLabel}>{item.label}</Text>
            <Ionicons name={item.icon} size={18} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.contextLabel}>Active Context</Text>
        <View style={styles.tags}>
          <View style={styles.tagSecondary}>
            <Ionicons name="bus" size={16} color={Colors.onSecondaryContainer} />
            <Text style={styles.tagTextSecondary}>Commuter</Text>
          </View>
          <View style={[styles.tagTertiary, aqi > 100 && styles.tagWarning]}>
            <Ionicons name="shield-checkmark" size={16} color={aqi > 100 ? '#f44336' : Colors.onTertiaryContainer} />
            <Text style={[styles.tagTextTertiary, aqi > 100 && { color: '#f44336' }]}>
              AQI {aqi > 100 ? 'Alert' : 'Normal'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Knowledge Base</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.articleScroll}>
          {ARTICLES.map((article, i) => (
            <TouchableOpacity key={i} style={styles.articleCard} activeOpacity={0.8}>
              <View style={styles.articleImage} />
              <View style={styles.articleContent}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <View style={styles.articleMeta}>
                  <Ionicons name="time" size={14} color={Colors.onSurfaceVariant} />
                  <Text style={styles.articleTime}>{article.readTime}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
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
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.titleMd,
    fontWeight: '500',
    color: Colors.onSurface,
  },
  badge: {
    backgroundColor: Colors.primaryContainer + '33',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelMd,
    color: Colors.primary,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkLabel: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.bodyMd,
    color: Colors.onSurface,
    flex: 1,
  },
  contextLabel: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelMd,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagTextSecondary: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelMd,
    color: Colors.onSecondaryContainer,
  },
  tagTertiary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.tertiaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagWarning: {
    backgroundColor: '#f4433622',
  },
  tagTextTertiary: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelMd,
    color: Colors.onTertiaryContainer,
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
  sectionLink: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelMd,
    color: Colors.primary,
    fontWeight: '500',
  },
  articleScroll: { marginHorizontal: -Spacing.containerPadding, paddingHorizontal: Spacing.containerPadding },
  articleCard: {
    width: 200,
    marginRight: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerLowest,
  },
  articleImage: {
    height: 112,
    backgroundColor: Colors.surfaceVariant,
  },
  articleContent: { padding: 12 },
  articleTitle: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.bodyMd,
    fontWeight: '500',
    color: Colors.onSurface,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  articleTime: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelSm,
    color: Colors.onSurfaceVariant,
  },
});
