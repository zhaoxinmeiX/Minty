import { DATABASE_NAME, INIT_QUERIES } from '@/src/db/schema';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import 'react-native-reanimated';

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
    { name: '日常其他', icon: 'LayoutGrid', type: 'expense' },
    { name: '装备', icon: 'Backpack', type: 'expense' },
    {
      name: '出行',
      icon: 'Plane',
      type: 'expense',
      children: [
        { name: '公交/地铁', icon: 'Bus' },
        { name: '打车', icon: 'Car' },
      ],
    },
    { name: '学费', icon: 'GraduationCap', type: 'expense' },
    { name: '签证', icon: 'FileCheck', type: 'expense' },
    { name: '保险', icon: 'ShieldPlus', type: 'expense' },
    {
      name: '餐饮',
      icon: 'Utensils',
      type: 'expense',
      children: [
        { name: '早餐', icon: 'Coffee' },
        { name: '午餐', icon: 'Utensils' },
        { name: '晚餐', icon: 'Utensils' },
      ],
    },
    {
      name: '车',
      icon: 'Car',
      type: 'expense',
      children: [
        { name: '加油', icon: 'Fuel' },
        { name: '停车费', icon: 'ParkingCircle' },
        { name: '维修保养', icon: 'Wrench' },
        { name: '汽车用品', icon: 'Package' },
        { name: '保险年检', icon: 'ShieldPlus' },
        { name: '违章罚款', icon: 'FileCheck' },
      ],
    },
    {
      name: '超市',
      icon: 'ShoppingCart',
      type: 'expense',
      children: [{ name: '日用品', icon: 'Home' }],
    },
    { name: '租房', icon: 'Home', type: 'expense' },
    { name: '英语', icon: 'BookOpen', type: 'expense' },
    { name: '工资', icon: 'DollarSign', type: 'income' },
    { name: '理财', icon: 'TrendingUp', type: 'income' },
    { name: '红包', icon: 'Gift', type: 'income' },
    { name: '报销', icon: 'Receipt', type: 'income' },
    { name: '其他收入', icon: 'PlusCircle', type: 'income' },
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
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </SQLiteProvider>
  );
}
