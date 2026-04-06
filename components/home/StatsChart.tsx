import { Colors } from '@/constants/Colors';
import { RecordItem } from '@/src/db/schema';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface StatsChartProps {
  records: RecordItem[];
  type: 'expense' | 'income';
}

export const StatsChart: React.FC<StatsChartProps> = ({ records, type }) => {
  const theme = Colors.light;

  const filtered = records.filter((r) => r.type === type);
  if (filtered.length === 0) {
    return (
      <View style={[styles.emptyChart, { backgroundColor: theme.card }]}>
        <Text style={{ color: theme.tabIconDefault, fontSize: 12 }}>暂无数据</Text>
      </View>
    );
  }

  // Aggregate by category
  const catMap = new Map<string, number>();
  filtered.forEach((r) => {
    catMap.set(r.category, (catMap.get(r.category) || 0) + r.amount);
  });

  const chartData = Array.from(catMap.entries())
    .map(([name, amount], index) => ({
      name,
      population: amount,
      color: `rgba(${(index * 70) % 200}, ${(index * 40 + 100) % 255}, ${(index * 90 + 50) % 255}, 1)`,
      legendFontColor: theme.text,
      legendFontSize: 12,
    }))
    .sort((a, b) => b.population - a.population)
    .slice(0, 5); // Show top 5

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <Text style={[styles.title, { color: theme.text }]}>{type === 'expense' ? '支出分布' : '收入分布'}</Text>
      <PieChart
        data={chartData}
        width={width - 64}
        height={200}
        chartConfig={{
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { margin: 16, borderRadius: 24, padding: 16 },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  emptyChart: { height: 150, margin: 16, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
});
