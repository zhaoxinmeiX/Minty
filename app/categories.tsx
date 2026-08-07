import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FolderPlus,
  Plus,
  Trash2,
  X,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { CategoryEditModal } from '@/components/add/CategoryEditModal';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { TypeSegmentControl } from '@/components/common/TypeSegmentControl';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getIconComponent } from '@/src/constants/icons';
import { useCategories } from '@/src/hooks/useCategories';
import { useNavigationGuard } from '@/src/hooks/useNavigationGuard';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
import { EditingCategory } from '@/src/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CategoriesScreen() {
  const router = useRouter();
  const navigateOnce = useNavigationGuard();
  const insets = useStableSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: 'expense' | 'income' }>();
  const theme = Colors.light;

  const [activeType, setActiveType] = useState<'expense' | 'income'>(
    params.type === 'income' ? 'income' : 'expense',
  );

  const { categories, remove, add, update, getSubs } = useCategories(activeType);
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set());
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);

  const accentColor = activeType === 'expense' ? theme.homeAccent : theme.income;

  const toggleExpand = (id: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = new Set(expandedCats);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCats(next);
  };

  const handleDelete = (id: number, name: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    Alert.alert('删除分类', `确定要删除「${name}」吗？关联的子分类也会同步删除。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch {}
          remove(id);
        },
      },
    ]);
  };

  const handleSaveCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
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

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => navigateOnce(() => router.back())}
          style={styles.backButton}
          hitSlop={12}
        >
          <ChevronLeft color={theme.text} size={24} />
        </Pressable>

        <TypeSegmentControl
          type={activeType}
          onChange={(t) => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            setActiveType(t);
          }}
        />

        <View style={styles.headerRightSpacer} />
      </View>

      {/* Category List */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FolderPlus size={48} color={theme.homeMuted} opacity={0.4} />
            <Text style={styles.emptyText}>暂无{activeType === 'expense' ? '支出' : '收入'}分类</Text>
            <Pressable
              style={[styles.emptyAddBtn, { backgroundColor: accentColor }]}
              onPress={() => setEditingCategory({ name: '', icon: 'LayoutGrid', parent_id: null })}
            >
              <Plus size={18} color="#FFF" />
              <Text style={styles.emptyAddBtnText}>添加第一个主分类</Text>
            </Pressable>
          </View>
        ) : (
          categories.map((cat) => {
            const subs = getSubs(cat.id);
            const isExp = expandedCats.has(cat.id);
            const Icon = getIconComponent(cat.icon);
            const iconBgColor =
              activeType === 'expense' ? 'rgba(249, 140, 88, 0.14)' : 'rgba(100, 138, 92, 0.14)';
            const iconColor = activeType === 'expense' ? theme.homeAccent : theme.income;

            return (
              <View key={cat.id} style={styles.cleanCard}>
                {/* Main Category Row */}
                <Pressable
                  style={styles.cardHeaderRow}
                  onPress={() => toggleExpand(cat.id)}
                >
                  <View style={styles.cardLeftContent}>
                    <View style={[styles.mainIconBadge, { backgroundColor: iconBgColor }]}>
                      <Icon size={20} color={iconColor} />
                    </View>
                    <Text style={styles.mainCategoryName}>{cat.name}</Text>
                    {subs.length > 0 && (
                      <View style={styles.subCountBadge}>
                        <Text style={styles.subCountBadgeText}>{subs.length}个</Text>
                      </View>
                    )}
                  </View>

                  {/* Right side: Edit + Delete + Chevron */}
                  <View style={styles.cardRightContent}>
                    <Pressable
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        } catch {}
                        setEditingCategory({ ...cat });
                      }}
                      style={styles.actionBtn}
                      hitSlop={8}
                    >
                      <Edit3 size={16} color={theme.homeOlive} />
                    </Pressable>

                    <Pressable
                      onPress={() => handleDelete(cat.id, cat.name)}
                      style={styles.actionBtn}
                      hitSlop={8}
                    >
                      <Trash2 size={16} color={theme.expense} />
                    </Pressable>

                    <View style={styles.chevronBox}>
                      {isExp ? (
                        <ChevronDown size={18} color={theme.homeOlive} />
                      ) : (
                        <ChevronRight size={18} color={theme.homeOlive} />
                      )}
                    </View>
                  </View>
                </Pressable>

                {/* Expanded Subcategory Chip Cloud */}
                {isExp && (
                  <View style={styles.chipCloudWrapper}>
                    {subs.map((sub) => {
                      const SubIcon = getIconComponent(sub.icon);
                      return (
                        <Pressable
                          key={sub.id}
                          style={styles.subChip}
                          onPress={() => {
                            try {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            } catch {}
                            setEditingCategory({ ...sub });
                          }}
                          onLongPress={() => handleDelete(sub.id, sub.name)}
                        >
                          <SubIcon size={14} color={iconColor} />
                          <Text style={styles.chipText}>{sub.name}</Text>
                          <Pressable
                            onPress={() => handleDelete(sub.id, sub.name)}
                            hitSlop={6}
                            style={styles.chipDeleteBtn}
                          >
                            <X size={12} color={theme.homeMuted} />
                          </Pressable>
                        </Pressable>
                      );
                    })}

                    {/* Add Subcategory Chip */}
                    <Pressable
                      style={[styles.subChip, styles.addChip]}
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        } catch {}
                        setEditingCategory({ name: '', icon: cat.icon, parent_id: cat.id });
                      }}
                    >
                      <Plus size={14} color={accentColor} />
                      <Text style={[styles.chipText, { color: accentColor, fontWeight: '700' }]}>
                        添加二级分类
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Add Main Category Button */}
        <Pressable
          style={[styles.addMainButton, { backgroundColor: accentColor + '15' }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch {}
            setEditingCategory({ name: '', icon: 'LayoutGrid', parent_id: null });
          }}
        >
          <Plus size={18} color={accentColor} />
          <Text style={[styles.addMainButtonText, { color: accentColor }]}>添加主分类</Text>
        </Pressable>
      </ScrollView>

      {/* Category Edit Modal */}
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
    paddingBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightSpacer: {
    width: 36,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: Typography.size.body,
    color: Colors.light.homeMuted,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  emptyAddBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: Typography.size.body,
  },
  cleanCard: {
    backgroundColor: Colors.light.homeSurface,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: '#2C3420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
    overflow: 'hidden',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.light.homeSurface,
  },
  cardLeftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mainCategoryName: {
    fontSize: Typography.size.body,
    fontWeight: '700',
    color: Colors.light.text,
    marginRight: 6,
  },
  cardRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subCountBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  subCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.homeMuted,
  },
  actionBtn: {
    padding: 4,
  },
  chevronBox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCloudWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
  },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  chipText: {
    fontSize: Typography.size.body - 2,
    fontWeight: '600',
    color: Colors.light.text,
  },
  chipDeleteBtn: {
    marginLeft: 2,
    padding: 2,
  },
  addChip: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderStyle: 'dashed',
  },
  addMainButton: {
    height: 50,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 24,
  },
  addMainButtonText: {
    fontWeight: '700',
    fontSize: Typography.size.body,
  },
});
