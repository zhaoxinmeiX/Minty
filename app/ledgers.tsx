import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Check, ChevronLeft, MoreVertical, Plus } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { Typography } from '@/constants/Typography';
import { addLedger, deleteLedger, getLedgersAsync, updateLedger } from '@/src/db/operations';
import { Ledger } from '@/src/db/schema';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
import { useNavigationGuard } from '@/src/hooks/useNavigationGuard';
import { useStore } from '@/src/store';
import { parseISODate } from '@/src/utils/date';

export default function LedgersScreen() {
  const router = useRouter();
  const navigateOnce = useNavigationGuard();
  const db = useSQLiteContext();
  const theme = Colors.light;
  const insets = useStableSafeAreaInsets();

  const activeLedgerId = useStore((state) => state.activeLedgerId);
  const setActiveLedgerId = useStore((state) => state.setActiveLedgerId);
  const dataVersion = useStore((state) => state.dataVersion);
  const bumpDataVersion = useStore((state) => state.bumpDataVersion);

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [newLedgerName, setNewLedgerName] = useState('');

  // Action Sheet State
  const [actionLedger, setActionLedger] = useState<Ledger | null>(null);
  
  const sheetTranslateY = useSharedValue(400);
  const sheetOpacity = useSharedValue(0);

  const loadLedgers = useCallback(async () => {
    const data = await getLedgersAsync(db);
    setLedgers(data);
  }, [db]);

  useEffect(() => {
    void loadLedgers();
  }, [loadLedgers, dataVersion]);

  const openActionSheet = (ledger: Ledger) => {
    setActionLedger(ledger);
    sheetTranslateY.value = withTiming(0, { duration: 250 });
    sheetOpacity.value = withTiming(1, { duration: 250 });
  };

  const closeActionSheet = () => {
    sheetTranslateY.value = withTiming(400, { duration: 250 });
    sheetOpacity.value = withTiming(0, { duration: 250 });
    setTimeout(() => {
      setActionLedger(null);
    }, 250);
  };

  const handleCreateLedger = () => {
    if (!newLedgerName.trim()) return;
    addLedger(db, newLedgerName.trim());
    bumpDataVersion();
    setNewLedgerName('');
  };

  const handleSetCurrent = () => {
    if (actionLedger && actionLedger.id !== activeLedgerId) {
      setActiveLedgerId(actionLedger.id);
    }
    closeActionSheet();
  };

  const handleRename = () => {
    if (!actionLedger) return;
    
    Alert.prompt(
      '重命名账本',
      '请输入新的账本名称',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: (newName?: string) => {
            if (newName && newName.trim()) {
              updateLedger(db, actionLedger.id, newName.trim());
              bumpDataVersion();
            }
          },
        },
      ],
      'plain-text',
      actionLedger.name,
    );
    closeActionSheet();
  };

  const handleDelete = () => {
    if (!actionLedger) return;
    if (ledgers.length <= 1) {
      Alert.alert('无法删除', '请至少保留一个账本。');
      closeActionSheet();
      return;
    }

    Alert.alert('删除账本', `确定要删除“${actionLedger.name}”吗？这将永久删除该账本下的所有数据，不可恢复。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          deleteLedger(db, actionLedger.id);
          bumpDataVersion();
          if (activeLedgerId === actionLedger.id) {
             void getLedgersAsync(db).then((remaining) => {
                if (remaining.length > 0) setActiveLedgerId(remaining[0].id);
             });
          }
        },
      },
    ]);
    closeActionSheet();
  };

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sheetOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.homeBackground, paddingTop: insets.top }]}>
      <ScreenBackground />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => navigateOnce(() => router.back())} style={[styles.headerIcon, { backgroundColor: theme.homeSurface }]}>
          <ChevronLeft size={22} color={theme.homeOlive} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.homeOlive }]}>账本管理</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.createContainer, { backgroundColor: theme.homeSurface }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="新建账本名称..."
            placeholderTextColor={theme.homeMuted}
            value={newLedgerName}
            onChangeText={setNewLedgerName}
          />
          <Pressable style={[styles.createBtn, { backgroundColor: theme.homeAccent }]} onPress={handleCreateLedger}>
            <Text style={styles.createBtnText}>新建</Text>
            <Plus size={16} color="#FFF" />
          </Pressable>
        </View>

        <View style={styles.listContainer}>
          {ledgers.map((ledger) => {
            const isActive = ledger.id === activeLedgerId;
            return (
              <View key={ledger.id} style={[styles.ledgerItem, { backgroundColor: theme.homeSurface }]}>
                <View style={styles.ledgerInfo}>
                  <Text style={[styles.ledgerName, { color: theme.text }]}>{ledger.name}</Text>
                  <Text style={[styles.ledgerDate, { color: theme.homeMuted }]}>
                    {(parseISODate(ledger.created_at) ?? new Date(ledger.created_at)).toLocaleDateString()}
                  </Text>
                </View>

                {isActive && (
                  <View style={styles.activePill}>
                    <Check size={14} color={theme.homeAccent} />
                    <Text style={[styles.activePillText, { color: theme.homeAccent }]}>当前使用</Text>
                  </View>
                )}

                <Pressable style={styles.moreBtn} onPress={() => openActionSheet(ledger)}>
                  <MoreVertical size={20} color={theme.homeMuted} />
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={actionLedger !== null} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
             <Pressable style={StyleSheet.absoluteFill} onPress={closeActionSheet} />
          </Animated.View>
          
          <Animated.View style={[styles.actionSheet, { backgroundColor: theme.card }, sheetAnimatedStyle]}>
             <View style={styles.sheetHandle} />
             <Text style={[styles.sheetTitle, { color: theme.homeMuted }]}>管理：{actionLedger?.name}</Text>

             <Pressable 
                style={styles.sheetAction} 
                onPress={handleSetCurrent}
             >
                <Text style={[styles.sheetActionText, { color: theme.text }, actionLedger?.id === activeLedgerId && { opacity: 0.5 }]}>
                  设为当前账本
                </Text>
             </Pressable>

             <View style={styles.sheetDivider} />

             <Pressable style={styles.sheetAction} onPress={handleRename}>
                <Text style={[styles.sheetActionText, { color: theme.text }]}>重命名</Text>
             </Pressable>

             <View style={styles.sheetDivider} />

             <Pressable style={styles.sheetAction} onPress={handleDelete}>
                <Text style={[styles.sheetActionText, { color: theme.expense }]}>删除账本</Text>
             </Pressable>
             
             <View style={{ height: 8 }} />
             
             <Pressable style={styles.sheetCancelBtn} onPress={closeActionSheet}>
                <Text style={[styles.sheetCancelBtnText, { color: theme.text }]}>取消</Text>
             </Pressable>
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  headerTitle: {
    fontSize: Typography.size.titleLg,
    fontWeight: '800',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 1,
  },
  headerRight: {
    width: 44,
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  createContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: Typography.size.body,
    fontWeight: '500',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 18,
    gap: 4,
  },
  createBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: Typography.size.caption,
  },
  listContainer: {
    gap: 12,
  },
  ledgerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 18,
    paddingLeft: 20,
    paddingRight: 8,
  },
  ledgerInfo: {
    flex: 1,
  },
  ledgerName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  ledgerDate: {
    fontSize: Typography.size.caption,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F2EC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    gap: 4,
  },
  activePillText: {
    fontSize: Typography.size.micro,
    fontWeight: '700',
  },
  moreBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  actionSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: Typography.size.caption,
    textAlign: 'center',
    marginBottom: 16,
  },
  sheetAction: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  sheetActionText: {
    fontSize: 17,
    fontWeight: '600',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  sheetCancelBtn: {
    marginTop: 8,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 18,
  },
  sheetCancelBtnText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
