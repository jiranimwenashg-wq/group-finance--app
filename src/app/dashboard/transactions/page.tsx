
import TransactionsClient from "@/components/app/transactions-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function TransactionsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
      <TransactionsClient />
    </Suspense>
  );
}
