
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Member, Transaction } from '@/lib/data';
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
import { Textarea } from '../ui/textarea';
import { Bot, Download, PlusCircle, Upload, Copy, Share2, Loader2, MoreHorizontal, Pencil, Trash2, Calendar as CalendarIcon, X as ClearIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  parseMpesaSms,
  ParseMpesaSmsOutput,
} from '@/ai/flows/parse-mpesa-sms';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';
import { formatCurrency } from './recent-transactions';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';


const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.date({ required_error: 'A date is required.' }),
  type: z.enum(['Income', 'Expense']),
  category: z.enum([
    'Contribution',
    'Late Fee',
    'Project',
    'Social Fund',
    'Operational',
    'Last Respect',
    'Loan Repayment'
  ]),
  memberId: z.string().optional(),
});

function AddTransactionDialog({
  members,
  onAddTransaction,
}: {
  members: Member[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'groupId'>) => void;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: new Date(),
      type: 'Income',
      category: 'Contribution',
    },
  });

  const onSubmit = (values: z.infer<typeof transactionSchema>) => {
    const member = values.memberId
      ? members.find((m) => m.id === values.memberId)
      : undefined;

    const newTransaction: Omit<Transaction, 'id' | 'groupId'> = {
      ...values,
      memberName: member?.name,
    };
    onAddTransaction(newTransaction);
    form.reset({
      description: '',
      amount: 0,
      date: new Date(),
      type: 'Income',
      category: 'Contribution',
    });
    setOpen(false);
  };
  
  const sortedMembers = useMemo(() => {
    if (!members) return [];
    return [...members]
      .filter((m) => m.status === 'Active')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Fill in the details of the new transaction.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., July Contribution" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Income">Income</SelectItem>
                        <SelectItem value="Expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Contribution">Contribution</SelectItem>
                        <SelectItem value="Late Fee">Late Fee</SelectItem>
                        <SelectItem value="Project">Project</SelectItem>
                        <SelectItem value="Social Fund">Social Fund</SelectItem>
                        <SelectItem value="Operational">Operational</SelectItem>
                        <SelectItem value="Last Respect">Last Respect</SelectItem>
                        <SelectItem value="Loan Repayment">Loan Repayment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="memberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sortedMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Link this transaction to a group member.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="sticky bottom-0 bg-background py-4 pr-6">
                <Button type="submit">Save Transaction</Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function formatTransactionsForWhatsApp(transactions: Transaction[]): string {
  const header = `*FinanceFlow AI - Recent Transactions*`;

  const items = transactions.map((t, index) => {
    const date = new Date(t.date).toLocaleDateString('en-GB'); // DD/MM/YYYY
    const sign = t.type === 'Income' ? '+' : '-';
    const member = t.memberName ? ` (${t.memberName})` : '';
    return `${index + 1}. ${t.description}${member} - ${sign}${formatCurrency(Math.abs(t.amount))} on ${date}`;
  }).join('\n');

  return `${header}\n\n${items}`;
}

function TransactionsTable({ 
  transactions,
  onEdit,
  onDelete
}: { 
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}) {
  return (
    <div className="rounded-lg border shadow-sm">
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  {new Date(transaction.date).toLocaleDateString()}
                </TableCell>
                <TableCell>{transaction.memberName || 'N/A'}</TableCell>
                <TableCell className="font-medium">
                  {transaction.description}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{transaction.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      transaction.type === 'Income' ? 'outline' : 'destructive'
                    }
                    className={
                      transaction.type === 'Income'
                        ? 'border-green-500 text-green-500'
                        : ''
                    }
                  >
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    transaction.type === 'Income'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
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
                    <DropdownMenuContent align="end">
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
                        <TableHead><Skeleton className="h-5 w-8" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-48" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                        <TableHead className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableHead>
                        <TableHead className="text-right"><Skeleton className="h-5 w-10 ml-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                            <TableCell><div className="flex justify-end"><Skeleton className="h-7 w-7" /></div></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function WhatsAppExportDialog({ transactions }: { transactions: Transaction[] }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const recentTransactions = useMemo(() => {
        return transactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [transactions]);
    
    const formattedText = useMemo(() => formatTransactionsForWhatsApp(recentTransactions), [recentTransactions]);

    const handleCopy = () => {
        navigator.clipboard.writeText(formattedText);
        toast({
            title: "Copied to Clipboard",
            description: "The transaction summary is ready to be pasted.",
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Share2 className="mr-2 h-4 w-4" /> Export for WhatsApp
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Export for WhatsApp</DialogTitle>
                    <DialogDescription>
                        Copy this message and paste it into your WhatsApp group chat.
                    </DialogDescription>
                </DialogHeader>
                <div className="my-4 rounded-lg border bg-muted p-4">
                    <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{formattedText}</pre>
                </div>
                <DialogFooter>
                    <Button onClick={handleCopy} className="w-full">
                        <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function TransactionsClient() {
  const [smsText, setSmsText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [filter, setFilter] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [parsedTransaction, setParsedTransaction] = useState<ParseMpesaSmsOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const membersPath = `groups/${GROUP_ID}/members`;
  const transactionsPath = `groups/${GROUP_ID}/transactions`;

  const membersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, membersPath);
  }, [firestore]);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, transactionsPath);
  }, [firestore]);

  const { data: members, isLoading: isLoadingMembers } = useCollection<Member>(membersQuery, membersPath);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery, transactionsPath);

  const editForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
  });

  useEffect(() => {
    if (selectedTransaction) {
      editForm.reset({
        description: selectedTransaction.description,
        amount: selectedTransaction.amount,
        date: new Date(selectedTransaction.date),
        type: selectedTransaction.type,
        category: selectedTransaction.category,
        memberId: selectedTransaction.memberId,
      });
    }
  }, [selectedTransaction, editForm]);


  const handleAddTransaction = (transaction: Omit<Transaction, 'id' | 'groupId'>) => {
    if (!firestore) return;
    const transactionsRef = collection(firestore, 'groups', GROUP_ID, 'transactions');
    addDocumentNonBlocking(transactionsRef, { ...transaction, groupId: GROUP_ID });
    toast({
      title: 'Transaction Added',
      description: `A new transaction for ${formatCurrency(transaction.amount)} has been recorded.`,
    });
  };

  const handleEditSubmit = (values: z.infer<typeof transactionSchema>) => {
    if (!firestore || !selectedTransaction) return;

    const member = values.memberId ? members?.find((m) => m.id === values.memberId) : undefined;
    const updatedTransaction = {
      ...selectedTransaction,
      ...values,
      memberName: member?.name,
    };
    
    const transactionRef = doc(firestore, 'groups', GROUP_ID, 'transactions', selectedTransaction.id);
    setDocumentNonBlocking(transactionRef, updatedTransaction, { merge: true });
    
    toast({
      title: 'Transaction Updated',
      description: 'The transaction has been successfully updated.',
    });
    setIsEditOpen(false);
    setSelectedTransaction(null);
  };
  
  const handleDeleteConfirm = () => {
    if (!firestore || !selectedTransaction) return;
    
    const transactionRef = doc(firestore, 'groups', GROUP_ID, 'transactions', selectedTransaction.id);
    deleteDocumentNonBlocking(transactionRef);
    
    toast({
      variant: 'destructive',
      title: 'Transaction Deleted',
      description: 'The transaction has been permanently deleted.',
    });
    setIsDeleteOpen(false);
    setSelectedTransaction(null);
  };

  const openEditDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditOpen(true);
  };
  
  const openDeleteDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteOpen(true);
  };


  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions
      .filter((transaction) => {
        const searchTerm = filter.toLowerCase();
        
        // Date filter
        const dateMatch = !date || new Date(transaction.date).toDateString() === date.toDateString();

        // Text filter
        const descriptionMatch = transaction.description
          .toLowerCase()
          .includes(searchTerm);
        const memberNameMatch = transaction.memberName
          ?.toLowerCase()
          .includes(searchTerm);
        const categoryMatch = transaction.category
          .toLowerCase()
          .includes(searchTerm);
        
        return dateMatch && (descriptionMatch || (memberNameMatch ?? false) || categoryMatch);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filter, date]);

  const contributionTransactions = useMemo(() => {
    return filteredTransactions.filter((t) => t.category === 'Contribution');
  }, [filteredTransactions]);

  const lastRespectTransactions = useMemo(() => {
    return filteredTransactions.filter((t) => t.category === 'Last Respect');
  }, [filteredTransactions]);

  const loanRepaymentTransactions = useMemo(() => {
    return filteredTransactions.filter((t) => t.category === 'Loan Repayment');
  }, [filteredTransactions]);

  const handleParseSms = async () => {
    if (!smsText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'SMS text cannot be empty.',
      });
      return;
    }
    setIsParsing(true);
    setParsedTransaction(null);
    try {
      const activeMembers =
        members
          ?.filter((m) => m.status === 'Active')
          .map((m) => ({ id: m.id, name: m.name })) || [];
      const result = await parseMpesaSms({
        smsText,
        members: activeMembers,
      });
      setParsedTransaction(result);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Parsing Failed',
        description: 'Could not extract details from the SMS.',
      });
    } finally {
      setIsParsing(false);
    }
  };
  
  const handleSaveParsedTransaction = () => {
    if (!parsedTransaction) return;

    const member = parsedTransaction.memberId ? members?.find(m => m.id === parsedTransaction.memberId) : undefined;
    
    const newTransaction: Omit<Transaction, 'id' | 'groupId'> = {
        date: new Date(parsedTransaction.date),
        description: `M-Pesa payment from ${parsedTransaction.senderRecipient}`,
        amount: parsedTransaction.amount,
        type: 'Income', // Assuming M-pesa parsing is for income
        category: 'Contribution',
        memberId: parsedTransaction.memberId,
        memberName: member?.name,
    };

    const transactionsRef = collection(firestore, 'groups', GROUP_ID, 'transactions');
    addDocumentNonBlocking(transactionsRef, { ...newTransaction, groupId: GROUP_ID });
    toast({
      title: 'Transaction Added',
      description: `A new transaction for ${formatCurrency(newTransaction.amount)} has been recorded.`,
    });
    setParsedTransaction(null);
    setSmsText('');
  };

  const handleCopyForWhatsApp = () => {
    if (!parsedTransaction) return;
    const memberName = parsedTransaction.memberId ? members?.find(m => m.id === parsedTransaction.memberId)?.name : parsedTransaction.senderRecipient;
    const text = `Transaction Alert:\nReceived ${formatCurrency(parsedTransaction.amount)} from ${memberName} on ${new Date(parsedTransaction.date).toLocaleDateString('en-GB')}.`;
    navigator.clipboard.writeText(text);
    toast({
        title: "Copied to Clipboard",
        description: "The transaction message is ready to be pasted.",
    });
  };


  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'date',
      'description',
      'amount',
      'type',
      'category',
      'memberName',
    ];
    const csvContent = headers.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'transactions_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!firestore || !members) return;
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

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const requiredHeaders = [
          'date',
          'description',
          'amount',
          'type',
          'category',
        ];
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

        const transactionsRef = collection(
          firestore,
          'groups',
          GROUP_ID,
          'transactions'
        );
        let importedCount = 0;
        results.data.forEach((row) => {
          const member = row.memberName
            ? members.find(
                (m) => m.name.toLowerCase() === row.memberName!.toLowerCase()
              )
            : undefined;
          const newTransaction: Omit<Transaction, 'id'> = {
            date: new Date(row.date),
            description: row.description,
            amount: parseFloat(row.amount),
            type: row.type as 'Income' | 'Expense',
            category: row.category as
              | 'Contribution'
              | 'Late Fee'
              | 'Project'
              | 'Social Fund'
              | 'Operational'
              | 'Last Respect'
              | 'Loan Repayment',
            memberId: member?.id,
            memberName: member?.name,
            groupId: GROUP_ID,
          };
          addDocumentNonBlocking(transactionsRef, newTransaction);
          importedCount++;
        });

        if (importedCount > 0) {
            toast({
              title: 'Import Successful',
              description: `${importedCount} transactions have been added.`,
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
  
  const sortedMembers = useMemo(() => {
    if (!members) return [];
    return [...members].sort((a, b) => a.name.localeCompare(b.name));
  }, [members]);

  const isLoading = isLoadingMembers || isLoadingTransactions;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Track all income and expenses for your group.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" /> Template
          </Button>
          <Button variant="outline" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <Dialog onOpenChange={(open) => {
            if (!open) {
                setParsedTransaction(null);
                setSmsText('');
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Bot className="mr-2 h-4 w-4" /> Parse SMS
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI-Powered SMS Parser</DialogTitle>
                <DialogDescription>
                  Paste your M-Pesa SMS below and let AI extract the details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  id="sms-text"
                  placeholder="Paste SMS here..."
                  rows={6}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                />
                 {parsedTransaction && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Parsed Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><strong>Amount:</strong> {formatCurrency(parsedTransaction.amount)}</p>
                      <p><strong>From/To:</strong> {parsedTransaction.senderRecipient}</p>
                      <p><strong>Date:</strong> {new Date(parsedTransaction.date).toLocaleString()}</p>
                      {parsedTransaction.memberId && members && (
                        <p className="text-green-600 font-semibold">
                          ✓ Matched to member: {members.find(m => m.id === parsedTransaction.memberId)?.name}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
              <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
                 {parsedTransaction ? (
                    <>
                       <Button onClick={handleCopyForWhatsApp} variant="outline" className="w-full">
                           <Copy className="mr-2 h-4 w-4" /> Copy for WhatsApp
                       </Button>
                       <Button onClick={handleSaveParsedTransaction} className="w-full">
                            Save Transaction
                       </Button>
                    </>
                 ) : (
                    <Button
                        onClick={handleParseSms}
                        disabled={isParsing || isLoadingMembers}
                        className="w-full"
                    >
                        {isParsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isParsing ? 'Parsing...' : 'Parse with AI'}
                    </Button>
                 )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
           <WhatsAppExportDialog transactions={transactions || []} />
          <AddTransactionDialog members={members || []} onAddTransaction={handleAddTransaction} />
        </div>
      </div>
       <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                    Search for transactions by description, member name, or category.
                </CardDescription>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Input
                    placeholder="Filter transactions..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="max-w-sm"
                    />
                     {date && (
                        <Button variant="ghost" onClick={() => setDate(undefined)}>
                            <ClearIcon className="mr-2 h-4 w-4" />
                            Clear Date
                        </Button>
                    )}
                </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? <TableSkeleton /> : (
                    <Tabs defaultValue="all">
                        <TabsList>
                          <TabsTrigger value="all">All Transactions</TabsTrigger>
                          <TabsTrigger value="contributions">Contributions</TabsTrigger>
                          <TabsTrigger value="last_respect">Last Respect</TabsTrigger>
                          <TabsTrigger value="loan_repayment">Loan Repayments</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" className="mt-4">
                        <TransactionsTable transactions={filteredTransactions} onEdit={openEditDialog} onDelete={openDeleteDialog} />
                        </TabsContent>
                        <TabsContent value="contributions" className="mt-4">
                        <TransactionsTable transactions={contributionTransactions} onEdit={openEditDialog} onDelete={openDeleteDialog} />
                        </TabsContent>
                        <TabsContent value="last_respect" className="mt-4">
                        <TransactionsTable transactions={lastRespectTransactions} onEdit={openEditDialog} onDelete={openDeleteDialog} />
                        </TabsContent>
                        <TabsContent value="loan_repayment" className="mt-4">
                          <TransactionsTable transactions={loanRepaymentTransactions} onEdit={openEditDialog} onDelete={openDeleteDialog} />
                        </TabsContent>
                    </Tabs>
                )}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-4">
            <Card>
                 <CardHeader>
                    <CardTitle>Filter by Date</CardTitle>
                    <CardDescription>Select a day to view transactions.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                    />
                </CardContent>
            </Card>
        </div>
      </div>

       {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the details of this transaction.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
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
                control={editForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Income">Income</SelectItem>
                        <SelectItem value="Expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Contribution">Contribution</SelectItem>
                        <SelectItem value="Late Fee">Late Fee</SelectItem>
                        <SelectItem value="Project">Project</SelectItem>
                        <SelectItem value="Social Fund">Social Fund</SelectItem>
                        <SelectItem value="Operational">Operational</SelectItem>
                        <SelectItem value="Last Respect">Last Respect</SelectItem>
                        <SelectItem value="Loan Repayment">Loan Repayment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="memberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a member" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {sortedMembers?.filter(m => m.status === 'Active').map(member => (
                          <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                        ))}
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transaction: <span className="font-semibold">{selectedTransaction?.description}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

    

    