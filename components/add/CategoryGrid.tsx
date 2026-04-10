import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getIconComponent } from '@/src/constants/icons';
import { Category } from '@/src/db/schema';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const COLUMN_COUNT = 6;

interface CategoryGridProps {
  categories: Category[];
  selectedCategory: Category | null;
  selectedSubCategory: Category | null;
  onSelectMain: (cat: Category) => void;
  onManage: () => void;
  categoryRefs: React.MutableRefObject<Map<number, View>>;
  accentColor: string;
  compact?: boolean;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, selectedCategory, selectedSubCategory, onSelectMain, onManage, categoryRefs, accentColor, compact = false }) => {
  const theme = Colors.light;
  const rows = Array.from({ length: Math.ceil(categories.length / COLUMN_COUNT) }, (_, rowIndex) => categories.slice(rowIndex * COLUMN_COUNT, (rowIndex + 1) * COLUMN_COUNT));

  const renderCategoryItem = (cat: Category) => {
    const Icon = getIconComponent(cat.icon);
    const isSelected = selectedCategory?.id === cat.id;
    const hasSelectedSubCategory = isSelected && !!selectedSubCategory;
    const combinedLabel = hasSelectedSubCategory ? `${cat.name}-${selectedSubCategory.name}` : cat.name;
    const shouldSplitSelectedLabel = hasSelectedSubCategory && Array.from(combinedLabel).length > (compact ? 7 : 8);
    return (
      <View
        key={cat.id}
        ref={(el) => {
          if (el) categoryRefs.current.set(cat.id, el as View);
        }}
        style={[styles.catGridItem, compact && styles.catGridItemCompact]}
      >
        <Pressable onPress={() => onSelectMain(cat)} style={styles.pressable}>
          <View
            style={[
              styles.iconWrapper,
              compact && styles.iconWrapperCompact,
              {
                backgroundColor: isSelected ? accentColor + '18' : theme.homeSurfaceStrong,
              },
            ]}
          >
            <View style={[styles.iconContainer, compact && styles.iconContainerCompact]}>
              <Icon size={compact ? 18 : 20} color={isSelected ? accentColor : theme.text} />
            </View>
          </View>
          <View style={[styles.labelBlock, compact && styles.labelBlockCompact]}>
            {shouldSplitSelectedLabel ? (
              <>
                <Text numberOfLines={1} style={[styles.catLabel, compact && styles.catLabelCompact, styles.catLabelLine, { color: accentColor, fontWeight: '700' }]}>
                  {cat.name}
                </Text>
                <Text numberOfLines={1} style={[styles.catLabel, compact && styles.catLabelCompact, styles.catLabelLine, { color: accentColor, fontWeight: '700' }]}>
                  {selectedSubCategory?.name}
                </Text>
              </>
            ) : (
              <Text numberOfLines={1} style={[styles.catLabel, compact && styles.catLabelCompact, { color: isSelected ? accentColor : theme.text }, isSelected && { fontWeight: '700' }]}>
                {combinedLabel}
              </Text>
            )}
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.gridContainer, compact && styles.gridContainerCompact]}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.gridRow, compact && styles.gridRowCompact]}>
          {Array.from({ length: COLUMN_COUNT }, (_, columnIndex) => {
            const category = row[columnIndex];
            if (!category) {
              return <View key={`empty-${rowIndex}-${columnIndex}`} style={[styles.catGridItem, compact && styles.catGridItemCompact]} />;
            }
            return renderCategoryItem(category);
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  gridContainerCompact: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridRowCompact: {
    gap: 8,
  },
  catGridItem: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  catGridItemCompact: {
    marginBottom: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconWrapperCompact: {
    width: 44,
    height: 44,
    borderRadius: 16,
    marginBottom: 4,
  },
  iconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerCompact: {
    width: 28,
    height: 28,
  },
  catLabel: {
    fontSize: Typography.size.footnote,
    textAlign: 'center',
    width: '100%',
  },
  catLabelCompact: {
    fontSize: Typography.size.tiny,
  },
  catLabelLine: {
    lineHeight: 13,
  },
  labelBlock: {
    minHeight: 28,
    width: '100%',
    alignItems: 'center',
  },
  labelBlockCompact: {
    minHeight: 26,
  },
  pressable: {
    width: '92%',
    alignItems: 'center',
  },
});
