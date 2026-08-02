import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Book, Calendar } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface AmountInputProps {
  amount: string; // The expression (e.g. 12*3)
  result?: string; // The calculated result (e.g. 36.00)
  note: string;
  onAmountChange: (text: string) => void;
  onNoteChange: (text: string) => void;
  onDatePress: () => void;
  onLedgerPress: () => void;
  dateText: string;
  ledgerName: string;
  accentColor: string;
  ledgerTriggerRef?: React.RefObject<View | null>;
  compact?: boolean;
  onNoteFocus?: () => void;
  onNoteBlur?: () => void;
  onAmountDisplayPress?: () => void;
  onSubmitEditing?: () => void;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  amount,
  result,
  note,
  onNoteChange,
  onDatePress,
  onLedgerPress,
  dateText,
  ledgerName,
  accentColor,
  ledgerTriggerRef,
  compact = false,
  onNoteFocus,
  onNoteBlur,
  onAmountDisplayPress,
  onSubmitEditing,
}) => {
  const theme = Colors.light;
  const noteInputRef = React.useRef<TextInput>(null);

  const hasExpression = /[+×÷\-]/.test(amount);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={[styles.pillRow, compact && styles.pillRowCompact]}>
        <Pressable onPress={onDatePress} style={[styles.pill, compact && styles.pillCompact, { backgroundColor: accentColor + '16' }]}>
          <Calendar size={compact ? 12 : 13} color={accentColor} />
          <Text style={[styles.pillText, compact && styles.pillTextCompact, { color: accentColor }]}>{dateText}</Text>
        </Pressable>

        <View ref={ledgerTriggerRef} collapsable={false}>
          <Pressable onPress={onLedgerPress} style={[styles.pill, compact && styles.pillCompact, { backgroundColor: accentColor + '16' }]}>
            <Book size={compact ? 12 : 13} color={accentColor} />
            <Text style={[styles.pillText, compact && styles.pillTextCompact, { color: accentColor }]}>{ledgerName}</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.topRow, compact && styles.topRowCompact, { backgroundColor: theme.homeSurfaceStrong }]}>
        <TextInput
          ref={noteInputRef}
          style={[styles.noteInput, compact && styles.noteInputCompact, { color: theme.text }]}
          placeholder="点击输入备注或分类名"
          placeholderTextColor={theme.tabIconDefault}
          value={note}
          onChangeText={onNoteChange}
          onFocus={onNoteFocus}
          onBlur={onNoteBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="done"
          blurOnSubmit
        />
        <Pressable
          onPress={() => {
            noteInputRef.current?.blur();
            onAmountDisplayPress?.();
          }}
          hitSlop={8}
          style={styles.amountDisplayPressable}
        >
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.amountDisplay, compact && styles.amountDisplayCompact, { color: accentColor }]}>{hasExpression ? result || '0.00' : amount || '0.00'}</Text>
            {hasExpression && <Text style={[styles.expressionDisplay, compact && styles.expressionDisplayCompact, { color: theme.tabIconDefault }]}>{amount}</Text>}
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 10,
  },
  containerCompact: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  topRowCompact: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noteInput: {
    flex: 1,
    height: 32,
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    fontWeight: '400',
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  noteInputCompact: {
    height: 30,
    fontSize: Typography.size.label,
    lineHeight: Typography.lineHeight.label,
  },
  amountDisplay: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '900',
  },
  amountDisplayCompact: {
    fontSize: 28,
    lineHeight: 30,
  },
  amountDisplayPressable: {
    marginLeft: 12,
  },
  expressionDisplay: {
    fontSize: Typography.size.caption,
    marginTop: 2,
  },
  expressionDisplayCompact: {
    fontSize: Typography.size.footnote,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  pillRowCompact: {
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  pillCompact: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 5,
  },
  pillText: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
  },
  pillTextCompact: {
    fontSize: Typography.size.footnote,
  },
});
