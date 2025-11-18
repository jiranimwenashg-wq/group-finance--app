'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';

const useIdleTimeout = (timeoutMinutes: number) => {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const timeoutMilliseconds = timeoutMinutes * 60 * 1000;

  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const handleSignOut = useCallback(() => {
    if (auth.currentUser) {
        auth.signOut().then(() => {
            toast({
              title: 'Session Expired',
              description: 'You have been logged out due to inactivity.',
            });
            router.push('/login');
        });
    }
  }, [auth, router, toast]);

  const resetTimer = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    timeoutIdRef.current = setTimeout(handleSignOut, timeoutMilliseconds);
  }, [handleSignOut, timeoutMilliseconds]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const eventListener = () => {
      resetTimer();
    };

    // Set up the initial timer and event listeners
    resetTimer();
    events.forEach(event => window.addEventListener(event, eventListener));

    // Cleanup function
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      events.forEach(event => window.removeEventListener(event, eventListener));
    };
  }, [resetTimer]);

  return null; // This hook does not render anything
};

export default useIdleTimeout;
