import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CheckCircle2, ChevronRight, Circle, Edit3, FileDown, FileUp, Plus, Trash2, User } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { addLedger, deleteLedger, getLedgers, updateLedger } from '@/src/db/operations';
import { Ledger } from '@/src/db/schema';
import { useStore } from '@/src/store';
import { parseISODate } from '@/src/utils/date';
import { exportLedgerToExcel, importExcelToLedger } from '@/src/utils/excel';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { activeLedgerId, setActiveLedgerId, nickname, setNickname, setLastTab } = useStore();
  const theme = Colors.light;

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [newLedgerName, setNewLedgerName] = useState('');

  const loadLedgers = useCallback(() => {
    const data = getLedgers(db);
    setLedgers(data);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadLedgers();
      setLastTab('settings');
    }, [loadLedgers, setLastTab]),
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
    setNewLedgerName('');
    loadLedgers();
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
              loadLedgers();
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
          deleteLedger(db, ledger.id);
          if (activeLedgerId === ledger.id) {
            const remaining = getLedgers(db);
            if (remaining.length > 0) {
              setActiveLedgerId(remaining[0].id);
            }
          }
          loadLedgers();
        },
      },
    ]);
  };

  const activeLedger = ledgers.find((l) => l.id === activeLedgerId);

  const handleExport = () => {
    if (activeLedger) {
      exportLedgerToExcel(db, activeLedger.id, activeLedger.name);
    }
  };

  const handleImport = () => {
    if (activeLedgerId) {
      importExcelToLedger(db, activeLedgerId, () => {
        loadLedgers();
      });
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>设置</Text>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.tabIconDefault }]}>个人资料</Text>
        <Pressable style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={handleEditNickname}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.tint + '15' }]}>
              <User size={22} color={theme.tint} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>我的昵称</Text>
              <Text style={[styles.cardValue, { color: theme.tabIconDefault }]}>{nickname}</Text>
            </View>
            <ChevronRight size={20} color={theme.tabIconDefault} />
          </View>
        </Pressable>
      </View>

      {/* Data Management Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.tabIconDefault }]}>数据管理</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, padding: 0 }]}>
          <Pressable style={styles.listItem} onPress={handleImport}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.income + '15' }]}>
              <FileDown size={20} color={theme.income} />
            </View>
            <Text style={[styles.listText, { color: theme.text }]}>导入数据 (Excel)</Text>
            <ChevronRight size={20} color={theme.tabIconDefault} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable style={styles.listItem} onPress={handleExport}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.tint + '15' }]}>
              <FileUp size={20} color={theme.tint} />
            </View>
            <Text style={[styles.listText, { color: theme.text }]}>导出数据 (Excel)</Text>
            <ChevronRight size={20} color={theme.tabIconDefault} />
          </Pressable>
        </View>
        <Text style={[styles.sectionHint, { color: theme.tabIconDefault }]}>导入导出将针对当前选中的账本：{activeLedger?.name || '默认账本'}</Text>
      </View>

      {/* Ledger Management Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: theme.tabIconDefault }]}>账本管理</Text>
        </View>

        {/* Create Ledger */}
        <View style={[styles.createContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="新建账本名称..."
            placeholderTextColor={theme.tabIconDefault}
            value={newLedgerName}
            onChangeText={setNewLedgerName}
          />
          <Pressable style={[styles.createBtn, { backgroundColor: theme.tint }]} onPress={handleCreateLedger}>
            <Plus size={20} color="#000" />
          </Pressable>
        </View>

        {ledgers.map((item) => (
          <View
            key={item.id}
            style={[styles.ledgerCard, { backgroundColor: theme.card, borderColor: theme.border }, activeLedgerId === item.id && { borderColor: theme.tint, borderWidth: 1.5 }]}
          >
            <Pressable style={styles.ledgerInfo} onPress={() => setActiveLedgerId(item.id)}>
              <View style={styles.radioContainer}>
                {activeLedgerId === item.id ? <CheckCircle2 size={24} color={theme.tint} /> : <Circle size={24} color={theme.tabIconDefault} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ledgerName, { color: theme.text }]}>{item.name}</Text>
                <Text style={styles.ledgerDate}>创建于 {(parseISODate(item.created_at) ?? new Date(item.created_at)).toLocaleDateString()}</Text>
              </View>
            </Pressable>

            <View style={styles.ledgerActions}>
              <Pressable onPress={() => handleEditLedger(item)} style={styles.iconBtn}>
                <Edit3 size={18} color={theme.tabIconDefault} />
              </Pressable>
              <Pressable onPress={() => handleDeleteLedger(item)} style={styles.iconBtn}>
                <Trash2 size={18} color={theme.expense} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionHint: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 12,
    marginTop: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  listText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginLeft: 72,
  },
  createContainer: {
    flexDirection: 'row',
    padding: 8,
    paddingLeft: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 12,
  },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ledgerCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  ledgerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  radioContainer: {
    marginRight: 16,
  },
  ledgerName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  ledgerDate: {
    fontSize: 11,
    color: '#888',
  },
  ledgerActions: {
    flexDirection: 'row',
  },
  iconBtn: {
    padding: 10,
  },
});
