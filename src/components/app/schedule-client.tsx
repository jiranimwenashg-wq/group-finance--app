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
import { Shuffle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

type ScheduleClientProps = {
  members: Member[];
};

type ScheduleItem = {
  month: string;
  member: Member;
};

export default function ScheduleClient({ members }: ScheduleClientProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const activeMembers = useMemo(() => members.filter(m => m.status === 'Active'), [members]);

  const generateSchedule = () => {
    const shuffledMembers = [...activeMembers].sort(() => Math.random() - 0.5);
    const currentMonth = new Date().getMonth();
    
    const newSchedule = shuffledMembers.map((member, index) => {
      const date = new Date();
      date.setMonth(currentMonth + index);
      return {
        month: date.toLocaleString("default", { month: "long", year: 'numeric' }),
        member: member,
      };
    });
    setSchedule(newSchedule);
  };
  
  useEffect(() => {
    generateSchedule();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activeMembers)]);


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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedule.map((item) => (
                            <TableRow key={item.month}>
                                <TableCell className="font-medium">{item.month}</TableCell>
                                <TableCell>{item.member.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">Pending</Badge>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <p className="text-muted-foreground">No active members to generate a schedule.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
