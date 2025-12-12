

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
import type { Member, Loan } from '@/lib/data';
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
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { GROUP_ID } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';
import { Banknote, MoreHorizontal, PlusCircle, HandCoins, Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { formatCurrency } from './recent-transactions';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Textarea } from '../ui/textarea';

const loanSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  principal: z.coerce.number().positive('Principal must be a positive number'),
  interestRate: z.coerce.number().min(0, 'Interest rate cannot be negative'),
  issueDate: z.date({ required_error: 'Issue date is required.'}),
  reason: z.string().min(1, 'Reason for the loan is required.'),
});

const paymentSchema = z.object({
    amount: z.coerce.number().positive('Payment amount must be positive'),
    paymentDate: z.date({ required_error: 'Payment date is required.' }),
});

function LoansTableSkeleton() {
    return (
        <div className="rounded-lg border shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default function LoansClient() {
  const [isIssueLoanOpen, setIsIssueLoanOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [filter, setFilter] = useState('');
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const membersPath = `groups/${GROUP_ID}/members`;
  const loansPath = `groups/${GROUP_ID}/loans`;
  const transactionsPath = `groups/${GROUP_ID}/transactions`;

  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !GROUP_ID) return null;
    return collection(firestore, membersPath);
  }, [firestore]);

  const loansQuery = useMemoFirebase(() => {
    if (!firestore || !GROUP_ID) return null;
    return query(collection(firestore, loansPath), where('groupId', '==', GROUP_ID));
  }, [firestore]);

  const { data: members, isLoading: isLoadingMembers } = useCollection<Member>(membersQuery, membersPath);
  const { data: loans, isLoading: isLoadingLoans } = useCollection<Loan>(loansQuery, loansPath);

  const issueLoanForm = useForm<z.infer<typeof loanSchema>>({
    resolver: zodResolver(loanSchema),
    defaultValues: { interestRate: 0, issueDate: new Date(), reason: '' },
  });

  const recordPaymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paymentDate: new Date() },
  });

  const handleIssueLoan = (values: z.infer<typeof loanSchema>) => {
    if (!firestore || !GROUP_ID || !members) return;

    const member = members.find(m => m.id === values.memberId);
    if (!member) return;
    
    const principal = values.principal;
    const interest = principal * (values.interestRate / 100);
    const balance = principal + interest;

    const newLoan: Omit<Loan, 'id'> = {
        groupId: GROUP_ID,
        memberId: values.memberId,
        memberName: member.name,
        principal: principal,
        interestRate: values.interestRate,
        balance: balance,
        issueDate: values.issueDate,
        status: 'Active',
        reason: values.reason,
    };
    
    const loansRef = collection(firestore, loansPath);
    addDocumentNonBlocking(loansRef, newLoan);

    // Create a corresponding expense transaction
    const newTransaction = {
        groupId: GROUP_ID,
        date: values.issueDate,
        description: `Loan issued to ${member.name}`,
        amount: values.principal,
        type: 'Expense' as const,
        category: 'Operational' as const,
        memberId: values.memberId,
        memberName: member.name
    }
    const transactionsRef = collection(firestore, transactionsPath);
    addDocumentNonBlocking(transactionsRef, newTransaction);


    toast({
      title: 'Loan Issued',
      description: `${formatCurrency(values.principal)} has been advanced to ${member.name}.`,
    });
    issueLoanForm.reset({ interestRate: 0, issueDate: new Date(), reason: '' });
    setIsIssueLoanOpen(false);
  };

  const openRecordPaymentDialog = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsRecordPaymentOpen(true);
  }

  const handleRecordPayment = (values: z.infer<typeof paymentSchema>) => {
    if(!firestore || !GROUP_ID || !selectedLoan) return;

    const newBalance = selectedLoan.balance - values.amount;
    const newStatus = newBalance <= 0 ? 'Paid Off' : 'Active';

    const loanRef = doc(firestore, loansPath, selectedLoan.id);
    updateDocumentNonBlocking(loanRef, {
        balance: newBalance,
        status: newStatus
    });

    const newTransaction = {
        groupId: GROUP_ID,
        date: values.paymentDate,
        description: `Loan repayment by ${selectedLoan.memberName}`,
        amount: values.amount,
        type: 'Income' as const,
        category: 'Loan Repayment' as const,
        memberId: selectedLoan.memberId,
        memberName: selectedLoan.memberName,
        loanId: selectedLoan.id,
    };

    const transactionsRef = collection(firestore, transactionsPath);
    addDocumentNonBlocking(transactionsRef, newTransaction);

    toast({
        title: 'Payment Recorded',
        description: `Payment of ${formatCurrency(values.amount)} for ${selectedLoan.memberName} has been recorded.`
    });
    recordPaymentForm.reset({ paymentDate: new Date()});
    setIsRecordPaymentOpen(false);
    setSelectedLoan(null);
  };


  const sortedActiveMembers = useMemo(
    () => members?.filter(m => m.status === 'Active').sort((a,b) => a.name.localeCompare(b.name)) || [], 
  [members]);
  
  const filteredLoans = useMemo(() => {
    if (!loans) return [];
    return loans
      .filter((loan) =>
        loan.memberName.toLowerCase().includes(filter.toLowerCase())
      )
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [loans, filter]);

  const isLoading = isLoadingMembers || isLoadingLoans;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Loan Management</h1>
          <p className="text-muted-foreground">
            Issue and track member loans and advances.
          </p>
        </div>
        <Dialog open={isIssueLoanOpen} onOpenChange={setIsIssueLoanOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Issue Loan
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Issue New Loan</DialogTitle>
                    <DialogDescription>
                        Select a member and enter the loan details.
                    </DialogDescription>
                </DialogHeader>
                <Form {...issueLoanForm}>
                    <form onSubmit={issueLoanForm.handleSubmit(handleIssueLoan)} className="space-y-4">
                        <FormField
                            control={issueLoanForm.control}
                            name="memberId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Member</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a member" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {sortedActiveMembers.map(member => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    {member.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={issueLoanForm.control}
                            name="issueDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Issue Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[240px] pl-3 text-left font-normal",
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
                            control={issueLoanForm.control}
                            name="principal"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Principal Amount</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g. 10000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={issueLoanForm.control}
                            name="interestRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Interest Rate (%)</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g. 10 for 10%" {...field} /></FormControl>
                                    <FormDescription>Enter 0 for an interest-free advance.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={issueLoanForm.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="e.g., School fees" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">Issue Loan</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </div>

       <Dialog open={isRecordPaymentOpen} onOpenChange={setIsRecordPaymentOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Record Payment for {selectedLoan?.memberName}</DialogTitle>
                    <DialogDescription>
                        Enter the amount being paid towards the loan.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...recordPaymentForm}>
                    <form onSubmit={recordPaymentForm.handleSubmit(handleRecordPayment)} className="space-y-4">
                        <FormField
                            control={recordPaymentForm.control}
                            name="paymentDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Payment Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[240px] pl-3 text-left font-normal",
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
                            control={recordPaymentForm.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment Amount</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g. 500" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">Record Payment</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Loans</CardTitle>
          <CardDescription>A complete history of all loans issued.</CardDescription>
          <Input
            placeholder="Filter by member name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-4 max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? <LoansTableSkeleton /> : (
            <div className="rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Interest</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLoans.map((loan) => (
                            <TableRow key={loan.id}>
                                <TableCell className="font-medium">{loan.memberName}</TableCell>
                                <TableCell>{formatCurrency(loan.principal)}</TableCell>
                                <TableCell>{loan.interestRate}%</TableCell>
                                <TableCell className="font-semibold text-destructive">{formatCurrency(loan.balance)}</TableCell>
                                <TableCell>{new Date(loan.issueDate).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Badge variant={loan.status === 'Active' ? 'destructive' : 'default'}>
                                        {loan.status}
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
                                            <DropdownMenuItem onClick={() => openRecordPaymentDialog(loan)}>
                                                <HandCoins className="mr-2 h-4 w-4" />
                                                Record Payment
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
    </div>
  );
}
