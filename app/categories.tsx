import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronLeft, ChevronRight, Edit3, Plus, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CategoryEditModal } from '@/components/add/CategoryEditModal';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getIconComponent } from '@/src/constants/icons';
import { useCategories } from '@/src/hooks/useCategories';
import { useNavigationGuard } from '@/src/hooks/useNavigationGuard';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
import { EditingCategory } from '@/src/types';

import { TypeSegmentControl } from '@/components/common/TypeSegmentControl';

export default function CategoriesScreen() {
  const router = useRouter();
  const navigateOnce = useNavigationGuard();
  const insets = useStableSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: 'expense' | 'income' }>();
  const theme = Colors.light;
  const accentColor = theme.accent;

  const [activeType, setActiveType] = useState<'expense' | 'income'>(
    params.type === 'income' ? 'income' : 'expense',
  );

  const { categories, remove, add, update, getSubs } = useCategories(activeType);
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set());
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);

  const toggleExpand = (id: number) => {
    const next = new Set(expandedCats);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCats(next);
  };

  const handleDelete = (id: number) => {
    Alert.alert('彻底删除', '确定要删除这个分类吗？相关所有层级都将被清理。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => remove(id),
      },
    ]);
  };

  const handleSaveCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    if (editingCategory.id) {
      update(editingCategory.id, editingCategory.name.trim(), editingCategory.icon);
    } else {
      add(editingCategory.name.trim(), editingCategory.icon, editingCategory.parent_id);
    }
    setEditingCategory(null);
  };

  return (
    <View style={styles.container}>
      <ScreenBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => navigateOnce(() => router.back())}
          style={styles.backButton}
          hitSlop={12}
        >
          <ChevronLeft color={theme.text} size={24} />
        </Pressable>

        <TypeSegmentControl type={activeType} onChange={setActiveType} />

        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Category List */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {categories.map((cat) => {
          const subs = getSubs(cat.id);
          const isExp = expandedCats.has(cat.id);
          const Icon = getIconComponent(cat.icon);
          return (
            <View key={cat.id} style={styles.categoryCardGroup}>
              <View style={[styles.treeRow, { backgroundColor: theme.homeSurface }]}>
                <Pressable onPress={() => toggleExpand(cat.id)} style={styles.treeExpander}>
                  {subs.length > 0 ? (
                    isExp ? (
                      <ChevronDown size={20} color={theme.homeOlive} />
                    ) : (
                      <ChevronRight size={20} color={theme.homeOlive} />
                    )
                  ) : (
                    <View style={{ width: 20 }} />
                  )}
                </Pressable>

                <View style={styles.treeMain}>
                  <View style={[styles.catIconBox, { backgroundColor: 'rgba(110, 125, 66, 0.08)' }]}>
                    <Icon size={20} color={theme.homeOlive} />
                  </View>
                  <Text style={[styles.treeText, { color: theme.text }]}>{cat.name}</Text>
                </View>

                <View style={styles.treeActions}>
                  <Pressable
                    onPress={() => setEditingCategory({ name: '', icon: cat.icon, parent_id: cat.id })}
                    style={styles.treeActionBtn}
                    hitSlop={8}
                  >
                    <Plus size={18} color={theme.homeOlive} />
                  </Pressable>

                  <Pressable
                    onPress={() => setEditingCategory({ ...cat })}
                    style={styles.treeActionBtn}
                    hitSlop={8}
                  >
                    <Edit3 size={18} color={theme.homeOlive} />
                  </Pressable>

                  <Pressable
                    onPress={() => handleDelete(cat.id)}
                    style={styles.treeActionBtn}
                    hitSlop={8}
                  >
                    <Trash2 size={18} color={theme.expense} />
                  </Pressable>
                </View>
              </View>

              {isExp &&
                subs.map((sub) => {
                  const SubIcon = getIconComponent(sub.icon);
                  return (
                    <View key={sub.id} style={[styles.treeRow, styles.subTreeRow, { backgroundColor: theme.homeSurfaceStrong }]}>
                      <View style={styles.treeMain}>
                        <View style={[styles.subIconBox, { backgroundColor: 'rgba(110, 125, 66, 0.08)' }]}>
                          <SubIcon size={16} color={theme.homeOlive} />
                        </View>
                        <Text style={[styles.treeText, { color: theme.text, fontSize: Typography.size.body - 1 }]}>{sub.name}</Text>
                      </View>

                      <View style={styles.treeActions}>
                        <Pressable
                          onPress={() => setEditingCategory({ ...sub })}
                          style={styles.treeActionBtn}
                          hitSlop={8}
                        >
                          <Edit3 size={16} color={theme.homeOlive} />
                        </Pressable>

                        <Pressable
                          onPress={() => handleDelete(sub.id)}
                          style={styles.treeActionBtn}
                          hitSlop={8}
                        >
                          <Trash2 size={16} color={theme.expense} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
            </View>
          );
        })}

        <Pressable
          style={[styles.addTreeBtn, { borderColor: accentColor }]}
          onPress={() => setEditingCategory({ name: '', icon: 'LayoutGrid', parent_id: null })}
        >
          <Plus size={20} color={accentColor} />
          <Text style={{ color: accentColor, fontWeight: '700', fontSize: Typography.size.body }}>增加主分类</Text>
        </Pressable>
      </ScrollView>

      {/* Edit Category Modal */}
      <CategoryEditModal
        visible={editingCategory !== null}
        editingCategory={editingCategory}
        onSave={handleSaveCategory}
        onCancel={() => setEditingCategory(null)}
        onChange={setEditingCategory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: Typography.size.title,
    fontWeight: '800',
  },
  headerRightPlaceholder: {
    width: 36,
  },
  segmentContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  segmentWrapper: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: Typography.size.body,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  categoryCardGroup: {
    marginBottom: 10,
  },
  treeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
  },
  subTreeRow: {
    marginLeft: 32,
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 16,
  },
  treeExpander: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  treeMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subIconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  treeText: {
    fontSize: Typography.size.body,
    fontWeight: '600',
  },
  treeActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  treeActionBtn: {
    padding: 4,
  },
  addTreeBtn: {
    height: 52,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 32,
  },
});
