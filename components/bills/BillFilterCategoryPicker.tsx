import { ArrowLeft, Check, CircleX } from 'lucide-react-native';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { CategoryOption } from '@/src/types/bills';

import { styles } from './BillFilterModal.styles';

type Props = {
  categoryOptions: CategoryOption[];
  selectedCategoryId?: number;
  onSelectCategory: (categoryId?: number) => void;
  onCloseCategoryPicker: () => void;
  onClose: () => void;
};

export function BillFilterCategoryPicker({ categoryOptions, selectedCategoryId, onSelectCategory, onCloseCategoryPicker, onClose }: Props) {
  const theme = Colors.light;

  return (
    <>
      <View style={styles.filterHeaderCompact}>
        <Pressable style={styles.headerIconBtnPlain} onPress={onCloseCategoryPicker} hitSlop={8}>
          <ArrowLeft size={20} color={theme.homeMuted} />
        </Pressable>

        <Text style={styles.filterMainTitle}>分类</Text>

        <Pressable style={styles.headerIconBtnPlain} onPress={onClose} hitSlop={8}>
          <CircleX size={22} color={theme.homeMuted} />
        </Pressable>
      </View>

      <FlatList
        data={categoryOptions}
        keyExtractor={(item) => item.category_id.toString()}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryListContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Pressable
            style={[styles.categoryItem, selectedCategoryId === undefined && styles.categoryItemActive]}
            onPress={() => {
              onSelectCategory(undefined);
              onCloseCategoryPicker();
            }}
          >
            <Text style={[styles.categoryItemText, selectedCategoryId === undefined && styles.categoryItemTextActive]}>不限制</Text>
            {selectedCategoryId === undefined ? (
              <View style={[styles.categoryCheck, styles.categoryCheckActive]}>
                <Check size={14} color="#FFFFFF" />
              </View>
            ) : null}
          </Pressable>
        }
        renderItem={({ item }) => {
          const selected = item.category_id === selectedCategoryId;
          return (
            <Pressable
              style={[styles.categoryItem, selected && styles.categoryItemActive]}
              onPress={() => {
                onSelectCategory(item.category_id);
                onCloseCategoryPicker();
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
