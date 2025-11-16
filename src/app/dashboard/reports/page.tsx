import ReportsClient from "@/components/app/reports-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getInsurancePayments, getMembers, getTransactions, insurancePolicies } from "@/lib/data";
import { Suspense } from "react";

async function ReportsData() {
  const [members, transactions, insurancePayments] = await Promise.all([
    getMembers(),
    getTransactions(),
    getInsurancePayments(),
  ]);

  return (
    <ReportsClient
      members={members}
      transactions={transactions}
      insurancePayments={insurancePayments}
      policies={insurancePolicies}
    />
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
        </div>
    }>
      <ReportsData />
    </Suspense>
  );
}
