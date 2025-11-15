import InsuranceClient from "@/components/app/insurance-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getInsurancePayments, getMembers, insurancePolicies } from "@/lib/data";
import { Suspense } from "react";

async function InsuranceData() {
  const [payments, members] = await Promise.all([
    getInsurancePayments(),
    getMembers(),
  ]);

  return (
    <InsuranceClient
      initialPayments={payments}
      members={members}
      policies={insurancePolicies}
    />
  );
}

export default function InsurancePage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
      <InsuranceData />
    </Suspense>
  );
}
