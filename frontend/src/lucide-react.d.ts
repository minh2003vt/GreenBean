declare module "lucide-react" {
  import type { ComponentType, SVGProps } from "react";

  export type LucideIcon = ComponentType<
    SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number; fill?: string }
  >;

  // Minimal list of icons used in this project.
  // If you add more icons, add them here (or widen to `any`).
  export const Globe: LucideIcon;
  export const Sprout: LucideIcon;
  export const Volume2: LucideIcon;
  export const X: LucideIcon;
  export const Camera: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const Clock: LucideIcon;
  export const ImagePlus: LucideIcon;
  export const Gift: LucideIcon;
  export const Calendar: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const BookOpen: LucideIcon;
  export const Home: LucideIcon;
  export const User: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const BarChart3: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const Wallet: LucideIcon;
  export const Headphones: LucideIcon;
  export const ImageIcon: LucideIcon;
  export const Play: LucideIcon;
  export const Bug: LucideIcon;
  export const Droplets: LucideIcon;
  export const Leaf: LucideIcon;
  export const Rows3: LucideIcon;
  export const Sun: LucideIcon;
  export const Mic: LucideIcon;
  export const Search: LucideIcon;
  export const ShoppingBag: LucideIcon;
  export const ShoppingCart: LucideIcon;
  export const Plus: LucideIcon;
  export const Minus: LucideIcon;
  export const Trash2: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
}

