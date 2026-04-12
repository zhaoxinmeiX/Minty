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
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
          
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.homeMuted }]}>账户</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.homeSurface }]}>
              <Pressable style={styles.listItem} onPress={handleEditNickname}>
                <View style={[styles.profileAvatar, { backgroundColor: 'rgba(110, 125, 66, 0.08)', marginRight: 12 }]}>
                  <User size={24} color={theme.homeOlive} />
                </View>
                <View style={styles.listTextWrap}>
                  <Text style={[styles.listTitle, { color: theme.text, fontSize: 18 }]}>{nickname}</Text>
                  <Text style={[styles.listHint, { color: theme.homeMuted }]}>点击修改记录名称</Text>
                </View>
                <ChevronRight size={18} color={theme.homeOlive} />
              </Pressable>
            </View>
          </View>

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
    paddingBottom: 132,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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

