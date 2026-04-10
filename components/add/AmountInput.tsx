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
}

export const AmountInput: React.FC<AmountInputProps> = ({ amount, result, note, onNoteChange, onDatePress, onLedgerPress, dateText, ledgerName, accentColor }) => {
  const theme = Colors.light;

  const hasExpression = /[+×÷\-]/.test(amount);

  return (
    <View style={[styles.container, { borderTopColor: theme.border }]}>
      {/* Top Row: Note and Amount */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <TextInput
            style={[styles.noteInput, { color: theme.text }]}
            placeholder="点击输入备注或分类名"
            placeholderTextColor={theme.tabIconDefault}
            value={note}
            onChangeText={onNoteChange}
          />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.amountDisplay, { color: theme.expense }]}>{hasExpression ? result || '0.00' : amount || '0.00'}</Text>
          {hasExpression && <Text style={[styles.expressionDisplay, { color: theme.tabIconDefault }]}>{amount}</Text>}
        </View>
      </View>

      {/* Bottom Row: Pills */}
      <View style={styles.pillRow}>
        <Pressable onPress={onDatePress} style={[styles.pill, { backgroundColor: accentColor + '1A' }]}>
          <Calendar size={13} color={accentColor} />
          <Text style={[styles.pillText, { color: accentColor }]}>{dateText}</Text>
        </Pressable>

        <Pressable onPress={onLedgerPress} style={[styles.pill, { backgroundColor: accentColor + '1A' }]}>
          <Book size={13} color={accentColor} />
          <Text style={[styles.pillText, { color: accentColor }]}>{ledgerName}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteInput: {
    flex: 1,
    fontSize: Typography.size.body,
    fontWeight: '400',
  },
  amountDisplay: {
    fontSize: Typography.size.headline,
    fontWeight: 'bold',
  },
  expressionDisplay: {
    fontSize: Typography.size.caption,
    marginTop: -2,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  pillText: {
    fontSize: Typography.size.caption,
    fontWeight: '600',
  },
});
