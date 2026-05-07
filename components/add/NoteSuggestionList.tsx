import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getIconComponent } from '@/src/constants/icons';
import { RecordNoteSuggestion } from '@/src/db/operations';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type NoteSuggestionListProps = {
  suggestions: RecordNoteSuggestion[];
  keyword: string;
  accentColor: string;
  compact?: boolean;
  onSelect: (suggestion: RecordNoteSuggestion) => void;
};

const HighlightedNote = ({ text, keyword, accentColor }: { text: string; keyword: string; accentColor: string }) => {
  const matchIndex = text.toLowerCase().indexOf(keyword.toLowerCase());

  if (!keyword || matchIndex < 0) {
    return <Text>{text}</Text>;
  }

  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + keyword.length);
  const after = text.slice(matchIndex + keyword.length);

  return (
    <Text>
      {before}
      <Text style={{ color: accentColor, fontWeight: '900' }}>{match}</Text>
      {after}
    </Text>
  );
};

export function NoteSuggestionList({ suggestions, keyword, accentColor, compact = false, onSelect }: NoteSuggestionListProps) {
  const theme = Colors.light;

  return (
    <View style={[styles.container, compact && styles.containerCompact, { backgroundColor: theme.homeSurface }]}>
      <Text style={[styles.title, compact && styles.titleCompact, { color: theme.homeMuted }]}>历史备注</Text>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {suggestions.map((suggestion) => {
          const Icon = getIconComponent(suggestion.icon);
          const note = suggestion.note?.trim() || '';

          return (
            <Pressable
              key={suggestion.id}
              onPress={() => onSelect(suggestion)}
              style={({ pressed }) => [
                styles.item,
                pressed && styles.itemPressed,
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: accentColor + '18' }]}>
                <Icon size={14} color={accentColor} />
              </View>

              <View style={styles.itemMain}>
                <Text style={[styles.note, { color: theme.text }]} numberOfLines={1}>
                  <HighlightedNote text={note} keyword={keyword} accentColor={accentColor} />
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 16,
    marginBottom: 8,
    borderRadius: 16,
    paddingTop: 8,
    width: '50%',
    maxHeight: 300,
    alignSelf: 'flex-start',
    shadowColor: '#A9B66D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 14,
  },
  containerCompact: {
    marginLeft: 14,
    borderRadius: 15,
    paddingTop: 7,
    maxHeight: 200,
  },
  title: {
    fontSize: Typography.size.footnote,
    lineHeight: Typography.lineHeight.footnote,
    fontWeight: '700',
    paddingHorizontal: 12,
    marginBottom: 2,
  },
  titleCompact: {
    fontSize: Typography.size.footnote,
    lineHeight: Typography.lineHeight.footnote,
    paddingHorizontal: 10,
  },
  scroll: {
    flexGrow: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  itemPressed: {
    backgroundColor: 'rgba(110, 125, 66, 0.05)',
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  itemMain: {
    flex: 1,
    minWidth: 0,
  },
  note: {
    fontSize: Typography.size.label,
    lineHeight: Typography.lineHeight.label,
    fontWeight: '600',
  },
});
