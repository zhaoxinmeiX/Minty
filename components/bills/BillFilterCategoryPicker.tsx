import { ArrowLeft, Check, CircleX } from 'lucide-react-native';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { CategoryOption } from '@/src/types/bills';

import { styles } from './BillFilterModal.styles';

type Props = {
  categoryOptions: CategoryOption[];
  selectedCategoryIds: number[];
  onToggleCategory: (categoryId?: number) => void;
  onCloseCategoryPicker: () => void;
  onClose: () => void;
};

export function BillFilterCategoryPicker({ categoryOptions, selectedCategoryIds, onToggleCategory, onCloseCategoryPicker, onClose }: Props) {
  const theme = Colors.light;

  return (
    <>
      <View style={styles.filterHeaderCompact}>
        <Pressable style={styles.headerIconBtnPlain} onPress={onCloseCategoryPicker} hitSlop={8}>
          <ArrowLeft size={20} color={theme.homeMuted} />
        </Pressable>

        <Text style={[styles.filterMainTitle, { fontSize: 18 }]}>选择分类</Text>

        <Pressable style={styles.headerIconBtnPlain} onPress={onClose} hitSlop={8}>
          <CircleX size={22} color={theme.homeMuted} />
        </Pressable>
      </View>

      <FlatList
        data={categoryOptions}
        keyExtractor={(item, index) => item?.category_id != null ? item.category_id.toString() : `index-${index}`}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryListContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Pressable
            style={[styles.categoryItem, selectedCategoryIds.length === 0 && styles.categoryItemActive]}
            onPress={() => {
              onToggleCategory(undefined);
              onCloseCategoryPicker();
            }}
          >
            <Text style={[styles.categoryItemText, selectedCategoryIds.length === 0 && styles.categoryItemTextActive]}>不限制</Text>
            {selectedCategoryIds.length === 0 ? (
              <View style={[styles.categoryCheck, styles.categoryCheckActive]}>
                <Check size={14} color="#FFFFFF" />
              </View>
            ) : null}
          </Pressable>
        }
        renderItem={({ item }) => {
          const selected = selectedCategoryIds.includes(item.category_id);
          return (
            <Pressable
              style={[styles.categoryItem, selected && styles.categoryItemActive]}
              onPress={() => {
                onToggleCategory(item.category_id);
              }}
            >
              <Text style={[styles.categoryItemText, selected && styles.categoryItemTextActive]}>{item.category}</Text>
              {selected ? (
                <View style={[styles.categoryCheck, styles.categoryCheckActive]}>
                  <Check size={14} color="#FFFFFF" />
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
    </>
  );
}
