'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useAuth, useFirestore } from '@/firebase';
import { initiateEmailSignIn, initiateGoogleSignIn, initiatePasswordReset } from '@/firebase/non-blocking-login';
import { useRedirectIfAuthenticated } from '@/hooks/use-redirect-if-authenticated';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  useRedirectIfAuthenticated();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    initiateEmailSignIn(auth, email, password, (error) => {
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: error,
        });
    });
  };

  const handleGoogleSignIn = () => {
    initiateGoogleSignIn(auth, firestore, (error) => {
        toast({
            variant: 'destructive',
            title: 'Sign-in Failed',
            description: error,
        });
    });
  };
  
  const handlePasswordReset = (emailToReset: string) => {
    if (!emailToReset) return;
    initiatePasswordReset(
      auth,
      emailToReset,
      (successMessage) => {
        toast({
          title: 'Email Sent',
          description: successMessage,
        });
      },
      (error) => {
        toast({
          variant: 'destructive',
          title: 'Reset Failed',
          description: error,
        });
      }
    );
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 px-4">
      <Link
        href="/"
        className="absolute left-4 top-4 flex items-center md:left-8 md:top-8 text-white"
      >
        <Icons.logo className="mr-2 size-6" />
        <span className="font-bold">FinanceFlow AI</span>
      </Link>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-blue-200">Sign in to access your dashboard.</p>
        </div>
        
        <div className="space-y-4 rounded-xl bg-white/10 p-8 shadow-2xl backdrop-blur-lg">
            <Button variant="outline" onClick={handleGoogleSignIn} className="w-full bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Icons.google className="mr-2 size-4" />
                Sign in with Google
            </Button>
            
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-blue-200">
                        Or continue with
                    </span>
                </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 text-white placeholder:text-blue-200 border-white/30 focus:border-primary"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/10 text-white placeholder:text-blue-200 border-white/30 focus:border-primary"
                />
            </div>
            <Button className="w-full" type="submit">
                Login with Email
            </Button>
            </form>
        </div>

        <div className="text-center">
             <Link
                href="/signup"
                className="text-sm text-blue-200 hover:text-white hover:underline"
                >
                Don&apos;t have an account? Sign up
            </Link>
             <Separator className="my-4 bg-white/20" />
             <Link
                href="/login#"
                onClick={(e) => {
                    e.preventDefault();
                    const emailToReset = prompt("Please enter your email address to reset your password:");
                    if (emailToReset) {
                        handlePasswordReset(emailToReset);
                    }
                }}
                className="text-sm text-blue-200 hover:text-white hover:underline"
                >
                Forgot your password?
            </Link>
        </div>
      </div>
    </div>
  );
}
