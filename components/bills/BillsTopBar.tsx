import { ArrowLeft, ChevronDown, CircleX, Search, X } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

type Props = {
  searchOpen: boolean;
  keyword: string;
  ledgerName: string;
  ledgerTriggerRef?: React.RefObject<View | null>;
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
  ledgerTriggerRef,
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
  const theme = Colors.light;

  return (
    <>
      <View style={styles.header}>
        {searchOpen ? (
          <View style={styles.headerSearchWrap}>
            <View style={[styles.headerSearchBar, { backgroundColor: theme.homeSurface }]}>
              <Search size={20} color={theme.homeMuted} />
              <TextInput
                value={keyword}
                onChangeText={onKeywordChange}
                placeholder="搜索分类、备注、金额"
                placeholderTextColor={theme.homeMuted}
                style={[styles.searchInput, { color: theme.text }]}
                autoFocus
                returnKeyType="search"
              />
              {!!keyword && (
                <Pressable onPress={onClearKeyword} hitSlop={8}>
                  <CircleX size={18} color={theme.homeMuted} />
                </Pressable>
              )}
            </View>
            <Pressable style={[styles.headerSearchCloseBtn, { backgroundColor: theme.homeSurface }]} onPress={onCloseSearch}>
              <X size={18} color={theme.homeOlive} />
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable onPress={onBack} style={[styles.headerBtn, { backgroundColor: theme.homeSurface }]}>
              <ArrowLeft size={20} color={theme.homeOlive} />
            </Pressable>

            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerEyebrow, { color: theme.homeMuted }]}>Bills</Text>
              <Text style={[styles.headerTitle, { color: theme.homeOlive }]}>账单列表</Text>
            </View>

            <Pressable onPress={onOpenSearch} style={[styles.headerBtn, { backgroundColor: theme.homeSurface }]}>
              <Search size={18} color={theme.homeOlive} />
            </Pressable>
          </>
        )}
      </View>

      {!searchOpen && (
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <View ref={ledgerTriggerRef} collapsable={false}>
              <Pressable style={[styles.toolbarChip, { backgroundColor: theme.homeSurface }]} onPress={onOpenLedgerPicker}>
                <Text style={[styles.toolbarChipText, { color: theme.text }]} numberOfLines={1}>
                  {ledgerName}
                </Text>
                <ChevronDown size={15} color={theme.homeOlive} />
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.toolbarChip,
                {
                  backgroundColor: monthLabel ? theme.homeAccentSoft : theme.homeSurface,
                },
              ]}
              onPress={onOpenMonthPicker}
            >
              <Text style={[styles.toolbarChipText, { color: monthLabel ? theme.homeAccent : theme.text }]}>{monthLabel || '全部时间'}</Text>
              <ChevronDown size={15} color={monthLabel ? theme.homeAccent : theme.homeOlive} />
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.toolbarChip,
              styles.toolbarChipRight,
              {
                backgroundColor: showFilters ? theme.homeSection : theme.homeSurface,
              },
            ]}
            onPress={onToggleFilters}
          >
            <Text style={[styles.toolbarChipText, { color: showFilters ? theme.homeOlive : theme.text }]}>筛选</Text>
            <ChevronDown size={15} color={showFilters ? theme.homeOlive : theme.homeOlive} />
          </Pressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 74,
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  headerTitleWrap: {
    flex: 1,
    paddingHorizontal: 14,
  },
  headerEyebrow: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  headerSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerSearchBar: {
    height: 50,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    flex: 1,
  },
  headerSearchCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.body,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  toolbarChip: {
    minHeight: 42,
    borderRadius: 21,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  toolbarChipRight: {
    marginLeft: 'auto',
  },
  toolbarChipText: {
    fontSize: Typography.size.label,
    fontWeight: '700',
  },
});
