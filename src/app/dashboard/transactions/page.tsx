
import TransactionsClient from "@/components/app/transactions-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getMembers, getTransactions } from "@/lib/data";
import { Suspense } from "react";

async function TransactionsData() {
  const [transactions, members] = await Promise.all([
    getTransactions(),
    getMembers(),
  ]);
  return <TransactionsClient initialTransactions={transactions} members={members} />;
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
      <TransactionsData />
    </Suspense>
  );
}
