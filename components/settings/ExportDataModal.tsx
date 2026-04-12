import { useSQLiteContext } from 'expo-sqlite';
import { CalendarDays, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { DateTimePickerModal } from '@/components/add/DateTimePickerModal';
import { LedgerPickerAnchorFrame, LedgerPickerModal } from '@/components/add/LedgerPickerModal';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useLedgers } from '@/src/hooks/useLedgers';
import { useStore } from '@/src/store';
import { exportLedgerToExcel } from '@/src/utils/excel';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ExportDataModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({ visible, onClose }) => {
  const db = useSQLiteContext();
  const theme = Colors.light;
  const storeActiveLedgerId = useStore((state) => state.activeLedgerId);
  const { ledgers } = useLedgers();

  const [selectedLedgerId, setSelectedLedgerId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'end'>('start');
  const [tempDate, setTempDate] = useState(new Date());

  const [isLedgerPickerVisible, setLedgerPickerVisible] = useState(false);
  const [ledgerAnchorFrame, setLedgerAnchorFrame] = useState<LedgerPickerAnchorFrame | null>(null);
  const ledgerBtnRef = React.useRef<View>(null);

  // Animation
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      if (selectedLedgerId === null && storeActiveLedgerId) {
        setSelectedLedgerId(storeActiveLedgerId);
      }
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, storeActiveLedgerId]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const activeLedger = ledgers.find(l => l.id === selectedLedgerId) || ledgers[0];

  const handleExport = () => {
    if (activeLedger) {
      const startStr = startDate ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')} 00:00:00` : undefined;
      const endStr = endDate ? `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} 23:59:59` : undefined;
      
      exportLedgerToExcel(db, activeLedger.id, activeLedger.name, startStr, endStr);
      onClose();
    }
  };

  const openDatePicker = (target: 'start' | 'end') => {
    setDatePickerTarget(target);
    const initialDate = target === 'start' ? startDate : endDate;
    setTempDate(initialDate || new Date());
    setDatePickerVisible(true);
  };

  const handleDateConfirm = () => {
    if (datePickerTarget === 'start') {
      setStartDate(tempDate);
    } else {
      setEndDate(tempDate);
    }
    setDatePickerVisible(false);
  };

  const openLedgerPicker = () => {
    if (ledgerBtnRef.current) {
      ledgerBtnRef.current.measureInWindow((x, y, width, height) => {
        setLedgerAnchorFrame({ x, y, width, height });
        setLedgerPickerVisible(true);
      });
    } else {
      setLedgerAnchorFrame(null);
      setLedgerPickerVisible(true);
    }
  };

  const formatDateLabel = (d: Date | null, fallback: string) => {
    if (!d) return fallback;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.bottomModal, { backgroundColor: theme.card }, animatedContentStyle]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>导出数据</Text>
            <Text style={[styles.headerSubtitle, { color: theme.homeMuted }]}>导出当前账本的数据为 Excel 报表</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.homeMuted }]}>选择账本</Text>
            <Pressable ref={ledgerBtnRef} style={[styles.selectorBtn, { backgroundColor: theme.homeSurface }]} onPress={openLedgerPicker}>
              <Text style={[styles.selectorBtnText, { color: theme.text }]}>{activeLedger?.name || '默认账本'}</Text>
              <ChevronRight size={18} color={theme.homeMuted} style={styles.selectorBtnIcon} />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.homeMuted }]}>时间范围</Text>
            <View style={styles.dateRangeContainer}>
              <Pressable style={[styles.dateBtn, { backgroundColor: theme.homeSurface }]} onPress={() => openDatePicker('start')}>
                <CalendarDays size={18} color={theme.homeOlive} />
                <Text style={[styles.dateBtnText, { color: startDate ? theme.text : theme.homeMuted }]}>
                  {formatDateLabel(startDate, '开始时间')}
                </Text>
              </Pressable>
              <Text style={[styles.dateRangeSeparator, { color: theme.homeMuted }]}>-</Text>
              <Pressable style={[styles.dateBtn, { backgroundColor: theme.homeSurface }]} onPress={() => openDatePicker('end')}>
                <CalendarDays size={18} color={theme.homeOlive} />
                <Text style={[styles.dateBtnText, { color: endDate ? theme.text : theme.homeMuted }]}>
                  {formatDateLabel(endDate, '结束时间')}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable style={[styles.actionBtn, styles.cancelBtn]} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: theme.text }]}>取消</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.exportBtn, { backgroundColor: theme.homeOlive }]} onPress={handleExport}>
              <Text style={styles.exportBtnText}>导出</Text>
            </Pressable>
          </View>
        </Animated.View>

        <DateTimePickerModal
          visible={isDatePickerVisible}
          tempDate={tempDate}
          onDateChange={setTempDate}
          onConfirm={handleDateConfirm}
          onCancel={() => setDatePickerVisible(false)}
        />

        <LedgerPickerModal
          visible={isLedgerPickerVisible}
          ledgers={ledgers}
          activeLedgerId={selectedLedgerId || storeActiveLedgerId}
          anchorFrame={ledgerAnchorFrame}
          onSelect={(ledgerId) => {
            setSelectedLedgerId(ledgerId);
            setLedgerPickerVisible(false);
          }}
          onClose={() => setLedgerPickerVisible(false)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  bottomModal: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: Dimensions.get('window').height > 800 ? 50 : 32,
  },
  header: {
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: Typography.size.titleLg,
    fontWeight: '800',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: Typography.size.caption,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 54,
    borderRadius: 18,
  },
  selectorBtnText: {
    fontSize: Typography.size.body,
    fontWeight: '600',
  },
  selectorBtnIcon: {
    transform: [{ rotate: '90deg' }],
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 18,
  },
  dateBtnText: {
    fontSize: Typography.size.body,
    fontWeight: '600',
  },
  dateRangeSeparator: {
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  cancelBtnText: {
    fontSize: Typography.size.body,
    fontWeight: '600',
  },
  exportBtn: {
    shadowColor: '#A9B66D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  exportBtnText: {
    color: '#FFF',
    fontSize: Typography.size.body,
    fontWeight: '800',
  },
});
