'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import { MainNav } from '@/components/app/main-nav';
import { Header } from '@/components/app/header';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useIdleTimeout from '@/hooks/use-idle-timeout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // Add the idle timeout hook. It will automatically handle logout.
  useIdleTimeout(30);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Icons.logo className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <Icons.logo className="size-6 text-primary" />
            <span>FinanceFlow AI</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
