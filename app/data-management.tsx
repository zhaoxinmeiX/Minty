import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronLeft, ChevronRight, FileDown, FileUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ExportDataModal } from '@/components/settings/ExportDataModal';
import { Colors } from '@/constants/Colors';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { Typography } from '@/constants/Typography';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
import { useStore } from '@/src/store';
import { importExcelToLedger } from '@/src/utils/excel';

export default function DataManagementScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const theme = Colors.light;
  const insets = useStableSafeAreaInsets();
  
  const activeLedgerId = useStore((state) => state.activeLedgerId);
  const bumpDataVersion = useStore((state) => state.bumpDataVersion);

  const [isExportModalVisible, setIsExportModalVisible] = useState(false);

  const handleImport = () => {
    if (activeLedgerId) {
      importExcelToLedger(db, activeLedgerId, () => {
        bumpDataVersion();
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.homeBackground, paddingTop: insets.top }]}>
      <ScreenBackground />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.headerIcon, { backgroundColor: theme.homeSurface }]}>
          <ChevronLeft size={22} color={theme.homeOlive} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.homeOlive }]}>数据管理</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <View style={[styles.sectionCard, { backgroundColor: theme.homeSurface }]}>
          <Pressable style={styles.listItem} onPress={handleImport}>
            <View style={[styles.iconWrapper, { backgroundColor: '#E4F1E3' }]}>
              <FileDown size={20} color={theme.income} />
            </View>
            <View style={styles.listTextWrap}>
              <Text style={[styles.listTitle, { color: theme.text }]}>导入数据</Text>
              <Text style={[styles.listHint, { color: theme.homeMuted }]}>从 Excel 合并到账本</Text>
            </View>
            <ChevronRight size={18} color={theme.homeOlive} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: 'rgba(110, 125, 66, 0.08)' }]} />

          <Pressable style={styles.listItem} onPress={() => setIsExportModalVisible(true)}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.homeBlueSoft }]}>
              <FileUp size={20} color={theme.homeOlive} />
            </View>
            <View style={styles.listTextWrap}>
              <Text style={[styles.listTitle, { color: theme.text }]}>导出数据</Text>
              <Text style={[styles.listHint, { color: theme.homeMuted }]}>导出当前账本为 Excel</Text>
            </View>
            <ChevronRight size={18} color={theme.homeOlive} />
          </Pressable>
        </View>
      </View>

      <ExportDataModal 
        visible={isExportModalVisible} 
        onClose={() => setIsExportModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  headerTitle: {
    fontSize: Typography.size.titleLg,
    fontWeight: '800',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 1,
  },
  headerRight: {
    width: 44,
  },
  content: {
    paddingHorizontal: 16,
  },
  sectionCard: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listTextWrap: {
    flex: 1,
  },
  listTitle: {
    fontSize: Typography.size.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  listHint: {
    fontSize: Typography.size.caption,
  },
  divider: {
    height: 1,
    marginLeft: 70,
  },
});
