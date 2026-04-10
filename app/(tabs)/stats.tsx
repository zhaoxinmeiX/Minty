import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, InteractionManager, Pressable, StyleSheet, Text, View } from 'react-native';

import { StatsDonutChart } from '@/components/stats/StatsDonutChart';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getIconComponent } from '@/src/constants/icons';
import { CategoryStat, TimeRange, useStatsScreen } from '@/src/hooks/useStatsScreen';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
import { useStore } from '@/src/store';

export default function StatsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const activeLedgerId = useStore((state) => state.activeLedgerId);
  const setLastTab = useStore((state) => state.setLastTab);
  const dataVersion = useStore((state) => state.dataVersion);
  const theme = Colors.light;
  const insets = useStableSafeAreaInsets();
  const statsState = useStatsScreen(db, activeLedgerId);
  const didInitialFetchRef = useRef(false);
  const lastSyncedDataVersionRef = useRef(dataVersion);

  useEffect(() => {
    void (async () => {
      await statsState.fetchStats();
      didInitialFetchRef.current = true;
      lastSyncedDataVersionRef.current = useStore.getState().dataVersion;
    })();
  }, [statsState.fetchStats]);

  useFocusEffect(
    useCallback(() => {
      if (didInitialFetchRef.current) {
        if (lastSyncedDataVersionRef.current === dataVersion) {
          setLastTab('stats');
          return;
        }

        const task = InteractionManager.runAfterInteractions(() => {
          void (async () => {
            await statsState.fetchStats();
            lastSyncedDataVersionRef.current = useStore.getState().dataVersion;
          })();
        });
        setLastTab('stats');
        return () => task.cancel();
      }

      setLastTab('stats');
    }, [dataVersion, setLastTab, statsState.fetchStats]),
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

  const rangeLabel =
    statsState.range === 'all'
      ? '全部时间'
      : statsState.range === 'year'
        ? `${statsState.currentDate.getFullYear()}年`
        : statsState.range === 'month'
          ? `${statsState.currentDate.getFullYear()}年${statsState.currentDate.getMonth() + 1}月`
          : '本周';

  const totalLabel = statsState.type === 'expense' ? '总支出' : '总收入';

  const renderRankingItem = ({ item, index }: { item: CategoryStat; index: number }) => {
    const Icon = getIconComponent(item.icon);
    return (
      <Pressable
        style={[
          styles.rankingItem,
          {
            backgroundColor: theme.homeSurface,
            borderColor: 'rgba(110, 125, 66, 0.08)',
          },
        ]}
        onPress={() => openBillsByCategory(item)}
      >
        <View style={styles.rankingLeft}>
          <View style={[styles.rankBadge, { backgroundColor: index === 0 ? theme.homeAccentSoft : index === 1 ? theme.homeBlueSoft : theme.homeSection }]}>
            <Text style={[styles.rankBadgeText, { color: theme.homeOlive }]}>{index + 1}</Text>
          </View>
          <View style={[styles.iconBox, { backgroundColor: item.percentage > 40 ? '#FDE9DE' : item.percentage > 20 ? theme.homeBlueSoft : theme.homeSection }]}>
            <Icon size={18} color={theme.text} />
          </View>
          <View style={styles.rankingMeta}>
            <Text style={[styles.rankingName, { color: theme.text }]}>{item.category}</Text>
            <Text style={[styles.rankingCount, { color: theme.homeMuted }]}>
              {item.percentage.toFixed(1)}% · {item.count}笔
            </Text>
          </View>
        </View>

        <View style={styles.rankingRight}>
          <Text style={[styles.rankingAmount, { color: theme.text }]}>{item.totalAmount.toFixed(2)}</Text>
          <Text style={[styles.rankingLink, { color: theme.homeOlive }]}>查看账单</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.homeBackground, paddingTop: insets.top + 10 }]}>
      <View pointerEvents="none" style={[styles.screenGlow, styles.screenGlowTop, { backgroundColor: 'rgba(252, 206, 180, 0.52)' }]} />
      <View pointerEvents="none" style={[styles.screenGlow, styles.screenGlowBottom, { backgroundColor: 'rgba(171, 215, 251, 0.34)' }]} />

      <FlatList
        data={statsState.stats}
        keyExtractor={(item) => item.category_id.toString()}
        renderItem={renderRankingItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={4}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={[styles.headerEyebrow, { color: theme.homeMuted }]}>Insights</Text>
              <Text style={[styles.headerTitle, { color: theme.homeOlive }]}>分类统计</Text>
            </View>

            <View style={[styles.controlCard, { backgroundColor: theme.homeSurface }]}>
              <View style={styles.rangeBar}>
                {(['all', 'year', 'month', 'week'] as TimeRange[]).map((range) => {
                  const active = statsState.range === range;
                  return (
                    <Pressable
                      key={range}
                      onPress={() => {
                        statsState.setRange(range);
                        statsState.setCurrentDate(new Date());
                      }}
                      style={[
                        styles.rangeBtn,
                        {
                          backgroundColor: active ? theme.homeAccent : theme.homeSurfaceStrong,
                        },
                      ]}
                    >
                      <Text style={[styles.rangeText, { color: active ? '#FFF' : theme.homeOlive }]}>
                        {range === 'all' ? '总览' : range === 'year' ? '年度' : range === 'month' ? '月度' : '周度'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.controlFooter}>
                <View style={[styles.periodChip, { backgroundColor: theme.homeSection }]}>
                  <Text style={[styles.periodChipLabel, { color: theme.homeMuted }]}>当前周期</Text>
                  <Text style={[styles.periodChipValue, { color: theme.text }]}>{rangeLabel}</Text>
                </View>

                <View style={styles.typeSwitcher}>
                  <Pressable
                    onPress={() => statsState.setType('expense')}
                    style={[
                      styles.typeBtn,
                      {
                        backgroundColor: statsState.type === 'expense' ? theme.homeAccentSoft : theme.homeSurfaceStrong,
                      },
                    ]}
                  >
                    <Text style={[styles.typeText, { color: statsState.type === 'expense' ? theme.expense : theme.homeMuted }]}>支出</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => statsState.setType('income')}
                    style={[
                      styles.typeBtn,
                      {
                        backgroundColor: statsState.type === 'income' ? '#E4F1E3' : theme.homeSurfaceStrong,
                      },
                    ]}
                  >
                    <Text style={[styles.typeText, { color: statsState.type === 'income' ? theme.income : theme.homeMuted }]}>收入</Text>
                  </Pressable>
                </View>
              </View>

              {statsState.range !== 'all' && (
                <View style={styles.dateNav}>
                  <Pressable style={[styles.navBtn, { backgroundColor: theme.homeSurfaceStrong }]} onPress={statsState.handlePrev}>
                    <ChevronLeft size={18} color={theme.homeOlive} />
                  </Pressable>
                  <Text style={[styles.currentDateText, { color: theme.text }]}>{rangeLabel}</Text>
                  <Pressable style={[styles.navBtn, { backgroundColor: theme.homeSurfaceStrong }]} onPress={statsState.handleNext}>
                    <ChevronRight size={18} color={theme.homeOlive} />
                  </Pressable>
                </View>
              )}
            </View>

            <View style={[styles.chartCard, { backgroundColor: theme.homeSurface }]}>
              <View style={styles.chartHeader}>
                <View>
                  <Text style={[styles.chartEyebrow, { color: theme.homeMuted }]}>Breakdown</Text>
                  <Text style={[styles.chartTitle, { color: theme.text }]}>{totalLabel}</Text>
                </View>
                <View style={[styles.chartAmountPill, { backgroundColor: theme.homeSection }]}>
                  <Text style={[styles.chartAmountLabel, { color: theme.homeMuted }]}>合计</Text>
                  <Text style={[styles.chartAmountValue, { color: statsState.type === 'expense' ? theme.expense : theme.income }]}>
                    {statsState.totalAmount.toFixed(2)}
                  </Text>
                </View>
              </View>

              <StatsDonutChart
                size={statsState.donutMetrics.size}
                center={statsState.donutMetrics.center}
                outerRadius={statsState.donutMetrics.outerRadius}
                innerRadius={statsState.donutMetrics.innerRadius}
                backgroundColor={theme.homeSurface}
                borderColor={theme.border}
                totalAmount={statsState.totalAmount}
                segments={statsState.segmentGeometry}
                emptyText="暂无数据"
                emptyTextColor={theme.homeMuted}
                labelColor={theme.homeMuted}
                valueColor={theme.text}
                onSegmentPress={openBillsByCategoryId}
              />
            </View>

            <View style={styles.rankingHeader}>
              <Text style={[styles.rankingHeaderEyebrow, { color: theme.homeMuted }]}>Ranking</Text>
              <Text style={[styles.rankingHeaderTitle, { color: theme.text }]}>分类排行</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={[styles.emptyList, { backgroundColor: theme.homeSurface }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>暂无统计数据</Text>
            <Text style={[styles.emptyHint, { color: theme.homeMuted }]}>先记几笔，统计图和排行才会出现。</Text>
          </View>
        }
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  screenGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  screenGlowTop: {
    width: 220,
    height: 220,
    top: 40,
    left: -60,
  },
  screenGlowBottom: {
    width: 280,
    height: 280,
    bottom: 120,
    right: -100,
  },
  listContent: {
    paddingBottom: 132,
  },
  header: {
    marginBottom: 16,
  },
  headerEyebrow: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  controlCard: {
    borderRadius: 30,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#A9B66D',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  rangeBar: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  rangeText: {
    fontSize: Typography.size.label,
    fontWeight: '800',
  },
  controlFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    alignItems: 'center',
  },
  periodChip: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  periodChipLabel: {
    fontSize: Typography.size.caption,
    fontWeight: '600',
    marginBottom: 4,
  },
  periodChipValue: {
    fontSize: Typography.size.body,
    fontWeight: '800',
  },
  typeSwitcher: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    minWidth: 74,
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeText: {
    fontSize: Typography.size.body,
    fontWeight: '800',
  },
  dateNav: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentDateText: {
    fontSize: Typography.size.body,
    fontWeight: '800',
  },
  chartCard: {
    borderRadius: 32,
    paddingHorizontal: 14,
    paddingVertical: 18,
    marginBottom: 18,
    shadowColor: '#A9B66D',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  chartEyebrow: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: Typography.size.titleLg,
    fontWeight: '900',
  },
  chartAmountPill: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  chartAmountLabel: {
    fontSize: Typography.size.caption,
    fontWeight: '600',
  },
  chartAmountValue: {
    marginTop: 4,
    fontSize: Typography.size.title,
    fontWeight: '800',
  },
  rankingHeader: {
    marginBottom: 10,
  },
  rankingHeaderEyebrow: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  rankingHeaderTitle: {
    fontSize: Typography.size.titleLg,
    fontWeight: '900',
  },
  rankingItem: {
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeText: {
    fontSize: Typography.size.caption,
    fontWeight: '800',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankingMeta: {
    flex: 1,
  },
  rankingName: {
    fontSize: Typography.size.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  rankingCount: {
    fontSize: Typography.size.caption,
  },
  rankingRight: {
    alignItems: 'flex-end',
    paddingLeft: 12,
  },
  rankingAmount: {
    fontSize: Typography.size.body,
    fontWeight: '800',
  },
  rankingLink: {
    marginTop: 4,
    fontSize: Typography.size.caption,
    fontWeight: '700',
  },
  emptyList: {
    borderRadius: 28,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: Typography.size.title,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: Typography.size.body,
  },
});
