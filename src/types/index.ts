import { Category } from '@/src/db/schema';

export interface PopoverPosition {
  top: number;
  left: number;
  arrowLeft: number;
}

export interface EditingCategory {
  id?: number;
  name: string;
  icon: string;
  parent_id: number | null;
}

export type ModalType = 'none' | 'datetime' | 'ledger' | 'manage_cats' | 'edit_cat';

export interface CategoryPopoverProps {
  visible: boolean;
  subs: Category[];
  position: PopoverPosition;
  selectedSub: Category | null;
  onSelect: (sub: Category | null) => void;
  onClose: () => void;
}
