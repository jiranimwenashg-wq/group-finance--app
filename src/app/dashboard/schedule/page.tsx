import ScheduleClient from "@/components/app/schedule-client";
import { getMembers } from "@/lib/data";

export default async function SchedulePage() {
  const members = await getMembers();
  return <ScheduleClient members={members} />;
}
