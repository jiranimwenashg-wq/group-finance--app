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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { initiateEmailSignIn, initiateGoogleSignIn, initiatePasswordReset } from '@/firebase/non-blocking-login';
import { useRedirectIfAuthenticated } from '@/hooks/use-redirect-if-authenticated';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';

function ForgotPasswordDialog() {
  const auth = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handlePasswordReset = () => {
    if (!resetEmail) return;
    initiatePasswordReset(
      auth,
      resetEmail,
      (successMessage) => {
        toast({
          title: 'Email Sent',
          description: successMessage,
        });
        setOpen(false); // Close dialog on success
        setResetEmail('');
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="w-full justify-start p-0">
          Forgot Password?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Enter your email address and we will send you a link to reset your
            password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reset-email" className="text-right">
              Email
            </Label>
            <Input
              id="reset-email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="col-span-3"
              placeholder="m@example.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handlePasswordReset}>Send Reset Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LoginPage() {
  useRedirectIfAuthenticated();
  const auth = useAuth();
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <ForgotPasswordDialog />
                    </div>
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
            <Separator className="my-4" />
             <div className="p-6 pt-0 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
        </Card>
      </div>
    </div>
  );
}
