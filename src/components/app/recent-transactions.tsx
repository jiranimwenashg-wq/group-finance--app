
'use client';

import { useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
    const recentTransactions = useMemo(
      () => transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
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
