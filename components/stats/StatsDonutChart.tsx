import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { Typography } from '@/constants/Typography';
import { SegmentGeometry } from '@/src/hooks/useStatsScreen';

type Props = {
  size: number;
  center: number;
  outerRadius: number;
  innerRadius: number;
  backgroundColor: string;
  borderColor: string;
  totalAmount: number;
  segments: SegmentGeometry[];
  emptyText: string;
  onSegmentPress: (categoryId: number) => void;
};

export function StatsDonutChart({ size, center, outerRadius, innerRadius, backgroundColor, borderColor, totalAmount, segments, emptyText, onSegmentPress }: Props) {
  if (segments.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.chartBox}>
      <View style={[styles.pieWrap, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          {segments.length === 1 && (
            <Circle
              cx={center}
              cy={center}
              r={(outerRadius + innerRadius) / 2}
              fill="none"
              stroke={segments[0].color}
              strokeWidth={outerRadius - innerRadius}
              onPress={() => onSegmentPress(segments[0].categoryId)}
            />
          )}

          {segments.map((segment) => (
            <React.Fragment key={segment.name}>
              {segments.length > 1 && <Path d={segment.path} fill={segment.color} onPress={() => onSegmentPress(segment.categoryId)} />}
              <Line x1={segment.lineStart.x} y1={segment.lineStart.y} x2={segment.lineTurn.x} y2={segment.lineTurn.y} stroke={segment.color} strokeWidth={2} />
              <Line x1={segment.lineTurn.x} y1={segment.lineTurn.y} x2={segment.lineEnd.x} y2={segment.lineEnd.y} stroke={segment.color} strokeWidth={2} />
              <SvgText x={segment.textX} y={segment.textY} fontSize={String(Typography.size.caption)} fontWeight="700" fill={segment.color} textAnchor={segment.textAnchor}>
                {`${segment.name} ${segment.percentage.toFixed(1)}%`}
              </SvgText>
            </React.Fragment>
          ))}

          <Circle cx={center} cy={center} r={innerRadius - 4} fill={backgroundColor} />
          <Circle cx={center} cy={center} r={innerRadius - 6} fill="none" stroke={borderColor} strokeWidth={1} />
        </Svg>
        <View style={styles.totalCenter}>
          <Text style={styles.totalLabel}>合计</Text>
          <Text style={styles.totalValue}>{totalAmount.toFixed(2)}</Text>
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
  totalLabel: { fontSize: Typography.size.body, fontWeight: '600' },
  totalValue: { fontSize: Typography.size.titleLg, fontWeight: '700', lineHeight: 38 },
  emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6B7280', fontSize: Typography.size.body },
});
