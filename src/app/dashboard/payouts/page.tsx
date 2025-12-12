
import PayoutsClient from "@/components/app/payouts-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function PayoutsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
      <PayoutsClient />
    </Suspense>
  );
}
