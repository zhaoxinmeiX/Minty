import { Tabs } from 'expo-router';
import { BarChart3, Calendar, Home, Settings } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useStore } from '@/src/store';

export default function TabLayout() {
  const themeColors = Colors.light;
  const isHomeLaunchOverlayVisible = useStore((state) => state.isHomeLaunchOverlayVisible);

  return (
    <View style={styles.container}>
      <Tabs
        detachInactiveScreens={false}
        screenOptions={{
          freezeOnBlur: true,
          lazy: false,
          animation: 'none',
          sceneStyle: {
            backgroundColor: themeColors.homeBackground,
          },
          tabBarActiveTintColor: themeColors.homeOlive,
          tabBarInactiveTintColor: themeColors.homeMuted,
          tabBarStyle: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 94,
            paddingBottom: 18,
            paddingTop: 12,
            backgroundColor: themeColors.homeSurface,
            borderTopWidth: 0,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            shadowColor: '#A9B66D',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 8,
          },
          tabBarLabelStyle: {
            marginTop: 4,
            fontSize: Typography.size.footnote,
            fontWeight: '700',
          },
          headerStyle: {
            backgroundColor: themeColors.card,
            shadowOpacity: 0,
            elevation: 0,
          },
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerTintColor: themeColors.text,
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            title: '首页',
            tabBarIcon: ({ color }) => <Home size={26} color={color} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            headerShown: false,
            title: '日历',
            tabBarIcon: ({ color }) => <Calendar size={26} color={color} />,
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            headerShown: false,
            title: '统计',
            tabBarIcon: ({ color }) => <BarChart3 size={26} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            headerShown: false,
            title: '设置',
            tabBarIcon: ({ color }) => <Settings size={26} color={color} />,
          }}
        />
      </Tabs>

      {isHomeLaunchOverlayVisible && (
        <View style={[styles.launchOverlay, { backgroundColor: themeColors.homeBackground }]}>
          <View style={styles.launchOverlayContent}>
            <Image source={require('@/assets/images/splash-icon.png')} style={styles.launchLogo} resizeMode="contain" />
            <Text style={[styles.launchBrand, { color: themeColors.homeOlive }]}>Minty</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  launchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  launchOverlayContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 184,
  },
  launchLogo: {
    width: 76,
    height: 76,
    marginBottom: 14,
  },
  launchBrand: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
});
