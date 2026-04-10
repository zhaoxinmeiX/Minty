import { ArrowLeft, ChevronDown, CircleX, Search, X } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Typography } from '@/constants/Typography';

type Props = {
  searchOpen: boolean;
  keyword: string;
  ledgerName: string;
  monthLabel: string | null;
  showFilters: boolean;
  onBack: () => void;
  onKeywordChange: (value: string) => void;
  onClearKeyword: () => void;
  onCloseSearch: () => void;
  onOpenSearch: () => void;
  onOpenLedgerPicker: () => void;
  onOpenMonthPicker: () => void;
  onToggleFilters: () => void;
};

export function BillsTopBar({
  searchOpen,
  keyword,
  ledgerName,
  monthLabel,
  showFilters,
  onBack,
  onKeywordChange,
  onClearKeyword,
  onCloseSearch,
  onOpenSearch,
  onOpenLedgerPicker,
  onOpenMonthPicker,
  onToggleFilters,
}: Props) {
  return (
    <>
      <View style={styles.header}>
        {searchOpen ? (
          <View style={styles.headerSearchWrap}>
            <View style={styles.headerSearchBar}>
              <Search size={22} color="#9CA3AF" />
              <TextInput
                value={keyword}
                onChangeText={onKeywordChange}
                placeholder="搜索分类、备注、金额"
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                autoFocus
                returnKeyType="search"
              />
              {!!keyword && (
                <Pressable onPress={onClearKeyword} hitSlop={8}>
                  <CircleX size={20} color="#9CA3AF" />
                </Pressable>
              )}
            </View>
            <Pressable style={styles.headerSearchCloseBtn} onPress={onCloseSearch}>
              <X size={20} color="#606266" />
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable onPress={onBack} style={styles.headerBtn}>
              <ArrowLeft size={28} color="#222" />
            </Pressable>
            <Text style={styles.headerTitle}>账单列表</Text>
            <View style={styles.headerRight}>
              <Pressable onPress={onOpenSearch} style={styles.headerBtn}>
                <Search size={22} color="#222" />
              </Pressable>
            </View>
          </>
        )}
      </View>

      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <Pressable style={styles.toolbarChip} onPress={onOpenLedgerPicker}>
            <Text style={styles.toolbarChipText}>{ledgerName}</Text>
            <ChevronDown size={16} color="#4B5563" />
          </Pressable>

          <Pressable style={[styles.toolbarChip, monthLabel && styles.toolbarChipActive]} onPress={onOpenMonthPicker}>
            <Text style={[styles.toolbarChipText, monthLabel && styles.toolbarChipActiveText]}>{monthLabel || '全部时间'}</Text>
            <ChevronDown size={16} color={monthLabel ? '#F59E0B' : '#4B5563'} />
          </Pressable>
        </View>

        <Pressable style={[styles.toolbarChip, styles.toolbarChipRight, showFilters && styles.toolbarChipActive]} onPress={onToggleFilters}>
          <Text style={[styles.toolbarChipText, showFilters && styles.toolbarChipActiveText]}>筛选</Text>
          <ChevronDown size={16} color={showFilters ? '#F59E0B' : '#4B5563'} />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: { padding: 8 },
  headerTitle: { fontSize: Typography.size.title, fontWeight: '700', color: '#111827' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerSearchBar: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    flex: 1,
  },
  headerSearchCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: { flex: 1, color: '#1F2937', fontSize: Typography.size.body },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  toolbarChip: {
    minHeight: 38,
    borderRadius: 20,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarChipActive: {
    backgroundColor: '#FFF5E6',
  },
  toolbarChipRight: {
    marginLeft: 'auto',
  },
  toolbarChipText: { fontSize: Typography.size.body, color: '#374151', fontWeight: '500' },
  toolbarChipActiveText: { color: '#F59E0B' },
});
