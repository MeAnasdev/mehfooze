import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants/theme';
import RioCard from '../components/RioCard';

const CHECKLIST_ITEMS = [
  { id: '1', label: 'Wear N95 mask', icon: 'medkit' as const },
  { id: '2', label: 'Keep windows closed', icon: 'lock-closed' as const },
  { id: '3', label: 'Delay commute', icon: 'car' as const },
];

const ARTICLES = [
  { title: 'Understanding PM2.5', readTime: '3 min read' },
  { title: 'Air Purifier Tips', readTime: '5 min read' },
];

export default function HabitsScreen() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setChecked((p) => ({ ...p, [id]: !p[id] }));
  const completedCount = Object.values(checked).filter(Boolean).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Safe Habits</Text>
      <Text style={styles.subtitle}>Your personalized environmental action plan.</Text>

      <RioCard
        message="Today is an indoor activity day."
        subtitle="Air quality is deteriorating. Limit outdoor exertion."
      />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Daily Checklist</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{completedCount}/3 Completed</Text>
          </View>
        </View>
        {CHECKLIST_ITEMS.map((item) => (
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
          <View style={styles.tagTertiary}>
            <Ionicons name="heart" size={16} color={Colors.onTertiaryContainer} />
            <Text style={styles.tagTextTertiary}>Mild Asthma</Text>
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
