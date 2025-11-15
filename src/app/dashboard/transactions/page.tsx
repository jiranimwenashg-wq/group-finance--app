import TransactionsClient from "@/components/app/transactions-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getTransactions } from "@/lib/data";
import { Suspense } from "react";

async function TransactionsData() {
  const transactions = await getTransactions();
  return <TransactionsClient initialTransactions={transactions} />;
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
      <TransactionsData />
    </Suspense>
  );
}
