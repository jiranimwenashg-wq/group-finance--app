
'use client';

import { Suspense, useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale, HandCoins, PiggyBank } from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { GROUP_ID, Transaction, Loan } from '@/lib/data';
import { formatCurrency } from '@/components/app/recent-transactions';

const OverviewChartData = dynamic(() => import('@/components/app/overview-chart').then(mod => mod.OverviewChartData), {
    loading: () => <Skeleton className="lg:col-span-3 h-[400px]" />,
    ssr: false
});

const RecentTransactions = dynamic(() => import('@/components/app/recent-transactions').then(mod => mod.RecentTransactions), {
    loading: () => <RecentTransactionsSkeleton />,
    ssr: false
});


function OverviewCards({ transactions, loans }: { transactions: Transaction[], loans: Loan[] }) {
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
    
    const outstandingLoans = loans
        .filter(l => l.status === 'Active')
        .reduce((sum, l) => sum + l.balance, 0);
        
    const paidLoans = loans
        .filter(l => l.status === 'Paid Off')
        .reduce((sum, l) => sum + l.principal, 0);

    return {
      income,
      expenses,
      netChange: income - expenses,
      totalBalance: totalIncome - totalExpenses,
      outstandingLoans,
      paidLoans,
    };
  }, [transactions, loans]);

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
            {formatCurrency(overview.expenses)}
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Loans</CardTitle>
          <HandCoins className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(overview.outstandingLoans)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total active loan balance
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid Loans</CardTitle>
          <PiggyBank className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(overview.paidLoans)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total principal from cleared loans
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Loans</CardTitle>
          <HandCoins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="mt-1 h-3 w-1/2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid Loans</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="mt-1 h-3 w-1/2" />
        </CardContent>
      </Card>
    </>
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

function DashboardData() {
  const firestore = useFirestore();
  const transactionsPath = `groups/${GROUP_ID}/transactions`;
  const loansPath = `groups/${GROUP_ID}/loans`;

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !GROUP_ID) return null;
    return collection(firestore, transactionsPath);
  }, [firestore]);
  
  const loansQuery = useMemoFirebase(() => {
    if (!firestore || !GROUP_ID) return null;
    return collection(firestore, loansPath);
  }, [firestore]);

  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(
    transactionsQuery,
    transactionsPath
  );
  
  const { data: loans, isLoading: isLoadingLoans } = useCollection<Loan>(
    loansQuery,
    loansPath
  );

  if (isLoadingTransactions || !transactions || isLoadingLoans || !loans) {
    return (
      <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <OverviewCardsSkeleton />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
          <Skeleton className="lg:col-span-3 h-[400px]" />
          <RecentTransactionsSkeleton />
        </div>
      </>
    )
  }
  
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <OverviewCards transactions={transactions} loans={loans} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <OverviewChartData transactions={transactions} />
        <RecentTransactions transactions={transactions} />
      </div>
    </>
  )
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          A snapshot of your group's financial health.
        </p>
      </div>
      <Suspense fallback={
         <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <OverviewCardsSkeleton />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Skeleton className="lg:col-span-3 h-[400px]" />
            <RecentTransactionsSkeleton />
          </div>
        </>
      }>
        <DashboardData />
      </Suspense>
    </div>
  );
}
