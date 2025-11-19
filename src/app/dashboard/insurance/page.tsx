import InsuranceClient from "@/components/app/insurance-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function InsurancePage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
      <InsuranceClient />
    </Suspense>
  );
}
