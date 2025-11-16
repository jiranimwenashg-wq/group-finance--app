"use client";

import {
  FileText,
  HeartHandshake,
  LayoutDashboard,
  CalendarClock,
  Settings,
  Users,
  Banknote,
  FileCheck,
  Calendar,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

const financialLinks = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
  { href: "/dashboard/transactions", label: "Transactions", icon: <Banknote /> },
  { href: "/dashboard/reports", label: "Reports", icon: <FileCheck /> },
];

const membershipLinks = [
  { href: "/dashboard/members", label: "Members", icon: <Users /> },
  { href: "/dashboard/insurance", label: "Insurance", icon: <HeartHandshake /> },
  { href: "/dashboard/schedule", label: "Schedule", icon: <CalendarClock /> },
];

const toolsLinks = [
  { href: "/dashboard/calendar", label: "Calendar", icon: <Calendar /> },
  { href: "/dashboard/constitution", label: "Constitution AI", icon: <FileText /> },
  { href: "/dashboard/help", label: "Help", icon: <HelpCircle /> },
];

export function MainNav() {
  const pathname = usePathname();

  const renderLink = (link: { href: string; label: string; icon: JSX.Element }) => (
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
  );

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>FINANCE</SidebarGroupLabel>
        <SidebarMenu>{financialLinks.map(renderLink)}</SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>MEMBERSHIP</SidebarGroupLabel>
        <SidebarMenu>{membershipLinks.map(renderLink)}</SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>TOOLS</SidebarGroupLabel>
        <SidebarMenu>{toolsLinks.map(renderLink)}</SidebarMenu>
      </SidebarGroup>
      
      <SidebarMenu className="mt-auto">
        <SidebarMenuItem>
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
    </>
  );
}
