"use client";

import { useState, useMemo, useRef } from "react";
import Papa from "papaparse";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Member, Transaction } from "@/lib/data";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Bot, Download, PlusCircle, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  parseMpesaSms,
  ParseMpesaSmsOutput,
} from "@/ai/flows/parse-mpesa-sms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";

type TransactionsClientProps = {
  initialTransactions: Transaction[];
  members: Member[];
};

const transactionSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    amount: z.coerce.number().positive('Amount must be positive'),
    type: z.enum(['Income', 'Expense']),
    category: z.enum(['Contribution', 'Late Fee', 'Project', 'Social Fund', 'Operational', 'Last Respect']),
    memberId: z.string().optional(),
});

function AddTransactionDialog({
    members,
    onAddTransaction
}: {
    members: Member[],
    onAddTransaction: (data: z.infer<typeof transactionSchema>) => void,
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
        onAddTransaction(values);
        form.reset();
        setOpen(false);
    }

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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a member" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {members.filter(m => m.status === 'Active').map(member => (
                                            <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>Link this transaction to a group member.</FormDescription>
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
    )
}

export default function TransactionsClient({
  initialTransactions,
  members,
}: TransactionsClientProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [smsText, setSmsText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [filter, setFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const searchTerm = filter.toLowerCase();
      const descriptionMatch = transaction.description.toLowerCase().includes(searchTerm);
      const memberNameMatch = transaction.memberName?.toLowerCase().includes(searchTerm);
      const categoryMatch = transaction.category.toLowerCase().includes(searchTerm);
      return descriptionMatch || (memberNameMatch ?? false) || categoryMatch;
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, filter]);

  const handleAddTransaction = (data: z.infer<typeof transactionSchema>) => {
    const member = data.memberId ? members.find(m => m.id === data.memberId) : undefined;
    const newTransaction: Transaction = {
        ...data,
        id: `TRN${Date.now()}`,
        date: new Date(),
        memberName: member?.name,
    };
    setTransactions(prev => [newTransaction, ...prev]);
    toast({
        title: "Transaction Added",
        description: `A new transaction for ${formatCurrency(newTransaction.amount)} has been recorded.`
    })
  }

  const handleParseSms = async () => {
    if (!smsText.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "SMS text cannot be empty.",
      });
      return;
    }
    setIsParsing(true);
    try {
      const activeMembers = members.filter(m => m.status === 'Active').map(m => ({ id: m.id, name: m.name }));
      const result: ParseMpesaSmsOutput = await parseMpesaSms({ smsText, members: activeMembers });
      
      let toastDescription = `Amount: ${result.amount}, From/To: ${result.senderRecipient}`;
      if (result.memberId) {
        const member = members.find(m => m.id === result.memberId);
        if (member) {
            toastDescription += ` (Matched to ${member.name})`;
        }
      }

      toast({
        title: "SMS Parsed Successfully",
        description: toastDescription,
      });

      // Here you would typically pre-fill a form with the parsed data
      // For this demo, we just show a toast and could pre-fill the add dialog
    } catch (error) {
      console.error("Failed to parse SMS:", error);
      toast({
        variant: "destructive",
        title: "Parsing Failed",
        description: "Could not extract details from the SMS.",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const headers = ["date", "description", "amount", "type", "category", "memberName"];
    const csvContent = headers.join(",");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "transactions_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv") {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload a .csv file.",
      });
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const requiredHeaders = ["date", "description", "amount", "type", "category"];
        const headers = results.meta.fields || [];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h)
        );

        if (missingHeaders.length > 0) {
          toast({
            variant: "destructive",
            title: "Invalid CSV format",
            description: `Missing required columns: ${missingHeaders.join(", ")}`,
          });
          return;
        }

        const newTransactions: Transaction[] = results.data.map((row, index) => {
          const member = row.memberName ? members.find(m => m.name.toLowerCase() === row.memberName!.toLowerCase()) : undefined;
          return {
            id: `TRN${Date.now()}${index}`,
            date: new Date(row.date),
            description: row.description,
            amount: parseFloat(row.amount),
            type: row.type as 'Income' | 'Expense',
            category: row.category as 'Contribution' | 'Late Fee' | 'Project' | 'Social Fund' | 'Operational' | 'Last Respect',
            memberId: member?.id,
            memberName: member?.name,
          };
        });

        setTransactions((prev) => [...prev, ...newTransactions]);
        toast({
          title: "Import Successful",
          description: `${newTransactions.length} transactions have been added.`,
        });
      },
      error: (error) => {
        toast({
          variant: "destructive",
          title: "CSV Parsing Error",
          description: error.message,
        });
      },
    });

    event.target.value = "";
  };


  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KES",
    }).format(amount);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex gap-2">
           <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" /> Template
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
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Bot className="mr-2 h-4 w-4" /> Parse M-Pesa SMS
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI-Powered SMS Parser</DialogTitle>
                <DialogDescription>
                  Paste your M-Pesa SMS below and let AI extract the details and match it to a member.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="sms-text">M-Pesa SMS</Label>
                <Textarea
                  id="sms-text"
                  placeholder="Paste SMS here..."
                  rows={6}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleParseSms}
                  disabled={isParsing}
                  className="w-full"
                >
                  {isParsing ? "Parsing..." : "Parse with AI"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AddTransactionDialog members={members} onAddTransaction={handleAddTransaction} />
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
          <div className="rounded-lg border shadow-sm">
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
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {transaction.date.toLocaleDateString()}
                    </TableCell>
                    <TableCell>{transaction.memberName || "N/A"}</TableCell>
                    <TableCell className="font-medium">
                      {transaction.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.type === "Income" ? "outline" : "destructive"
                        }
                        className={
                          transaction.type === "Income"
                            ? "border-green-500 text-green-500"
                            : ""
                        }
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        transaction.type === "Income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
