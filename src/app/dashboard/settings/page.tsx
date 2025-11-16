'use client';

import { ThemeToggle } from '@/components/app/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { firebaseConfig } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { GROUP_ID, type Group } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

const groupProfileSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  currency: z.string(),
});

function GroupProfileCard() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const groupRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'groups', GROUP_ID);
  }, [firestore]);

  const { data: group, isLoading } = useDoc<Group>(groupRef);

  const form = useForm<z.infer<typeof groupProfileSchema>>({
    resolver: zodResolver(groupProfileSchema),
    defaultValues: {
      name: '',
      currency: 'KES',
    },
  });

  useEffect(() => {
    if (group) {
      form.reset({
        name: group.name,
        currency: group.currency,
      });
    }
  }, [group, form]);

  const onSubmit = (values: z.infer<typeof groupProfileSchema>) => {
    if (!groupRef) return;
    setDocumentNonBlocking(groupRef, 
        { ...values, id: GROUP_ID },
        { merge: true }
    );
    toast({
      title: 'Changes Saved',
      description: 'Your group profile has been updated.',
    });
  };
  
   if (isLoading) {
    return (
      <Card className="lg:col-span-1">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-32" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-1">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Group Profile</CardTitle>
            <CardDescription>
              Update your group's name and currency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit">Save Changes</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function AppearanceCard() {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of the app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <h3 className="font-medium">Theme</h3>
            <p className="text-sm text-muted-foreground">
              Select your preferred color scheme.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectSettingsCard() {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Project Settings</CardTitle>
        <CardDescription>Manage your Firebase project settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="w-full">
          <Link
            href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}`}
            target="_blank"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Firebase Console
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function SettingsContent() {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-[400px]" />
                <Skeleton className="h-[250px]" />
                <Skeleton className="h-[250px]" />
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <GroupProfileCard />
            <AppearanceCard />
            <ProjectSettingsCard />
        </div>
    )
}

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your group, appearance, and project settings.</p>
        </div>
        <Suspense fallback={
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-[400px]" />
                <Skeleton className="h-[250px]" />
                <Skeleton className="h-[250px]" />
            </div>
        }>
            <SettingsContent />
        </Suspense>
    </div>
  );
}
