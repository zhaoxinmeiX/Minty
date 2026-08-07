import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getIconComponent } from '@/src/constants/icons';
import { useCategories } from '@/src/hooks/useCategories';
import { EditingCategory } from '@/src/types';
import { ChevronDown, ChevronRight, Edit3, Plus, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface CategoryManagerProps {
  visible: boolean;
  type: 'expense' | 'income';
  onClose: () => void;
  onEdit: (cat: EditingCategory) => void;
  children?: React.ReactNode;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ visible, type, onClose, onEdit, children }) => {
  const theme = Colors.light;
  const accentColor = theme.accent;

  const { categories, remove, getSubs } = useCategories(type);
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    const next = new Set(expandedCats);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCats(next);
  };

  const handleDelete = (id: number) => {
    Alert.alert('彻底删除', '确定要删除这个分类吗？相关所有层级都将被清理。', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => remove(id) },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.manageContainer, { backgroundColor: theme.background }]}>
        <View style={styles.dragHandleContainer}>
          <View style={[styles.dragHandle, { backgroundColor: theme.tabIconDefault + '40' }]} />
        </View>
        <View style={styles.manageHeader}>
          <Text style={[styles.manageTitle, { color: theme.text }]}>管理分类</Text>
          <Pressable onPress={onClose}>
            <X color={theme.text} size={24} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {categories.map((cat) => {
            const subs = getSubs(cat.id);
            const isExp = expandedCats.has(cat.id);
            const Icon = getIconComponent(cat.icon);
            return (
              <View key={cat.id} style={{ marginBottom: 12 }}>
                <View style={[styles.treeRow, { backgroundColor: theme.card }]}>
                  <Pressable onPress={() => toggleExpand(cat.id)} style={styles.treeExpander}>
                    {subs.length > 0 && (isExp ? <ChevronDown size={20} color={theme.tabIconDefault} /> : <ChevronRight size={20} color={theme.tabIconDefault} />)}
                  </Pressable>
                  <View style={styles.treeMain}>
                    <Icon size={20} color={theme.text} />
                    <Text style={[styles.treeText, { color: theme.text }]}>{cat.name}</Text>
                  </View>
                  <View style={styles.treeActions}>
                    <Pressable onPress={() => onEdit({ name: '', icon: cat.icon, parent_id: cat.id })} style={styles.treeActionBtn}>
                      <Plus size={20} color={theme.tabIconDefault} />
                    </Pressable>
                    <Pressable onPress={() => onEdit({ ...cat })} style={styles.treeActionBtn}>
                      <Edit3 size={20} color={theme.tabIconDefault} />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(cat.id)} style={styles.treeActionBtn}>
                      <Trash2 size={20} color={theme.expense} />
                    </Pressable>
                  </View>
                </View>

                {isExp &&
                  subs.map((sub) => {
                    const SubIcon = getIconComponent(sub.icon);
                    return (
                    <View key={sub.id} style={[styles.treeRow, styles.subTreeRow, { backgroundColor: theme.card + '50' }]}>
                      <View style={styles.treeMain}>
                        <SubIcon size={18} color={theme.text} style={{ marginLeft: 20 }} />
                        <Text style={[styles.treeText, { color: theme.text }]}>{sub.name}</Text>
                      </View>
                      <View style={styles.treeActions}>
                        <Pressable onPress={() => onEdit({ ...sub })} style={styles.treeActionBtn}>
                          <Edit3 size={18} color={theme.tabIconDefault} />
                        </Pressable>
                        <Pressable onPress={() => handleDelete(sub.id)} style={styles.treeActionBtn}>
                          <Trash2 size={18} color={theme.expense} />
                        </Pressable>
                      </View>
                    </View>
                    );
                  })}
              </View>
            );
          })}

          <Pressable style={[styles.addTreeBtn, { borderColor: accentColor }]} onPress={() => onEdit({ name: '', icon: 'LayoutGrid', parent_id: null })}>
            <Plus size={20} color={accentColor} />
            <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: Typography.size.body }}>增加主分类</Text>
          </Pressable>
        </ScrollView>
      </View>
      {children}
    </Modal>
  );
};

const styles = StyleSheet.create({
  manageContainer: { flex: 1, paddingTop: 10 },
  dragHandleContainer: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  dragHandle: { width: 36, height: 5, borderRadius: 3 },
  manageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  manageTitle: { fontSize: Typography.size.title, fontWeight: 'bold' },
  treeRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 4 },
  subTreeRow: { marginLeft: 30, paddingVertical: 12 },
  treeExpander: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  treeMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  treeText: { fontSize: Typography.size.body, fontWeight: '500' },
  treeActions: { flexDirection: 'row', gap: 16 },
  treeActionBtn: { padding: 4 },
  addTreeBtn: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 40,
  },
});
