import type { IconType } from "react-icons";
import { LuChartNoAxesColumn, LuRadioTower, LuUsers } from "react-icons/lu";

export interface NavItem {
  label: string;
  href: string;
  icon: IconType;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Stats",
    href: "/admin/stats",
    icon: LuChartNoAxesColumn,
    description: "System overview",
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: LuUsers,
    description: "User management",
  },
  {
    label: "Feed",
    href: "/admin/feed",
    icon: LuRadioTower,
    description: "Live event stream",
  },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
