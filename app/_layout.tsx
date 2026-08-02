import { Colors } from '@/constants/Colors';
import { DATABASE_NAME, INIT_QUERIES } from '@/src/db/schema';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { Platform, StyleSheet, UIManager } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const initDatabase = async (db: SQLiteDatabase) => {
  // 强制删库重建 (开发阶段 - 暂时注释以防外键冲突)
  // await db.execAsync('DROP TABLE IF EXISTS records;');
  // await db.execAsync('DROP TABLE IF EXISTS categories;');
  // await db.execAsync('DROP TABLE IF EXISTS ledgers;');

  await db.execAsync(INIT_QUERIES);

  // Ensure default ledger
  await db.runAsync('INSERT OR IGNORE INTO ledgers (id, name, currency) VALUES (1, "默认账本", "NZD");');

  // Idempotent seed for all default categories: works for both new and existing databases.
  const defaultCategories: Array<{
    name: string;
    icon: string;
    type: 'expense' | 'income';
    children?: Array<{ name: string; icon: string }>;
  }> = [
      {
        name: '超市',
        icon: 'cart-outline',
        type: 'expense',
      },
      {
        name: '车',
        icon: 'car',
        type: 'expense',
        children: [
          { name: '加油', icon: 'gas-station-outline' },
          { name: '停车费', icon: 'parking' },
          { name: '维修保养', icon: 'wrench-outline' },
          { name: '汽车用品', icon: 'package-variant' },
          { name: '保险年检', icon: 'shield-check-outline' },
          { name: '违章罚款', icon: 'file-document-outline' },
        ],
      },
      { name: '餐饮', icon: 'silverware-fork-knife', type: 'expense' },
      { name: '日常其他', icon: 'view-grid-outline', type: 'expense' },
      {
        name: '租房',
        icon: 'home-outline',
        type: 'expense',
        children: [
          { name: 'Airbnb', icon: 'bed-outline' },
          { name: '房租', icon: 'home-outline' },
          { name: '水电网', icon: 'lightning-bolt-outline' },
          { name: '其他', icon: 'view-grid-outline' },
        ],
      },
      {
        name: '公共交通',
        icon: 'bus',
        type: 'expense',
        children: [
          { name: '飞机', icon: 'airplane' },
          { name: '高铁', icon: 'train' },
          { name: '公交/地铁', icon: 'bus' },
          { name: '打车', icon: 'car' },
        ],
      },
      { name: '宠物', icon: 'paw', type: 'expense' },
      { name: '保险', icon: 'shield-check-outline', type: 'expense' },
      { name: '学费签证', icon: 'wallet-outline', type: 'expense' },
      { name: '工资', icon: 'cash-multiple', type: 'income' },
      { name: '理财', icon: 'chart-line', type: 'income' },
      { name: '红包', icon: 'gift-outline', type: 'income' },
      { name: '报销', icon: 'receipt-outline', type: 'income' },
      { name: '其他收入', icon: 'plus-circle-outline', type: 'income' },
    ];

  for (const category of defaultCategories) {
    await db.runAsync(
      `INSERT INTO categories (name, icon, type, parent_id)
       SELECT ?, ?, ?, NULL
       WHERE NOT EXISTS (
         SELECT 1 FROM categories WHERE name = ? AND type = ? AND parent_id IS NULL
       );`,
      category.name,
      category.icon,
      category.type,
      category.name,
      category.type,
    );

    if (!category.children || category.children.length === 0) continue;

    const parent = (await db.getFirstAsync('SELECT id FROM categories WHERE name = ? AND type = ? AND parent_id IS NULL LIMIT 1;', category.name, category.type)) as {
      id: number;
    } | null;

    if (!parent?.id) continue;

    for (const child of category.children) {
      await db.runAsync(
        `INSERT INTO categories (name, icon, type, parent_id)
         SELECT ?, ?, ?, ?
         WHERE NOT EXISTS (
           SELECT 1 FROM categories WHERE name = ? AND type = ? AND parent_id = ?
         );`,
        child.name,
        child.icon,
        category.type,
        parent.id,
        child.name,
        category.type,
        parent.id,
      );
    }
  }
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const themeColors = Colors.light;
  const defaultAnimation = 'fade_from_bottom' as const;
  const horizontalAnimation = Platform.OS === 'android' ? 'fade' : 'slide_from_right';
  const verticalAnimation = Platform.OS === 'android' ? 'fade_from_bottom' : 'slide_from_bottom';

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
        <Stack
          screenOptions={{
            animation: defaultAnimation,
            contentStyle: { backgroundColor: themeColors.homeBackground },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="data-management" options={{ headerShown: false, animation: horizontalAnimation }} />
          <Stack.Screen name="ledgers" options={{ headerShown: false, animation: horizontalAnimation }} />
          <Stack.Screen name="search" options={{ headerShown: false, animation: horizontalAnimation }} />
          <Stack.Screen name="bills" options={{ headerShown: false, animation: horizontalAnimation }} />
          <Stack.Screen name="add" options={{ headerShown: false, animation: verticalAnimation }} />
        </Stack>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
