import ScheduleClient from "@/components/app/schedule-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function SchedulePage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
      <ScheduleClient />
    </Suspense>
  );
}
