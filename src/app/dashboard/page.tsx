'use client';

import { Suspense, useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { OverviewChart } from '@/components/app/overview-chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { GROUP_ID, Transaction } from '@/lib/data';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);

function OverviewCards({ transactions }: { transactions: Transaction[] }) {
  const overview = useMemo(() => {
    const now = new Date();
    const last30Days = new Date(new Date().setDate(now.getDate() - 30));

    const recentTransactions = transactions.filter(
      (t) => new Date(t.date) >= last30Days
    );

    const income = recentTransactions
      .filter((t) => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = recentTransactions
      .filter((t) => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactions
      .filter((t) => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      netChange: income + expenses,
      totalBalance: totalIncome + totalExpenses,
    };
  }, [transactions]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(overview.income)}
          </div>
          <p className="text-xs text-muted-foreground">in the last 30 days</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <ArrowDownLeft className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(Math.abs(overview.expenses))}
          </div>
          <p className="text-xs text-muted-foreground">in the last 30 days</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Change</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              overview.netChange >= 0 ? 'text-green-600' : 'text-destructive'
            }`}
          >
            {formatCurrency(overview.netChange)}
          </div>
          <p className="text-xs text-muted-foreground">in the last 30 days</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(overview.totalBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            Overall account balance
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function OverviewCardsSkeleton() {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="mt-1 h-3 w-1/2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="mt-1 h-3 w-1/2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Change</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="mt-1 h-3 w-1/2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="mt-1 h-3 w-1/2" />
        </CardContent>
      </Card>
    </>
  );
}

function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  const recentTransactions = useMemo(
    () => transactions.slice(0, 5),
    [transactions]
  );

  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
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
                <TableCell>{transaction.category}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(transaction.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RecentTransactionsSkeleton() {
  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
  );
}

function OverviewChartData({ transactions }: { transactions: Transaction[] }) {
  const chartData = useMemo(() => {
    // This is a simplified example. In a real app, you'd aggregate by month.
    const incomeByMonth: Record<string, number> = {};
    const expensesByMonth: Record<string, number> = {};

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const month = date.toLocaleString('default', { month: 'short' });
      if (t.type === 'Income') {
        incomeByMonth[month] = (incomeByMonth[month] || 0) + t.amount;
      } else {
        expensesByMonth[month] = (expensesByMonth[month] || 0) + t.amount;
      }
    });

    const allMonths = [
      ...new Set([
        ...Object.keys(incomeByMonth),
        ...Object.keys(expensesByMonth),
      ]),
    ];

    return allMonths.map((month) => ({
      month,
      income: incomeByMonth[month] || 0,
      expenses: (expensesByMonth[month] || 0) * -1,
    }));
  }, [transactions]);

  return <OverviewChart data={chartData} />;
}

export default function DashboardPage() {
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'groups', GROUP_ID, 'transactions');
  }, [firestore]);

  const { data: transactions, isLoading } = useCollection<Transaction>(
    transactionsQuery
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          A snapshot of your group's financial health.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<OverviewCardsSkeleton />}>
          {isLoading || !transactions ? (
            <OverviewCardsSkeleton />
          ) : (
            <OverviewCards transactions={transactions} />
          )}
        </Suspense>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        {isLoading || !transactions ? (
          <Skeleton className="lg:col-span-3 h-[400px]" />
        ) : (
          <OverviewChartData transactions={transactions} />
        )}
        <Suspense fallback={<RecentTransactionsSkeleton />}>
          {isLoading || !transactions ? (
            <RecentTransactionsSkeleton />
          ) : (
            <RecentTransactions transactions={transactions} />
          )}
        </Suspense>
      </div>
    </div>
  );
}
