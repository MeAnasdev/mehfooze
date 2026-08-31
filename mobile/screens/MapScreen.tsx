import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Colors, FontFamily, FontSize, Spacing } from '../constants/theme';
import { AqiReading } from '../types';
import { fetchLahoreAqi } from '../services/api';

const LAHORE_CENTER = { latitude: 31.5204, longitude: 74.3587 };

function aqiColor(aqi: number): string {
  if (aqi <= 50) return '#00e400';
  if (aqi <= 100) return '#ffff00';
  if (aqi <= 150) return '#ff7e00';
  if (aqi <= 200) return '#ff0000';
  if (aqi <= 300) return '#8f3f97';
  return '#7e0023';
}

function aqiLabel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  return 'Hazardous';
}

interface SearchResult {
  lat: number;
  lng: number;
  name: string;
}

export default function MapScreen() {
  const [zones, setZones] = useState<AqiReading[]>([]);
  const [selected, setSelected] = useState<AqiReading | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    fetchLahoreAqi()
      .then(setZones)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 3) { setSearchResults([]); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=pk`
      );
      const data = await res.json();
      setSearchResults(
        data.map((item: Record<string, string>) => ({
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          name: item.display_name,
        }))
      );
      setShowSearch(true);
    } catch {
      setSearchResults([]);
    }
  };

  const flyTo = (lat: number, lng: number) => {
    mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 1000);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search location..."
          placeholderTextColor={Colors.onSurfaceVariant}
        />
        {searchResults.length > 0 && showSearch && (
          <FlatList
            style={styles.resultsList}
            data={searchResults}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => flyTo(item.lat, item.lng)}>
                <Text style={styles.resultText} numberOfLines={1}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Map */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{ ...LAHORE_CENTER, latitudeDelta: 0.15, longitudeDelta: 0.15 }}
          showsUserLocation
        >
          {zones.map((zone) => (
            <Marker
              key={zone.zone_id}
              coordinate={{ latitude: zone.lat, longitude: zone.lng }}
              pinColor={aqiColor(zone.aqi)}
              onCalloutPress={() => setSelected(zone)}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{zone.station}</Text>
                  <Text style={[styles.calloutAqi, { color: aqiColor(zone.aqi) }]}>
                    AQI {Math.round(zone.aqi)}
                  </Text>
                  <Text style={styles.calloutLabel}>{aqiLabel(zone.aqi)}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}

      {/* AQI Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>AQI</Text>
        {[
          { label: 'Good', color: '#00e400' },
          { label: 'Moderate', color: '#ffff00' },
          { label: 'Sensitive', color: '#ff7e00' },
          { label: 'Unhealthy', color: '#ff0000' },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Selected Zone Bar */}
      {selected && (
        <View style={styles.selectedBar}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName}>{selected.station}</Text>
            <Text style={styles.selectedDetail}>PM2.5: {Math.round(selected.pm25)} · PM10: {Math.round(selected.pm10)}</Text>
          </View>
          <View style={[styles.selectedBadge, { backgroundColor: aqiColor(selected.aqi) }]}>
            <Text style={styles.selectedBadgeText}>{Math.round(selected.aqi)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchContainer: {
    position: 'absolute', top: 56, left: 12, right: 12, zIndex: 10,
  },
  searchInput: {
    backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.outlineVariant, paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: FontFamily.publicSans, fontSize: FontSize.bodyMd, color: Colors.onSurface,
  },
  resultsList: {
    backgroundColor: Colors.surface, borderRadius: 10, marginTop: 4,
    maxHeight: 200, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  resultItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.outlineVariant },
  resultText: { fontFamily: FontFamily.publicSans, fontSize: FontSize.labelSm, color: Colors.onSurface },
  legend: {
    position: 'absolute', bottom: 100, left: 12, backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8, padding: 8, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  legendTitle: { fontFamily: FontFamily.publicSans, fontSize: 10, fontWeight: '700', color: Colors.onSurfaceVariant, marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: FontFamily.publicSans, fontSize: 10, color: Colors.onSurfaceVariant },
  selectedBar: {
    position: 'absolute', bottom: 24, left: 12, right: 12,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.outlineVariant,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  selectedInfo: { flex: 1 },
  selectedName: { fontFamily: FontFamily.publicSans, fontSize: FontSize.bodyMd, fontWeight: '600', color: Colors.onSurface },
  selectedDetail: { fontFamily: FontFamily.publicSans, fontSize: FontSize.labelSm, color: Colors.onSurfaceVariant, marginTop: 2 },
  selectedBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  selectedBadgeText: { fontFamily: FontFamily.publicSans, fontSize: FontSize.bodyMd, fontWeight: '700', color: '#fff' },
  callout: { minWidth: 120, alignItems: 'center' },
  calloutTitle: { fontFamily: FontFamily.publicSans, fontSize: FontSize.bodyMd, fontWeight: '600', color: Colors.onSurface },
  calloutAqi: { fontFamily: FontFamily.publicSans, fontSize: FontSize.titleLg, fontWeight: '700', marginTop: 4 },
  calloutLabel: { fontFamily: FontFamily.publicSans, fontSize: FontSize.labelSm, color: Colors.onSurfaceVariant },
});
