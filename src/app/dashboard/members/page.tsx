import MembersClient from "@/components/app/members-client";
import { getMembers } from "@/lib/data";

export default async function MembersPage() {
  const members = await getMembers();
  return <MembersClient initialMembers={members} />;
}
