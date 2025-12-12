
'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Loan, Member, Transaction } from '@/lib/data';
import { Button } from '../ui/button';
import { Download, PlusCircle, Upload, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '../ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../ui/card';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { GROUP_ID } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';

const memberSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  phone: z.string().min(1, { message: 'Phone number is required' }),
});

const editMemberSchema = memberSchema.extend({
    status: z.enum(['Active', 'Inactive']),
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
                        <TableHead className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><div className="flex justify-end"><Skeleton className="h-8 w-8" /></div></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default function MembersClient() {
  const [filter, setFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const membersPath = `groups/${GROUP_ID}/members`;
  const transactionsPath = `groups/${GROUP_ID}/transactions`;
  const loansPath = `groups/${GROUP_ID}/loans`;

  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !GROUP_ID) return null;
    return collection(firestore, membersPath);
  }, [firestore]);

  const { data: members, isLoading } = useCollection<Member>(membersQuery, membersPath);

  const form = useForm<z.infer<typeof editMemberSchema>>({
    resolver: zodResolver(editMemberSchema),
  });

  useEffect(() => {
    if (selectedMember) {
      form.reset({
        name: selectedMember.name,
        phone: selectedMember.phone,
        status: selectedMember.status,
      });
    }
  }, [selectedMember, form]);

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members
      .filter((member) =>
        member.name.toLowerCase().includes(filter.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, filter]);

  const handleAddMember = (
    newMemberData: Omit<Member, 'id' | 'joinDate' | 'status' | 'groupId'>
  ) => {
    if (!firestore || !GROUP_ID) return;
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

  const handleEditClick = (member: Member) => {
    setSelectedMember(member);
    setIsEditOpen(true);
  };
  
  const handleDeleteClick = (member: Member) => {
    setSelectedMember(member);
    setIsDeleteOpen(true);
  };

  const handleEditSubmit = async (values: z.infer<typeof editMemberSchema>) => {
    if (!firestore || !selectedMember) return;
    
    const memberRef = doc(firestore, membersPath, selectedMember.id);
    const updatedMemberData = { ...selectedMember, ...values };
    
    const batch = writeBatch(firestore);
    
    // Update the member document itself
    batch.set(memberRef, updatedMemberData);

    // If the name changed, update denormalized memberName in other collections
    if (selectedMember.name !== values.name) {
        // Update transactions
        const transactionsQuery = query(collection(firestore, transactionsPath), where('memberId', '==', selectedMember.id));
        const transactionsSnapshot = await getDocs(transactionsQuery);
        transactionsSnapshot.forEach(doc => {
            batch.update(doc.ref, { memberName: values.name });
        });

        // Update loans
        const loansQuery = query(collection(firestore, loansPath), where('memberId', '==', selectedMember.id));
        const loansSnapshot = await getDocs(loansQuery);
        loansSnapshot.forEach(doc => {
            batch.update(doc.ref, { memberName: values.name });
        });
    }
    
    await batch.commit();

    toast({
      title: 'Member Updated',
      description: `${values.name}'s details have been updated.`,
    });
    
    setIsEditOpen(false);
    setSelectedMember(null);
  };
  
  const confirmDelete = () => {
    if (!firestore || !selectedMember) return;
    const memberRef = doc(firestore, membersPath, selectedMember.id);
    deleteDocumentNonBlocking(memberRef);
    toast({
      variant: 'destructive',
      title: 'Member Deleted',
      description: `${selectedMember.name} has been removed.`,
    });
    setIsDeleteOpen(false);
    setSelectedMember(null);
  }

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
                    <TableHead className="text-right">Actions</TableHead>
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
                        <TableCell className="text-right">
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditClick(member)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteClick(member)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
       {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Edit Member</DialogTitle>
                <DialogDescription>
                    Update the details for {selectedMember?.name}.
                </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input {...field} />
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
                            <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <DialogFooter>
                    <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
                </Form>
            </DialogContent>
        </Dialog>
        
        {/* Delete Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete {selectedMember?.name} and all associated data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                        Delete Member
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}

    