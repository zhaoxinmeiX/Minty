import { Colors } from '@/constants/Colors';
import { Calculator, Delete, Reply } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');
const BUTTON_HEIGHT = 48;

interface NumericPadProps {
  onPress: (val: string) => void;
  onClear: () => void;
  onDelete: () => void;
  onSave: () => void;
  onAddAnother: () => void;
  accentColor: string;
}

export const NumericPad: React.FC<NumericPadProps> = ({ onPress, onClear, onDelete, onSave, onAddAnother, accentColor }) => {
  const theme = Colors.light;
  const defaultButtonBg = '#E9E9ED';
  const [mode, setMode] = useState<'normal' | 'calc'>('normal');

  const renderButton = (label: string | React.ReactNode, action: () => void, options: { flex?: number; bg?: string; color?: string; fontSize?: number; height?: number } = {}) => (
    <Pressable
      onPress={action}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: options.bg || defaultButtonBg,
          flex: options.flex || 1,
          height: options.height || BUTTON_HEIGHT,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      {typeof label === 'string' ? (
        <Text style={[styles.btnText, { color: options.color || theme.text }, options.fontSize ? { fontSize: options.fontSize } : null]}>{label}</Text>
      ) : (
        label
      )}
    </Pressable>
  );

  if (mode === 'calc') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.row}>
          {renderButton('1', () => onPress('1'))}
          {renderButton('2', () => onPress('2'))}
          {renderButton('3', () => onPress('3'))}
          {renderButton('(', () => onPress('('))}
          {renderButton(')', () => onPress(')'))}
        </View>
        <View style={styles.row}>
          {renderButton('4', () => onPress('4'))}
          {renderButton('5', () => onPress('5'))}
          {renderButton('6', () => onPress('6'))}
          {renderButton('×', () => onPress('×'))}
          {renderButton('÷', () => onPress('÷'))}
        </View>
        <View style={styles.row}>
          {renderButton('7', () => onPress('7'))}
          {renderButton('8', () => onPress('8'))}
          {renderButton('9', () => onPress('9'))}
          {renderButton('+', () => onPress('+'))}
          {renderButton(<Reply size={22} color={theme.text} />, () => setMode('normal'))}
        </View>
        <View style={styles.row}>
          {renderButton('.', () => onPress('.'))}
          {renderButton('0', () => onPress('0'))}
          {renderButton(<Delete size={20} color={theme.text} />, onDelete)}
          {renderButton('-', () => onPress('-'))}
          {renderButton('保存', onSave, { bg: accentColor, color: '#000', fontSize: 18 })}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.row}>
        {renderButton('1', () => onPress('1'))}
        {renderButton('2', () => onPress('2'))}
        {renderButton('3', () => onPress('3'))}
        {renderButton(<Delete size={20} color={theme.text} />, onDelete)}
      </View>
      <View style={styles.row}>
        {renderButton('4', () => onPress('4'))}
        {renderButton('5', () => onPress('5'))}
        {renderButton('6', () => onPress('6'))}
        {renderButton(<Calculator size={22} color={theme.text} />, () => setMode('calc'))}
      </View>
      <View style={styles.row}>
        <View style={styles.leftCol}>
          <View style={styles.innerRow}>
            {renderButton('7', () => onPress('7'))}
            {renderButton('8', () => onPress('8'))}
            {renderButton('9', () => onPress('9'))}
          </View>
          <View style={styles.innerRow}>
            {renderButton('再记', onAddAnother, { fontSize: 16 })}
            {renderButton('0', () => onPress('0'))}
            {renderButton('.', () => onPress('.'))}
          </View>
        </View>
        <Pressable onPress={onSave} style={({ pressed }) => [styles.saveBtn, { backgroundColor: accentColor }, pressed && { opacity: 0.8 }]}>
          <Text style={styles.saveBtnText}>保存</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10, paddingBottom: 20, gap: 4 },
  row: { flexDirection: 'row', gap: 4 },
  leftCol: { flex: 3.08, gap: 4 },
  innerRow: { flexDirection: 'row', gap: 4 },
  btn: {
    height: BUTTON_HEIGHT,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    height: BUTTON_HEIGHT * 2 + 4,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: { fontSize: 18, fontWeight: '600' },
  saveBtnText: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
});
