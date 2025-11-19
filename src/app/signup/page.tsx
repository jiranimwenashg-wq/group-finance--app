'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useAuth, useFirestore } from '@/firebase';
import { initiateEmailSignUp, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { useRedirectIfAuthenticated } from '@/hooks/use-redirect-if-authenticated';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';

export default function SignupPage() {
  useRedirectIfAuthenticated();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !confirmPassword) return;

    if (password.length < 6) {
        toast({
            variant: 'destructive',
            title: 'Sign-up Failed',
            description: 'Password must be at least 6 characters long.',
        });
        return;
    }

    if (password !== confirmPassword) {
        toast({
            variant: 'destructive',
            title: 'Sign-up Failed',
            description: 'Passwords do not match.',
        });
        return;
    }

    initiateEmailSignUp(auth, firestore, email, password, name, (error) => {
        toast({
            variant: 'destructive',
            title: 'Sign-up Failed',
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
          <h1 className="text-4xl font-bold">Create Your Account</h1>
          <p className="mt-2 text-blue-200">Join FinanceFlow AI and simplify your finances.</p>
        </div>
        
        <div className="space-y-4 rounded-xl bg-white/10 p-8 shadow-2xl backdrop-blur-lg">
            <Button variant="outline" onClick={handleGoogleSignIn} className="w-full bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Icons.google className="mr-2 size-4" />
                Sign up with Google
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

            <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="name" className="text-white">Name</Label>
                    <Input
                    id="name"
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-white/10 text-white placeholder:text-blue-200 border-white/30 focus:border-primary"
                    />
                </div>
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
                <div className="grid gap-2">
                    <Label htmlFor="confirm-password" className="text-white">Confirm Password</Label>
                    <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-white/10 text-white placeholder:text-blue-200 border-white/30 focus:border-primary"
                    />
                </div>
                <Button className="w-full" type="submit">
                    Create Account
                </Button>
            </form>
        </div>

        <div className="text-center">
             <Link
                href="/login"
                className="text-sm text-blue-200 hover:text-white hover:underline"
                >
                Already have an account? Login
            </Link>
        </div>
      </div>
    </div>
  );
}
