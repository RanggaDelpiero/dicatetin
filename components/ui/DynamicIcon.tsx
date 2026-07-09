// ============================================
// Pundi — Dynamic Phosphor Icon Resolver
// ============================================

"use client";

import React from 'react';
import {
  Money,
  Bank,
  DeviceMobile,
  ForkKnife,
  Car,
  ShoppingCart,
  GameController,
  Receipt,
  Heart,
  GraduationCap,
  Coffee,
  Basket,
  Repeat,
  HandHeart,
  DotsThree,
  Laptop,
  TrendUp,
  Gift,
  Wallet,
  CreditCard,
  House,
  Star,
  Fire,
  Trophy,
  MagnifyingGlass,
  CheckCircle,
  UsersThree,
  PiggyBank,
  Robot,
  Crown,
  Medal,
  Footprints,
  ArrowUp,
  ArrowDown,
  ArrowsLeftRight,
  Plus,
  Gear,
  ChartDonut,
  ListBullets,
  User,
  Lightning,
  Coin,
  CurrencyDollar,
  ShieldCheck,
  Sparkle,
  type IconProps,
} from '@phosphor-icons/react';

const iconMap: Record<string, React.ComponentType<IconProps>> = {
  Money,
  Bank,
  DeviceMobile,
  ForkKnife,
  Car,
  ShoppingCart,
  GameController,
  Receipt,
  Heart,
  GraduationCap,
  Coffee,
  Basket,
  Repeat,
  HandHeart,
  DotsThree,
  Laptop,
  TrendUp,
  Gift,
  Wallet,
  CreditCard,
  House,
  Star,
  Fire,
  Trophy,
  MagnifyingGlass,
  CheckCircle,
  UsersThree,
  PiggyBank,
  Robot,
  Crown,
  Medal,
  Footprints,
  ArrowUp,
  ArrowDown,
  ArrowsLeftRight,
  Plus,
  Gear,
  ChartDonut,
  ListBullets,
  User,
  Lightning,
  Coin,
  CurrencyDollar,
  ShieldCheck,
  Sparkle,
};

interface DynamicIconProps extends IconProps {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const Icon = iconMap[name];
  if (!Icon) {
    return <DotsThree {...props} />;
  }
  return <Icon {...props} />;
}
