
'use client';

import { useState, useMemo, useRef } from 'react';
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
import { Bot, Download, PlusCircle, Upload, Copy, Share2, Loader2 } from 'lucide-react';
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
} from '@/firebase';
import { collection } from 'firebase/firestore';
import { GROUP_ID } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';

const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['Income', 'Expense']),
  category: z.enum([
    'Contribution',
    'Late Fee',
    'Project',
    'Social Fund',
    'Operational',
    'Last Respect',
  ]),
  memberId: z.string().optional(),
});

function AddTransactionDialog({
  members,
  onAddTransaction,
}: {
  members: Member[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: 0,
      type: 'Income',
      category: 'Contribution',
    },
  });

  const onSubmit = (values: z.infer<typeof transactionSchema>) => {
    const member = values.memberId
      ? members.find((m) => m.id === values.memberId)
      : undefined;

    const newTransaction: Omit<Transaction, 'id'> = {
      ...values,
      date: new Date(),
      memberName: member?.name,
      groupId: GROUP_ID,
    };
    onAddTransaction(newTransaction);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Fill in the details of the new transaction.
          </DialogDescription>
        </DialogHeader>
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
                      {members
                        .filter((m) => m.status === 'Active')
                        .map((member) => (
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
            <DialogFooter>
              <Button type="submit">Save Transaction</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);
  
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

function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="rounded-lg border shadow-sm">
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
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
                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-48" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                        <TableHead className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
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
  const [parsedTransaction, setParsedTransaction] =
    useState<ParseMpesaSmsOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

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

  const { data: members, isLoading: isLoadingMembers } =
    useCollection<Member>(membersQuery, membersPath);
  const { data: transactions, isLoading: isLoadingTransactions } =
    useCollection<Transaction>(transactionsQuery, transactionsPath);

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    if (!firestore) return;
    const transactionsRef = collection(firestore, 'groups', GROUP_ID, 'transactions');
    addDocumentNonBlocking(transactionsRef, transaction);
    toast({
      title: 'Transaction Added',
      description: `A new transaction for ${formatCurrency(transaction.amount)} has been recorded.`,
    });
  };

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions
      .filter((transaction) => {
        const searchTerm = filter.toLowerCase();
        const descriptionMatch = transaction.description
          .toLowerCase()
          .includes(searchTerm);
        const memberNameMatch = transaction.memberName
          ?.toLowerCase()
          .includes(searchTerm);
        const categoryMatch = transaction.category
          .toLowerCase()
          .includes(searchTerm);
        return descriptionMatch || (memberNameMatch ?? false) || categoryMatch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filter]);

  const contributionTransactions = useMemo(() => {
    return filteredTransactions.filter((t) => t.category === 'Contribution');
  }, [filteredTransactions]);

  const lastRespectTransactions = useMemo(() => {
    return filteredTransactions.filter((t) => t.category === 'Last Respect');
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
    
    const newTransaction: Omit<Transaction, 'id'> = {
        date: new Date(parsedTransaction.date),
        description: `M-Pesa payment from ${parsedTransaction.senderRecipient}`,
        amount: parsedTransaction.amount,
        type: 'Income', // Assuming M-pesa parsing is for income
        category: 'Contribution',
        memberId: parsedTransaction.memberId,
        memberName: member?.name,
        groupId: GROUP_ID
    };

    handleAddTransaction(newTransaction);
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
              | 'Last Respect',
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

  const isLoading = isLoadingMembers || isLoadingTransactions;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Track all income and expenses for your group.
          </p>
        </div>
        <div className="flex flex-wrap shrink-0 gap-2">
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
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Search for transactions by description, member name, or category.
          </CardDescription>
          <Input
            placeholder="Filter transactions..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-4 max-w-sm"
          />
        </CardHeader>
        <CardContent>
            {isLoading ? <TableSkeleton /> : (
            <Tabs defaultValue="all">
                <TabsList>
                <TabsTrigger value="all">All Transactions</TabsTrigger>
                <TabsTrigger value="contributions">Contributions</TabsTrigger>
                <TabsTrigger value="last_respect">Last Respect</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                <TransactionsTable transactions={filteredTransactions} />
                </TabsContent>
                <TabsContent value="contributions" className="mt-4">
                <TransactionsTable transactions={contributionTransactions} />
                </TabsContent>
                <TabsContent value="last_respect" className="mt-4">
                <TransactionsTable transactions={lastRespectTransactions} />
                </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    