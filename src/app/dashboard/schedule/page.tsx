import ScheduleClient from "@/components/app/schedule-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getMembers } from "@/lib/data";
import { Suspense } from "react";

async function ScheduleData() {
  const members = await getMembers();
  return <ScheduleClient members={members} />;
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
      <ScheduleData />
    </Suspense>
  );
}
