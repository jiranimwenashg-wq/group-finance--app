
'use client';

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { useAuth, setDocumentNonBlocking } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { GROUP_ID } from '@/lib/data';

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const useUser = (): UserHookResult => {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) {
      setIsUserLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsUserLoading(false);
        setUserError(null);

        if (firebaseUser && firestore) {
            // Create user profile if it doesn't exist
            const userRef = doc(firestore, 'groups', GROUP_ID, 'users', firebaseUser.uid);
            setDocumentNonBlocking(userRef, {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                groupId: GROUP_ID,
            }, { merge: true });
        }
      },
      (error) => {
        setUser(null);
        setIsUserLoading(false);
        setUserError(error);
      }
    );

    return () => unsubscribe();
  }, [auth, firestore]);

  return { user, isUserLoading, userError };
};
