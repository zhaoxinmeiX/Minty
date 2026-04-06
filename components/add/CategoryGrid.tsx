import { Colors } from '@/constants/Colors';
import { getIconComponent } from '@/src/constants/icons';
import { Category } from '@/src/db/schema';
import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

interface CategoryGridProps {
  categories: Category[];
  selectedCategory: Category | null;
  selectedSubCategory: Category | null;
  onSelectMain: (cat: Category) => void;
  onManage: () => void;
  categoryRefs: React.MutableRefObject<Map<number, View>>;
  accentColor: string;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, selectedCategory, selectedSubCategory, onSelectMain, onManage, categoryRefs, accentColor }) => {
  const theme = Colors.light;

  const renderCategoryItem = (cat: Category) => {
    const Icon = getIconComponent(cat.icon);
    const isSelected = selectedCategory?.id === cat.id;
    return (
      <View
        key={cat.id}
        ref={(el) => {
          if (el) categoryRefs.current.set(cat.id, el as View);
        }}
        style={styles.catGridItem}
      >
        <Pressable onPress={() => onSelectMain(cat)} style={{ alignItems: 'center' }}>
          <View style={[styles.iconWrapper, isSelected && { backgroundColor: '#FFF4E5', borderRadius: 20 }]}>
            <View style={styles.iconContainer}>
              <Icon size={24} color={isSelected ? '#FF9500' : theme.text} />
              <View style={styles.badgeContainer}>
                <View style={[styles.badge, { backgroundColor: theme.tabIconDefault + '40' }]}>
                  <Text style={styles.badgeText}>•••</Text>
                </View>
              </View>
            </View>
          </View>
          <Text numberOfLines={1} style={[styles.catLabel, { color: isSelected ? '#FF9500' : theme.text }, isSelected && { fontWeight: '700' }]}>
            {isSelected && selectedSubCategory ? selectedSubCategory.name : cat.name}
          </Text>
        </Pressable>
      </View>
    );
  };

  return <View style={styles.gridContainer}>{categories.map(renderCategoryItem)}</View>;
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  catGridItem: {
    width: (width - 20) / 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    padding: 8,
    marginBottom: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catLabel: {
    fontSize: 12,
    marginTop: 0,
    textAlign: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 7,
    color: '#FFF',
    fontWeight: 'bold',
  },
});
