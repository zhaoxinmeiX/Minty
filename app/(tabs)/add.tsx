import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Hexagon } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Dimensions, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { addRecord, getRecordById, updateRecord } from '@/src/db/operations';
import { Category } from '@/src/db/schema';
import { useStore } from '@/src/store';
import { EditingCategory, ModalType } from '@/src/types';

// Hooks
import { useCategories } from '@/src/hooks/useCategories';
import { useCategoryPopover } from '@/src/hooks/useCategoryPopover';
import { useLedgers } from '@/src/hooks/useLedgers';
import { parseISODate } from '@/src/utils/date';

// Components
import { AmountInput } from '@/components/add/AmountInput';
import { CategoryEditModal } from '@/components/add/CategoryEditModal';
import { CategoryGrid } from '@/components/add/CategoryGrid';
import { CategoryManager } from '@/components/add/CategoryManager';
import { CategoryPopover } from '@/components/add/CategoryPopover';
import { DateTimePickerModal } from '@/components/add/DateTimePickerModal';
import { LedgerPickerModal } from '@/components/add/LedgerPickerModal';
import { NumericPad } from '@/components/add/NumericPad';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_BACKGROUND = '#FFFFFF';
const PAGE_TEXT = '#111111';
const PAGE_CARD = '#F3F4F6';
const PAGE_TAB_ICON = '#6B7280';
const PAGE_SECTION_DIVIDER = '#E9E9ED';
const PAGE_ACCENT = '#FFB02E';
const TAB_ROUTES = {
  index: '/',
  calendar: '/calendar',
  stats: '/stats',
  settings: '/settings',
} as const;

export default function AddScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { activeLedgerId, setActiveLedgerId, selectedDateContext, setSelectedDateContext, lastTab } = useStore();
  const accentColor = PAGE_ACCENT;
  const { id, mode } = useLocalSearchParams<{ id: string; mode: string }>();
  const isEdit = mode === 'edit';
  const isCopy = mode === 'copy';

  // Local State
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());

  // Reset state on focus if not editing/copying
  useFocusEffect(
    useCallback(() => {
      if (!isEdit && !isCopy) {
        setAmount('');
        setNote('');
        setSelectedCategory(null);
        setSelectedSubCategory(null);

        if (selectedDateContext) {
          // Keep current time but use the context date
          const newDate = new Date();
          const [y, m, d] = selectedDateContext.split('-').map(Number);
          newDate.setFullYear(y, m - 1, d);
          setDate(newDate);
        } else {
          setDate(new Date());
        }
      }
    }, [isEdit, isCopy, selectedDateContext]),
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<Category | null>(null);

  // Modal states
  const [modalType, setModalType] = useState<ModalType>('none');
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  // Hooks
  const { categories, add: addCat, update: updateCat, getSubs } = useCategories(type);
  const popover = useCategoryPopover();
  const { ledgers } = useLedgers();

  const activeLedger = useMemo(() => ledgers.find((l) => l.id === activeLedgerId), [ledgers, activeLedgerId]);

  // Ensure the active ledger ID is valid
  React.useEffect(() => {
    if (ledgers.length > 0 && !activeLedger) {
      setActiveLedgerId(ledgers[0].id);
    }
  }, [ledgers, activeLedger, setActiveLedgerId]);

  // Load record if editing or copying
  React.useEffect(() => {
    if (id) {
      const record = getRecordById(db, parseInt(id));
      if (record) {
        setType(record.type);
        setAmount(record.amount.toString());
        setNote(record.note || '');
        setDate(parseISODate(record.created_at) ?? new Date());
      }
    }
  }, [id, db]);

  // Sync category selection once categories are loaded
  React.useEffect(() => {
    if (id && categories.length > 0) {
      const record = getRecordById(db, parseInt(id));
      if (record && record.type === type) {
        const foundCat = categories.find((c) => c.id === record.category_id);
        if (foundCat) {
          setSelectedCategory(foundCat);
          const subs = getSubs(foundCat.id);
          const foundSub = subs.find((s) => s.id === record.sub_category_id);
          if (foundSub) setSelectedSubCategory(foundSub);
        }
      }
    }
  }, [id, categories, type, db]);

  const handleSelectMainCategory = (cat: Category) => {
    if (selectedCategory?.id === cat.id) {
      const subs = getSubs(cat.id);
      if (subs.length > 0) popover.open(cat, subs);
    } else {
      setSelectedCategory(cat);
      setSelectedSubCategory(null);
      const subs = getSubs(cat.id);
      if (subs.length > 0) popover.open(cat, subs);
    }
  };

  const formatLocalDatabaseDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const evaluateExpression = (expr: string): string => {
    try {
      // Replace display symbols with JS math symbols
      let cleanExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');

      // Basic sanitization: only allow numbers, dots, and math operators
      if (/[^0-9.+\-*/()]/.test(cleanExpr)) return expr;

      // Use a safe evaluation approach.
      // While Function('return ' + expr)() is common in JS,
      // for a calculator we want to handle errors gracefully.
      const result = new Function(`return (${cleanExpr})`)();

      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) return expr;

      // Format to 2 decimal places and remove trailing zeros
      return Number(result.toFixed(2)).toString();
    } catch (e) {
      return expr;
    }
  };

  const handleSaveRecord = (stayOnPage = false) => {
    // Evaluate if it's an expression
    const evaluatedAmount = evaluateExpression(amount);
    const numericAmount = parseFloat(evaluatedAmount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('提示', '请输入有效的金额');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('提示', '请选择一个分类');
      return;
    }

    const formattedDate = formatLocalDatabaseDate(date);
    const recordData = {
      amount: numericAmount,
      type,
      category_id: selectedCategory.id,
      sub_category_id: selectedSubCategory ? selectedSubCategory.id : null,
      category: selectedCategory.name,
      sub_category: selectedSubCategory ? selectedSubCategory.name : null,
      note: note || null,
      icon: selectedCategory.icon,
      member: 'Me',
      ledger_id: activeLedgerId,
      created_at: formattedDate,
    };

    if (isEdit && id) {
      updateRecord(db, parseInt(id), recordData);
    } else {
      addRecord(db, recordData);
    }

    setAmount('');
    setNote('');
    setSelectedCategory(null);
    setSelectedSubCategory(null);

    if (!stayOnPage) {
      const targetRoute = TAB_ROUTES[lastTab as keyof typeof TAB_ROUTES] ?? TAB_ROUTES.index;
      router.replace(targetRoute);
    }
  };

  const handleKeyPress = (val: string) => {
    if (val === '.') {
      if (amount.includes('.') && !/[+\-*/(]/.test(amount.slice(-1))) {
        // Find if the current number (after last operator) has a dot.
        const lastPart = amount.split(/[+\-×÷()]/).pop() || '';
        if (lastPart.includes('.')) return;
      }
      if (amount === '') setAmount('0.');
      else setAmount((prev) => prev + '.');
    } else if (/[0-9]/.test(val)) {
      if (amount === '0') setAmount(val);
      else setAmount((prev) => prev + val);
    } else {
      // It's an operator or parenthesis
      setAmount((prev) => prev + val);
    }
  };

  const handleDeletePress = () => {
    if (amount.length > 0) {
      setAmount((prev) => prev.slice(0, -1));
    }
  };

  const handleSaveCategory = () => {
    if (!editingCategory || !editingCategory.name) return;
    if (editingCategory.id) {
      updateCat(editingCategory.id, editingCategory.name, editingCategory.icon);
    } else {
      addCat(editingCategory.name, editingCategory.icon, editingCategory.parent_id);
    }
    setModalType('manage_cats');
    setEditingCategory(null);
  };

  const dateText =
    date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }) + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: PAGE_BACKGROUND }]}>
      <StatusBar style="dark" />

      <View style={styles.topSection}>
        {/* Custom Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              const targetRoute = TAB_ROUTES[lastTab as keyof typeof TAB_ROUTES] ?? TAB_ROUTES.index;
              router.replace(targetRoute);
            }}
            style={styles.headerIcon}
          >
            <ChevronLeft size={28} color={PAGE_TEXT} />
          </Pressable>

          <View style={[styles.segmentControl, { backgroundColor: PAGE_CARD }]}>
            <Pressable onPress={() => setType('expense')} style={[styles.segmentBtn, type === 'expense' && styles.segmentBtnActive]}>
              <Text style={[styles.segmentText, { color: type === 'expense' ? '#000' : PAGE_TAB_ICON }]}>支出</Text>
            </Pressable>
            <Pressable onPress={() => setType('income')} style={[styles.segmentBtn, type === 'income' && styles.segmentBtnActive]}>
              <Text style={[styles.segmentText, { color: type === 'income' ? '#000' : PAGE_TAB_ICON }]}>收入</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => setModalType('manage_cats')} style={styles.headerIcon}>
            <Hexagon size={24} color={PAGE_TEXT} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.categoryScroll}>
          <CategoryGrid
            categories={categories}
            selectedCategory={selectedCategory}
            selectedSubCategory={selectedSubCategory}
            onSelectMain={handleSelectMainCategory}
            onManage={() => setModalType('manage_cats')}
            categoryRefs={popover.categoryRefs}
            accentColor={accentColor}
          />
        </ScrollView>
      </View>

      <View style={[styles.sectionDivider, { backgroundColor: PAGE_SECTION_DIVIDER }]} />

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <AmountInput
          amount={amount}
          result={useMemo(() => evaluateExpression(amount), [amount])}
          note={note}
          onNoteChange={setNote}
          onAmountChange={setAmount}
          onDatePress={() => {
            setTempDate(new Date(date));
            setModalType('datetime');
          }}
          onLedgerPress={() => setModalType('ledger')}
          dateText={dateText}
          ledgerName={activeLedger?.name || '默认账本'}
          accentColor={accentColor}
        />
        <NumericPad
          onPress={handleKeyPress}
          onDelete={handleDeletePress}
          onClear={() => setAmount('')}
          onSave={() => handleSaveRecord(false)}
          onAddAnother={() => handleSaveRecord(true)}
          accentColor={PAGE_ACCENT}
        />
      </View>

      {/* Popovers & Modals */}
      <CategoryPopover
        visible={popover.isVisible}
        subs={popover.subs}
        position={popover.position}
        selectedSub={selectedSubCategory}
        onSelect={(sub) => {
          setSelectedSubCategory(sub);
          popover.close();
        }}
        onClose={popover.close}
      />

      <CategoryManager
        visible={modalType === 'manage_cats'}
        type={type}
        onClose={() => setModalType('none')}
        onEdit={(cat) => {
          setEditingCategory(cat);
          setModalType('edit_cat');
        }}
      />

      <CategoryEditModal
        visible={modalType === 'edit_cat'}
        editingCategory={editingCategory}
        onSave={handleSaveCategory}
        onCancel={() => {
          setEditingCategory(null);
          setModalType('manage_cats');
        }}
        onChange={setEditingCategory}
      />

      <DateTimePickerModal
        visible={modalType === 'datetime'}
        tempDate={tempDate}
        onDateChange={setTempDate}
        onConfirm={() => {
          setDate(tempDate);
          setModalType('none');
        }}
        onCancel={() => setModalType('none')}
      />

      <LedgerPickerModal
        visible={modalType === 'ledger'}
        ledgers={ledgers}
        activeLedgerId={activeLedgerId}
        onSelect={(id) => {
          setActiveLedgerId(id);
          setModalType('none');
        }}
        onClose={() => setModalType('none')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSection: {
    flex: 1,
  },
  sectionDivider: {
    height: 4,
    marginHorizontal: 0,
    borderRadius: 2,
  },
  header: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerIcon: { width: 40, alignItems: 'center' },
  segmentControl: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
    width: 160,
  },
  segmentBtn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: { fontSize: 12, fontWeight: '600' },
  categoryScroll: { flex: 1 },
  footer: {
    backgroundColor: 'transparent',
  },
});
