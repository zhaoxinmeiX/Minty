import { SQLiteDatabase } from 'expo-sqlite';
import { startTransition, useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions } from 'react-native';

import { getCategoryStatsAsync } from '@/src/db/operations';
import { formatDateToISO } from '@/src/utils/date';

const { width } = Dimensions.get('window');

export type TimeRange = 'all' | 'year' | 'month' | 'week';

export type CategoryStat = {
  category: string;
  category_id: number;
  icon: string;
  totalAmount: number;
  count: number;
  percentage: number;
};

export type ChartSegment = {
  name: string;
  categoryId: number;
  amount: number;
  icon: string;
  percentage: number;
  color: string;
};

export type SegmentGeometry = {
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

const CHART_COLORS = ['#F98C58', '#8DB07B', '#ABD7FB', '#F7C48C', '#C9D99A'];

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

const getDateRange = (range: TimeRange, currentDate: Date) => {
  if (range === 'all') {
    return { startDate: undefined, endDate: undefined };
  }

  if (range === 'month') {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    return {
      startDate: formatDateToISO(start),
      endDate: formatDateToISO(end),
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
    startDate: formatDateToISO(monday),
    endDate: formatDateToISO(sunday),
  };
};

export function useStatsScreen(db: SQLiteDatabase, ledgerId: number) {
  const [range, setRange] = useState<TimeRange>('month');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const requestIdRef = useRef(0);

  const buildDateRange = useCallback(() => getDateRange(range, currentDate), [currentDate, range]);

  const fetchStats = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const { startDate, endDate } = getDateRange(range, currentDate);
    const data = await getCategoryStatsAsync(db, ledgerId, type, startDate, endDate);
    if (requestId !== requestIdRef.current) return;

    startTransition(() => {
      setStats(data);
    });
  }, [currentDate, db, ledgerId, range, type]);

  const totalAmount = useMemo(() => stats.reduce((acc, curr) => acc + curr.totalAmount, 0), [stats]);

  const chartData = useMemo<ChartSegment[]>(() => {
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
    const size = Math.min(width - 32, 360);
    const center = size / 2;
    const outerRadius = size * 0.24;
    const innerRadius = size * 0.16;
    return { size, center, outerRadius, innerRadius };
  }, []);

  const segmentGeometry = useMemo<SegmentGeometry[]>(() => {
    let startAngle = 0;
    const raw = chartData.map((item) => {
      const sweep = (item.percentage / 100) * 360;
      const endAngle = startAngle + sweep;
      const path = donutSegmentPath(donutMetrics.center, donutMetrics.center, donutMetrics.outerRadius, donutMetrics.innerRadius, startAngle, endAngle);

      const midAngle = startAngle + sweep / 2;
      const lineStart = polarToCartesian(donutMetrics.center, donutMetrics.center, donutMetrics.outerRadius + 1, midAngle);
      const lineTurn = polarToCartesian(donutMetrics.center, donutMetrics.center, donutMetrics.outerRadius + 14, midAngle);
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
    const minY = 16;
    const maxY = donutMetrics.size - 16;
    const minGap = 18;

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

    const rightEndX = donutMetrics.size - 76;
    const leftEndX = 76;
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

  const handlePrev = useCallback(() => {
    const next = new Date(currentDate);
    if (range === 'month') next.setMonth(next.getMonth() - 1);
    else if (range === 'year') next.setFullYear(next.getFullYear() - 1);
    else if (range === 'week') next.setDate(next.getDate() - 7);
    setCurrentDate(next);
  }, [currentDate, range]);

  const handleNext = useCallback(() => {
    const next = new Date(currentDate);
    if (range === 'month') next.setMonth(next.getMonth() + 1);
    else if (range === 'year') next.setFullYear(next.getFullYear() + 1);
    else if (range === 'week') next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  }, [currentDate, range]);

  return {
    range,
    setRange,
    type,
    setType,
    currentDate,
    setCurrentDate,
    stats,
    totalAmount,
    donutMetrics,
    segmentGeometry,
    buildDateRange,
    fetchStats,
    handlePrev,
    handleNext,
  };
}
