
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Member } from "@/lib/data";
import { Button } from "../ui/button";
import { MoreHorizontal, Shuffle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

type ScheduleStatus = "Pending" | "Paid" | "Skipped";

type ScheduleItem = {
  payoutDate: Date;
  member: Member;
  status: ScheduleStatus;
  payoutAmount: number;
};

type ScheduleClientProps = {
  members: Member[];
};

const CONTRIBUTION_AMOUNT = 5000; // Assuming a fixed contribution amount

export default function ScheduleClient({ members }: ScheduleClientProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const activeMembers = useMemo(
    () => members.filter((m) => m.status === "Active"),
    [members]
  );

  const generateSchedule = () => {
    const shuffledMembers = [...activeMembers].sort(() => Math.random() - 0.5);
    const currentMonth = new Date().getMonth();
    const payoutAmount = activeMembers.length * CONTRIBUTION_AMOUNT;

    const newSchedule = shuffledMembers.map((member, index) => {
      const payoutDate = new Date();
      payoutDate.setDate(1); // Set to the 1st of the month
      payoutDate.setMonth(currentMonth + index);
      
      return {
        payoutDate,
        member: member,
        status: "Pending" as ScheduleStatus,
        payoutAmount,
      };
    });
    setSchedule(newSchedule);
  };

  useEffect(() => {
    generateSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activeMembers)]);

  const handleStatusChange = (
    payoutDate: Date,
    newStatus: ScheduleStatus
  ) => {
    setSchedule((prevSchedule) =>
      prevSchedule.map((item) =>
        item.payoutDate.getTime() === payoutDate.getTime() ? { ...item, status: newStatus } : item
      )
    );
  };

  const getBadgeVariant = (status: ScheduleStatus) => {
    switch (status) {
      case "Paid":
        return "default";
      case "Skipped":
        return "destructive";
      case "Pending":
      default:
        return "outline";
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KES",
    }).format(amount);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chama Schedule</h1>
        <Button onClick={generateSchedule} variant="outline">
          <Shuffle className="mr-2 h-4 w-4" /> Regenerate Schedule
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Merry-Go-Round Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {schedule.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Turn (Month)</TableHead>
                    <TableHead>Payout Date</TableHead>
                    <TableHead>Receiving Member</TableHead>
                    <TableHead>Payout Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((item) => (
                    <TableRow key={item.payoutDate.toISOString()}>
                      <TableCell className="font-medium">{format(item.payoutDate, "MMMM yyyy")}</TableCell>
                      <TableCell>{format(item.payoutDate, "do MMMM yyyy")}</TableCell>
                      <TableCell>{item.member.name}</TableCell>
                       <TableCell>{formatCurrency(item.payoutAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(item.payoutDate, "Paid")
                              }
                            >
                              Mark as Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(item.payoutDate, "Pending")
                              }
                            >
                              Mark as Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(item.payoutDate, "Skipped")
                              }
                            >
                              Mark as Skipped
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
              <p className="text-muted-foreground">
                No active members to generate a schedule.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
