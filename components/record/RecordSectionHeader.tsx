import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RecordSectionHeaderProps {
  title: string;
  total: number;
  compact?: boolean;
}

export function RecordSectionHeader({ title, total, compact = false }: RecordSectionHeaderProps) {
  const theme = Colors.light;

  return (
    <View
      style={[
        styles.sectionHeaderContainer,
        compact ? styles.sectionHeaderContainerCompact : styles.sectionHeaderContainerDefault,
        !compact && {
          backgroundColor: theme.homeSection,
          borderColor: 'rgba(110, 125, 66, 0.08)',
        },
      ]}
    >
      <View style={[styles.sectionAccentDot, { backgroundColor: theme.homeAccent }]} />
      <View style={styles.sectionHeaderContent}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        {compact ? (
          <Text style={[styles.sectionTotalCompact, { color: theme.homeOlive }]}>支 {total.toFixed(2)}</Text>
        ) : (
          <View style={[styles.sectionTotalPill, { backgroundColor: theme.homeSurface }]}>
            <Text style={[styles.sectionTotal, { color: theme.homeOlive }]}>支 {total.toFixed(2)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderContainerDefault: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    minHeight: 50,
    borderRadius: 24,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
    borderWidth: 1,
    shadowColor: '#A9B66D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 1,
  },
  sectionHeaderContainerCompact: {
    marginHorizontal: 0,
    marginTop: 10,
    marginBottom: 4,
    minHeight: 32,
    paddingVertical: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  sectionAccentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  sectionHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.size.body,
    fontWeight: '700',
  },
  sectionTotalPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  sectionTotal: {
    fontSize: Typography.size.label,
    fontWeight: '600',
  },
  sectionTotalCompact: {
    fontSize: Typography.size.label,
    lineHeight: Typography.lineHeight.label,
    fontWeight: '700',
  },
});
