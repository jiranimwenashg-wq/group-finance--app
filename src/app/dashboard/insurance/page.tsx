import InsuranceClient from "@/components/app/insurance-client";
import { getInsurancePayments, getMembers, insurancePolicies } from "@/lib/data";

export default async function InsurancePage() {
  const [payments, members] = await Promise.all([
    getInsurancePayments(),
    getMembers(),
  ]);

  return (
    <InsuranceClient
      initialPayments={payments}
      members={members}
      policies={insurancePolicies}
    />
  );
}
