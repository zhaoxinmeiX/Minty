import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getIconComponent, SELECTABLE_ICONS } from '@/src/constants/icons';
import { EditingCategory } from '@/src/types';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

interface CategoryEditModalProps {
  visible: boolean;
  editingCategory: EditingCategory | null;
  onSave: () => void;
  onCancel: () => void;
  onChange: (cat: EditingCategory) => void;
}

export const CategoryEditModal: React.FC<CategoryEditModalProps> = ({ visible, editingCategory, onSave, onCancel, onChange }) => {
  const theme = Colors.light;
  const accentColor = theme.accent;

  if (!editingCategory) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.editBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.editTitle, { color: theme.text }]}>{editingCategory.id ? '编辑分类' : editingCategory.parent_id ? '增加子分类' : '增加主分类'}</Text>
          <TextInput
            style={[styles.editInput, { color: theme.text, borderBottomColor: theme.border }]}
            value={editingCategory.name}
            onChangeText={(t) => onChange({ ...editingCategory, name: t })}
            placeholder="分类名称..."
            placeholderTextColor={theme.tabIconDefault}
            autoFocus
          />

          {!editingCategory.parent_id && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 20 }}>
              {SELECTABLE_ICONS.map((i) => {
                const Icon = getIconComponent(i);
                const sel = editingCategory.icon === i;
                return (
                  <Pressable key={i} onPress={() => onChange({ ...editingCategory, icon: i })} style={[styles.iconChoice, sel && { borderColor: accentColor, borderWidth: 2 }]}>
                    <Icon size={24} color={sel ? accentColor : theme.tabIconDefault} />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.editFooter}>
            <Pressable style={styles.editCancel} onPress={onCancel}>
              <Text style={{ color: theme.tabIconDefault, fontSize: Typography.size.body }}>取消</Text>
            </Pressable>
            <Pressable style={[styles.editConfirm, { backgroundColor: accentColor }]} onPress={onSave}>
              <Text style={{ color: '#000', fontWeight: 'bold', fontSize: Typography.size.body }}>保存</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  editBox: { width: '80%', padding: 20, borderRadius: 24 },
  editTitle: { fontSize: Typography.size.title, fontWeight: 'bold', marginBottom: 20 },
  editInput: { fontSize: Typography.size.body, paddingVertical: 8, borderBottomWidth: 1, marginBottom: 20 },
  iconChoice: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  editFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 10 },
  editCancel: { padding: 12 },
  editConfirm: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
});
