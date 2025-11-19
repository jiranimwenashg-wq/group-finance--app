

'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { InsurancePayment, Member, InsurancePolicy } from '@/lib/data';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, query } from 'firebase/firestore';
import { GROUP_ID } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);

const policySchema = z.object({
    name: z.string().min(1, 'Policy name is required'),
    premiumAmount: z.coerce.number().positive('Premium amount must be a positive number'),
});

function TableSkeleton() {
    return (
        <div className="rounded-lg border shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                        {[...Array(12)].map((_, i) => (
                           <TableHead key={i}><Skeleton className="h-5 w-10 mx-auto" /></TableHead>
                        ))}
                        <TableHead className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                             {[...Array(12)].map((_, j) => (
                                <TableCell key={j}><Skeleton className="h-5 w-5 mx-auto" /></TableCell>
                            ))}
                            <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function AddPolicyDialog() {
    const [open, setOpen] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();
    const form = useForm<z.infer<typeof policySchema>>({
        resolver: zodResolver(policySchema),
    });

    const onSubmit = (values: z.infer<typeof policySchema>) => {
        if (!firestore) return;
        const policiesRef = collection(firestore, `groups/${GROUP_ID}/insurancePolicies`);
        addDocumentNonBlocking(policiesRef, {
            ...values,
            groupId: GROUP_ID,
        });

        toast({
            title: 'Policy Created',
            description: `The "${values.name}" policy has been successfully created.`,
        });

        form.reset();
        setOpen(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <PlusCircle className="mr-2 size-4" />
                    New Policy
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Insurance Policy</DialogTitle>
                    <DialogDescription>Fill in the details for the new insurance policy.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Policy Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., NHIF" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="premiumAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Premium Amount (Monthly)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 500" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">Create Policy</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


export default function InsuranceClient() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [filter, setFilter] = useState('');
  const firestore = useFirestore();

  const policiesPath = `groups/${GROUP_ID}/insurancePolicies`;
  const policiesQuery = useMemoFirebase(() => {
    if (!firestore || !GROUP_ID) return null;
    return collection(firestore, policiesPath);
  }, [firestore]);
  const { data: policies, isLoading: isLoadingPolicies } = useCollection<InsurancePolicy>(policiesQuery, policiesPath);
  
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | undefined>(undefined);

  const membersPath = `groups/${GROUP_ID}/members`;
  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !GROUP_ID) return null;
    return collection(firestore, membersPath);
  }, [firestore]);
  
  const {data: members, isLoading: isLoadingMembers} = useCollection<Member>(membersQuery, membersPath);

  const paymentsPath = `groups/${GROUP_ID}/insurancePolicies/${selectedPolicyId}/payments`;
  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedPolicyId || !GROUP_ID) return null;
    const paymentsCollection = collection(firestore, paymentsPath);
    return query(paymentsCollection);
  }, [firestore, selectedPolicyId]);

  const {data: payments, isLoading: isLoadingPayments} = useCollection<InsurancePayment>(paymentsQuery, paymentsPath);
  
  const activeMembers = useMemo(
    () => members?.filter(m => 
      m.status === 'Active' && 
      m.name.toLowerCase().includes(filter.toLowerCase())
    ).sort((a,b) => a.name.localeCompare(b.name)) || [],
    [members, filter]
  );
  
  const selectedPolicy = useMemo(() => {
      if (!selectedPolicyId || !policies) return null;
      return policies.find(p => p.id === selectedPolicyId);
  }, [selectedPolicyId, policies]);


  useEffect(() => {
    if (policies && policies.length > 0 && !selectedPolicyId) {
      setSelectedPolicyId(policies[0].id);
    }
  }, [policies, selectedPolicyId]);

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => new Date(selectedYear, i, 1)),
    [selectedYear]
  );
  
  const handlePaymentChange = (
    memberId: string,
    month: string,
    checked: boolean
  ) => {
    if(!firestore || !selectedPolicyId || !selectedPolicy || !GROUP_ID) return;

    const payment = payments?.find(p => p.memberId === memberId);
    
    if (payment) {
        const paymentRef = doc(firestore, 'groups', GROUP_ID, 'insurancePolicies', selectedPolicyId, 'payments', payment.id);
        const newPayments = { ...payment.payments };
        newPayments[month] = checked ? 'Paid' : 'Unpaid';
        setDocumentNonBlocking(paymentRef, { payments: newPayments }, { merge: true });
    } else {
        const paymentsRef = collection(firestore, 'groups', GROUP_ID, 'insurancePolicies', selectedPolicyId, 'payments');
        const newPayment: Omit<InsurancePayment, 'id'> = {
            memberId,
            policyId: selectedPolicy.id,
            groupId: GROUP_ID,
            payments: {
                [month]: checked ? 'Paid' : 'Unpaid'
            }
        };
        addDocumentNonBlocking(paymentsRef, newPayment);
    }
  };
  
  const handleMarkMonthAsPaid = () => {
     if(!firestore || !activeMembers || !payments || !selectedPolicyId || !selectedPolicy || !GROUP_ID) return;
     const monthKey = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;

     activeMembers.forEach(member => {
        const payment = payments.find(p => p.memberId === member.id);
        
        if (payment) {
            const paymentRef = doc(firestore, 'groups', GROUP_ID, 'insurancePolicies', selectedPolicyId, 'payments', payment.id);
            if (payment.payments[monthKey] !== 'Waived') {
                setDocumentNonBlocking(paymentRef, {
                    payments: {
                        ...payment.payments,
                        [monthKey]: 'Paid',
                    }
                }, { merge: true });
            }
        } else {
             const paymentsRef = collection(firestore, 'groups', GROUP_ID, 'insurancePolicies', selectedPolicyId, 'payments');
             const newPayment: Omit<InsurancePayment, 'id'> = {
                memberId: member.id,
                policyId: selectedPolicy.id,
                groupId: GROUP_ID,
                payments: {
                    [monthKey]: 'Paid'
                }
            };
            addDocumentNonBlocking(paymentsRef, newPayment);
        }
    });
  };

  const monthlyStats = useMemo(() => {
    if (!selectedPolicy) return { total: 0, collected: 0, outstanding: 0};
    const allActiveMembers = members?.filter(m => m.status === 'Active') || [];
    const monthKey = `${selectedYear}-${(selectedMonth + 1)
      .toString()
      .padStart(2, '0')}`;
    const totalPossible = allActiveMembers.length * selectedPolicy.premiumAmount;
    let collected = 0;

    payments?.forEach(p => {
      if (
        allActiveMembers.some(am => am.id === p.memberId) &&
        p.payments[monthKey] === 'Paid'
      ) {
        collected += selectedPolicy.premiumAmount;
      }
    });

    return {
      total: totalPossible,
      collected: collected,
      outstanding: totalPossible - collected,
    };
  }, [
    selectedYear,
    selectedMonth,
    members,
    selectedPolicy,
    payments,
  ]);

  const years = [
    new Date().getFullYear() + 1,
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
  ];

  const isLoading = isLoadingMembers || isLoadingPayments || isLoadingPolicies;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Insurance</h1>
            <p className="text-muted-foreground">Track member payments for insurance policies.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <AddPolicyDialog />
          <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId} disabled={isLoading}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={isLoading ? "Loading..." : "Select a policy"} />
            </SelectTrigger>
            <SelectContent>
              {policies?.map(policy => (
                <SelectItem key={policy.id} value={policy.id}>
                  {policy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(selectedYear)}
            onValueChange={val => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Premiums ({months[selectedMonth].toLocaleString('default', { month: 'long' })})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24"/> : <div className="text-2xl font-bold">{formatCurrency(monthlyStats.total)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-24"/> : <div className="text-2xl font-bold text-green-600">{formatCurrency(monthlyStats.collected)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-24"/> : <div className="text-2xl font-bold text-destructive">{formatCurrency(monthlyStats.outstanding)}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle>Monthly Contributions</CardTitle>
              <CardDescription>
                Filter by member name or select a month to view and update payment statuses.
              </CardDescription>
              <Input 
                placeholder="Filter members by name..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="mt-4 max-w-sm"
              />
            </div>
             <div className="flex items-center gap-2">
                <Select value={String(selectedMonth)} onValueChange={val => setSelectedMonth(Number(val))}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map((m, i) => (
                            <SelectItem key={i} value={String(i)}>{m.toLocaleString('default', { month: 'long' })}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Button onClick={handleMarkMonthAsPaid}>Mark All Paid</Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <TableSkeleton /> : (
            <div className="rounded-lg border shadow-sm">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[200px]">Member</TableHead>
                    <TableHead>Status</TableHead>
                    {months.map(month => (
                        <TableHead key={month.toISOString()} className="text-center">
                        {month.toLocaleString('default', { month: 'short' })}
                        </TableHead>
                    ))}
                     <TableHead className="text-right w-[150px]">Annual Progress</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {activeMembers.map(member => {
                    const memberPayment = payments?.find(
                        p => p.memberId === member.id
                    );

                    const annualStats = {
                        paid: 0,
                        total: 0,
                    };

                    months.forEach(month => {
                        const monthKey = `${selectedYear}-${(month.getMonth() + 1).toString().padStart(2, '0')}`;
                        const status = memberPayment?.payments[monthKey];
                        if (status !== 'Waived') {
                            annualStats.total++;
                            if(status === 'Paid') {
                                annualStats.paid++;
                            }
                        }
                    });
                    
                    return (
                        <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              member.status === "Active" ? "default" : "outline"
                            }
                            className={
                              member.status === "Active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : ""
                            }
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        {months.map(month => {
                            const monthKey = `${selectedYear}-${(month.getMonth() + 1)
                            .toString()
                            .padStart(2, '0')}`;
                            const status = memberPayment?.payments[monthKey];

                            if (status === 'Waived') {
                            return (
                                <TableCell key={monthKey} className="text-center">
                                <Badge variant="outline">N/A</Badge>
                                </TableCell>
                            );
                            }

                            return (
                            <TableCell key={monthKey} className="text-center">
                                <Checkbox
                                    checked={status === 'Paid'}
                                    onCheckedChange={checked =>
                                    handlePaymentChange(
                                        member.id,
                                        monthKey,
                                        !!checked
                                    )
                                    }
                                    aria-label={`Payment for ${
                                    member.name
                                    } in ${month.toLocaleString('default', {
                                    month: 'long',
                                    })}`}
                                />
                            </TableCell>
                            );
                        })}
                         <TableCell className="text-right">
                             <div className="flex items-center gap-2 justify-end">
                                <span>{annualStats.paid}/{annualStats.total || 1}</span>
                                <Progress value={(annualStats.paid / (annualStats.total || 1)) * 100} className="w-16 h-2" />
                             </div>
                         </TableCell>
                        </TableRow>
                    );
                    })}
                </TableBody>
                </Table>
            </div>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
