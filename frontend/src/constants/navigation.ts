import { BookOpen, Gift, Home, ShoppingBag, User } from "lucide-react";
import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", path: "/", icon: Home },
  { id: "history", label: "Videos", path: "/history", icon: BookOpen },
  { id: "market", label: "Market", path: "/market", icon: ShoppingBag },
  { id: "rewards", label: "Rewards", path: "/rewards", icon: Gift },
  { id: "profile", label: "Profile", path: "/profile", icon: User },
];

export const APP_NAME = "GreenBean";
export const APP_TAGLINE = "Better soil. Better crops. Better life.";
