import dayjs from 'dayjs';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, InteractionManager, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { LedgerPickerAnchorFrame, LedgerPickerModal } from '@/components/add/LedgerPickerModal';
import { StatsDonutChart } from '@/components/stats/StatsDonutChart';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getIconComponent } from '@/src/constants/icons';
import { useLedgers } from '@/src/hooks/useLedgers';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
import { CategoryStat, TimeRange, useStatsScreen } from '@/src/hooks/useStatsScreen';
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

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  activeColor,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (val: T) => void;
  activeColor: string;
}) {
  const theme = Colors.light;
  return (
    <View
      style={[
        styles.segmentContainer,
        {
          backgroundColor: theme.homeSection,
        },
      ]}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segmentItem,
              isActive && {
                backgroundColor: theme.homeSurface,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
          >
            <Text style={[styles.segmentLabel, { color: isActive ? activeColor : theme.homeMuted }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function StatsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const activeLedgerId = useStore((state) => state.activeLedgerId);
  const setActiveLedgerId = useStore((state) => state.setActiveLedgerId);
  const setLastTab = useStore((state) => state.setLastTab);
  const dataVersion = useStore((state) => state.dataVersion);
  const theme = Colors.light;
  const insets = useStableSafeAreaInsets();
  const { ledgers, fetchLedgers } = useLedgers();
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
            await Promise.all([statsState.fetchStats(), fetchLedgers()]);
            lastSyncedDataVersionRef.current = useStore.getState().dataVersion;
          })();
        });
        setLastTab('stats');
        return () => task.cancel();
      }

      setLastTab('stats');
    }, [dataVersion, fetchLedgers, setLastTab, statsState.fetchStats]),
  );

  const activeLedger = ledgers.find((ledger) => ledger.id === activeLedgerId);
  const displayLedgerName = useMemo(() => {
    const rawName = activeLedger?.name || '账本';
    const chars = Array.from(rawName);
    return chars.length > 5 ? `${chars.slice(0, 5).join('')}...` : rawName;
  }, [activeLedger?.name]);

  const categoryCount = statsState.stats.length;
  const primaryAccent = statsState.type === 'expense' ? theme.homeAccent : theme.income;

  const getWeekRangeLabel = (date: Date) => {
    const d = dayjs(date);
    const day = d.day();
    const diff = d.date() - day + (day === 0 ? -6 : 1);
    const monday = d.date(diff);
    const sunday = monday.add(6, 'day');
    return `${monday.format('M月D日')}-${sunday.format('M月D日')}`;
  };

  const rangeNavLabel = useMemo(() => {
    if (statsState.range === 'all') return '全部账单';
    const d = dayjs(statsState.currentDate);
    if (statsState.range === 'year') return d.format('YYYY年');
    if (statsState.range === 'month') return d.format('YYYY年M月');
    return getWeekRangeLabel(statsState.currentDate);
  }, [statsState.range, statsState.currentDate]);

  const openBillsByCategoryId = useCallback(
    (categoryId: number) => {
      const target = statsState.stats.find((item) => item.category_id === categoryId);
      if (!target) return;

      const { startDate, endDate } = statsState.buildDateRange();
      router.push({
        pathname: '/bills',
        params: {
          type: statsState.type,
          categoryId: categoryId.toString(),
          startDate,
          endDate,
        },
      });
    },
    [router, statsState],
  );

  const openLedgerPicker = useCallback(() => {
    void fetchLedgers();

    if (!ledgerButtonRef.current) {
      setLedgerAnchorFrame(null);
      setIsLedgerModalVisible(true);
      return;
    }

    ledgerButtonRef.current.measureInWindow((x, y, width, height) => {
      setLedgerAnchorFrame({ x, y, width, height });
      setIsLedgerModalVisible(true);
    });
  }, [fetchLedgers]);

  const renderRankingItem = ({ item, index }: { item: CategoryStat; index: number }) => {
    const Icon = getIconComponent(item.icon);
    const isLast = index === categoryCount - 1;

    return (
      <Pressable
        style={[
          styles.rankingItem,
          {
            backgroundColor: theme.homeSurface,
            borderColor: 'rgba(110, 125, 66, 0.08)',
          },
          isLast && {
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            borderBottomWidth: 0,
            paddingBottom: 32,
          },
        ]}
        onPress={() => openBillsByCategoryId(item.category_id)}
      >
        <View style={styles.rankingTopRow}>
          <View style={styles.rankingLeft}>
            <View style={[styles.iconBox, { backgroundColor: theme.homeSection }]}>
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
            <View style={styles.rankingFooter}>
              <Text style={[styles.rankingFooterText, { color: theme.homeMuted }]}>{item.percentage.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: theme.homeSurfaceStrong }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.max(Math.min(item.percentage, 100), 2)}%`,
                backgroundColor: primaryAccent,
              },
            ]}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 6 }]}>
        <View style={styles.filterSection}>
          <View style={styles.topHeader}>
            <SegmentedControl
              options={RANGE_OPTIONS}
              value={statsState.range}
              onChange={(val) => {
                statsState.setRange(val);
                statsState.setCurrentDate(new Date());
              }}
              activeColor={theme.homeAccent}
            />
          </View>

          <View style={styles.dateNavRow}>
            {statsState.range !== 'all' ? (
              <>
                <Pressable style={styles.navArrow} onPress={statsState.handlePrev}>
                  <ChevronLeft size={20} color={theme.homeAccent} />
                </Pressable>
                <Text style={[styles.navLabel, { color: theme.text }]}>{rangeNavLabel}</Text>
                <Pressable style={styles.navArrow} onPress={statsState.handleNext}>
                  <ChevronRight size={20} color={theme.homeAccent} />
                </Pressable>
              </>
            ) : (
              <Text style={[styles.navLabel, { color: theme.text }]}>{rangeNavLabel}</Text>
            )}
          </View>
        </View>
      </View>

      <Animated.FlatList
        itemLayoutAnimation={LinearTransition}
        data={statsState.stats}
        keyExtractor={(item: CategoryStat) => item.category_id.toString()}
        renderItem={renderRankingItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* 分类统计区头 */}
            <View
              style={[
                styles.contentSection,
                {
                  borderBottomLeftRadius: categoryCount > 0 ? 0 : 32,
                  borderBottomRightRadius: categoryCount > 0 ? 0 : 32,
                },
              ]}
            >
              <View style={styles.contentTitleRow}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>分类统计</Text>

                <View ref={ledgerButtonRef} collapsable={false}>
                  <Pressable
                    onPress={openLedgerPicker}
                    style={[styles.smallLedgerBtn, { backgroundColor: theme.homeSection }]}
                  >
                    <Text style={[styles.smallLedgerName, { color: theme.text }]} numberOfLines={1}>
                      {displayLedgerName}
                    </Text>
                    <ChevronRight size={16} color={theme.homeOlive} strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.chartWrapper}>
                <StatsDonutChart
                  width={statsState.donutMetrics.width}
                  height={statsState.donutMetrics.height}
                  centerX={statsState.donutMetrics.centerX}
                  centerY={statsState.donutMetrics.centerY}
                  outerRadius={statsState.donutMetrics.outerRadius}
                  innerRadius={statsState.donutMetrics.innerRadius}
                  backgroundColor={'transparent'}
                  borderColor={theme.border}
                  totalAmount={statsState.totalAmount}
                  segments={statsState.segmentGeometry}
                  emptyText="暂无数据"
                  emptyTextColor={theme.homeMuted}
                  labelColor={theme.homeMuted}
                  valueColor={theme.homeAccent}
                  onSegmentPress={openBillsByCategoryId}
                />
              </View>

              <View style={styles.flowTypeWrap}>
                <SegmentedControl
                  options={[
                    { value: 'expense', label: '支出' },
                    { value: 'income', label: '收入' },
                  ]}
                  value={statsState.type}
                  onChange={(val) => statsState.setType(val)}
                  activeColor={statsState.type === 'expense' ? theme.expense : theme.income}
                />
              </View>

            </View>
          </>
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
  },
  fixedHeader: {
    width: 240,
    alignSelf: 'center',
    paddingBottom: 12,
    zIndex: 10,
  },
  topHeader: {
    minHeight: 44,
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 132,
  },
  segmentContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 22,
    gap: 4,
    height: 44,
  },
  segmentItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  segmentLabel: {
    fontSize: Typography.size.body,
    fontWeight: '800',
  },
  filterSection: {
    gap: 12,
  },
  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    height: 32,
  },
  navArrow: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: Typography.size.body,
    fontWeight: '800',
    minWidth: 100,
    textAlign: 'center',
  },
  contentSection: {
    backgroundColor: Colors.light.homeSurface,
    borderRadius: 32,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  contentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: Typography.size.titleLg,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  smallLedgerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(169, 182, 109, 0.15)',
  },
  smallLedgerName: {
    fontSize: Typography.size.body,
    fontWeight: '800',
    maxWidth: 132,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  flowTypeWrap: {
    width: 160,
    alignSelf: 'center',
    marginBottom: 12,
  },
  rankingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8, // 减少标题下方的间距
  },
  rankingSectionTitle: {
    fontSize: Typography.size.body,
    fontWeight: '800',
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countPillText: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
  },
  rankingItem: {
    backgroundColor: Colors.light.homeSurface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(110, 125, 66, 0.06)',
  },
  rankingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankingMeta: {
    flex: 1,
  },
  rankingName: {
    fontSize: Typography.size.body,
    fontWeight: '800',
  },
  rankingSubline: {
    fontSize: Typography.size.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  rankingAmountWrap: {
    alignItems: 'flex-end',
  },
  rankingAmount: {
    fontSize: Typography.size.body,
    fontWeight: '900',
  },
  rankingFooter: {
    marginTop: 2,
  },
  rankingFooterText: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyContainer: {
    backgroundColor: Colors.light.homeSurface,
    padding: 80,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  emptyText: {
    fontSize: Typography.size.body,
    fontWeight: '600',
  },
});
