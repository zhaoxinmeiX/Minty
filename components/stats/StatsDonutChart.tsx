import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { Typography } from '@/constants/Typography';
import { SegmentGeometry } from '@/src/hooks/useStatsScreen';

type Props = {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  outerRadius: number;
  innerRadius: number;
  backgroundColor: string;
  borderColor: string;
  totalAmount: number;
  segments: SegmentGeometry[];
  emptyText: string;
  onSegmentPress: (categoryId: number) => void;
  labelColor?: string;
  valueColor?: string;
  emptyTextColor?: string;
};

export function StatsDonutChart({
  width,
  height,
  centerX,
  centerY,
  outerRadius,
  innerRadius,
  backgroundColor,
  borderColor,
  totalAmount,
  segments,
  emptyText,
  onSegmentPress,
  labelColor = '#6B7280',
  valueColor = '#111827',
  emptyTextColor = '#6B7280',
}: Props) {
  const formattedTotalAmount = totalAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (segments.length === 0) {
    return (
      <View style={[styles.emptyChart, { height }]}>
        <Text style={[styles.emptyText, { color: emptyTextColor }]}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.chartBox}>
      <View style={[styles.pieWrap, { width, height }]}>
        <Svg width={width} height={height}>
          <Circle
            cx={centerX}
            cy={centerY}
            r={(outerRadius + innerRadius) / 2}
            fill="none"
            stroke={borderColor}
            strokeOpacity={0.28}
            strokeWidth={outerRadius - innerRadius}
          />

          {segments.length === 1 && (
            <Circle
              cx={centerX}
              cy={centerY}
              r={(outerRadius + innerRadius) / 2}
              fill="none"
              stroke={segments[0].color}
              strokeWidth={outerRadius - innerRadius}
              onPress={() => onSegmentPress(segments[0].categoryId)}
            />
          )}

          {segments.map((segment) => (
            <React.Fragment key={segment.categoryId}>
              {segments.length > 1 && <Path d={segment.path} fill={segment.color} onPress={() => onSegmentPress(segment.categoryId)} />}
              <Line x1={segment.lineStart.x} y1={segment.lineStart.y} x2={segment.lineTurn.x} y2={segment.lineTurn.y} stroke={segment.color} strokeWidth={2} />
              <Line x1={segment.lineTurn.x} y1={segment.lineTurn.y} x2={segment.lineEnd.x} y2={segment.lineEnd.y} stroke={segment.color} strokeWidth={2} />
              <SvgText x={segment.textX} y={segment.textY} fontSize={String(Typography.size.caption)} fontWeight="700" fill={segment.color} textAnchor={segment.textAnchor}>
                {`${segment.name} ${segment.percentage.toFixed(1)}%`}
              </SvgText>
            </React.Fragment>
          ))}

          <Circle cx={centerX} cy={centerY} r={innerRadius - 4} fill={backgroundColor} />
          <Circle cx={centerX} cy={centerY} r={innerRadius - 6} fill="none" stroke={borderColor} strokeWidth={1} />
        </Svg>
        <View style={styles.totalCenter}>
          <Text style={[styles.totalLabel, { color: labelColor }]}>合计</Text>
          <Text style={[styles.totalValue, { color: valueColor }]}>{formattedTotalAmount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartBox: { alignItems: 'center' },
  pieWrap: { position: 'relative', justifyContent: 'center', overflow: 'visible' },
  totalCenter: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: { fontSize: Typography.size.footnote, fontWeight: '600' },
  totalValue: { fontSize: Typography.size.label, fontWeight: '800', marginTop: 4 },
  emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: Typography.size.body },
});
