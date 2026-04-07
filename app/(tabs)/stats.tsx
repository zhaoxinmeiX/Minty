import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { StatsDonutChart } from '@/components/stats/StatsDonutChart';
import { Colors } from '@/constants/Colors';
import { getIconComponent } from '@/src/constants/icons';
import { CategoryStat, TimeRange, useStatsScreen } from '@/src/hooks/useStatsScreen';
import { useStore } from '@/src/store';

export default function StatsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { activeLedgerId, setLastTab } = useStore();
  const theme = Colors.light;
  const statsState = useStatsScreen(db, activeLedgerId);
  const didInitialFetchRef = useRef(false);

  useEffect(() => {
    statsState.fetchStats();
    didInitialFetchRef.current = true;
  }, [statsState.fetchStats]);

  useFocusEffect(
    useCallback(() => {
      if (didInitialFetchRef.current) {
        statsState.fetchStats();
      }
      setLastTab('stats');
    }, [setLastTab, statsState.fetchStats]),
  );

  const openBillsByCategory = useCallback(
    (item: CategoryStat) => {
      const { startDate, endDate } = statsState.buildDateRange();
      router.push({
        pathname: '/bills',
        params: {
          type: statsState.type,
          categoryId: item.category_id.toString(),
          startDate,
          endDate,
        },
      });
    },
    [router, statsState],
  );

  const openBillsByCategoryId = useCallback(
    (categoryId: number) => {
      const target = statsState.stats.find((item) => item.category_id === categoryId);
      if (!target) return;
      openBillsByCategory(target);
    },
    [openBillsByCategory, statsState.stats],
  );

  const renderRankingItem = ({ item }: { item: CategoryStat }) => {
    const Icon = getIconComponent(item.icon);
    return (
      <Pressable style={[styles.rankingItem, { borderBottomColor: theme.border }]} onPress={() => openBillsByCategory(item)}>
        <View style={styles.rankingLeft}>
          <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
            <Icon size={18} color={theme.text} />
          </View>
          <View>
            <Text style={[styles.rankingName, { color: theme.text }]}>{item.category}</Text>
            <Text style={[styles.rankingCount, { color: theme.tabIconDefault }]}>
              {item.percentage.toFixed(1)}% · {item.count}笔
            </Text>
          </View>
        </View>
        <Text style={[styles.rankingAmount, { color: theme.text }]}>{item.totalAmount.toFixed(2)}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Range Switcher */}
      <View style={styles.rangeBar}>
        {(['all', 'year', 'month', 'week'] as TimeRange[]).map((r) => (
          <Pressable
            key={r}
            onPress={() => {
              statsState.setRange(r);
              statsState.setCurrentDate(new Date());
            }}
            style={[styles.rangeBtn, statsState.range === r && { borderBottomColor: theme.tint }]}
          >
            <Text style={[styles.rangeText, { color: statsState.range === r ? theme.text : theme.tabIconDefault }]}>
              {r === 'all' ? '总' : r === 'year' ? '年' : r === 'month' ? '月' : '周'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Date Navigator */}
      {statsState.range !== 'all' && (
        <View style={styles.dateNav}>
          <Pressable onPress={statsState.handlePrev}>
            <ChevronLeft size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.currentDateText, { color: theme.text }]}>
            {statsState.range === 'year'
              ? `${statsState.currentDate.getFullYear()}年`
              : statsState.range === 'month'
                ? `${statsState.currentDate.getFullYear()}年${statsState.currentDate.getMonth() + 1}月`
                : '本周'}
          </Text>
          <Pressable onPress={statsState.handleNext}>
            <ChevronRight size={24} color={theme.text} />
          </Pressable>
        </View>
      )}

      {/* Type Switcher */}
      <View style={styles.typeSwitcher}>
        <Pressable
          onPress={() => statsState.setType('expense')}
          style={[styles.typeBtn, statsState.type === 'expense' && { backgroundColor: theme.expense + '20', borderColor: theme.expense }]}
        >
          <Text style={[styles.typeText, { color: statsState.type === 'expense' ? theme.expense : theme.tabIconDefault }]}>支出</Text>
        </Pressable>
        <Pressable
          onPress={() => statsState.setType('income')}
          style={[styles.typeBtn, statsState.type === 'income' && { backgroundColor: theme.income + '20', borderColor: theme.income }]}
        >
          <Text style={[styles.typeText, { color: statsState.type === 'income' ? theme.income : theme.tabIconDefault }]}>收入</Text>
        </Pressable>
      </View>

      <FlatList
        data={statsState.stats}
        keyExtractor={(item) => item.category_id.toString()}
        renderItem={renderRankingItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.chartContainer}>
            <StatsDonutChart
              size={statsState.donutMetrics.size}
              center={statsState.donutMetrics.center}
              innerRadius={statsState.donutMetrics.innerRadius}
              backgroundColor={theme.background}
              borderColor={theme.border}
              totalAmount={statsState.totalAmount}
              segments={statsState.segmentGeometry}
              emptyText="暂无数据"
              onSegmentPress={openBillsByCategoryId}
            />
            <Text style={[styles.rankingTitle, { color: theme.text }]}>分类排行</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={{ color: theme.tabIconDefault, fontSize: 12 }}>暂无统计数据</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rangeBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  rangeBtn: { paddingVertical: 4, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  rangeText: { fontSize: 14, fontWeight: '600' },
  dateNav: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginVertical: 10 },
  currentDateText: { fontSize: 13, fontWeight: '700' },
  typeSwitcher: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 16 },
  typeBtn: { paddingVertical: 6, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  typeText: { fontSize: 13, fontWeight: 'bold' },
  chartContainer: { alignItems: 'center', paddingVertical: 0 },
  rankingTitle: { alignSelf: 'flex-start', marginHorizontal: 20, marginTop: 12, fontSize: 14, fontWeight: 'bold' },
  listContent: { paddingBottom: 24 },
  rankingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rankingName: { fontSize: 12, fontWeight: '600', marginBottom: 1 },
  rankingCount: { fontSize: 11 },
  rankingAmount: { fontSize: 13, fontWeight: '700' },
  emptyList: { padding: 40, alignItems: 'center' },
});
