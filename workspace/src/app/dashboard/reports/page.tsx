import ReportsClient from "@/components/app/reports-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function ReportsPage() {
  return (
    <Suspense fallback={
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
        </div>
    }>
      <ReportsClient />
    </Suspense>
  );
}
