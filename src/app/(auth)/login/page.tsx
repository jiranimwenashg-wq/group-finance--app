'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { initiateEmailSignIn, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { useRedirectIfAuthenticated } from '@/hooks/use-redirect-if-authenticated';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  useRedirectIfAuthenticated();
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    initiateEmailSignIn(auth, email, password).catch((error: FirebaseError) => {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'The email or password you entered is incorrect.',
      });
    });
  };

  const handleGoogleSignIn = () => {
    initiateGoogleSignIn(auth).catch((error: FirebaseError) => {
      toast({
        variant: 'destructive',
        title: 'Sign-in Failed',
        description:
          'Could not sign in with Google. Please try again.',
      });
    });
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Welcome Back</CardTitle>
        <CardDescription>
          Choose your preferred sign-in method
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Button variant="outline" onClick={handleGoogleSignIn}>
          <Icons.google className="mr-2 size-4" />
          Sign in with Google
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
        <form onSubmit={handleLogin} className="space-y-4">
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
            Login with Email
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col !space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="underline underline-offset-4 hover:text-primary"
          >
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

    