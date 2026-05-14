import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface IconGroup {
  label: string;
  icons: string[];
}

// Icons organized by category for the grouped picker UI
export const ICON_GROUPS: IconGroup[] = [
  {
    label: '餐饮',
    icons: ['silverware-fork-knife', 'food-croissant', 'food-drumstick', 'glass-wine', 'cup-water', 'food-apple-outline', 'pizza', 'coffee-outline'],
  },
  {
    label: '交通',
    icons: ['bus', 'train', 'car', 'airplane', 'ferry', 'subway', 'scooter', 'motorbike', 'gas-station-outline', 'parking'],
  },
  {
    label: '购物',
    icons: ['cart-outline', 'shopping-outline', 'bag-personal-outline', 'tshirt-crew-outline', 'shoe-sneaker', 'hanger', 'lipstick', 'bottle-tonic-outline'],
  },
  {
    label: '居家',
    icons: ['home-outline', 'bed-outline', 'lightning-bolt-outline', 'water-outline', 'fire', 'wifi', 'cellphone', 'television-classic'],
  },
  {
    label: '休闲',
    icons: ['gamepad-variant-outline', 'music-note', 'movie-open-outline', 'basketball', 'dumbbell', 'run', 'bicycle', 'swim', 'tent', 'beach'],
  },
  {
    label: '工作',
    icons: ['book-open-outline', 'school-outline', 'briefcase-outline', 'office-building', 'laptop', 'monitor', 'palette', 'calculator'],
  },
  {
    label: '理财',
    icons: ['currency-usd', 'wallet-outline', 'bank-outline', 'cash-multiple', 'piggy-bank-outline', 'chart-line', 'receipt-outline'],
  },
  {
    label: '自然',
    icons: ['paw', 'cat', 'dog', 'tree-outline', 'flower-outline', 'weather-partly-cloudy', 'snowflake'],
  },
  {
    label: '其他',
    icons: ['gift-outline', 'baby-carriage', 'teddy-bear', 'hospital-building', 'pill', 'scissors-cutting', 'heart-outline', 'camera-outline', 'ticket-outline', 'plus-circle-outline', 'view-grid-outline', 'shield-check-outline', 'file-document-outline', 'wrench-outline', 'package-variant'],
  },
];

// Flat list for backward compatibility
export const SELECTABLE_ICONS: string[] = ICON_GROUPS.flatMap((g) => g.icons);

export const getIconComponent = (name: string) => {
  return function MaterialIconWrapper(props: any) {
    return React.createElement(MaterialCommunityIcons, { name: (name || 'help-circle-outline') as any, ...props });
  };
};
