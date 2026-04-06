import { ArrowLeft, CircleX } from 'lucide-react-native';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { CategoryOption } from '@/src/types/bills';

import { styles } from './BillFilterModal.styles';

type Props = {
  categoryOptions: CategoryOption[];
  onSelectCategory: (categoryId?: number) => void;
  onCloseCategoryPicker: () => void;
  onClose: () => void;
};

export function BillFilterCategoryPicker({ categoryOptions, onSelectCategory, onCloseCategoryPicker, onClose }: Props) {
  return (
    <>
      <View style={styles.filterHeader}>
        <Pressable style={styles.categoryBackBtn} onPress={onCloseCategoryPicker} hitSlop={8}>
          <ArrowLeft size={20} color="#6B7280" />
        </Pressable>
        <Text style={styles.filterMainTitle}>选择分类</Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <CircleX size={22} color="#9CA3AF" />
        </Pressable>
      </View>

      <FlatList
        data={categoryOptions}
        keyExtractor={(item) => item.category_id.toString()}
        style={styles.categoryList}
        ListHeaderComponent={
          <Pressable
            style={styles.categoryItem}
            onPress={() => {
              onSelectCategory(undefined);
              onCloseCategoryPicker();
            }}
          >
            <Text style={styles.categoryItemText}>不限制</Text>
          </Pressable>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.categoryItem}
            onPress={() => {
              onSelectCategory(item.category_id);
              onCloseCategoryPicker();
            }}
          >
            <Text style={styles.categoryItemText}>{item.category}</Text>
          </Pressable>
        )}
      />
    </>
  );
}
