import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import * as Haptics from 'expo-haptics';
import { Calculator, Delete, Reply } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const BUTTON_HEIGHT = 54;

interface NumericPadProps {
  onPress: (val: string) => void;
  onClear: () => void;
  onDelete: () => void;
  onSave: () => void;
  onAddAnother: () => void;
  accentColor: string;
  compact?: boolean;
}

export const NumericPad: React.FC<NumericPadProps> = ({ onPress, onClear, onDelete, onSave, onAddAnother, accentColor, compact = false }) => {
  const theme = Colors.light;
  const defaultButtonBg = theme.homeSurfaceStrong;
  const utilityButtonBg = theme.homeSection;
  const [mode, setMode] = useState<'normal' | 'calc'>('normal');
  const buttonHeight = compact ? 48 : BUTTON_HEIGHT;
  const buttonGap = compact ? 8 : 6;

  const playHaptic = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderButton = (label: string | React.ReactNode, action: () => void, options: { flex?: number; bg?: string; color?: string; fontSize?: number; height?: number } = {}) => (
    <Pressable
      onPress={() => {
        playHaptic();
        action();
      }}
      style={({ pressed }) => [
        styles.btn,
        compact && styles.btnCompact,
        {
          backgroundColor: options.bg || defaultButtonBg,
          flex: options.flex || 1,
          height: options.height || buttonHeight,
          borderWidth: 1,
          borderColor: 'rgba(110, 125, 66, 0.06)',
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      {typeof label === 'string' ? (
        <Text style={[styles.btnText, { color: options.color || theme.homeOlive }, options.fontSize ? { fontSize: options.fontSize } : null]}>{label}</Text>
      ) : (
        label
      )}
    </Pressable>
  );

  if (mode === 'calc') {
    return (
      <View style={[styles.container, compact && styles.containerCompact, { backgroundColor: theme.homeSurface }]}>
        <View style={[styles.row, compact && styles.rowCompact]}>
          {renderButton('1', () => onPress('1'))}
          {renderButton('2', () => onPress('2'))}
          {renderButton('3', () => onPress('3'))}
          {renderButton('(', () => onPress('('))}
          {renderButton(')', () => onPress(')'))}
        </View>
        <View style={[styles.row, compact && styles.rowCompact]}>
          {renderButton('4', () => onPress('4'))}
          {renderButton('5', () => onPress('5'))}
          {renderButton('6', () => onPress('6'))}
          {renderButton('×', () => onPress('×'))}
          {renderButton('÷', () => onPress('÷'))}
        </View>
        <View style={[styles.row, compact && styles.rowCompact]}>
          {renderButton('7', () => onPress('7'))}
          {renderButton('8', () => onPress('8'))}
          {renderButton('9', () => onPress('9'))}
          {renderButton('+', () => onPress('+'))}
          {renderButton(<Reply size={22} color={theme.homeOlive} />, () => setMode('normal'), { bg: utilityButtonBg })}
        </View>
        <View style={[styles.row, compact && styles.rowCompact]}>
          {renderButton('.', () => onPress('.'))}
          {renderButton('0', () => onPress('0'))}
          {renderButton(<Delete size={20} color={theme.homeOlive} />, onDelete, { bg: utilityButtonBg })}
          {renderButton('-', () => onPress('-'))}
          {renderButton('保存', onSave, { bg: accentColor, color: '#FFF', fontSize: Typography.size.titleLg })}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact, { backgroundColor: theme.homeSurface }]}>
      <View style={[styles.row, compact && styles.rowCompact]}>
        {renderButton('1', () => onPress('1'))}
        {renderButton('2', () => onPress('2'))}
        {renderButton('3', () => onPress('3'))}
        {renderButton(<Delete size={20} color={theme.homeOlive} />, onDelete, { bg: utilityButtonBg })}
      </View>
      <View style={[styles.row, compact && styles.rowCompact]}>
        {renderButton('4', () => onPress('4'))}
        {renderButton('5', () => onPress('5'))}
        {renderButton('6', () => onPress('6'))}
        {renderButton(<Calculator size={22} color={theme.homeOlive} />, () => setMode('calc'), { bg: utilityButtonBg })}
      </View>
      <View style={[styles.row, compact && styles.rowCompact]}>
        <View style={[styles.leftCol, compact && styles.leftColCompact]}>
          <View style={[styles.innerRow, compact && styles.innerRowCompact]}>
            {renderButton('7', () => onPress('7'))}
            {renderButton('8', () => onPress('8'))}
            {renderButton('9', () => onPress('9'))}
          </View>
          <View style={[styles.innerRow, compact && styles.innerRowCompact]}>
            {renderButton('再记', onAddAnother, { fontSize: Typography.size.title, bg: theme.homeSection })}
            {renderButton('0', () => onPress('0'))}
            {renderButton('.', () => onPress('.'))}
          </View>
        </View>
        <Pressable
          onPress={() => {
            playHaptic();
            onSave();
          }}
          style={({ pressed }) => [
            styles.saveBtn,
            compact && styles.saveBtnCompact,
            { backgroundColor: accentColor, height: buttonHeight * 2 + buttonGap },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.saveBtnText, compact && styles.saveBtnTextCompact]}>保存</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 18, gap: 6 },
  containerCompact: { paddingHorizontal: 14, paddingTop: 2, paddingBottom: 14, gap: 8 },
  row: { flexDirection: 'row', gap: 6 },
  rowCompact: { gap: 8 },
  leftCol: { flex: 3.08, gap: 6 },
  leftColCompact: { gap: 8 },
  innerRow: { flexDirection: 'row', gap: 6 },
  innerRowCompact: { gap: 8 },
  btn: {
    height: BUTTON_HEIGHT,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCompact: {
    borderRadius: 18,
  },
  saveBtn: {
    flex: 1,
    height: BUTTON_HEIGHT * 2 + 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnCompact: {
    borderRadius: 22,
  },
  btnText: { fontSize: Typography.size.titleLg, fontWeight: '700' },
  saveBtnText: { fontSize: Typography.size.titleLg, fontWeight: 'bold', color: '#ffffff' },
  saveBtnTextCompact: { fontSize: Typography.size.title },
});
