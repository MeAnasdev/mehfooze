import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize } from '../constants/theme';
import HomeScreen from '../screens/HomeScreen';
import ExposureScreen from '../screens/ExposureScreen';
import MapScreen from '../screens/MapScreen';
import HabitsScreen from '../screens/HabitsScreen';
import ProfileScreen from '../screens/ProfileScreen';

type RootTabParamList = {
  Home: undefined;
  Exposure: undefined;
  Map: undefined;
  Habits: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Exposure: 'bar-chart',
  Map: 'map',
  Habits: 'checkbox',
  Profile: 'person',
};

export default function BottomNav() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          const iconName = focused ? TAB_ICONS[route.name] : TAB_ICONS[route.name];
          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarLabel: ({ focused }) => (
          <Text style={[styles.label, focused && styles.labelActive]}>
            {route.name}
          </Text>
        ),
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveTintColor: Colors.primaryContainer,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Exposure" component={ExposureScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Habits" component={HabitsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopColor: Colors.outlineVariant,
    borderTopWidth: 1,
    height: 72,
    paddingTop: 8,
    paddingBottom: 16,
  },
  tabBarItem: {
    flexDirection: 'column',
  },
  label: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.labelSm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  labelActive: {
    color: Colors.primaryContainer,
    fontWeight: '600',
  },
});
