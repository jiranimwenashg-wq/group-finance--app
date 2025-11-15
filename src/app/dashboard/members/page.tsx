import MembersClient from "@/components/app/members-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getMembers } from "@/lib/data";
import { Suspense } from "react";

async function MembersData() {
  const members = await getMembers();
  return <MembersClient initialMembers={members} />;
}


export default function MembersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <MembersData />
    </Suspense>
  );
}
