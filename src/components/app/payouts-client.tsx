
'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/lib/data';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { PlusCircle, Calendar as CalendarIcon, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { GROUP_ID } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import { formatCurrency } from './recent-transactions';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { Calendar } from '../ui/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

const payoutSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.date({ required_error: 'A date is required.' }),
});

function PayoutsTable({ 
    transactions,
    onEdit,
    onDelete,
}: { 
    transactions: Transaction[],
    onEdit: (transaction: Transaction) => void;
    onDelete: (transaction: Transaction) => void;
}) {
  return (
    <div className="rounded-lg border shadow-sm">
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {new Date(transaction.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-medium">
                  {transaction.description}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{transaction.category}</Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-semibold text-red-600`}
                >
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onEdit(transaction)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(transaction)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TableSkeleton() {
    return (
        <div className="rounded-lg border shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-48" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableHead>
                        <TableHead className="text-right"><Skeleton className="h-5 w-10 ml-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                            <TableCell><div className="flex justify-end"><Skeleton className="h-7 w-7" /></div></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default function PayoutsClient() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Transaction | null>(null);

  const { toast } = useToast();
  const firestore = useFirestore();

  const transactionsPath = `groups/${GROUP_ID}/transactions`;
  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, transactionsPath);
  }, [firestore]);

  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery, transactionsPath);

  const form = useForm<z.infer<typeof payoutSchema>>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
        description: '',
        amount: 0,
        date: new Date(),
    }
  });

  const handleAddPayout = (values: z.infer<typeof payoutSchema>) => {
    if (!firestore) return;

    const newTransaction: Omit<Transaction, 'id' | 'groupId'> = {
        date: values.date,
        description: values.description,
        amount: values.amount,
        type: 'Expense',
        category: 'Payout',
    };

    const transactionsRef = collection(firestore, 'groups', GROUP_ID, 'transactions');
    addDocumentNonBlocking(transactionsRef, { ...newTransaction, groupId: GROUP_ID });
    
    toast({
      title: 'Payout Recorded',
      description: `A payout for ${formatCurrency(values.amount)} has been recorded.`,
    });
    
    form.reset({
        description: '',
        amount: 0,
        date: new Date(),
    });
    setIsAddDialogOpen(false);
  };

  const openEditDialog = (payout: Transaction) => {
    setSelectedPayout(payout);
    form.reset({
        description: payout.description,
        amount: payout.amount,
        date: new Date(payout.date),
    });
    setIsEditDialogOpen(true);
  };
  
  const handleEditPayout = (values: z.infer<typeof payoutSchema>) => {
    if (!firestore || !selectedPayout) return;
    
    const payoutRef = doc(firestore, transactionsPath, selectedPayout.id);
    setDocumentNonBlocking(payoutRef, {
        ...values,
    }, { merge: true });

    toast({
        title: 'Payout Updated',
        description: 'The payout has been successfully updated.',
    });
    setIsEditDialogOpen(false);
    setSelectedPayout(null);
  };
  
  const openDeleteDialog = (payout: Transaction) => {
    setSelectedPayout(payout);
    setIsDeleteDialogOpen(true);
  }

  const handleDeletePayout = () => {
    if (!firestore || !selectedPayout) return;

    const payoutRef = doc(firestore, transactionsPath, selectedPayout.id);
    deleteDocumentNonBlocking(payoutRef);

    toast({
        variant: 'destructive',
        title: 'Payout Deleted',
        description: 'The payout has been permanently deleted.',
    });
    setIsDeleteDialogOpen(false);
    setSelectedPayout(null);
  }
  
  const payoutTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions
      .filter((transaction) => transaction.category === 'Payout')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);


  const isLoading = isLoadingTransactions;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
          <p className="text-muted-foreground">
            Record and view all group payouts and expenditures.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Payout
                </Button>
            </DialogTrigger>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Record New Payout</DialogTitle>
                    <DialogDescription>
                        Fill in the details for the new payout. This will be recorded as an expense.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddPayout)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                    />
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="e.g., Catering for event" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl><Input type="number" placeholder="5000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">Save Payout</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </div>
      
        <Card>
            <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>
                A record of all payouts made by the group.
            </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <TableSkeleton /> : <PayoutsTable transactions={payoutTransactions} onEdit={openEditDialog} onDelete={openDeleteDialog} />}
            </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Payout</DialogTitle>
                    <DialogDescription>
                        Update the details for this payout.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleEditPayout)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                    />
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
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
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the payout for &quot;{selectedPayout?.description}&quot;.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeletePayout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}
