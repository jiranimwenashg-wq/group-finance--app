"use client";

import {
  FileText,
  HeartHandshake,
  LayoutDashboard,
  CalendarClock,
  Settings,
  Users,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
  { href: "/dashboard/transactions", label: "Transactions", icon: <Banknote /> },
  { href: "/dashboard/members", label: "Members", icon: <Users /> },
  { href: "/dashboard/insurance", label: "Insurance", icon: <HeartHandshake /> },
  { href: "/dashboard/schedule", label: "Schedule", icon: <CalendarClock /> },
  { href: "/dashboard/constitution", label: "Constitution AI", icon: <FileText /> },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {links.map((link) => (
        <SidebarMenuItem key={link.href}>
          <Link href={link.href} legacyBehavior passHref>
            <SidebarMenuButton
              isActive={pathname === link.href}
              tooltip={{ children: link.label }}
            >
              {link.icon}
              <span>{link.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
      <SidebarMenuItem className="mt-auto">
         <Link href="/dashboard/settings" legacyBehavior passHref>
            <SidebarMenuButton
              isActive={pathname === '/dashboard/settings'}
              tooltip={{ children: "Settings" }}
            >
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
