import HelpClient from "@/components/app/help-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function HelpPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
      <HelpClient />
    </Suspense>
  );
}
