'use client';

import { useState, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Member } from '@/lib/data';
import { Button } from '../ui/button';
import { Download, PlusCircle, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../ui/card';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { GROUP_ID } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from '../ui/skeleton';

const memberSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  phone: z.string().min(1, { message: 'Phone number is required' }),
});

function AddMemberDialog({
  onAddMember,
}: {
  onAddMember: (member: Omit<Member, 'id' | 'joinDate' | 'status' | 'groupId'>) => void;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  function onSubmit(values: z.infer<typeof memberSchema>) {
    onAddMember(values);
    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            Enter the details for the new member.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+254700000000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Member</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TableSkeleton() {
    return (
        <div className="rounded-lg border shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default function MembersClient() {
  const [filter, setFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const membersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'groups', GROUP_ID, 'members');
  }, [firestore]);

  const { data: members, isLoading } = useCollection<Member>(membersQuery);


  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members.filter((member) =>
      member.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [members, filter]);

  const handleAddMember = (
    newMemberData: Omit<Member, 'id' | 'joinDate' | 'status' | 'groupId'>
  ) => {
    if (!firestore) return;
    const newMember: Omit<Member, 'id'> = {
      ...newMemberData,
      joinDate: new Date(),
      status: 'Active',
      groupId: GROUP_ID,
    };
    
    const membersRef = collection(firestore, 'groups', GROUP_ID, 'members');
    addDocumentNonBlocking(membersRef, newMember);

    toast({
      title: 'Member Added',
      description: `${newMember.name} has been successfully added.`,
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const headers = ['name', 'phone'];
    const csvContent = headers.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'members_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!firestore) return;
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a .csv file.',
      });
      return;
    }
    
    const membersRef = collection(firestore, 'groups', GROUP_ID, 'members');

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const requiredHeaders = ['name', 'phone'];
        const headers = results.meta.fields || [];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h)
        );

        if (missingHeaders.length > 0) {
          toast({
            variant: 'destructive',
            title: 'Invalid CSV format',
            description: `Missing required columns: ${missingHeaders.join(
              ', '
            )}`,
          });
          return;
        }

        let importedCount = 0;
        results.data.forEach((row) => {
          const newMember: Omit<Member, 'id'> = {
            name: row.name,
            phone: row.phone,
            joinDate: new Date(),
            status: 'Active',
            groupId: GROUP_ID,
          };
          addDocumentNonBlocking(membersRef, newMember);
          importedCount++;
        });

        if(importedCount > 0){
          toast({
            title: 'Import Successful',
            description: `${importedCount} members have been added.`,
          });
        }
      },
      error: (error) => {
        toast({
          variant: 'destructive',
          title: 'CSV Parsing Error',
          description: error.message,
        });
      },
    });

    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">
            Manage your group's members and their details.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" /> Download Template
          </Button>
          <Button variant="outline" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <AddMemberDialog onAddMember={handleAddMember} />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Member List</CardTitle>
          <CardDescription>Search for members by their name.</CardDescription>
          <Input
            placeholder="Filter members by name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-4 max-w-sm"
          />
        </CardHeader>
        <CardContent>
            {isLoading ? <TableSkeleton /> : (
            <div className="rounded-lg border shadow-sm">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredMembers.map((member) => (
                    <TableRow key={member.id} id={member.name.replace(/\s+/g, '-')}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>
                        <div className="flex flex-col">
                            <span className="text-sm">{member.phone}</span>
                        </div>
                        </TableCell>
                        <TableCell>
                        {new Date(member.joinDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                        <Badge
                            variant={
                            member.status === 'Active' ? 'default' : 'outline'
                            }
                            className={
                            member.status === 'Active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : ''
                            }
                        >
                            {member.status}
                        </Badge>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
