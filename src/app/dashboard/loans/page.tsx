import LoansClient from "@/components/app/loans-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function LoansPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
      <LoansClient />
    </Suspense>
  );
}
