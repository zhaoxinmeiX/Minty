import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

export type TransactionType = 'expense' | 'income';

interface TypeSegmentControlProps {
  type: TransactionType;
  onChange: (type: TransactionType) => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}

export const TypeSegmentControl: React.FC<TypeSegmentControlProps> = ({
  type,
  onChange,
  compact = false,
  style,
  backgroundColor,
}) => {
  const theme = Colors.light;
  const containerBg = backgroundColor ?? theme.homeSurface;

  return (
    <View
      style={[
        styles.segmentControl,
        compact && styles.segmentControlCompact,
        { backgroundColor: containerBg },
        style,
      ]}
    >
      <Pressable
        onPress={() => onChange('expense')}
        style={[
          styles.segmentBtn,
          compact && styles.segmentBtnCompact,
          type === 'expense' && { backgroundColor: theme.homeAccent },
        ]}
      >
        <Text
          style={[
            styles.segmentText,
            { color: type === 'expense' ? '#FFF' : theme.homeMuted },
          ]}
        >
          支出
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange('income')}
        style={[
          styles.segmentBtn,
          compact && styles.segmentBtnCompact,
          type === 'income' && { backgroundColor: theme.income },
        ]}
      >
        <Text
          style={[
            styles.segmentText,
            { color: type === 'income' ? '#FFF' : theme.homeMuted },
          ]}
        >
          收入
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  segmentControl: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 4,
    width: 184,
  },
  segmentControlCompact: {
    width: 170,
    borderRadius: 16,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentBtnCompact: {
    height: 34,
    borderRadius: 12,
  },
  segmentText: {
    fontSize: Typography.size.body,
    fontWeight: '800',
  },
});
