
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Bell, Trash2, Bot, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { createEventFromText } from "@/ai/flows/create-event-from-text";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from 'lucide-react';
import { ScrollArea } from "../ui/scroll-area";


type Event = {
  id: string;
  title: string;
  date: Date;
  description?: string;
};

const eventSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  date: z.date({ required_error: 'A date is required.' }),
  description: z.string().optional(),
});

const getFirstSundayOfMonth = (year: number, month: number): Date => {
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, ...
    const dateOfFirstSunday = 1 + (7 - dayOfWeek) % 7;
    return new Date(year, month, dateOfFirstSunday);
}

function AiEventCreator({
  onEventParsed,
}: {
  onEventParsed: (data: { title: string; date: Date; description?: string }) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();

  const handleParse = async () => {
    if (!prompt.trim()) return;
    setIsParsing(true);
    try {
      const result = await createEventFromText({ prompt });
      const eventDate = new Date(result.date);
      // Adjust for timezone offset
      const timezoneOffset = eventDate.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(eventDate.getTime() + timezoneOffset);

      onEventParsed({
        title: result.title,
        date: adjustedDate,
        description: result.description,
      });
      setPrompt("");
    } catch (error) {
      console.error("Failed to parse event:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not create event from the provided text.",
      });
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="size-5" />
          Create with AI
        </CardTitle>
        <CardDescription>
          Describe the event you want to create, and AI will fill in the
          details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Textarea
            placeholder="e.g., Schedule a budget review meeting next Friday at 2pm"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button
            onClick={handleParse}
            disabled={isParsing}
            className="w-full"
          >
            {isParsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isParsing ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CalendarClient() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const monthlyMeetings: Event[] = [];
    for (let month = 0; month < 12; month++) {
      const meetingDate = getFirstSundayOfMonth(currentYear, month);
      monthlyMeetings.push({
        id: `MM-${currentYear}-${month}`,
        title: "Monthly Meeting",
        date: meetingDate,
        description: "Group monthly general meeting.",
      });
    }
    setEvents(monthlyMeetings);
  }, []);

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      date: new Date(),
      description: "",
    },
  });
  
  const handleAiEventParsed = (data: { title: string; date: Date; description?: string }) => {
    form.reset(data);
    setIsAddDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof eventSchema>) => {
    const newEvent: Event = {
      ...values,
      id: `EVT${Date.now()}`,
    };
    setEvents((prev) => [...prev, newEvent].sort((a,b) => a.date.getTime() - b.date.getTime()));
    toast({
      title: "Event Created",
      description: `${values.title} has been added to the calendar.`,
    });
    form.reset({ title: "", date: new Date(), description: "" });
    setIsAddDialogOpen(false);
  };
  
  const deleteEvent = (eventId: string) => {
    if (eventId.startsWith('MM-')) {
        toast({
            variant: 'destructive',
            title: "Action Not Allowed",
            description: "Default monthly meetings cannot be deleted.",
        });
        return;
    }
    setEvents(prev => prev.filter(event => event.id !== eventId));
    toast({
        variant: 'destructive',
        title: "Event Deleted",
        description: `The event has been removed from the calendar.`,
    });
  }

  const eventsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(
      (event) => event.date.toDateString() === selectedDate.toDateString()
    );
  }, [events, selectedDate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Group Calendar</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
                form.reset({ title: "", date: new Date(), description: "" });
            }
        }}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Event
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Event</DialogTitle>
                    <DialogDescription>
                        Fill in the details for the new group event.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Monthly General Meeting" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date"
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
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Provide additional details..." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                            <Button type="submit">Save Event</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </div>
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
           <Card>
             <CardContent className="p-2">
                <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="w-full"
                modifiers={{
                    events: events.map(e => e.date),
                }}
                modifiersStyles={{
                    events: {
                    color: 'hsl(var(--primary-foreground))',
                    backgroundColor: 'hsl(var(--primary))',
                    }
                }}
                />
             </CardContent>
           </Card>
           <AiEventCreator onEventParsed={handleAiEventParsed} />
        </div>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>
              Events for {selectedDate ? format(selectedDate, "do MMMM yyyy") : "..."}
            </CardTitle>
            <CardDescription>All scheduled events for the selected day.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[480px]">
                {eventsOnSelectedDate.length > 0 ? (
                <div className="space-y-4">
                    {eventsOnSelectedDate.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 rounded-lg border p-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Bell className="size-4" />
                        </div>
                        <div className="flex-1">
                        <p className="font-semibold">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => deleteEvent(event.id)}>
                            <Trash2 className="size-4 text-destructive" />
                        </Button>
                    </div>
                    ))}
                </div>
                ) : (
                <div className="flex h-[200px] flex-col items-center justify-center text-center">
                    <p className="text-muted-foreground">No events for this day.</p>
                </div>
                )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
