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

type ScheduleStatus = "Pending" | "Paid" | "Skipped";

type ScheduleItem = {
  month: string;
  member: Member;
  status: ScheduleStatus;
};

type ScheduleClientProps = {
  members: Member[];
};

export default function ScheduleClient({ members }: ScheduleClientProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const activeMembers = useMemo(
    () => members.filter((m) => m.status === "Active"),
    [members]
  );

  const generateSchedule = () => {
    const shuffledMembers = [...activeMembers].sort(() => Math.random() - 0.5);
    const currentMonth = new Date().getMonth();

    const newSchedule = shuffledMembers.map((member, index) => {
      const date = new Date();
      date.setMonth(currentMonth + index);
      return {
        month: date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        member: member,
        status: "Pending" as ScheduleStatus,
      };
    });
    setSchedule(newSchedule);
  };

  useEffect(() => {
    generateSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activeMembers)]);

  const handleStatusChange = (
    month: string,
    newStatus: ScheduleStatus
  ) => {
    setSchedule((prevSchedule) =>
      prevSchedule.map((item) =>
        item.month === month ? { ...item, status: newStatus } : item
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
                    <TableHead>Receiving Member</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((item) => (
                    <TableRow key={item.month}>
                      <TableCell className="font-medium">{item.month}</TableCell>
                      <TableCell>{item.member.name}</TableCell>
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
                                handleStatusChange(item.month, "Paid")
                              }
                            >
                              Mark as Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(item.month, "Pending")
                              }
                            >
                              Mark as Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(item.month, "Skipped")
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
