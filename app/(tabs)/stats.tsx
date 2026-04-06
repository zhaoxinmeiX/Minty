import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { Colors } from '@/constants/Colors';
import { getIconComponent } from '@/src/constants/icons';
import { getCategoryStats } from '@/src/db/operations';
import { useStore } from '@/src/store';

const { width } = Dimensions.get('window');

type TimeRange = 'all' | 'year' | 'month' | 'week';

type CategoryStat = {
  category: string;
  category_id: number;
  icon: string;
  totalAmount: number;
  count: number;
  percentage: number;
};

type ChartSegment = {
  name: string;
  categoryId: number;
  amount: number;
  icon: string;
  percentage: number;
  color: string;
};

type SegmentGeometry = {
  name: string;
  categoryId: number;
  color: string;
  percentage: number;
  path: string;
  lineStart: { x: number; y: number };
  lineTurn: { x: number; y: number };
  lineEnd: { x: number; y: number };
  textX: number;
  textY: number;
  textAnchor: 'start' | 'end';
};

const CHART_COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#A8E6CF'];

const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
};

const donutSegmentPath = (cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number) => {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
};

const distributeLabelY = (values: number[], minGap: number, minY: number, maxY: number) => {
  if (values.length === 0) return [];
  const sorted = values.map((y, index) => ({ y, index })).sort((a, b) => a.y - b.y);

  const adjusted = sorted.map((v, i) => {
    if (i === 0) return Math.max(v.y, minY);
    return Math.max(v.y, sorted[i - 1].y + minGap);
  });

  for (let i = 1; i < adjusted.length; i += 1) {
    adjusted[i] = Math.max(adjusted[i], adjusted[i - 1] + minGap);
  }

  const overflow = adjusted[adjusted.length - 1] - maxY;
  if (overflow > 0) {
    for (let i = 0; i < adjusted.length; i += 1) {
      adjusted[i] -= overflow;
    }
    adjusted[0] = Math.max(adjusted[0], minY);
    for (let i = 1; i < adjusted.length; i += 1) {
      adjusted[i] = Math.max(adjusted[i], adjusted[i - 1] + minGap);
    }
  }

  const result = new Array(values.length).fill(0);
  sorted.forEach((item, i) => {
    result[item.index] = Math.min(Math.max(adjusted[i], minY), maxY);
  });
  return result;
};

export default function StatsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { activeLedgerId, setLastTab } = useStore();
  const theme = Colors.light;

  const [range, setRange] = useState<TimeRange>('month');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<CategoryStat[]>([]);

  const fetchStats = useCallback(() => {
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (range === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      startDate = `${year}-${monthStr}-01`;
      endDate = `${year}-${monthStr}-31`;
    } else if (range === 'year') {
      startDate = `${currentDate.getFullYear()}-01-01`;
      endDate = `${currentDate.getFullYear()}-12-31`;
    } else if (range === 'week') {
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(currentDate.setDate(diff));
      startDate = monday.toISOString().split('T')[0];
      const sunday = new Date(monday.setDate(monday.getDate() + 6));
      endDate = sunday.toISOString().split('T')[0];
    }

    const data = getCategoryStats(db, activeLedgerId, type, startDate, endDate);
    setStats(data);
  }, [db, activeLedgerId, range, type, currentDate]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
      setLastTab('stats');
    }, [fetchStats, setLastTab]),
  );

  const totalAmount = useMemo(() => stats.reduce((acc, curr) => acc + curr.totalAmount, 0), [stats]);

  const chartData = useMemo(() => {
    return stats.slice(0, 5).map((item, index) => ({
      name: item.category,
      categoryId: item.category_id,
      amount: item.totalAmount,
      icon: item.icon,
      percentage: totalAmount > 0 ? (item.totalAmount / totalAmount) * 100 : 0,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [stats, totalAmount]);

  const donutMetrics = useMemo(() => {
    const size = Math.min(width - 32, 340);
    const center = size / 2;
    const outerRadius = size * 0.33;
    const innerRadius = size * 0.2;
    return { size, center, outerRadius, innerRadius };
  }, []);

  const segmentGeometry = useMemo<SegmentGeometry[]>(() => {
    let startAngle = 0;
    const raw = chartData.map((item) => {
      const sweep = (item.percentage / 100) * 360;
      const endAngle = startAngle + sweep;
      const path = donutSegmentPath(donutMetrics.center, donutMetrics.center, donutMetrics.outerRadius, donutMetrics.innerRadius, startAngle, endAngle);

      const midAngle = startAngle + sweep / 2;
      const lineStart = polarToCartesian(donutMetrics.center, donutMetrics.center, donutMetrics.outerRadius + 2, midAngle);
      const lineTurn = polarToCartesian(donutMetrics.center, donutMetrics.center, donutMetrics.outerRadius + 18, midAngle);
      const isRight = Math.cos(((midAngle - 90) * Math.PI) / 180) >= 0;

      startAngle = endAngle;

      return {
        name: item.name,
        categoryId: item.categoryId,
        color: item.color,
        percentage: item.percentage,
        path,
        lineStart,
        lineTurn,
        isRight,
      };
    });

    const rightItems = raw.filter((r) => r.isRight);
    const leftItems = raw.filter((r) => !r.isRight);
    const minY = 18;
    const maxY = donutMetrics.size - 18;
    const minGap = 20;

    const rightAdjustedY = distributeLabelY(
      rightItems.map((r) => r.lineTurn.y),
      minGap,
      minY,
      maxY,
    );
    const leftAdjustedY = distributeLabelY(
      leftItems.map((r) => r.lineTurn.y),
      minGap,
      minY,
      maxY,
    );

    const rightEndX = donutMetrics.size - 86;
    const leftEndX = 86;
    const rightTextX = donutMetrics.size - 4;
    const leftTextX = 4;

    const rightMap = new Map<string, number>();
    rightItems.forEach((item, index) => {
      rightMap.set(item.name, rightAdjustedY[index]);
    });
    const leftMap = new Map<string, number>();
    leftItems.forEach((item, index) => {
      leftMap.set(item.name, leftAdjustedY[index]);
    });

    return raw.map((item) => {
      const y = item.isRight ? rightMap.get(item.name)! : leftMap.get(item.name)!;
      return {
        name: item.name,
        categoryId: item.categoryId,
        color: item.color,
        percentage: item.percentage,
        path: item.path,
        lineStart: item.lineStart,
        lineTurn: { x: item.lineTurn.x, y },
        lineEnd: { x: item.isRight ? rightEndX : leftEndX, y },
        textX: item.isRight ? rightTextX : leftTextX,
        textY: y - 2,
        textAnchor: item.isRight ? 'end' : 'start',
      };
    });
  }, [chartData, donutMetrics]);

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (range === 'month') next.setMonth(next.getMonth() - 1);
    else if (range === 'year') next.setFullYear(next.getFullYear() - 1);
    else if (range === 'week') next.setDate(next.getDate() - 7);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (range === 'month') next.setMonth(next.getMonth() + 1);
    else if (range === 'year') next.setFullYear(next.getFullYear() + 1);
    else if (range === 'week') next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const buildDateRange = () => {
    if (range === 'all') {
      return { startDate: undefined, endDate: undefined };
    }

    if (range === 'month') {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      return {
        startDate: `${year}-${month}-01`,
        endDate: `${year}-${month}-31`,
      };
    }

    if (range === 'year') {
      const year = currentDate.getFullYear();
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      };
    }

    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(currentDate);
    monday.setDate(diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
    };
  };

  const openBillsByCategory = (item: CategoryStat) => {
    const { startDate, endDate } = buildDateRange();
    router.push({
      pathname: '/bills',
      params: {
        type,
        categoryId: item.category_id.toString(),
        startDate,
        endDate,
      },
    });
  };

  const openBillsByCategoryId = (categoryId: number) => {
    const target = stats.find((item) => item.category_id === categoryId);
    if (!target) return;
    openBillsByCategory(target);
  };

  const renderRankingItem = ({ item }: { item: CategoryStat }) => {
    const Icon = getIconComponent(item.icon);
    return (
      <Pressable style={[styles.rankingItem, { borderBottomColor: theme.border }]} onPress={() => openBillsByCategory(item)}>
        <View style={styles.rankingLeft}>
          <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
            <Icon size={20} color={theme.text} />
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
              setRange(r);
              setCurrentDate(new Date());
            }}
            style={[styles.rangeBtn, range === r && { borderBottomColor: theme.tint }]}
          >
            <Text style={[styles.rangeText, { color: range === r ? theme.text : theme.tabIconDefault }]}>
              {r === 'all' ? '总' : r === 'year' ? '年' : r === 'month' ? '月' : '周'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Date Navigator */}
      {range !== 'all' && (
        <View style={styles.dateNav}>
          <Pressable onPress={handlePrev}>
            <ChevronLeft size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.currentDateText, { color: theme.text }]}>
            {range === 'year' ? `${currentDate.getFullYear()}年` : range === 'month' ? `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月` : '本周'}
          </Text>
          <Pressable onPress={handleNext}>
            <ChevronRight size={24} color={theme.text} />
          </Pressable>
        </View>
      )}

      {/* Type Switcher */}
      <View style={styles.typeSwitcher}>
        <Pressable onPress={() => setType('expense')} style={[styles.typeBtn, type === 'expense' && { backgroundColor: theme.expense + '20', borderColor: theme.expense }]}>
          <Text style={[styles.typeText, { color: type === 'expense' ? theme.expense : theme.tabIconDefault }]}>支出</Text>
        </Pressable>
        <Pressable onPress={() => setType('income')} style={[styles.typeBtn, type === 'income' && { backgroundColor: theme.income + '20', borderColor: theme.income }]}>
          <Text style={[styles.typeText, { color: type === 'income' ? theme.income : theme.tabIconDefault }]}>收入</Text>
        </Pressable>
      </View>

      <FlatList
        data={stats}
        keyExtractor={(item) => item.category_id.toString()}
        renderItem={renderRankingItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.chartContainer}>
            {stats.length > 0 ? (
              <View style={styles.chartBox}>
                <View style={styles.pieWrap}>
                  <Svg width={donutMetrics.size} height={donutMetrics.size}>
                    {segmentGeometry.map((segment) => (
                      <React.Fragment key={segment.name}>
                        <Path d={segment.path} fill={segment.color} onPress={() => openBillsByCategoryId(segment.categoryId)} />
                        <Line x1={segment.lineStart.x} y1={segment.lineStart.y} x2={segment.lineTurn.x} y2={segment.lineTurn.y} stroke={segment.color} strokeWidth={2} />
                        <Line x1={segment.lineTurn.x} y1={segment.lineTurn.y} x2={segment.lineEnd.x} y2={segment.lineEnd.y} stroke={segment.color} strokeWidth={2} />
                        <SvgText x={segment.textX} y={segment.textY} fontSize="12" fontWeight="700" fill={segment.color} textAnchor={segment.textAnchor}>
                          {`${segment.name} ${segment.percentage.toFixed(1)}%`}
                        </SvgText>
                      </React.Fragment>
                    ))}

                    <Circle cx={donutMetrics.center} cy={donutMetrics.center} r={donutMetrics.innerRadius - 4} fill={theme.background} />
                    <Circle cx={donutMetrics.center} cy={donutMetrics.center} r={donutMetrics.innerRadius - 6} fill="none" stroke={theme.border} strokeWidth={1} />
                  </Svg>
                  <View style={styles.totalCenter}>
                    <Text style={[styles.totalLabel, { color: theme.tabIconDefault }]}>合计</Text>
                    <Text style={[styles.totalValue, { color: theme.text }]}>{totalAmount.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={{ color: theme.tabIconDefault, fontSize: 12 }}>暂无数据</Text>
              </View>
            )}
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
  rangeText: { fontSize: 12, fontWeight: '600' },
  dateNav: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginVertical: 10 },
  currentDateText: { fontSize: 13, fontWeight: '700' },
  typeSwitcher: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 16 },
  typeBtn: { paddingVertical: 6, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  typeText: { fontSize: 13, fontWeight: 'bold' },
  chartContainer: { alignItems: 'center', paddingVertical: 20 },
  chartBox: { alignItems: 'center', width: width - 32 },
  pieWrap: { position: 'relative', width: Math.min(width - 32, 340), height: Math.min(width - 32, 340), justifyContent: 'center', overflow: 'visible' },
  totalCenter: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: { fontSize: 12, fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '700', lineHeight: 38 },
  emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center' },
  rankingTitle: { alignSelf: 'flex-start', marginHorizontal: 20, marginTop: 20, fontSize: 14, fontWeight: 'bold' },
  listContent: { paddingBottom: 40 },
  rankingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  rankingName: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  rankingCount: { fontSize: 11 },
  rankingAmount: { fontSize: 13, fontWeight: '700' },
  emptyList: { padding: 40, alignItems: 'center' },
});
