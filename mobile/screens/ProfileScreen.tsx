import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants/theme';

const PROFILE_TYPES = [
  { key: 'general', label: 'General', icon: 'person' as const },
  { key: 'commuter', label: 'Commuter', icon: 'car' as const },
  { key: 'parent', label: 'Parent', icon: 'people' as const },
  { key: 'sensitive', label: 'Sensitive', icon: 'medical' as const },
];

const LOCATIONS = [
  { name: 'Home', address: 'Downtown Residential', icon: 'home' as const, color: Colors.primaryContainer },
  { name: 'Work', address: 'Tech District Office', icon: 'briefcase' as const, color: Colors.secondaryContainer },
];

export default function ProfileScreen() {
  const [selectedProfile, setSelectedProfile] = useState('commuter');
  const [rioEnabled, setRioEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={Colors.onSurfaceVariant} />
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="pencil" size={14} color={Colors.onPrimary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>User</Text>
        <Text style={styles.userEmail}>umar@example.com</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="id-card" size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>Profile Type</Text>
        </View>
        <Text style={styles.cardDesc}>Select your primary lifestyle to tailor AQI alerts and tips.</Text>
        <View style={styles.profileGrid}>
          {PROFILE_TYPES.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.profileBtn, selectedProfile === p.key && styles.profileBtnActive]}
              onPress={() => setSelectedProfile(p.key)}
            >
              <Ionicons
                name={p.icon}
                size={22}
                color={selectedProfile === p.key ? Colors.onPrimaryContainer : Colors.onSurfaceVariant}
              />
              <Text style={[styles.profileLabel, selectedProfile === p.key && styles.profileLabelActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="notifications" size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>Alert Threshold</Text>
          <View style={styles.thresholdBadge}>
            <Text style={styles.thresholdText}>100 AQI</Text>
          </View>
        </View>
        <Text style={styles.cardDesc}>Notify me when air quality exceeds this level.</Text>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: '33%' }]} />
        </View>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>Good (0)</Text>
          <Text style={styles.sliderLabel}>Moderate (100)</Text>
          <Text style={styles.sliderLabel}>Hazardous (300+)</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRowSpace}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="location" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Saved Locations</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.addLink}>Add New</Text>
          </TouchableOpacity>
        </View>
        {LOCATIONS.map((loc, i) => (
          <View key={i} style={styles.locationRow}>
            <View style={styles.locationLeft}>
              <View style={[styles.locationIcon, { backgroundColor: loc.color }]}>
                <Ionicons name={loc.icon} size={18} color={Colors.onPrimaryContainer} />
              </View>
              <View>
                <Text style={styles.locationName}>{loc.name}</Text>
                <Text style={styles.locationAddr}>{loc.address}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editLocation}>
              <Ionicons name="pencil" size={14} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={[styles.card, { marginBottom: 40 }]}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="settings" size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>App Preferences</Text>
        </View>
        <View style={styles.prefRow}>
          <View style={styles.prefInfo}>
            <Text style={styles.prefLabel}>Rio Tips & Pop-ups</Text>
            <Text style={styles.prefDesc}>Show context-aware environmental tips.</Text>
          </View>
          <Switch
            value={rioEnabled}
            onValueChange={setRioEnabled}
            trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryContainer }}
            thumbColor={Colors.surfaceContainerLowest}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.prefRow}>
          <View style={styles.prefInfo}>
            <Text style={styles.prefLabel}>Push Notifications</Text>
            <Text style={styles.prefDesc}>Receive daily summaries and alerts.</Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={setNotifEnabled}
            trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryContainer }}
            thumbColor={Colors.surfaceContainerLowest}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.containerPadding, gap: Spacing.sectionMargin },
  avatarSection: { alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  userName: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.headlineMd,
    fontWeight: '600',
    color: Colors.onBackground,
  },
  userEmail: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.bodyMd,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitleRowSpace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.titleMd,
    fontWeight: '500',
    color: Colors.onBackground,
  },
  cardDesc: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.bodyMd,
    color: Colors.onSurfaceVariant,
    marginBottom: 16,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileBtn: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
    gap: 6,
  },
  profileBtnActive: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
  },
  profileLabel: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelMd,
    color: Colors.onSurfaceVariant,
  },
  profileLabelActive: {
    color: Colors.onPrimaryContainer,
    fontWeight: '700',
  },
  thresholdBadge: {
    marginLeft: 'auto',
    backgroundColor: Colors.errorContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  thresholdText: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelMd,
    color: Colors.onErrorContainer,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceVariant,
    overflow: 'hidden',
    marginBottom: 8,
  },
  sliderFill: { height: '100%', borderRadius: 2, backgroundColor: Colors.primaryContainer },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelSm,
    color: Colors.outline,
  },
  addLink: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelMd,
    color: Colors.primary,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    marginBottom: 8,
  },
  locationLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationName: {
    fontFamily: FontFamily.publicSans,
    fontSize: FontSize.bodyMd,
    fontWeight: '500',
    color: Colors.onBackground,
  },
  locationAddr: {
    fontFamily: FontFamily.publicSans,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  editLocation: { padding: 4 },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prefInfo: { flex: 1, marginRight: 12 },
  prefLabel: {
    fontFamily: FontFamily.publicSans,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.onBackground,
  },
  prefDesc: {
    fontFamily: FontFamily.publicSans,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.outlineVariant + '80',
    marginVertical: 14,
  },
});
