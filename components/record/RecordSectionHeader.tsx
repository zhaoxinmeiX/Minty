import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RecordSectionHeaderProps {
  title: string;
  total: number;
}

export function RecordSectionHeader({ title, total }: RecordSectionHeaderProps) {
  const theme = Colors.light;

  return (
    <View
      style={[
        styles.sectionHeaderContainer,
        {
          backgroundColor: theme.homeSection,
          borderColor: 'rgba(110, 125, 66, 0.08)',
        },
      ]}
    >
      <View style={[styles.sectionAccentDot, { backgroundColor: theme.homeAccent }]} />
      <View style={styles.sectionHeaderContent}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        <View style={[styles.sectionTotalPill, { backgroundColor: theme.homeSurface }]}>
          <Text style={[styles.sectionTotal, { color: theme.homeOlive }]}>支 {total.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
});
