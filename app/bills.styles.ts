import { StyleSheet } from 'react-native';
import { Typography } from '@/constants/Typography';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: { padding: 8 },
  headerTitle: { fontSize: Typography.size.title, fontWeight: '700', color: '#111827' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerSearchBar: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    flex: 1,
  },
  headerSearchCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  toolbarChip: {
    minHeight: 38,
    borderRadius: 20,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarChipActive: {
    backgroundColor: '#FFF5E6',
  },
  toolbarChipRight: {
    marginLeft: 'auto',
  },
  toolbarChipText: { fontSize: Typography.size.body, color: '#374151', fontWeight: '500' },
  toolbarChipActiveText: { color: '#F59E0B' },

  listContent: { paddingBottom: 40 },
  monthHeader: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 8,
  },
  monthTitle: { color: '#374151', fontSize: Typography.size.label, fontWeight: '700' },
  monthTotal: { fontSize: Typography.size.label, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 120, color: '#9CA3AF', fontSize: Typography.size.body },

  searchInput: { flex: 1, color: '#1F2937', fontSize: Typography.size.body },

  appliedHint: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  appliedHintText: { color: '#FFF', fontSize: Typography.size.caption, fontWeight: '600' },
});
