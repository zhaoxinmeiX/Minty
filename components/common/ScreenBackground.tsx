import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/Colors';

/**
 * Shared atmospheric background component.
 * Provides the signature light green base and glowing orbs.
 * Use this at the root of a screen to ensure visual consistency 
 * with the rest of the app while maintaining opaque navigation.
 */
export const ScreenBackground = () => {
  const theme = Colors.light;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Base Background Color */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.homeBackground }]} />
      
      {/* Atmospheric Glows */}
      <View 
        pointerEvents="none" 
        style={[
          styles.screenGlow, 
          styles.screenGlowTop, 
          { backgroundColor: 'rgba(252, 206, 180, 0.42)' }
        ]} 
      />
      <View 
        pointerEvents="none" 
        style={[
          styles.screenGlow, 
          styles.screenGlowRight, 
          { backgroundColor: 'rgba(171, 215, 251, 0.22)' }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  screenGlowTop: {
    width: 220,
    height: 220,
    top: 36,
    left: -56,
  },
  screenGlowRight: {
    width: 230,
    height: 230,
    top: 160,
    right: -82,
  },
});
