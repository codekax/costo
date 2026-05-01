import {
  Folder,
  Package,
  Hammer,
  Plug,
  Receipt,
  Utensils,
  Car,
  Wrench,
  Briefcase,
  Coffee,
  Home,
  Heart,
  Plane,
  ShoppingCart,
  Wifi,
  Zap,
  Droplet,
  Phone,
  type LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  folder: Folder,
  package: Package,
  hammer: Hammer,
  plug: Plug,
  receipt: Receipt,
  utensils: Utensils,
  car: Car,
  wrench: Wrench,
  briefcase: Briefcase,
  coffee: Coffee,
  home: Home,
  heart: Heart,
  plane: Plane,
  cart: ShoppingCart,
  wifi: Wifi,
  zap: Zap,
  droplet: Droplet,
  phone: Phone,
};

export const CATEGORY_ICON_LIST = Object.keys(CATEGORY_ICONS);

export const CATEGORY_COLORS = [
  '#f97316',
  '#3b82f6',
  '#22c55e',
  '#a855f7',
  '#ef4444',
  '#14b8a6',
  '#eab308',
  '#6b7280',
  '#ec4899',
  '#0ea5e9',
  '#84cc16',
  '#f59e0b',
];

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? Folder;
}
