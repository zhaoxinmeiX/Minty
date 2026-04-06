import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RecordSectionHeaderProps {
  title: string;
  total: number;
}

export function RecordSectionHeader({ title, total }: RecordSectionHeaderProps) {
  const theme = Colors.light;

  return (
    <View style={[styles.sectionHeaderContainer, { backgroundColor: '#FFF8EC' }]}>
      <View style={styles.sectionLeftBar} />
      <View style={styles.sectionHeaderContent}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.sectionTotal, { color: theme.tabIconDefault }]}>支 {total.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    height: 38,
    borderRadius: 20,
    // Add a very subtle shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionLeftBar: {
    width: 4,
    height: '40%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    marginLeft: 14,
  },
  sectionHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTotal: {
    fontSize: 12,
    fontWeight: '600',
  },
});
