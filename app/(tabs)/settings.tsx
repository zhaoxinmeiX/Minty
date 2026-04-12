import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { BookText, ChevronRight, CircleEllipsis, Database, User } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
import { useStore } from '@/src/store';

export default function SettingsScreen() {
  const router = useRouter();
  const nickname = useStore((state) => state.nickname);
  const setNickname = useStore((state) => state.setNickname);
  const setLastTab = useStore((state) => state.setLastTab);
  const theme = Colors.light;
  const insets = useStableSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      setLastTab('settings');
    }, [setLastTab]),
  );

  const handleEditNickname = () => {
    Alert.prompt(
      '修改昵称',
      '请输入您的新昵称',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '保存',
          onPress: (name?: string) => {
            if (name && name.trim()) {
              setNickname(name.trim());
            }
          },
        },
      ],
      'plain-text',
      nickname,
    );
  };

  const handleAbout = () => {
    Alert.alert('关于 Minty', 'Minty v1.0\n一款轻量高级的记账应用');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSpacer}>
          <Pressable onPress={handleEditNickname}>
            <LinearGradient
              colors={[theme.homeBackground, theme.homeOliveSoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.profileHero, { paddingTop: insets.top + 32 }]}
            >
              <View style={styles.summaryDecorLayer} pointerEvents="none">
                <View style={styles.summaryOrbLarge} />
                <View style={[styles.summaryOrbSmall, { backgroundColor: 'rgba(255, 249, 241, 0.26)' }]} />
                <View style={[styles.summaryOrbBlue, { backgroundColor: 'rgba(171, 215, 251, 0.16)' }]} />
              </View>

              <View style={[styles.profileAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <User size={32} color="#FFF" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: '#FFF' }]}>{nickname}</Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={[styles.content, { backgroundColor: theme.background }]}>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.homeMuted }]}>数据</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.homeSurface }]}>
              <Pressable style={styles.listItem} onPress={() => router.push('/data-management')}>
                <View style={[styles.iconWrapper, { backgroundColor: '#E4F1E3' }]}>
                  <Database size={20} color={theme.income} />
                </View>
                <View style={styles.listTextWrap}>
                  <Text style={[styles.listTitle, { color: theme.text }]}>数据管理</Text>
                  <Text style={[styles.listHint, { color: theme.homeMuted }]}>导入与导出数据</Text>
                </View>
                <ChevronRight size={18} color={theme.homeOlive} />
              </Pressable>

              <View style={styles.divider} />

              <Pressable style={styles.listItem} onPress={() => router.push('/ledgers')}>
                <View style={[styles.iconWrapper, { backgroundColor: theme.homeBlueSoft }]}>
                  <BookText size={20} color={theme.homeOlive} />
                </View>
                <View style={styles.listTextWrap}>
                  <Text style={[styles.listTitle, { color: theme.text }]}>账本管理</Text>
                  <Text style={[styles.listHint, { color: theme.homeMuted }]}>创建和切换不同账本</Text>
                </View>
                <ChevronRight size={18} color={theme.homeOlive} />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.homeMuted }]}>其他</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.homeSurface }]}>
              <Pressable style={styles.listItem} onPress={handleAbout}>
                <View style={[styles.iconWrapper, { backgroundColor: '#FFF5EB' }]}>
                  <CircleEllipsis size={20} color={theme.expense} />
                </View>
                <View style={styles.listTextWrap}>
                  <Text style={[styles.listTitle, { color: theme.text }]}>关于</Text>
                  <Text style={[styles.listHint, { color: theme.homeMuted }]}>关于 Minty 记账</Text>
                </View>
                <ChevronRight size={18} color={theme.homeOlive} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 132,
    marginTop: -32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  headerSpacer: {
    marginBottom: 0,
  },
  profileHero: {
    paddingHorizontal: 24,
    paddingBottom: 64,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  summaryDecorLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  summaryOrbLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    right: -56,
    top: -40,
    backgroundColor: 'rgba(255, 249, 241, 0.16)',
  },
  summaryOrbSmall: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    left: -18,
    bottom: 56,
  },
  summaryOrbBlue: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    right: 34,
    bottom: -8,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginLeft: 70,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listTextWrap: {
    flex: 1,
  },
  listTitle: {
    fontSize: Typography.size.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  listHint: {
    fontSize: Typography.size.caption,
  },
});

