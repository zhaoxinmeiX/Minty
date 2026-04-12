import { formatDateTimeToISO, parseISODate } from '@/src/utils/date';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { SQLiteDatabase } from 'expo-sqlite';
import { Alert } from 'react-native';
import * as XLSX from 'xlsx';
import { addRecord, ensureLedgerSync, getCategoryByName, getRecordsByLedger, getRecordsByLedgerInRangeAsync } from '../db/operations';

// Export Ledger to Excel
export const exportLedgerToExcel = async (db: SQLiteDatabase, ledgerId: number, ledgerName: string, startDate?: string, endDate?: string) => {
  try {
    const records = await getRecordsByLedgerInRangeAsync(db, ledgerId, startDate, endDate);
    if (records.length === 0) {
      Alert.alert('Empty Ledger', 'There are no records to export.');
      return;
    }

    // Format Data to match user's expected Chinese headers
    const data = records.map((r) => ({
      时间: formatDateTimeToISO(parseISODate(r.created_at) ?? new Date(r.created_at)),
      类型: r.type === 'income' ? '收入' : '支出',
      分类: r.category,
      二级分类: r.sub_category || '',
      金额: r.type === 'expense' ? -r.amount : r.amount,
      账本: ledgerName,
      备注: r.note || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');

    const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

    const fileName = `Minty_${ledgerName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(filePath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath);
    } else {
      Alert.alert('Sharing Unavailable', 'Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Export Error:', error);
    Alert.alert('Export Failed', 'An error occurred while exporting.');
  }
};

// Utility to clean currency strings and parse numbers
const parseCurrency = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = val.toString().replace(/[^-0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

// Import Excel to Ledger
export const importExcelToLedger = async (db: SQLiteDatabase, currentLedgerId: number, onSuccess: () => void) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const { uri } = result.assets[0];
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const workbook = XLSX.read(base64, { type: 'base64', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json<any>(worksheet);

    if (data.length === 0) {
      Alert.alert('Empty File', 'The selected Excel file has no data.');
      return;
    }

    let importedCount = 0;
    db.withTransactionSync(() => {
      data.forEach((row) => {
        // Support both Chinese and English headers
        const rawAmount = row['金额'] ?? row['Amount'];
        const amount = parseCurrency(rawAmount);

        if (amount !== 0 || rawAmount !== undefined) {
          const typeStr = (row['类型'] ?? row['Type'] ?? '').toString();
          const isIncome = typeStr.includes('收入') || typeStr.toLowerCase() === 'income' || amount > 0;
          const type: 'income' | 'expense' = isIncome ? 'income' : 'expense';

          // Determine target ledger
          const ledgerName = row['账本'] ?? row['Ledger'];
          const targetLedgerId = ledgerName ? ensureLedgerSync(db, ledgerName.toString()) : currentLedgerId;

          // Resolve IDs for Category
          const catName = (row['分类'] ?? row['Category'] ?? '日常其他').toString();
          const subCatName = (row['二级分类'] ?? row['Sub Category'] ?? null)?.toString() || null;

          let categoryId = 1; // Default
          let subCategoryId: number | null = null;

          const mainCat = getCategoryByName(db, catName, type);
          if (mainCat) {
            categoryId = mainCat.id;
            if (subCatName) {
              const subCat = getCategoryByName(db, subCatName, type, categoryId);
              if (subCat) {
                subCategoryId = subCat.id;
              }
            }
          }

          // Parse Date
          let createdAt: string | undefined = undefined;
          const rawDate = row['时间'] ?? row['Date'] ?? row['created_at'];
          if (rawDate) {
            // Priority: parseISODate (standard format) -> new Date (Excel date object or generic string)
            const dateObj = parseISODate(rawDate.toString()) ?? new Date(rawDate);
            if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
              // Format using LOCAL time components to preserve the date as shown in Excel.
              // toISOString() would output UTC, which shifts dates backward for positive UTC offsets (e.g., NZST UTC+12).
              const yyyy = dateObj.getFullYear();
              const MM = String(dateObj.getMonth() + 1).padStart(2, '0');
              const dd = String(dateObj.getDate()).padStart(2, '0');
              const hh = String(dateObj.getHours()).padStart(2, '0');
              const mm = String(dateObj.getMinutes()).padStart(2, '0');
              const ss = String(dateObj.getSeconds()).padStart(2, '0');
              createdAt = `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
            }
          }

          addRecord(db, {
            amount: Math.abs(amount),
            type,
            category_id: categoryId,
            sub_category_id: subCategoryId,
            category: catName,
            sub_category: subCatName,
            note: (row['备注'] ?? row['Note'] ?? '').toString(),
            ledger_id: targetLedgerId,
            created_at: createdAt,
          });
          importedCount++;
        }
      });
    });

    Alert.alert('Import Success', `Successfully imported ${importedCount} records.`);
    onSuccess();
  } catch (error) {
    console.error('Import Error:', error);
    Alert.alert('Import Failed', 'Failed to read the Excel file. Please ensure it follows the correct format.');
  }
};
