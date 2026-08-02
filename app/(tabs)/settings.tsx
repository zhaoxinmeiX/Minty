import { useFocusEffect, useRouter } from 'expo-router';
import { BookText, ChevronRight, CircleEllipsis, Database, User } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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
  const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(nickname);
  const nicknameInputRef = useRef<TextInput>(null);
  const nicknameFocusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLastTab('settings');
    }, [setLastTab]),
  );

  const handleEditNickname = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        '修改昵称',
        '请输入您的新昵称',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '保存',
            onPress: (name?: string) => {
              if (name?.trim()) {
                setNickname(name.trim());
              }
            },
          },
        ],
        'plain-text',
        nickname,
      );
      return;
    }

    setNicknameDraft(nickname);
    setIsNicknameModalVisible(true);
  };

  const closeNicknameModal = () => {
    if (nicknameFocusTimerRef.current) {
      clearTimeout(nicknameFocusTimerRef.current);
      nicknameFocusTimerRef.current = null;
    }
    setIsNicknameModalVisible(false);
  };

  const focusNicknameInput = () => {
    nicknameFocusTimerRef.current = setTimeout(() => {
      nicknameInputRef.current?.focus();
      nicknameFocusTimerRef.current = null;
    }, 200);
  };

  const saveNickname = () => {
    const nextNickname = nicknameDraft.trim();
    if (!nextNickname) return;

    setNickname(nextNickname);
    closeNicknameModal();
  };

  const handleAbout = () => {
    Alert.alert('关于 Minty', 'Minty v1.0\n一款轻量高级的记账应用');
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { paddingTop: insets.top + 20 }]}>

          <View style={styles.section}>
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

      <Modal
        visible={Platform.OS === 'android' && isNicknameModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={closeNicknameModal}
        onShow={focusNicknameInput}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView style={styles.keyboardAvoidingContainer} behavior="height" pointerEvents="box-none">
            <View style={[styles.nicknameDialog, { backgroundColor: theme.homeSurface }]}>
              <Text style={[styles.nicknameDialogTitle, { color: theme.text }]}>修改昵称</Text>
              <TextInput
                ref={nicknameInputRef}
                selectTextOnFocus
                showSoftInputOnFocus
                maxLength={20}
                value={nicknameDraft}
                onChangeText={setNicknameDraft}
                onSubmitEditing={saveNickname}
                returnKeyType="done"
                placeholder="请输入昵称"
                placeholderTextColor={theme.homeMuted}
                style={[
                  styles.nicknameInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.homeSurfaceStrong,
                    borderColor: theme.border,
                  },
                ]}
              />
              <View style={styles.nicknameActions}>
                <Pressable style={styles.nicknameCancelButton} onPress={closeNicknameModal}>
                  <Text style={[styles.nicknameCancelText, { color: theme.homeMuted }]}>取消</Text>
                </Pressable>
                <Pressable
                  disabled={!nicknameDraft.trim()}
                  style={[styles.nicknameSaveButton, { backgroundColor: theme.homeAccent }, !nicknameDraft.trim() && styles.nicknameSaveButtonDisabled]}
                  onPress={saveNickname}
                >
                  <Text style={styles.nicknameSaveText}>保存</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  keyboardAvoidingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nicknameDialog: {
    width: '88%',
    borderRadius: 24,
    padding: 20,
    elevation: 10,
  },
  nicknameDialogTitle: {
    fontSize: Typography.size.title,
    lineHeight: Typography.lineHeight.title,
    fontWeight: '800',
    marginBottom: 16,
  },
  nicknameInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontSize: Typography.size.body,
  },
  nicknameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  nicknameCancelButton: {
    minWidth: 72,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nicknameCancelText: {
    fontSize: Typography.size.body,
    fontWeight: '700',
  },
  nicknameSaveButton: {
    minWidth: 88,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nicknameSaveButtonDisabled: {
    opacity: 0.4,
  },
  nicknameSaveText: {
    color: '#FFF',
    fontSize: Typography.size.body,
    fontWeight: '800',
  },
});
