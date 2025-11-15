'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance).catch(error => {
    // Although not explicitly asked for, it's good practice to handle potential errors.
    console.error('Anonymous sign-in error:', error);
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(
  authInstance: Auth,
  email: string,
  password: string
): Promise<void> {
  // CRITICAL: Call createUserWithEmailAndPassword directly and return the promise.
  return createUserWithEmailAndPassword(authInstance, email, password).then(
    () => {
      // Success is handled by onAuthStateChanged, so nothing to do here.
    }
  );
  // The returned promise will be used by the caller to handle errors.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(
  authInstance: Auth,
  email: string,
  password: string
): Promise<void> {
  // CRITICAL: Call signInWithEmailAndPassword directly and return the promise.
  return signInWithEmailAndPassword(authInstance, email, password).then(() => {
    // Success is handled by onAuthStateChanged.
  });
}
