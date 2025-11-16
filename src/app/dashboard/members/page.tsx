import MembersClient from "@/components/app/members-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";


export default function MembersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <MembersClient />
    </Suspense>
  );
}
