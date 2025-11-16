
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';

type InsuranceClientProps = {
  initialPayments: InsurancePayment[];
  members: Member[];
  policies: InsurancePolicy[];
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);

export default function InsuranceClient({
  initialPayments,
  members,
  policies,
}: InsuranceClientProps) {
  const [payments, setPayments] = useState(initialPayments);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(
    policies[0].id
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [filter, setFilter] = useState('');

  const activeMembers = useMemo(
    () => members.filter(m => 
      m.status === 'Active' && 
      m.name.toLowerCase().includes(filter.toLowerCase())
    ),
    [members, filter]
  );
  const selectedPolicy = useMemo(
    () => policies.find(p => p.id === selectedPolicyId)!,
    [selectedPolicyId, policies]
  );

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => new Date(selectedYear, i, 1)),
    [selectedYear]
  );

  const filteredPayments = useMemo(
    () => payments.filter(p => p.policyId === selectedPolicyId),
    [payments, selectedPolicyId]
  );

  const handlePaymentChange = (
    memberId: string,
    policyId: string,
    month: string,
    checked: boolean
  ) => {
    setPayments(prevPayments => {
      const paymentIndex = prevPayments.findIndex(
        p => p.memberId === memberId && p.policyId === policyId
      );
      if (paymentIndex === -1) return prevPayments;

      const newPayments = [...prevPayments];
      const paymentToUpdate = { ...newPayments[paymentIndex] };
      paymentToUpdate.payments = { ...paymentToUpdate.payments };
      paymentToUpdate.payments[month] = checked ? 'Paid' : 'Unpaid';
      newPayments[paymentIndex] = paymentToUpdate;
      return newPayments;
    });
  };
  
  const handleMarkMonthAsPaid = () => {
    const monthKey = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;
    setPayments(prevPayments => {
        const newPayments = [...prevPayments];
        activeMembers.forEach(member => {
            const paymentIndex = newPayments.findIndex(p => p.memberId === member.id && p.policyId === selectedPolicyId);
            if (paymentIndex !== -1) {
                const paymentToUpdate = { ...newPayments[paymentIndex] };
                paymentToUpdate.payments = { ...paymentToUpdate.payments };
                if (paymentToUpdate.payments[monthKey] !== 'Waived') {
                    paymentToUpdate.payments[monthKey] = 'Paid';
                }
                newPayments[paymentIndex] = paymentToUpdate;
            }
        });
        return newPayments;
    });
  };

  const monthlyStats = useMemo(() => {
    const allActiveMembers = members.filter(m => m.status === 'Active');
    const monthKey = `${selectedYear}-${(selectedMonth + 1)
      .toString()
      .padStart(2, '0')}`;
    const totalPossible = allActiveMembers.length * selectedPolicy.monthlyPremium;
    let collected = 0;

    payments.filter(p => p.policyId === selectedPolicyId).forEach(p => {
      if (
        allActiveMembers.some(am => am.id === p.memberId) &&
        p.payments[monthKey] === 'Paid'
      ) {
        collected += selectedPolicy.monthlyPremium;
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Insurance Tracking</h1>
        <div className="flex gap-2">
          <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a policy" />
            </SelectTrigger>
            <SelectContent>
              {policies.map(policy => (
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
            <div className="text-2xl font-bold">{formatCurrency(monthlyStats.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(monthlyStats.collected)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(monthlyStats.outstanding)}</div>
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
                    const memberPayment = filteredPayments.find(
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
                                {status ? (
                                <Checkbox
                                    checked={status === 'Paid'}
                                    onCheckedChange={checked =>
                                    handlePaymentChange(
                                        member.id,
                                        selectedPolicyId,
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
                                ) : (
                                <Badge variant="secondary">N/A</Badge>
                                )}
                            </TableCell>
                            );
                        })}
                         <TableCell className="text-right">
                             <div className="flex items-center gap-2 justify-end">
                                <span>{annualStats.paid}/{annualStats.total}</span>
                                <Progress value={(annualStats.paid / annualStats.total) * 100} className="w-16 h-2" />
                             </div>
                         </TableCell>
                        </TableRow>
                    );
                    })}
                </TableBody>
                </Table>
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
