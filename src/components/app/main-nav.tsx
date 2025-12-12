
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
  Landmark,
  PiggyBank,
  HandCoins
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

const navIconClasses = "text-primary";

const financialLinks = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className={navIconClasses} /> },
  { href: "/dashboard/transactions", label: "Transactions", icon: <Banknote className={navIconClasses} /> },
  { href: "/dashboard/payouts", label: "Payouts", icon: <HandCoins className={navIconClasses} /> },
  { href: "/dashboard/reports", label: "Reports", icon: <FileCheck className={navIconClasses} /> },
  { href: "/dashboard/loans", label: "Loans", icon: <Landmark className={navIconClasses} /> },
];

const membershipLinks = [
  { href: "/dashboard/members", label: "Members", icon: <Users className={navIconClasses} /> },
  { href: "/dashboard/insurance", label: "Insurance", icon: <HeartHandshake className={navIconClasses} /> },
  { href: "/dashboard/schedule", label: "Schedule", icon: <CalendarClock className={navIconClasses} /> },
];

const toolsLinks = [
  { href: "/dashboard/calendar", label: "Calendar", icon: <Calendar className={navIconClasses} /> },
  { href: "/dashboard/constitution", label: "Constitution AI", icon: <FileText className={navIconClasses} /> },
  { href: "/dashboard/help", label: "Help", icon: <HelpCircle className={navIconClasses} /> },
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
              <Settings className={navIconClasses} />
              <span>Settings</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
