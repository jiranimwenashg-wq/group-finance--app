'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';


type ErrorCallback = (errorMessage: string) => void;
type SuccessCallback = (successMessage: string) => void;

function getAuthErrorMessage(error: any): string {
    if (error instanceof FirebaseError) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'This email address is already in use by another account.';
            case 'auth/invalid-email':
                return 'The email address you entered is not valid.';
            case 'auth/operation-not-allowed':
                return 'Email/password accounts are not enabled. Please contact support.';
            case 'auth/weak-password':
                return 'The password is too weak. Please use a stronger password.';
            case 'auth/user-disabled':
                return 'This user account has been disabled.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'The email or password you entered is incorrect.';
            case 'auth/popup-closed-by-user':
                return 'The sign-in popup was closed before completing the sign-in.';
            case 'auth/account-exists-with-different-credential':
                return 'An account already exists with the same email address but different sign-in credentials.';
            case 'auth/network-request-failed':
                return 'A network error occurred. Please check your connection and try again.';
            default:
                return 'An unexpected error occurred. Please try again.';
        }
    }
    return 'An unexpected error occurred. Please try again.';
}

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(
  authInstance: Auth,
  onError: ErrorCallback
): void {
  signInAnonymously(authInstance).catch(error => {
    onError(getAuthErrorMessage(error));
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(
  authInstance: Auth,
  email: string,
  password: string,
  onError: ErrorCallback
): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(() => {
      // Success is handled by onAuthStateChanged listener.
    })
    .catch(error => {
      onError(getAuthErrorMessage(error));
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(
  authInstance: Auth,
  email: string,
  password: string,
  onError: ErrorCallback
): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .then(() => {
      // Success is handled by onAuthStateChanged listener.
    })
    .catch(error => {
      onError(getAuthErrorMessage(error));
    });
}

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(
  authInstance: Auth,
  onError: ErrorCallback
): void {
  const provider = new GoogleAuthProvider();
  signInWithPopup(authInstance, provider)
    .then(() => {
      // Success is handled by onAuthStateChanged listener.
    })
    .catch(error => {
      onError(getAuthErrorMessage(error));
    });
}

/** Initiate password reset email (non-blocking). */
export function initiatePasswordReset(
  authInstance: Auth,
  email: string,
  onSuccess: SuccessCallback,
  onError: ErrorCallback
): void {
  sendPasswordResetEmail(authInstance, email)
    .then(() => {
      onSuccess(`A password reset link has been sent to ${email}.`);
    })
    .catch(error => {
      onError(getAuthErrorMessage(error));
    });
}
