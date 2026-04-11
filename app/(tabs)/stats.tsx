import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, InteractionManager, Pressable, StyleSheet, Text, View } from 'react-native';

import { LedgerPickerAnchorFrame, LedgerPickerModal } from '@/components/add/LedgerPickerModal';
import { StatsDonutChart } from '@/components/stats/StatsDonutChart';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getIconComponent } from '@/src/constants/icons';
import { useLedgers } from '@/src/hooks/useLedgers';
import { CategoryStat, TimeRange, useStatsScreen } from '@/src/hooks/useStatsScreen';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
import { useStore } from '@/src/store';

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'all', label: '总览' },
  { value: 'year', label: '年' },
  { value: 'month', label: '月' },
  { value: 'week', label: '周' },
];

const formatAmount = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function StatsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const activeLedgerId = useStore((state) => state.activeLedgerId);
  const setActiveLedgerId = useStore((state) => state.setActiveLedgerId);
  const setLastTab = useStore((state) => state.setLastTab);
  const dataVersion = useStore((state) => state.dataVersion);
  const theme = Colors.light;
  const insets = useStableSafeAreaInsets();
  const { ledgers } = useLedgers();
  const statsState = useStatsScreen(db, activeLedgerId);
  const didInitialFetchRef = useRef(false);
  const lastSyncedDataVersionRef = useRef(dataVersion);
  const [isLedgerModalVisible, setIsLedgerModalVisible] = useState(false);
  const [ledgerAnchorFrame, setLedgerAnchorFrame] = useState<LedgerPickerAnchorFrame | null>(null);
  const ledgerButtonRef = useRef<View>(null);

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

  const activeLedger = ledgers.find((ledger) => ledger.id === activeLedgerId);
  const displayLedgerName = useMemo(() => {
    const rawName = activeLedger?.name || '账本';
    const chars = Array.from(rawName);
    return chars.length > 6 ? `${chars.slice(0, 6).join('')}...` : rawName;
  }, [activeLedger?.name]);

  const recordCount = useMemo(() => statsState.stats.reduce((sum, item) => sum + item.count, 0), [statsState.stats]);
  const categoryCount = statsState.stats.length;
  const topCategory = statsState.stats[0];
  const averageAmount = recordCount > 0 ? statsState.totalAmount / recordCount : 0;

  const rangeLabel =
    statsState.range === 'all'
      ? '全部时间'
      : statsState.range === 'year'
        ? `${statsState.currentDate.getFullYear()}年`
        : statsState.range === 'month'
          ? `${statsState.currentDate.getFullYear()}年${statsState.currentDate.getMonth() + 1}月`
          : '本周';

  const totalLabel = statsState.type === 'expense' ? '总支出' : '总收入';
  const summaryGradientColors: readonly [string, string] =
    statsState.type === 'expense' ? [theme.homeAccentSoft, theme.homeAccent] : ['#D7E8D1', '#7FA16F'];
  const summaryPillBg = statsState.type === 'expense' ? 'rgba(110, 125, 66, 0.12)' : 'rgba(255, 249, 241, 0.2)';
  const summaryPillTextColor = statsState.type === 'expense' ? 'rgba(44, 52, 32, 0.86)' : '#F7F4EC';
  const summaryMinorTextColor = statsState.type === 'expense' ? 'rgba(44, 52, 32, 0.72)' : 'rgba(255, 249, 241, 0.88)';
  const summaryValueColor = statsState.type === 'expense' ? theme.text : '#FFF9F1';
  const primaryAccent = statsState.type === 'expense' ? theme.homeAccent : theme.income;
  const secondaryAccent = statsState.type === 'expense' ? theme.homeAccentSoft : '#E4F1E3';
  const progressPalette = statsState.type === 'expense' ? [theme.homeAccent, '#F5A172', theme.homeBlue, theme.homeOliveSoft] : [theme.income, '#8DB07B', theme.homeBlue, '#A8BE88'];

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

  const openBills = useCallback(() => {
    router.push('/bills');
  }, [router]);

  const openLedgerPicker = useCallback(() => {
    if (!ledgerButtonRef.current) {
      setLedgerAnchorFrame(null);
      setIsLedgerModalVisible(true);
      return;
    }

    ledgerButtonRef.current.measureInWindow((x, y, width, height) => {
      setLedgerAnchorFrame({ x, y, width, height });
      setIsLedgerModalVisible(true);
    });
  }, []);

  const renderSummaryMetric = (label: string, value: string) => (
    <View key={label} style={styles.summaryMetricCard}>
      <Text style={[styles.summaryMetricLabel, { color: summaryMinorTextColor }]}>{label}</Text>
      <Text style={[styles.summaryMetricValue, { color: summaryValueColor }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );

  const renderRankingItem = ({ item, index }: { item: CategoryStat; index: number }) => {
    const Icon = getIconComponent(item.icon);
    const progressColor = progressPalette[index % progressPalette.length];
    const rankBadgeColor = index === 0 ? secondaryAccent : index === 1 ? theme.homeBlueSoft : theme.homeSection;

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
        <View style={styles.rankingTopRow}>
          <View style={styles.rankingLeft}>
            <View style={[styles.rankBadge, { backgroundColor: rankBadgeColor }]}>
              <Text style={[styles.rankBadgeText, { color: theme.homeOlive }]}>{index + 1}</Text>
            </View>
            <View style={[styles.iconBox, { backgroundColor: item.percentage > 35 ? secondaryAccent : theme.homeSection }]}>
              <Icon size={18} color={theme.text} />
            </View>
            <View style={styles.rankingMeta}>
              <Text style={[styles.rankingName, { color: theme.text }]} numberOfLines={1}>
                {item.category}
              </Text>
              <Text style={[styles.rankingSubline, { color: theme.homeMuted }]}>
                {item.count} 笔记录
              </Text>
            </View>
          </View>

          <View style={styles.rankingAmountWrap}>
            <Text style={[styles.rankingAmount, { color: theme.text }]}>{formatAmount(item.totalAmount)}</Text>
            <Text style={[styles.rankingHint, { color: theme.homeOlive }]}>查看账单</Text>
          </View>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: theme.homeSurfaceStrong }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.max(Math.min(item.percentage, 100), 6)}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>

        <View style={styles.rankingFooter}>
          <Text style={[styles.rankingFooterText, { color: theme.homeMuted }]}>占比 {item.percentage.toFixed(1)}%</Text>
          <Text style={[styles.rankingFooterText, { color: theme.homeMuted }]}>
            {statsState.type === 'expense' ? '支出分类' : '收入分类'}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.homeBackground, paddingTop: insets.top }]}>
      <View pointerEvents="none" style={[styles.screenGlow, styles.screenGlowTop, { backgroundColor: 'rgba(252, 206, 180, 0.46)' }]} />
      <View pointerEvents="none" style={[styles.screenGlow, styles.screenGlowRight, { backgroundColor: 'rgba(171, 215, 251, 0.3)' }]} />

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
              <View ref={ledgerButtonRef} collapsable={false} style={styles.headerLedgerButtonWrap}>
                <Pressable style={[styles.headerLedgerButton, { backgroundColor: theme.homeSurface }]} onPress={openLedgerPicker}>
                  <Text style={[styles.headerLedgerName, { color: theme.text }]} numberOfLines={1}>
                    {displayLedgerName}
                  </Text>
                  <ChevronRight size={16} color={theme.homeOlive} strokeWidth={2.5} />
                </Pressable>
              </View>

              <View style={styles.headerIcons}>
                <Pressable style={[styles.iconButton, { backgroundColor: theme.homeSurface }]} onPress={openBills}>
                  <FileText size={20} color={theme.homeOlive} />
                </Pressable>
              </View>
            </View>

            <LinearGradient colors={summaryGradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summaryCard}>
              <View style={styles.summaryDecorLayer} pointerEvents="none">
                <View style={styles.summaryOrbLarge} />
                <View style={[styles.summaryOrbSmall, { backgroundColor: 'rgba(255, 249, 241, 0.22)' }]} />
                <View style={[styles.summaryOrbBlue, { backgroundColor: 'rgba(171, 215, 251, 0.18)' }]} />
              </View>

              <View style={styles.summaryTopRow}>
                <Text style={[styles.summaryOverviewLabel, { color: summaryMinorTextColor }]}>{rangeLabel}</Text>
                <View style={[styles.summaryCountPill, { backgroundColor: summaryPillBg }]}>
                  <Text style={[styles.summaryCountText, { color: summaryPillTextColor }]}>
                    {statsState.type === 'expense' ? '支出视角' : '收入视角'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.summaryLabel, { color: summaryMinorTextColor }]}>{totalLabel}</Text>
              <Text style={[styles.summaryAmount, { color: summaryValueColor }]}>{formatAmount(statsState.totalAmount)}</Text>

              <View style={styles.summaryMetricsGrid}>
                {renderSummaryMetric('分类数', `${categoryCount} 类`)}
                {renderSummaryMetric('记录数', `${recordCount} 笔`)}
                {renderSummaryMetric('主力分类', topCategory?.category ?? '暂无')}
              </View>
            </LinearGradient>

            <View style={[styles.controlCard, { backgroundColor: theme.homeSurface }]}>
              <View style={styles.controlHeader}>
                <View>
                  <Text style={[styles.sectionEyebrow, { color: theme.homeMuted }]}>筛选</Text>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>统计条件</Text>
                </View>
                <View style={[styles.periodChip, { backgroundColor: theme.homeSection }]}>
                  <Text style={[styles.periodChipLabel, { color: theme.homeMuted }]}>当前周期</Text>
                  <Text style={[styles.periodChipValue, { color: theme.text }]}>{rangeLabel}</Text>
                </View>
              </View>

              <View style={styles.controlGroup}>
                <Text style={[styles.controlGroupLabel, { color: theme.homeMuted }]}>收支类型</Text>
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

              <View style={styles.controlGroup}>
                <Text style={[styles.controlGroupLabel, { color: theme.homeMuted }]}>时间范围</Text>
                <View style={styles.rangeBar}>
                  {RANGE_OPTIONS.map((range) => {
                    const active = statsState.range === range.value;
                    return (
                      <Pressable
                        key={range.value}
                        onPress={() => {
                          statsState.setRange(range.value);
                          statsState.setCurrentDate(new Date());
                        }}
                        style={[
                          styles.rangeBtn,
                          {
                            backgroundColor: active ? primaryAccent : theme.homeSurfaceStrong,
                          },
                        ]}
                      >
                        <Text style={[styles.rangeText, { color: active ? '#FFF' : theme.homeOlive }]}>{range.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {statsState.range !== 'all' && (
                <View style={[styles.dateNav, { backgroundColor: theme.homeSurfaceStrong }]}>
                  <Pressable style={styles.navBtn} onPress={statsState.handlePrev}>
                    <ChevronLeft size={18} color={theme.homeOlive} />
                  </Pressable>
                  <Text style={[styles.currentDateText, { color: theme.text }]}>{rangeLabel}</Text>
                  <Pressable style={styles.navBtn} onPress={statsState.handleNext}>
                    <ChevronRight size={18} color={theme.homeOlive} />
                  </Pressable>
                </View>
              )}
            </View>

            <View style={[styles.chartCard, { backgroundColor: theme.homeSurface }]}>
              <View style={styles.controlHeader}>
                <View>
                  <Text style={[styles.sectionEyebrow, { color: theme.homeMuted }]}>拆分</Text>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>分类拆分</Text>
                </View>
                <View style={[styles.chartCountPill, { backgroundColor: theme.homeSection }]}>
                  <Text style={[styles.chartCountPillText, { color: theme.homeOlive }]}>前 5 类</Text>
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
                emptyText="暂无统计数据"
                emptyTextColor={theme.homeMuted}
                labelColor={theme.homeMuted}
                valueColor={theme.text}
                onSegmentPress={openBillsByCategoryId}
              />

              <View style={styles.chartInsightsRow}>
                <View style={[styles.chartInsightCard, { backgroundColor: theme.homeSection }]}>
                  <Text style={[styles.chartInsightLabel, { color: theme.homeMuted }]}>最高占比</Text>
                  <Text style={[styles.chartInsightValue, { color: theme.text }]} numberOfLines={1}>
                    {topCategory ? `${topCategory.category} ${topCategory.percentage.toFixed(1)}%` : '暂无'}
                  </Text>
                </View>
                <View style={[styles.chartInsightCard, { backgroundColor: theme.homeSection }]}>
                  <Text style={[styles.chartInsightLabel, { color: theme.homeMuted }]}>笔均金额</Text>
                  <Text style={[styles.chartInsightValue, { color: theme.text }]} numberOfLines={1}>
                    {recordCount > 0 ? formatAmount(averageAmount) : '--'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.chartHint, { color: theme.homeMuted }]}>点击扇区可直接查看对应账单。</Text>
            </View>

            <View style={styles.rankingHeader}>
              <View>
                <Text style={[styles.sectionEyebrow, { color: theme.homeMuted }]}>排行</Text>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>分类排行</Text>
              </View>
              {categoryCount > 0 && (
                <View style={[styles.rankingCountPill, { backgroundColor: theme.homeSurface }]}>
                  <Text style={[styles.rankingCountPillText, { color: theme.homeOlive }]}>{categoryCount} 类</Text>
                </View>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={[styles.emptyList, { backgroundColor: theme.homeSurface }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>暂无统计数据</Text>
            <Text style={[styles.emptyHint, { color: theme.homeMuted }]}>先记几笔，分类拆分和排行会自动生成。</Text>
          </View>
        }
      />

      <LedgerPickerModal
        visible={isLedgerModalVisible}
        ledgers={ledgers}
        activeLedgerId={activeLedgerId}
        anchorFrame={ledgerAnchorFrame}
        onSelect={(id) => {
          setActiveLedgerId(id);
          setIsLedgerModalVisible(false);
        }}
        onClose={() => setIsLedgerModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  screenGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  screenGlowTop: {
    width: 220,
    height: 220,
    top: 32,
    left: -58,
  },
  screenGlowRight: {
    width: 250,
    height: 250,
    top: 188,
    right: -92,
  },
  listContent: {
    paddingBottom: 132,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    paddingTop: 6,
    paddingBottom: 12,
    zIndex: 1,
  },
  headerLedgerButtonWrap: {
    maxWidth: 196,
    justifyContent: 'center',
  },
  headerLedgerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  headerLedgerName: {
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    fontWeight: '800',
    maxWidth: 132,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryCard: {
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  summaryDecorLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  summaryOrbLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    right: -56,
    top: -40,
    backgroundColor: 'rgba(255, 249, 241, 0.16)',
  },
  summaryOrbSmall: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    left: -18,
    bottom: 56,
  },
  summaryOrbBlue: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    right: 34,
    bottom: -8,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    minHeight: 30,
  },
  summaryOverviewLabel: {
    flex: 1,
    fontSize: Typography.size.label,
    lineHeight: Typography.lineHeight.label,
    fontWeight: '700',
  },
  summaryCountPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  summaryCountText: {
    fontSize: Typography.size.footnote,
    lineHeight: Typography.lineHeight.footnote,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    fontWeight: '700',
  },
  summaryAmount: {
    marginTop: 8,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  summaryMetricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  summaryMetricCard: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 249, 241, 0.18)',
  },
  summaryMetricLabel: {
    fontSize: Typography.size.caption,
    lineHeight: Typography.lineHeight.caption,
    fontWeight: '700',
    marginBottom: 6,
  },
  summaryMetricValue: {
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    fontWeight: '800',
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
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  sectionEyebrow: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: Typography.size.titleLg + 8,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  periodChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 92,
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
  controlGroup: {
    marginTop: 16,
  },
  controlGroupLabel: {
    fontSize: Typography.size.caption,
    lineHeight: Typography.lineHeight.caption,
    fontWeight: '700',
    marginBottom: 10,
  },
  typeSwitcher: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeText: {
    fontSize: Typography.size.body,
    fontWeight: '800',
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
  dateNav: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 8,
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
  chartCountPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chartCountPillText: {
    fontSize: Typography.size.label,
    fontWeight: '800',
  },
  chartInsightsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  chartInsightCard: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chartInsightLabel: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
    marginBottom: 6,
  },
  chartInsightValue: {
    fontSize: Typography.size.body,
    fontWeight: '800',
  },
  chartHint: {
    marginTop: 12,
    paddingHorizontal: 6,
    fontSize: Typography.size.caption,
    lineHeight: Typography.lineHeight.caption,
    fontWeight: '600',
  },
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rankingCountPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rankingCountPillText: {
    fontSize: Typography.size.label,
    fontWeight: '800',
  },
  rankingItem: {
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#A9B66D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  rankingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
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
    fontWeight: '800',
    marginBottom: 2,
  },
  rankingSubline: {
    fontSize: Typography.size.caption,
    lineHeight: Typography.lineHeight.caption,
    fontWeight: '600',
  },
  rankingAmountWrap: {
    alignItems: 'flex-end',
    minWidth: 88,
  },
  rankingAmount: {
    fontSize: Typography.size.body,
    fontWeight: '800',
  },
  rankingHint: {
    marginTop: 4,
    fontSize: Typography.size.caption,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 14,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  rankingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankingFooterText: {
    fontSize: Typography.size.caption,
    lineHeight: Typography.lineHeight.caption,
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
    textAlign: 'center',
  },
});
