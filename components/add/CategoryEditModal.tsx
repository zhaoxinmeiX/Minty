import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getIconComponent, ICON_GROUPS, SELECTABLE_ICONS } from '@/src/constants/icons';
import { EditingCategory } from '@/src/types';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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

  // If the current icon isn't in the standard list, prepend it as its own group
  const groups = useMemo(() => {
    if (!editingCategory) return ICON_GROUPS;
    if (SELECTABLE_ICONS.includes(editingCategory.icon)) return ICON_GROUPS;
    return [{ label: '当前', icons: [editingCategory.icon] }, ...ICON_GROUPS];
  }, [editingCategory?.icon]);

  if (!visible || !editingCategory) return null;

  const CurrentIcon = getIconComponent(editingCategory.icon);

  return (
    <View style={[styles.modalOverlay, styles.embeddedOverlay]} onStartShouldSetResponder={() => true}>
      <View style={[styles.editBox, { backgroundColor: theme.card }]}>
          {/* Header: icon preview + title + name input */}
          <View style={styles.editHeader}>
            <View style={[styles.currentIconPreview, { backgroundColor: accentColor + '18' }]}>
              <CurrentIcon size={32} color={accentColor} />
            </View>
            <View style={styles.editHeaderRight}>
              <Text style={[styles.editTitle, { color: theme.text }]}>
                {editingCategory.id ? '编辑分类' : editingCategory.parent_id ? '增加子分类' : '增加主分类'}
              </Text>
              <TextInput
                style={[styles.editInput, { color: theme.text, borderBottomColor: theme.border }]}
                value={editingCategory.name}
                onChangeText={(t) => onChange({ ...editingCategory, name: t })}
                placeholder="分类名称..."
                placeholderTextColor={theme.tabIconDefault}
                autoFocus
              />
            </View>
          </View>

          {/* Icon picker: categorized grid */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.iconScroll}
            contentContainerStyle={styles.iconScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {groups.map((group) => (
              <View key={group.label} style={styles.iconGroup}>
                <Text style={[styles.groupLabel, { color: theme.tabIconDefault }]}>{group.label}</Text>
                <View style={styles.iconGrid}>
                  {group.icons.map((iconName) => {
                    const Icon = getIconComponent(iconName);
                    const isSelected = editingCategory.icon === iconName;
                    return (
                      <Pressable
                        key={iconName}
                        onPress={() => onChange({ ...editingCategory, icon: iconName })}
                        style={styles.iconCell}
                      >
                        <View
                          style={[
                            styles.iconCellInner,
                            isSelected && { backgroundColor: accentColor + '18', borderColor: accentColor, borderWidth: 1.5 },
                          ]}
                        >
                          <Icon size={22} color={isSelected ? accentColor : theme.text} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
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
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  embeddedOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
  },
  editBox: {
    width: '88%',
    maxHeight: '80%',
    padding: 20,
    borderRadius: 24,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  currentIconPreview: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editHeaderRight: {
    flex: 1,
  },
  editTitle: {
    fontSize: Typography.size.title,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  editInput: {
    fontSize: Typography.size.body,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  iconScroll: {
    maxHeight: 340,
    marginTop: 8,
  },
  iconScrollContent: {
    paddingBottom: 8,
  },
  iconGroup: {
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: Typography.size.caption,
    fontWeight: '600',
    marginBottom: 8,
    paddingLeft: 2,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  iconCell: {
    width: '16.66%',
    aspectRatio: 1,
    padding: 3,
  },
  iconCellInner: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(120,120,120,0.06)',
  },
  editFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
  },
  editCancel: {
    padding: 12,
  },
  editConfirm: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
