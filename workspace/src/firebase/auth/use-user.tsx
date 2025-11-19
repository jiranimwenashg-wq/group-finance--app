
'use client';

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { useAuth, setDocumentNonBlocking, useMemoFirebase } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const GROUP_ID = process.env.NEXT_PUBLIC_GROUP_ID!;

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

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'groups', GROUP_ID, 'users', user.uid);
  }, [firestore, user]);

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

        if (firebaseUser && userRef) {
            // Create user profile if it doesn't exist
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
  }, [auth, userRef]);

  return { user, isUserLoading, userError };
};
