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
          <SidebarMenuButton
            asChild
            isActive={pathname === link.href}
            tooltip={{ children: link.label }}
          >
            <Link href={link.href}>
              {link.icon}
              <span>{link.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
      <SidebarMenuItem className="mt-auto">
         <SidebarMenuButton
            asChild
            isActive={pathname === '/dashboard/settings'}
            tooltip={{ children: "Settings" }}
          >
            <Link href="/dashboard/settings">
              <Settings />
              <span>Settings</span>
            </Link>
          </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
