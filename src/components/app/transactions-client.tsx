
"use client";

import { useState, useMemo } from "react";
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
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Bot, PlusCircle } from "lucide-react";
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

type TransactionsClientProps = {
  initialTransactions: Transaction[];
  members: Member[];
};

export default function TransactionsClient({
  initialTransactions,
  members,
}: TransactionsClientProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [smsText, setSmsText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const { toast } = useToast();

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const searchTerm = filter.toLowerCase();
      const descriptionMatch = transaction.description.toLowerCase().includes(searchTerm);
      const memberNameMatch = transaction.memberName?.toLowerCase().includes(searchTerm);
      const categoryMatch = transaction.category.toLowerCase().includes(searchTerm);
      return descriptionMatch || !!memberNameMatch && memberNameMatch || categoryMatch;
    });
  }, [transactions, filter]);

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

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input id="description" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="member" className="text-right">
                    Member
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a member (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {members
                        .filter((m) => m.status === "Active")
                        .map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount
                  </Label>
                  <Input id="amount" type="number" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={() => setAddDialogOpen(false)}>
                  Save Transaction
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
