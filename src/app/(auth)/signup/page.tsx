'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { initiateEmailSignUp, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { useRedirectIfAuthenticated } from '@/hooks/use-redirect-if-authenticated';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';

export default function SignupPage() {
  useRedirectIfAuthenticated();
  const auth = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    initiateEmailSignUp(auth, email, password, (error) => {
        toast({
            variant: 'destructive',
            title: 'Sign-up Failed',
            description: error,
        });
    });
  };

  const handleGoogleSignIn = () => {
    initiateGoogleSignIn(auth, (error) => {
        toast({
            variant: 'destructive',
            title: 'Sign-in Failed',
            description: error,
        });
    });
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Link
            href="/"
            className="absolute left-4 top-4 flex items-center md:left-8 md:top-8"
        >
            <Icons.logo className="mr-2 size-6" />
            <span className="font-bold">FinanceFlow AI</span>
        </Link>
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <Card>
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl">Create an Account</CardTitle>
                <CardDescription>
                Choose your preferred sign-up method
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <Button variant="outline" onClick={handleGoogleSignIn}>
                <Icons.google className="mr-2 size-4" />
                Sign up with Google
                </Button>
                <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
                </div>
                <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                    id="name"
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    />
                </div>
                <Button className="w-full" type="submit">
                    Create Account
                </Button>
                </form>
            </CardContent>
            <Separator className="my-4" />
            <div className="p-6 pt-0 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Login
                </Link>
              </p>
            </div>
            </Card>
        </div>
    </div>
  );
}
