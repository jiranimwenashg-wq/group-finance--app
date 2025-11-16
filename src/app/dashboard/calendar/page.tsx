import CalendarClient from "@/components/app/calendar-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="lg:col-span-2 h-[600px]" />
        <Skeleton className="lg:col-span-1 h-[600px]" />
      </div>
    }>
      <CalendarClient />
    </Suspense>
  );
}
