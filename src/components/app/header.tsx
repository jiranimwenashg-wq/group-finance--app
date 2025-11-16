'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/app/user-nav';
import { ThemeToggle } from './theme-toggle';
import { Button } from '../ui/button';
import { useAuth } from '@/firebase';

export function Header() {
  const auth = useAuth();
  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="sm:hidden" />
      <div className="flex-1" />
      <ThemeToggle />
      <Button variant="ghost" onClick={handleLogout} className="hidden sm:inline-flex">
        Logout
      </Button>
      <UserNav />
    </header>
  );
}
