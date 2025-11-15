import ConstitutionClient from "@/components/app/constitution-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function ConstitutionPage() {
  return (
    <Suspense
      fallback={
        <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="lg:col-span-1 h-[500px]" />
          <Skeleton className="lg:col-span-2 h-[500px]" />
        </div>
      }
    >
      <ConstitutionClient />
    </Suspense>
  );
}
