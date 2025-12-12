
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { GROUP_ID } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";
import { formatCurrency } from "./recent-transactions";


type ScheduleStatus = "Pending" | "Paid" | "Skipped";

type ScheduleItem = {
  id: string;
  payoutDate: Date;
  memberId: string;
  memberName: string;
  status: ScheduleStatus;
  payoutAmount: number;
  groupId: string;
};

const CONTRIBUTION_AMOUNT = 5000;

const editPayoutSchema = z.object({
    payoutDate: z.date({ required_error: 'A date is required.' }),
    payoutAmount: z.coerce.number().min(1, 'Payout amount must be greater than 0.'),
});

function TableSkeleton() {
    return (
        <div className="rounded-lg border shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-28" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                        <TableHead className="text-right"><Skeleton className="h-5 w-10 ml-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><div className="flex justify-end"><Skeleton className="h-8 w-8" /></div></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default function ScheduleClient() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const firestore = useFirestore();

  const { toast } = useToast();

  const form = useForm<z.infer<typeof editPayoutSchema>>({
    resolver: zodResolver(editPayoutSchema),
  });
  
  const membersPath = `groups/${GROUP_ID}/members`;
  const schedulePath = `groups/${GROUP_ID}/savingsSchedules`;
  const transactionsPath = `groups/${GROUP_ID}/transactions`;

  const membersQuery = useMemoFirebase(() => {
      if(!firestore || !GROUP_ID) return null;
      return collection(firestore, membersPath);
  }, [firestore]);
  
  const scheduleQuery = useMemoFirebase(() => {
    if(!firestore || !GROUP_ID) return null;
    return collection(firestore, schedulePath);
  }, [firestore]);

  const { data: members, isLoading: isLoadingMembers } = useCollection<Member>(membersQuery, membersPath);
  const { data: schedule, isLoading: isLoadingSchedule } = useCollection<ScheduleItem>(scheduleQuery, schedulePath);


  const activeMembers = useMemo(
    () => members?.filter((m) => m.status === "Active") || [],
    [members]
  );
  
  const sortedSchedule = useMemo(
    () => schedule?.sort((a,b) => {
        const dateA = a.payoutDate instanceof Date ? a.payoutDate : (a.payoutDate as any).toDate();
        const dateB = b.payoutDate instanceof Date ? b.payoutDate : (b.payoutDate as any).toDate();
        return dateA.getTime() - dateB.getTime();
    }) || [],
    [schedule]
  )

  const generateSchedule = () => {
    if (!firestore || activeMembers.length === 0 || !GROUP_ID) return;
    
    const shuffledMembers = [...activeMembers].sort(() => Math.random() - 0.5);
    const currentMonth = new Date().getMonth();
    const payoutAmount = activeMembers.length * CONTRIBUTION_AMOUNT;
    const scheduleRef = collection(firestore, 'groups', GROUP_ID, 'savingsSchedules');

    // First, delete old schedule entries if any
    schedule?.forEach(item => {
        const docRef = doc(scheduleRef, item.id);
        deleteDocumentNonBlocking(docRef);
    });

    // Create new schedule
    shuffledMembers.forEach((member, index) => {
      const payoutDate = new Date();
      payoutDate.setDate(1);
      payoutDate.setMonth(currentMonth + index);
      
      const newItem: Omit<ScheduleItem, 'id'> = {
        payoutDate,
        memberId: member.id,
        memberName: member.name,
        status: "Pending",
        payoutAmount,
        groupId: GROUP_ID,
      };
      const newDocRef = doc(scheduleRef); // Create a new doc reference with a generated ID
      setDocumentNonBlocking(newDocRef, newItem, { merge: false });
    });

    toast({ title: "Schedule Regenerated", description: "A new savings schedule has been created."})
  };


  useEffect(() => {
    if (selectedItem) {
        const payoutDate = selectedItem.payoutDate instanceof Date 
            ? selectedItem.payoutDate 
            : (selectedItem.payoutDate as any).toDate();

        form.reset({
            payoutDate: payoutDate,
            payoutAmount: selectedItem.payoutAmount,
        })
    }
  }, [selectedItem, form])

  const handleStatusChange = (
    item: ScheduleItem,
    newStatus: ScheduleStatus
  ) => {
    if (!firestore || !GROUP_ID) return;
    const docRef = doc(firestore, 'groups', GROUP_ID, 'savingsSchedules', item.id);
    setDocumentNonBlocking(docRef, { status: newStatus }, { merge: true });

    if (newStatus === "Paid") {
        const transactionsRef = collection(firestore, transactionsPath);
        const newTransaction = {
            groupId: GROUP_ID,
            date: new Date(),
            description: `Payout to ${item.memberName}`,
            amount: item.payoutAmount,
            type: 'Expense' as const,
            category: 'Operational' as const,
            memberId: item.memberId,
            memberName: item.memberName
        }
        addDocumentNonBlocking(transactionsRef, newTransaction);
        toast({
            title: "Payout Recorded",
            description: `An expense of ${formatCurrency(item.payoutAmount)} has been recorded for ${item.memberName}.`,
        });
    }
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
    if (!selectedItem || !firestore || !GROUP_ID) return;
    const docRef = doc(firestore, 'groups', GROUP_ID, 'savingsSchedules', selectedItem.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Payout Deleted", description: `The payout for ${selectedItem.memberName} has been removed.` });
    setIsDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleSave = (values: z.infer<typeof editPayoutSchema>) => {
    if (!selectedItem || !firestore || !GROUP_ID) return;
    const docRef = doc(firestore, 'groups', GROUP_ID, 'savingsSchedules', selectedItem.id);

    setDocumentNonBlocking(docRef, {
        payoutDate: values.payoutDate,
        payoutAmount: values.payoutAmount
    }, { merge: true });

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

  const isLoading = isLoadingMembers || isLoadingSchedule;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Chama Schedule</h1>
            <p className="text-muted-foreground">Manage your group's rotating savings schedule.</p>
        </div>
        <Button onClick={generateSchedule} variant="outline" className="shrink-0" disabled={isLoading}>
          <Shuffle className="mr-2 h-4 w-4" /> Regenerate Schedule
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Merry-Go-Round Schedule</CardTitle>
          <CardDescription>Manage your group's rotating savings and credit schedule. You can edit, delete, and update the status of each payout.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <TableSkeleton /> : sortedSchedule.length > 0 ? (
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
                  {sortedSchedule.map((item) => {
                    const payoutDate = item.payoutDate instanceof Date ? item.payoutDate : (item.payoutDate as any).toDate();
                    return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{format(payoutDate, "MMMM yyyy")}</TableCell>
                      <TableCell>{format(payoutDate, "do MMMM yyyy")}</TableCell>
                      <TableCell>{item.memberName}</TableCell>
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
                              onClick={() => handleStatusChange(item, "Paid")}
                            >
                              Mark as Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item, "Pending")}
                            >
                              Mark as Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item, "Skipped")}
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
                  )})}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
              <p className="text-muted-foreground">
                {activeMembers.length > 0 ? "No schedule generated yet. Click 'Regenerate Schedule' to start." : "No active members to generate a schedule."}
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
                    Update the payout details for {selectedItem?.memberName}.
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
                                        {field.value instanceof Date && !isNaN(field.value.getTime()) ? (
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
                                    captionLayout="dropdown-buttons"
                                    fromYear={new Date().getFullYear() - 10}
                                    toYear={new Date().getFullYear()}
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
              This will permanently delete the payout for <span className="font-semibold">{selectedItem?.memberName}</span> on <span className="font-semibold">{selectedItem ? format(selectedItem.payoutDate instanceof Date ? selectedItem.payoutDate : (selectedItem.payoutDate as any).toDate(), "do MMMM yyyy") : ''}</span>.
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

    