"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InsurancePayment, Member, InsurancePolicy } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type InsuranceClientProps = {
  initialPayments: InsurancePayment[];
  members: Member[];
  policies: InsurancePolicy[];
};

export default function InsuranceClient({
  initialPayments,
  members,
  policies,
}: InsuranceClientProps) {
  const [payments, setPayments] = useState(initialPayments);
  const [selectedPolicy, setSelectedPolicy] = useState<string>(policies[0].id);

  const currentYear = new Date().getFullYear();
  const months = Array.from(
    { length: 12 },
    (_, i) => new Date(currentYear, i, 1)
  );

  const getMemberName = (memberId: string) =>
    members.find((m) => m.id === memberId)?.name || "Unknown Member";

  const handlePaymentChange = (
    memberId: string,
    policyId: string,
    month: string,
    checked: boolean
  ) => {
    setPayments((prevPayments) => {
      return prevPayments.map((p) => {
        if (p.memberId === memberId && p.policyId === policyId) {
          const newPayments = { ...p.payments };
          newPayments[month] = checked ? "Paid" : "Unpaid";
          return { ...p, payments: newPayments };
        }
        return p;
      });
    });
  };

  const filteredPayments = payments.filter(p => p.policyId === selectedPolicy);
  const activeMembers = members.filter(m => m.status === 'Active');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Insurance Tracking</h1>
        <div className="w-[200px]">
          <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
            <SelectTrigger>
              <SelectValue placeholder="Select a policy" />
            </SelectTrigger>
            <SelectContent>
              {policies.map((policy) => (
                <SelectItem key={policy.id} value={policy.id}>
                  {policy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Member</TableHead>
              {months.map((month) => (
                <TableHead key={month.toISOString()} className="text-center">
                  {month.toLocaleString("default", { month: "short" })}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeMembers.map((member) => {
              const memberPayment = filteredPayments.find(
                (p) => p.memberId === member.id
              );
              return (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.name}
                  </TableCell>
                  {months.map((month) => {
                    const monthKey = `${currentYear}-${(month.getMonth() + 1)
                      .toString()
                      .padStart(2, "0")}`;
                    const status = memberPayment?.payments[monthKey];

                    if (status === 'Waived') {
                        return <TableCell key={monthKey} className="text-center"><Badge variant="outline">N/A</Badge></TableCell>
                    }

                    return (
                      <TableCell key={monthKey} className="text-center">
                        {status ? (
                          <Checkbox
                            checked={status === "Paid"}
                            onCheckedChange={(checked) =>
                              handlePaymentChange(
                                member.id,
                                selectedPolicy,
                                monthKey,
                                !!checked
                              )
                            }
                            aria-label={`Payment for ${member.name} in ${month.toLocaleString(
                              "default",
                              { month: "long" }
                            )}`}
                          />
                        ) : (
                          <Badge variant="secondary">N/A</Badge>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
