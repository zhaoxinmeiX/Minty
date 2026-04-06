import * as LucideIcons from 'lucide-react-native';
import { LayoutGrid } from 'lucide-react-native';

export const IconMap: Record<string, any> = {
  LayoutGrid: LucideIcons.LayoutGrid,
  Backpack: LucideIcons.Backpack,
  Plane: LucideIcons.Plane,
  GraduationCap: LucideIcons.GraduationCap,
  FileCheck: LucideIcons.FileCheck,
  ShieldPlus: LucideIcons.ShieldPlus,
  Utensils: LucideIcons.Utensils,
  Car: LucideIcons.Car,
  ShoppingCart: LucideIcons.ShoppingCart,
  Home: LucideIcons.Home,
  BookOpen: LucideIcons.BookOpen,
  DollarSign: LucideIcons.DollarSign,
  TrendingUp: LucideIcons.TrendingUp,
  Gift: LucideIcons.Gift,
  Receipt: LucideIcons.Receipt,
  PlusCircle: LucideIcons.PlusCircle,
  Briefcase: LucideIcons.Briefcase,
  Coffee: LucideIcons.Coffee,
  ShoppingBag: LucideIcons.ShoppingBag,
  Heart: LucideIcons.Heart,
  Gamepad2: LucideIcons.Gamepad2,
  Brush: LucideIcons.Brush,
  Music: LucideIcons.Music,
  Bus: LucideIcons.Bus,
  Fuel: LucideIcons.Fuel,
  Apple: LucideIcons.Apple,
  Pizza: LucideIcons.Pizza,
  Moon: LucideIcons.Moon,
};

export const SELECTABLE_ICONS = Object.keys(IconMap);

export const getIconComponent = (name: string) => {
  return IconMap[name] || LayoutGrid;
};
