import CalendarClient from "@/components/app/calendar-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[200px]" />
        </div>
        <Skeleton className="lg:col-span-1 h-full" />
      </div>
    }>
      <CalendarClient />
    </Suspense>
  );
}
