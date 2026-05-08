import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Hexagon } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, AppState, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AmountInput } from '@/components/add/AmountInput';
import { CategoryEditModal } from '@/components/add/CategoryEditModal';
import { CATEGORY_GRID_COLUMN_COUNT, CategoryGrid } from '@/components/add/CategoryGrid';
import { CategoryManager } from '@/components/add/CategoryManager';
import { CategoryPopover } from '@/components/add/CategoryPopover';
import { DateTimePickerModal } from '@/components/add/DateTimePickerModal';
import { LedgerPickerAnchorFrame, LedgerPickerModal } from '@/components/add/LedgerPickerModal';
import { NoteSuggestionList } from '@/components/add/NoteSuggestionList';
import { NumericPad } from '@/components/add/NumericPad';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { RecordDetailSheet } from '@/components/record/RecordDetailSheet';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { addRecord, getRecordById, getRecordNoteSuggestionsAsync, RecordNoteSuggestion, updateRecord } from '@/src/db/operations';
import { Category } from '@/src/db/schema';
import { useCategories } from '@/src/hooks/useCategories';
import { useCategoryPopover } from '@/src/hooks/useCategoryPopover';
import { useLedgers } from '@/src/hooks/useLedgers';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
import { useStore } from '@/src/store';
import { EditingCategory, ModalType } from '@/src/types';
import { parseISODate } from '@/src/utils/date';

const TAB_ROUTES = {
  index: '/',
  calendar: '/calendar',
  stats: '/stats',
  settings: '/settings',
} as const;

type CategorySelectionTarget = {
  type: 'expense' | 'income';
  categoryId: number;
  subCategoryId: number | null;
};

export default function AddScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = Colors.light;
  const { height: screenHeight } = useWindowDimensions();
  const insets = useStableSafeAreaInsets();
  const activeLedgerId = useStore((state) => state.activeLedgerId);
  const setActiveLedgerId = useStore((state) => state.setActiveLedgerId);
  const selectedDateContext = useStore((state) => state.selectedDateContext);
  const setSelectedDateContext = useStore((state) => state.setSelectedDateContext);
  const lastTab = useStore((state) => state.lastTab);
  const bumpDataVersion = useStore((state) => state.bumpDataVersion);
  const lastRecordCategorySelections = useStore((state) => state.lastRecordCategorySelections);
  const setLastRecordCategorySelection = useStore((state) => state.setLastRecordCategorySelection);
  const { id, mode, date: paramDate } = useLocalSearchParams<{ id: string; mode: string; date?: string }>();
  const isEdit = mode === 'edit';
  const isCopy = mode === 'copy';
  const isCompactLayout = screenHeight <= 860;

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [noteSuggestions, setNoteSuggestions] = useState<RecordNoteSuggestion[]>([]);
  const [isNoteSuggestionSuppressed, setIsNoteSuggestionSuppressed] = useState(false);
  const [hasNoteInputChanged, setHasNoteInputChanged] = useState(false);
  const [date, setDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<Category | null>(null);
  const [pendingCategorySelection, setPendingCategorySelection] = useState<CategorySelectionTarget | null>(null);
  const [modalType, setModalType] = useState<ModalType>('none');
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [tempDate, setTempDate] = useState(new Date());
  const [ledgerAnchorFrame, setLedgerAnchorFrame] = useState<LedgerPickerAnchorFrame | null>(null);
  const [isNoteInputFocused, setIsNoteInputFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const ledgerButtonRef = React.useRef<View>(null);
  const defaultCategoryKeyRef = React.useRef('');
  const noteSuggestionRequestIdRef = React.useRef(0);
  const hasInitializedCategoryRef = React.useRef<string | null>(null);

  const accentColor = type === 'expense' ? theme.homeAccent : theme.income;

  useFocusEffect(
    useCallback(() => {
      if (!isEdit && !isCopy) {
        defaultCategoryKeyRef.current = '';
        setAmount('');
        setNote('');
        setSelectedCategory(null);
        setSelectedSubCategory(null);

        const targetDateStr = paramDate || selectedDateContext;

        if (targetDateStr) {
          const newDate = new Date();
          const [y, m, d] = targetDateStr.split('-').map(Number);
          newDate.setFullYear(y, m - 1, d);
          setDate(newDate);
        } else {
          setDate(new Date());
        }
        
        hasInitializedCategoryRef.current = null;
      }
    }, [isEdit, isCopy, paramDate, selectedDateContext]),
  );

  const { categories, add: addCat, update: updateCat, getSubs } = useCategories(type);
  const popover = useCategoryPopover();
  const { ledgers } = useLedgers();

  const activeLedger = useMemo(() => ledgers.find((ledger) => ledger.id === activeLedgerId), [ledgers, activeLedgerId]);

  React.useEffect(() => {
    if (ledgers.length > 0 && !activeLedger) {
      setActiveLedgerId(ledgers[0].id);
    }
  }, [ledgers, activeLedger, setActiveLedgerId]);

  React.useEffect(() => {
    if (isEdit || isCopy || categories.length === 0 || categories[0]?.type !== type) {
      return;
    }

    const defaultCategoryKey = `${activeLedgerId}-${type}`;
    const selection = lastRecordCategorySelections[defaultCategoryKey];
    const defaultCategoryStateKey = selection
      ? `${defaultCategoryKey}-${selection.categoryId}-${selection.subCategoryId ?? 'none'}`
      : `${defaultCategoryKey}-none`;

    if (defaultCategoryKeyRef.current === defaultCategoryStateKey) {
      return;
    }

    defaultCategoryKeyRef.current = defaultCategoryStateKey;

    if (selection) {
      setPendingCategorySelection({
        type,
        categoryId: selection.categoryId,
        subCategoryId: selection.subCategoryId,
      });
      return;
    }

    setSelectedCategory(null);
    setSelectedSubCategory(null);
  }, [activeLedgerId, categories.length, isCopy, isEdit, lastRecordCategorySelections, type]);

  React.useEffect(() => {
    if (!pendingCategorySelection) {
      return;
    }

    if (pendingCategorySelection.type !== type) {
      setType(pendingCategorySelection.type);
      return;
    }

    if (categories.length === 0 || categories[0]?.type !== pendingCategorySelection.type) {
      return;
    }

    const foundCat = categories.find((category) => category.id === pendingCategorySelection.categoryId);

    if (!foundCat) {
      setSelectedCategory(null);
      setSelectedSubCategory(null);
      setPendingCategorySelection(null);
      return;
    }

    setSelectedCategory(foundCat);
    const subs = getSubs(foundCat.id);
    const foundSub = pendingCategorySelection.subCategoryId
      ? subs.find((sub) => sub.id === pendingCategorySelection.subCategoryId) ?? null
      : null;
    setSelectedSubCategory(foundSub);
    setPendingCategorySelection(null);
  }, [categories, getSubs, pendingCategorySelection, type]);

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

  React.useEffect(() => {
    const keyword = note.trim();

    if (!isNoteInputFocused || !hasNoteInputChanged || isNoteSuggestionSuppressed || keyword.length === 0) {
      noteSuggestionRequestIdRef.current += 1;
      setNoteSuggestions([]);
      return;
    }

    const requestId = ++noteSuggestionRequestIdRef.current;

    void getRecordNoteSuggestionsAsync(db, activeLedgerId, type, keyword).then((suggestions) => {
      if (requestId !== noteSuggestionRequestIdRef.current) {
        return;
      }

      setNoteSuggestions(suggestions);
    });
  }, [activeLedgerId, db, hasNoteInputChanged, isNoteInputFocused, isNoteSuggestionSuppressed, note, type]);

  React.useEffect(() => {
    if (id && categories.length > 0 && hasInitializedCategoryRef.current !== id) {
      const record = getRecordById(db, parseInt(id));
      if (record && record.type === type) {
        const foundCat = categories.find((category) => category.id === record.category_id);
        if (foundCat) {
          setSelectedCategory(foundCat);
          const subs = getSubs(foundCat.id);
          const foundSub = subs.find((sub) => sub.id === record.sub_category_id);
          if (foundSub) setSelectedSubCategory(foundSub);
        }
      }
      hasInitializedCategoryRef.current = id;
    }
  }, [id, categories, type, db, getSubs]);

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' || !isNoteInputFocused) {
        return;
      }

      Keyboard.dismiss();
      setIsNoteInputFocused(false);
      setKeyboardHeight(0);
      setNoteSuggestions([]);
      setHasNoteInputChanged(false);
    });

    return () => {
      subscription.remove();
    };
  }, [isNoteInputFocused]);

  const handleSelectMainCategory = (category: Category) => {
    setPendingCategorySelection(null);

    if (selectedCategory?.id === category.id) {
      const subs = getSubs(category.id);
      if (subs.length > 0) popover.open(category, subs);
    } else {
      setSelectedCategory(category);
      setSelectedSubCategory(null);
      const subs = getSubs(category.id);
      if (subs.length > 0) popover.open(category, subs);
    }
  };

  const handleNoteChange = (text: string) => {
    setNote(text);
    setHasNoteInputChanged(true);
    setIsNoteSuggestionSuppressed(false);
  };

  const handleSelectNoteSuggestion = (suggestion: RecordNoteSuggestion) => {
    setNote(suggestion.note?.trim() || '');
    setNoteSuggestions([]);
    setIsNoteSuggestionSuppressed(true);
    setHasNoteInputChanged(false);

    setPendingCategorySelection({
      type: suggestion.type,
      categoryId: suggestion.category_id,
      subCategoryId: suggestion.sub_category_id,
    });
  };

  const formatLocalDatabaseDate = (targetDate: Date) => {
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const hours = String(targetDate.getHours()).padStart(2, '0');
    const minutes = String(targetDate.getMinutes()).padStart(2, '0');
    const seconds = String(targetDate.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const evaluateExpression = (expr: string): string => {
    try {
      const cleanExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
      if (/[^0-9.+\-*/()]/.test(cleanExpr)) return expr;

      const result = new Function(`return (${cleanExpr})`)();
      if (typeof result !== 'number' || Number.isNaN(result) || !Number.isFinite(result)) return expr;
      return Number(result.toFixed(2)).toString();
    } catch {
      return expr;
    }
  };

  const handleSaveRecord = (stayOnPage = false) => {
    const evaluatedAmount = evaluateExpression(amount);
    const numericAmount = parseFloat(evaluatedAmount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
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
      ledger_id: activeLedgerId,
      created_at: formattedDate,
    };

    if (isEdit && id) {
      updateRecord(db, parseInt(id), recordData);
    } else {
      addRecord(db, recordData);
    }

    setLastRecordCategorySelection(activeLedgerId, type, {
      categoryId: selectedCategory.id,
      subCategoryId: selectedSubCategory ? selectedSubCategory.id : null,
    });
    bumpDataVersion();

    setAmount('');
    setNote('');
    setNoteSuggestions([]);
    setIsNoteSuggestionSuppressed(false);
    setHasNoteInputChanged(false);

    if (!stayOnPage) {
      setSelectedCategory(null);
      setSelectedSubCategory(null);
      closeAddScreen();
    }
  };

  const handleKeyPress = (value: string) => {
    if (value === '.') {
      if (amount.includes('.') && !/[+\-*/(]/.test(amount.slice(-1))) {
        const lastPart = amount.split(/[+\-×÷()]/).pop() || '';
        if (lastPart.includes('.')) return;
      }
      if (amount === '') setAmount('0.');
      else setAmount((prev) => prev + '.');
    } else if (/[0-9]/.test(value)) {
      if (amount === '0') setAmount(value);
      else setAmount((prev) => prev + value);
    } else {
      setAmount((prev) => prev + value);
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

  const result = useMemo(() => evaluateExpression(amount), [amount]);
  const categoryRowCount = Math.ceil(categories.length / CATEGORY_GRID_COLUMN_COUNT);
  const shouldScrollCategories = isCompactLayout ? categoryRowCount > 3 : categoryRowCount > 4;
  const fallbackRoute = TAB_ROUTES[lastTab as keyof typeof TAB_ROUTES] ?? TAB_ROUTES.index;
  const showNoteSuggestions = isNoteInputFocused && noteSuggestions.length > 0;
  const noteSuggestionBottomOffset = (keyboardHeight > 0 ? keyboardHeight : insets.bottom) + 60;

  const closeAddScreen = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackRoute);
  };

  const openLedgerPicker = () => {
    if (!ledgerButtonRef.current) {
      setLedgerAnchorFrame(null);
      setModalType('ledger');
      return;
    }

    ledgerButtonRef.current.measureInWindow((x, y, width, height) => {
      setLedgerAnchorFrame({ x, y, width, height });
      setModalType('ledger');
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.homeBackground, paddingTop: insets.top + 8 }]}>
      <ScreenBackground />
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <View style={[styles.topSection, isCompactLayout && styles.topSectionCompact]}>
        <View style={[styles.header, isCompactLayout && styles.headerCompact]}>
          <Pressable
            onPress={closeAddScreen}
            style={[styles.headerIcon, isCompactLayout && styles.headerIconCompact, { backgroundColor: theme.homeSurface }]}
          >
            <ChevronLeft size={22} color={theme.homeOlive} />
          </Pressable>

          <View style={[styles.segmentControl, isCompactLayout && styles.segmentControlCompact, { backgroundColor: theme.homeSurface }]}>
            <Pressable
              onPress={() => setType('expense')}
              style={[styles.segmentBtn, isCompactLayout && styles.segmentBtnCompact, type === 'expense' && { backgroundColor: theme.homeAccent }]}
            >
              <Text style={[styles.segmentText, { color: type === 'expense' ? '#FFF' : theme.homeMuted }]}>支出</Text>
            </Pressable>
            <Pressable
              onPress={() => setType('income')}
              style={[styles.segmentBtn, isCompactLayout && styles.segmentBtnCompact, type === 'income' && { backgroundColor: theme.income }]}
            >
              <Text style={[styles.segmentText, { color: type === 'income' ? '#FFF' : theme.homeMuted }]}>收入</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => setModalType('manage_cats')} style={[styles.headerIcon, isCompactLayout && styles.headerIconCompact, { backgroundColor: theme.homeSurface }]}>
            <Hexagon size={20} color={theme.homeOlive} />
          </Pressable>
        </View>

      </View>

      <View style={[styles.contentSheet, isCompactLayout && styles.contentSheetCompact, { backgroundColor: theme.homeSurface }]}>
        <View
          style={[
            styles.categorySection,
            isCompactLayout && styles.categorySectionCompact,
            shouldScrollCategories && styles.categorySectionScrollable,
            shouldScrollCategories && isCompactLayout && styles.categorySectionScrollableCompact,
          ]}
        >
          {shouldScrollCategories ? (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.categoryScroll}>
              <CategoryGrid
                categories={categories}
                selectedCategory={selectedCategory}
                selectedSubCategory={selectedSubCategory}
                onSelectMain={handleSelectMainCategory}
                onManage={() => setModalType('manage_cats')}
                categoryRefs={popover.categoryRefs}
                accentColor={accentColor}
                compact={isCompactLayout}
              />
            </ScrollView>
          ) : (
            <CategoryGrid
              categories={categories}
              selectedCategory={selectedCategory}
              selectedSubCategory={selectedSubCategory}
              onSelectMain={handleSelectMainCategory}
              onManage={() => setModalType('manage_cats')}
              categoryRefs={popover.categoryRefs}
              accentColor={accentColor}
              compact={isCompactLayout}
            />
          )}
        </View>

        <View
          style={[
            styles.footerAvoiding,
            isNoteInputFocused && keyboardHeight > 0 && { marginBottom: keyboardHeight },
          ]}
        >
          <View style={[styles.footer, isCompactLayout && styles.footerCompact]}>
            <AmountInput
              amount={amount}
              result={result}
              note={note}
              onNoteChange={handleNoteChange}
              onAmountChange={setAmount}
              onDatePress={() => {
                setTempDate(new Date(date));
                setModalType('datetime');
              }}
              onLedgerPress={openLedgerPicker}
              dateText={dateText}
              ledgerName={activeLedger?.name || '默认账本'}
              accentColor={accentColor}
              ledgerTriggerRef={ledgerButtonRef}
              compact={isCompactLayout}
              onNoteFocus={() => {
                setIsNoteInputFocused(true);
                setIsNoteSuggestionSuppressed(false);
                setHasNoteInputChanged(false);
              }}
              onNoteBlur={() => {
                setTimeout(() => {
                  setIsNoteInputFocused(false);
                  setHasNoteInputChanged(false);
                }, 120);
              }}
              onAmountDisplayPress={() => {
                Keyboard.dismiss();
                setIsNoteInputFocused(false);
                setHasNoteInputChanged(false);
              }}
            />
            {!isNoteInputFocused && (
              <NumericPad
                onPress={handleKeyPress}
                onDelete={handleDeletePress}
                onClear={() => setAmount('')}
                onSave={() => handleSaveRecord(false)}
                onAddAnother={() => handleSaveRecord(true)}
                accentColor={accentColor}
                compact={isCompactLayout}
              />
            )}
          </View>
        </View>
      </View>

      {showNoteSuggestions && (
        <View style={[styles.noteSuggestionOverlay, { bottom: noteSuggestionBottomOffset }]}>
          <NoteSuggestionList
            suggestions={noteSuggestions}
            keyword={note.trim()}
            accentColor={accentColor}
            compact={isCompactLayout}
            onSelect={handleSelectNoteSuggestion}
          />
        </View>
      )}

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
        onEdit={(category) => {
          setEditingCategory(category);
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
        anchorFrame={ledgerAnchorFrame}
        onSelect={(ledgerId) => {
          setActiveLedgerId(ledgerId);
          setModalType('none');
        }}
        onClose={() => setModalType('none')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
  },
  topSectionCompact: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 8,
  },
  header: {
    height: 54,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCompact: {
    height: 50,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconCompact: {
    width: 44,
    height: 44,
    borderRadius: 16,
  },
  segmentControl: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 4,
    width: 184,
  },
  segmentControlCompact: {
    width: 170,
    borderRadius: 16,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentBtnCompact: {
    height: 34,
    borderRadius: 12,
  },
  segmentText: {
    fontSize: Typography.size.body,
    fontWeight: '800',
  },
  contentSheet: {
    flex: 1,
    marginTop: 8,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    overflow: 'hidden',
    shadowColor: '#A9B66D',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 8,
  },
  contentSheetCompact: {
    marginTop: 6,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  categorySection: {
    paddingTop: 10,
  },
  categorySectionCompact: {
    paddingTop: 8,
  },
  categorySectionScrollable: {
    maxHeight: 308,
  },
  categorySectionScrollableCompact: {
    maxHeight: 260,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  footerAvoiding: {
    marginTop: 'auto',
  },
  footer: {
    paddingTop: 6,
    paddingBottom: 0,
  },
  footerCompact: {
    paddingTop: 4,
  },
  noteSuggestionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
    elevation: 30,
  },
});
