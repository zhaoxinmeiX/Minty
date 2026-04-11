import { ArrowLeft, ChevronDown, CircleX, Search, SlidersHorizontal, X } from 'lucide-react-native';
import React from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

type Props = {
  searchOpen: boolean;
  keyword: string;
  ledgerName: string;
  ledgerTriggerRef?: React.RefObject<View | null>;
  showFilters: boolean;
  onBack: () => void;
  onKeywordChange: (value: string) => void;
  onSubmitKeyword: () => void;
  onClearKeyword: () => void;
  onCloseSearch: () => void;
  onOpenSearch: () => void;
  onOpenLedgerPicker: () => void;
  onToggleFilters: () => void;
};

export function BillsTopBar({
  searchOpen,
  keyword,
  ledgerName,
  ledgerTriggerRef,
  showFilters,
  onBack,
  onKeywordChange,
  onSubmitKeyword,
  onClearKeyword,
  onCloseSearch,
  onOpenSearch,
  onOpenLedgerPicker,
  onToggleFilters,
}: Props) {
  const theme = Colors.light;
  const handleOpenLedgerPicker = () => {
    Keyboard.dismiss();
    onOpenLedgerPicker();
  };

  const handleToggleFilters = () => {
    Keyboard.dismiss();
    onToggleFilters();
  };

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
                onSubmitEditing={onSubmitKeyword}
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

            <View pointerEvents="none" style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitle, { color: theme.homeOlive }]} numberOfLines={1}>
                账单列表
              </Text>
            </View>

            <Pressable onPress={onOpenSearch} style={[styles.headerBtn, { backgroundColor: theme.homeSurface }]}>
              <Search size={18} color={theme.homeOlive} />
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <View ref={ledgerTriggerRef} collapsable={false}>
            <Pressable style={[styles.toolbarChip, { backgroundColor: theme.homeSurface }]} onPress={handleOpenLedgerPicker}>
              <Text style={[styles.toolbarChipText, { color: theme.text }]} numberOfLines={1}>
                {ledgerName}
              </Text>
              <ChevronDown size={15} color={theme.homeOlive} />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[
            styles.toolbarChip,
            styles.toolbarChipRight,
            {
              backgroundColor: showFilters ? theme.homeSection : theme.homeSurface,
            },
          ]}
          onPress={handleToggleFilters}
        >
          <Text style={[styles.toolbarChipText, { color: showFilters ? theme.homeOlive : theme.text }]}>筛选</Text>
          <SlidersHorizontal size={16} color={theme.homeOlive} />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    position: 'absolute',
    left: 72,
    right: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.size.title,
    lineHeight: Typography.lineHeight.title,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  headerSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerSearchBar: {
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    flex: 1,
  },
  headerSearchCloseBtn: {
    width: 44,
    height: 44,
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
