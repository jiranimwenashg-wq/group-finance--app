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
import { MoreHorizontal, Shuffle, CalendarIcon, Trash2, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";


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

const editPayoutSchema = z.object({
    payoutDate: z.date({ required_error: 'A date is required.' }),
    payoutAmount: z.coerce.number().min(1, 'Payout amount must be greater than 0.'),
});

export default function ScheduleClient({ members }: ScheduleClientProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  const { toast } = useToast();

  const form = useForm<z.infer<typeof editPayoutSchema>>({
    resolver: zodResolver(editPayoutSchema),
  });

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
      payoutDate.setDate(1);
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

  useEffect(() => {
    if (selectedItem) {
        form.reset({
            payoutDate: selectedItem.payoutDate,
            payoutAmount: selectedItem.payoutAmount,
        })
    }
  }, [selectedItem, form])

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

  const handleEditClick = (item: ScheduleItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (item: ScheduleItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedItem) return;
    setSchedule(prev => prev.filter(item => item.payoutDate.getTime() !== selectedItem.payoutDate.getTime()));
    toast({ title: "Payout Deleted", description: `The payout for ${selectedItem.member.name} has been removed.` });
    setIsDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleSave = (values: z.infer<typeof editPayoutSchema>) => {
    if (!selectedItem) return;

    setSchedule(prev => prev.map(item => 
        item.member.id === selectedItem.member.id
        ? { ...item, payoutDate: values.payoutDate, payoutAmount: values.payoutAmount }
        : item
    ).sort((a,b) => a.payoutDate.getTime() - b.payoutDate.getTime()));

    toast({ title: "Payout Updated", description: "The payout details have been saved." });
    setIsEditDialogOpen(false);
    setSelectedItem(null);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Chama Schedule</h1>
            <p className="text-muted-foreground">Manage your group's rotating savings schedule.</p>
        </div>
        <Button onClick={generateSchedule} variant="outline" className="shrink-0">
          <Shuffle className="mr-2 h-4 w-4" /> Regenerate Schedule
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Merry-Go-Round Schedule</CardTitle>
          <CardDescription>Manage your group's rotating savings and credit schedule. You can edit, delete, and update the status of each payout.</CardDescription>
        </CardHeader>
        <CardContent>
          {schedule.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Turn (Month)</TableHead>
                    <TableHead>Payout Date</TableHead>
                    <TableHead>Receiving Member</TableHead>
                    <TableHead>Payout Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((item) => (
                    <TableRow key={item.member.id}>
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
                              onClick={() => handleStatusChange(item.payoutDate, "Paid")}
                            >
                              Mark as Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item.payoutDate, "Pending")}
                            >
                              Mark as Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item.payoutDate, "Skipped")}
                            >
                              Mark as Skipped
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => handleEditClick(item)}>
                               <Pencil className="mr-2 h-4 w-4" />
                               Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteClick(item)} className="text-red-600">
                               <Trash2 className="mr-2 h-4 w-4" />
                               Delete
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Edit Payout</DialogTitle>
                   <DialogDescription>
                    Update the payout details for {selectedItem?.member.name}.
                    </DialogDescription>
              </DialogHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
                     <FormField
                        control={form.control}
                        name="payoutDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-[240px] pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        {field.value ? (
                                        format(field.value, "PPP")
                                        ) : (
                                        <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                    />
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                            control={form.control}
                            name="payoutAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
             </Form>
          </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the payout for <span className="font-semibold">{selectedItem?.member.name}</span> on <span className="font-semibold">{selectedItem ? format(selectedItem.payoutDate, "do MMMM yyyy") : ''}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
