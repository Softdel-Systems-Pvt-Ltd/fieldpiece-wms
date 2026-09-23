import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";

// Mirrors the route table in Section 6.2. Keep in sync with app/router.tsx.

export interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  roles: readonly Role[] | "all";
  end?: boolean;
}

export const navItems: NavItem[] = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard, roles: "all", end: true },
  {
    to: "/registrations",
    labelKey: "nav.registrations",
    icon: ShieldCheck,
    roles: ["technician", "distributor", "admin"],
  },
  { to: "/claims", labelKey: "nav.claims", icon: ClipboardList, roles: "all" },
  { to: "/rma", labelKey: "nav.rma", icon: Truck, roles: ["claims_agent", "service_center", "admin"] },
  {
    to: "/customers",
    labelKey: "nav.customers",
    icon: Users,
    roles: ["distributor", "claims_agent", "admin"],
  },
  { to: "/products", labelKey: "nav.products", icon: Package, roles: "all" },
  { to: "/reports", labelKey: "nav.reports", icon: BarChart3, roles: ["claims_agent", "admin"] },
  { to: "/admin/users", labelKey: "nav.admin", icon: Settings, roles: ["admin"] },
];

export const publicNavItems: NavItem[] = [
  { to: "/check", labelKey: "nav.checkWarranty", icon: Boxes, roles: "all" },
];

export function navItemsFor(role: Role | undefined): NavItem[] {
  if (!role) return [];
  return navItems.filter((item) => item.roles === "all" || item.roles.includes(role));
}
