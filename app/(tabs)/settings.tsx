import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CheckCircle2, ChevronRight, Circle, Edit3, FileDown, FileUp, Plus, Trash2, User } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, InteractionManager, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { addLedger, deleteLedger, getLedgersAsync, updateLedger } from '@/src/db/operations';
import { Ledger } from '@/src/db/schema';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
import { useStore } from '@/src/store';
import { parseISODate } from '@/src/utils/date';
import { exportLedgerToExcel, importExcelToLedger } from '@/src/utils/excel';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const activeLedgerId = useStore((state) => state.activeLedgerId);
  const setActiveLedgerId = useStore((state) => state.setActiveLedgerId);
  const nickname = useStore((state) => state.nickname);
  const setNickname = useStore((state) => state.setNickname);
  const setLastTab = useStore((state) => state.setLastTab);
  const dataVersion = useStore((state) => state.dataVersion);
  const bumpDataVersion = useStore((state) => state.bumpDataVersion);
  const theme = Colors.light;
  const insets = useStableSafeAreaInsets();

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [newLedgerName, setNewLedgerName] = useState('');
  const hasFocusedRef = useRef(false);
  const lastSyncedDataVersionRef = useRef(dataVersion);
  const requestIdRef = useRef(0);

  const loadLedgers = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const data = await getLedgersAsync(db);
    if (requestId !== requestIdRef.current) return;
    setLedgers(data);
  }, [db]);

  useEffect(() => {
    void (async () => {
      await loadLedgers();
      hasFocusedRef.current = true;
      lastSyncedDataVersionRef.current = useStore.getState().dataVersion;
    })();
  }, [loadLedgers]);

  useFocusEffect(
    useCallback(() => {
      setLastTab('settings');

      if (!hasFocusedRef.current) {
        return;
      }

      if (lastSyncedDataVersionRef.current === dataVersion) {
        return;
      }

      const task = InteractionManager.runAfterInteractions(() => {
        void (async () => {
          await loadLedgers();
          lastSyncedDataVersionRef.current = useStore.getState().dataVersion;
        })();
      });

      return () => task.cancel();
    }, [dataVersion, loadLedgers, setLastTab]),
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

  const handleCreateLedger = () => {
    if (!newLedgerName.trim()) return;
    addLedger(db, newLedgerName.trim());
    bumpDataVersion();
    setNewLedgerName('');
    void loadLedgers();
  };

  const handleEditLedger = (ledger: Ledger) => {
    Alert.prompt(
      '编辑账本名称',
      '请输入新的账本名称',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '保存',
          onPress: (newName?: string) => {
            if (newName && newName.trim()) {
              updateLedger(db, ledger.id, newName.trim());
              bumpDataVersion();
              void loadLedgers();
            }
          },
        },
      ],
      'plain-text',
      ledger.name,
    );
  };

  const handleDeleteLedger = (ledger: Ledger) => {
    if (ledgers.length <= 1) {
      Alert.alert('无法删除', '请至少保留一个账本。');
      return;
    }

    Alert.alert('删除账本', `确定要删除“${ledger.name}”吗？这将永久删除该账本下的所有记账记录，操作不可恢复。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确定删除',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            deleteLedger(db, ledger.id);
            bumpDataVersion();
            if (activeLedgerId === ledger.id) {
              const remaining = await getLedgersAsync(db);
              if (remaining.length > 0) {
                setActiveLedgerId(remaining[0].id);
              }
            }
            await loadLedgers();
          })();
        },
      },
    ]);
  };

  const activeLedger = ledgers.find((ledger) => ledger.id === activeLedgerId);

  const handleExport = () => {
    if (activeLedger) {
      exportLedgerToExcel(db, activeLedger.id, activeLedger.name);
    }
  };

  const handleImport = () => {
    if (activeLedgerId) {
      importExcelToLedger(db, activeLedgerId, () => {
        bumpDataVersion();
        void loadLedgers();
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.homeBackground, paddingTop: insets.top }]}>
      <View pointerEvents="none" style={[styles.screenGlow, styles.screenGlowTop, { backgroundColor: 'rgba(252, 206, 180, 0.48)' }]} />
      <View pointerEvents="none" style={[styles.screenGlow, styles.screenGlowBottom, { backgroundColor: 'rgba(171, 215, 251, 0.34)' }]} />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerEyebrow, { color: theme.homeMuted }]}>Preferences</Text>
          <Text style={[styles.headerTitle, { color: theme.homeOlive }]}>设置</Text>
        </View>

        <Pressable style={[styles.profileHero, { backgroundColor: theme.homeSurface }]} onPress={handleEditNickname}>
          <View style={[styles.profileAvatar, { backgroundColor: theme.homeSection }]}>
            <User size={24} color={theme.homeOlive} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileLabel, { color: theme.homeMuted }]}>当前昵称</Text>
            <Text style={[styles.profileName, { color: theme.text }]}>{nickname}</Text>
          </View>
          <ChevronRight size={20} color={theme.homeOlive} />
        </Pressable>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.homeMuted }]}>数据管理</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.homeSurface }]}>
            <Pressable style={styles.listItem} onPress={handleImport}>
              <View style={[styles.iconWrapper, { backgroundColor: '#E4F1E3' }]}>
                <FileDown size={20} color={theme.income} />
              </View>
              <View style={styles.listTextWrap}>
                <Text style={[styles.listTitle, { color: theme.text }]}>导入数据</Text>
                <Text style={[styles.listHint, { color: theme.homeMuted }]}>从 Excel 合并到账本</Text>
              </View>
              <ChevronRight size={18} color={theme.homeOlive} />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: 'rgba(110, 125, 66, 0.08)' }]} />

            <Pressable style={styles.listItem} onPress={handleExport}>
              <View style={[styles.iconWrapper, { backgroundColor: theme.homeBlueSoft }]}>
                <FileUp size={20} color={theme.homeOlive} />
              </View>
              <View style={styles.listTextWrap}>
                <Text style={[styles.listTitle, { color: theme.text }]}>导出数据</Text>
                <Text style={[styles.listHint, { color: theme.homeMuted }]}>导出当前账本的 Excel</Text>
              </View>
              <ChevronRight size={18} color={theme.homeOlive} />
            </Pressable>
          </View>
          <Text style={[styles.sectionHint, { color: theme.homeMuted }]}>当前目标账本：{activeLedger?.name || '默认账本'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.homeMuted }]}>账本管理</Text>

          <View style={[styles.createContainer, { backgroundColor: theme.homeSurface }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="新建账本名称"
              placeholderTextColor={theme.homeMuted}
              value={newLedgerName}
              onChangeText={setNewLedgerName}
            />
            <Pressable style={[styles.createBtn, { backgroundColor: theme.homeAccent }]} onPress={handleCreateLedger}>
              <Plus size={18} color="#FFF" />
            </Pressable>
          </View>

          {ledgers.map((ledger) => {
            const active = activeLedgerId === ledger.id;
            return (
              <View
                key={ledger.id}
                style={[
                  styles.ledgerCard,
                  {
                    backgroundColor: theme.homeSurface,
                    borderColor: active ? theme.homeAccent : 'rgba(110, 125, 66, 0.08)',
                  },
                ]}
              >
                <Pressable style={styles.ledgerInfo} onPress={() => setActiveLedgerId(ledger.id)}>
                  <View style={styles.radioContainer}>
                    {active ? <CheckCircle2 size={24} color={theme.homeAccent} /> : <Circle size={24} color={theme.homeMuted} />}
                  </View>
                  <View style={styles.ledgerMeta}>
                    <Text style={[styles.ledgerName, { color: theme.text }]}>{ledger.name}</Text>
                    <Text style={[styles.ledgerDate, { color: theme.homeMuted }]}>
                      创建于 {(parseISODate(ledger.created_at) ?? new Date(ledger.created_at)).toLocaleDateString()}
                    </Text>
                  </View>
                </Pressable>

                <View style={styles.ledgerActions}>
                  <Pressable onPress={() => handleEditLedger(ledger)} style={[styles.actionBtn, { backgroundColor: theme.homeSurfaceStrong }]}>
                    <Edit3 size={16} color={theme.homeOlive} />
                  </Pressable>
                  <Pressable onPress={() => handleDeleteLedger(ledger)} style={[styles.actionBtn, { backgroundColor: '#FDE9DE' }]}>
                    <Trash2 size={16} color={theme.expense} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  screenGlowTop: {
    width: 210,
    height: 210,
    top: 56,
    left: -46,
  },
  screenGlowBottom: {
    width: 260,
    height: 260,
    bottom: 100,
    right: -96,
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 132,
  },
  header: {
    marginBottom: 16,
  },
  headerEyebrow: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  profileHero: {
    borderRadius: 30,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#A9B66D',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  profileAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileLabel: {
    fontSize: Typography.size.caption,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileName: {
    fontSize: Typography.size.titleLg,
    fontWeight: '800',
  },
  section: {
    marginBottom: 28,
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
    paddingVertical: 16,
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
  divider: {
    height: 1,
    marginLeft: 70,
  },
  sectionHint: {
    fontSize: Typography.size.caption,
    marginTop: 8,
    marginLeft: 4,
  },
  createContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: Typography.size.body,
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ledgerCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFF',
  },
  ledgerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 8,
  },
  radioContainer: {
    marginRight: 14,
  },
  ledgerMeta: {
    flex: 1,
  },
  ledgerName: {
    fontSize: Typography.size.body,
    fontWeight: '700',
    marginBottom: 4,
  },
  ledgerDate: {
    fontSize: Typography.size.caption,
  },
  ledgerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
