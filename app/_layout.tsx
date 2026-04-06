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

  // Seed basic categories if table is empty
  const cats = await db.getAllAsync('SELECT * FROM categories LIMIT 1');
  if (cats.length === 0) {
    // Parent Expense
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("日常其他", "LayoutGrid", "expense", NULL);');
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("装备", "Backpack", "expense", NULL);');
    const resTravel = await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("出行", "Plane", "expense", NULL);');
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("学费", "GraduationCap", "expense", NULL);');
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("签证", "FileCheck", "expense", NULL);');
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("保险", "ShieldPlus", "expense", NULL);');
    const resFood = await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("餐饮", "Utensils", "expense", NULL);');
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("车", "Car", "expense", NULL);');
    const resSuper = await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("超市", "ShoppingCart", "expense", NULL);');
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("租房", "Home", "expense", NULL);');
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("英语", "BookOpen", "expense", NULL);');

    // Parent Income
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("工资", "DollarSign", "income", NULL);');
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("理财", "TrendingUp", "income", NULL);');
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("红包", "Gift", "income", NULL);');
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("报销", "Receipt", "income", NULL);');
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("其他收入", "PlusCircle", "income", NULL);');

    // Sub Expense
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("早餐", "Coffee", "expense", ?);', resFood.lastInsertRowId);
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("午餐", "Utensils", "expense", ?);', resFood.lastInsertRowId);
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("晚餐", "Utensils", "expense", ?);', resFood.lastInsertRowId);
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("公交/地铁", "Bus", "expense", ?);', resTravel.lastInsertRowId);
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("打车", "Car", "expense", ?);', resTravel.lastInsertRowId);
    await db.runAsync('INSERT INTO categories (name, icon, type, parent_id) VALUES ("日用品", "Home", "expense", ?);', resSuper.lastInsertRowId);
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
