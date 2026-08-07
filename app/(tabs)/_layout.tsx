import { Tabs, useRouter } from 'expo-router';
import { BarChart3, Calendar, Home, Plus, Settings } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { ScreenBackground } from '@/components/common/ScreenBackground';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useNavigationGuard } from '@/src/hooks/useNavigationGuard';
import { useStore } from '@/src/store';

export default function TabLayout() {
  const themeColors = Colors.light;
  const router = useRouter();
  const navigateOnce = useNavigationGuard();
  const isHomeLaunchOverlayVisible = useStore((state) => state.isHomeLaunchOverlayVisible);

  const TabIcon = ({ Icon, title, color, focused, isAdd }: { Icon?: any; title?: string; color: string; focused: boolean; isAdd?: boolean }) => {
    if (isAdd) {
      return (
        <View style={styles.addIconContainer}>
          <View style={[styles.addPill, { backgroundColor: themeColors.homeAccent }]}>
            <Plus size={28} color="#FFF" strokeWidth={3} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.iconContainer}>
        {focused && (
          <View style={[styles.activePill, { backgroundColor: 'rgba(110, 125, 66, 0.12)' }]} />
        )}
        <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
        {title ? (
          <Text style={[styles.tabLabel, { color, fontWeight: focused ? '800' : '600' }]}>
            {title}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <Tabs
        detachInactiveScreens={false}
        screenOptions={{
          freezeOnBlur: true,
          lazy: false,
          animation: 'none',
          sceneStyle: {
            backgroundColor: 'transparent',
          },
          tabBarActiveTintColor: themeColors.homeOlive,
          tabBarInactiveTintColor: themeColors.homeMuted,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 94,
            paddingBottom: 24,
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
            tabBarIcon: ({ color, focused }) => <TabIcon Icon={Home} title="首页" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            headerShown: false,
            lazy: true,
            title: '日历',
            tabBarIcon: ({ color, focused }) => <TabIcon Icon={Calendar} title="日历" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="add-tab"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              navigateOnce(() => router.push('/add'));
            },
            tabLongPress: () => {
              navigateOnce(() => router.push({ pathname: '/add', params: { mode: 'recurring' } }));
            },
          }}
          options={{
            headerShown: false,
            title: '记账',
            tabBarIcon: ({ color }) => (
              <TabIcon color={color} focused={false} isAdd />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            headerShown: false,
            title: '统计',
            tabBarIcon: ({ color, focused }) => <TabIcon Icon={BarChart3} title="统计" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            headerShown: false,
            title: '设置',
            tabBarIcon: ({ color, focused }) => <TabIcon Icon={Settings} title="设置" color={color} focused={focused} />,
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
  iconContainer: {
    width: 64,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  activePill: {
    position: 'absolute',
    width: 64,
    height: 56,
    borderRadius: 20,
    top: -2,
  },
  addIconContainer: {
    width: 64,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  addPill: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F98C58',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  tabLabel: {
    fontSize: Typography.size.caption,
    marginTop: 2,
    letterSpacing: -0.2,
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
