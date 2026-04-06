import { Tabs } from 'expo-router';
import { BarChart3, Calendar, Feather, Home, Settings } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  const themeColors = Colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.tint,
        tabBarInactiveTintColor: themeColors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: themeColors.card,
          borderTopColor: themeColors.border,
          height: 85,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          marginTop: 6,
          fontSize: 10,
          fontWeight: '500',
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
        headerShown: useClientOnlyValue(false, true),
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
        name="add"
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => (
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: themeColors.accent,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: -40,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                elevation: 8,
                borderWidth: 4,
                borderColor: themeColors.card,
              }}
            >
              <Feather size={32} color="#fff" />
            </View>
          ),
          tabBarStyle: { display: 'none' }, // 盖住底部tab标签
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
  );
}
