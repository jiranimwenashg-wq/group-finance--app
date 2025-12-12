
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Bell, Trash2, Bot, Loader2, Calendar as CalendarIcon, Repeat } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { createEventFromText, type CreateEventFromTextOutput } from "@/ai/flows/create-event-from-text";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


type Event = {
  id: string;
  title: string;
  date: Date;
  description?: string;
};

const recurrenceSchema = z.object({
  isRecurring: z.boolean().default(false),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  interval: z.coerce.number().optional(),
  endDate: z.date().optional(),
});

const eventSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  date: z.date({ required_error: 'A date is required.' }),
  description: z.string().optional(),
  recurrence: recurrenceSchema,
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
  onEventParsed: (data: Partial<CreateEventFromTextOutput>) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();

  const handleParse = async () => {
    if (!prompt.trim()) return;
    setIsParsing(true);
    try {
      const result = await createEventFromText({ prompt });
      onEventParsed(result);
      setPrompt("");
    } catch (error) {
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
          Describe an event, even repeating ones. e.g., "Weekly sync every Friday for 6 weeks"
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
      recurrence: {
        isRecurring: false,
        frequency: 'weekly',
        interval: 1,
      }
    },
  });

  const isRecurring = form.watch('recurrence.isRecurring');

  const createRecurringEvents = (
    title: string,
    description: string,
    startDate: Date,
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
    interval: number,
    endDate?: Date,
    count?: number,
  ) => {
    const newEvents: Event[] = [];
    let currentDate = startDate;
    const limitDate = endDate;

    const maxIterations = count || (limitDate ? 500 : 52); // Safety break

    for (let i = 0; i < maxIterations; i++) {
        if (limitDate && currentDate > limitDate) break;

        newEvents.push({
            id: `EVT${Date.now()}-${i}`,
            title: title!,
            date: currentDate,
            description: description || '',
        });

        if (frequency === 'daily') {
            currentDate = addDays(currentDate, interval);
        } else if (frequency === 'weekly') {
            currentDate = addWeeks(currentDate, interval);
        } else if (frequency === 'monthly') {
            currentDate = addMonths(currentDate, interval);
        } else if (frequency === 'yearly') {
            currentDate = addYears(currentDate, interval);
        } else {
            break;
        }
    }
    
    setEvents(prev => [...prev, ...newEvents].sort((a,b) => a.date.getTime() - b.date.getTime()));
    toast({
        title: "Recurring Events Created",
        description: `${newEvents.length} instances of "${title}" have been added to the calendar.`,
    });
  }
  
  const handleAiEventParsed = (data: Partial<CreateEventFromTextOutput>) => {
    if (data.recurrence && data.title && data.date) {
        const { recurrence, title, date, description } = data;
        
        let startDate = new Date(date!);
        // Adjust for timezone offset
        const timezoneOffset = startDate.getTimezoneOffset() * 60000;
        startDate = new Date(startDate.getTime() + timezoneOffset);

        createRecurringEvents(
          title,
          description || '',
          startDate,
          recurrence.frequency!,
          recurrence.interval || 1,
          recurrence.endDate ? new Date(recurrence.endDate) : undefined,
          recurrence.count
        );

    } else if(data.title && data.date) {
      const eventDate = new Date(data.date);
      // Adjust for timezone offset
      const timezoneOffset = eventDate.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(eventDate.getTime() + timezoneOffset);

      form.reset({
          title: data.title,
          date: adjustedDate,
          description: data.description || '',
          recurrence: { isRecurring: false }
      });
      setIsAddDialogOpen(true);
    }
  };

  const onSubmit = (values: z.infer<typeof eventSchema>) => {
    if (values.recurrence.isRecurring && values.recurrence.frequency) {
        createRecurringEvents(
            values.title,
            values.description || '',
            values.date,
            values.recurrence.frequency,
            values.recurrence.interval || 1,
            values.recurrence.endDate
        );
    } else {
        const newEvent: Event = {
            id: `EVT${Date.now()}`,
            title: values.title,
            date: values.date,
            description: values.description
        };
        setEvents((prev) => [...prev, newEvent].sort((a,b) => a.date.getTime() - b.date.getTime()));
        toast({
          title: "Event Created",
          description: `${values.title} has been added to the calendar.`,
        });
    }

    form.reset({ title: "", date: new Date(), description: "" , recurrence: { isRecurring: false, frequency: 'weekly', interval: 1 }});
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Group Calendar</h1>
            <p className="text-muted-foreground">Manage your group's events and important dates.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
                form.reset({ title: "", date: new Date(), description: "" , recurrence: { isRecurring: false, frequency: 'weekly', interval: 1 }});
            }
        }}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Event
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Add New Event</DialogTitle>
                    <DialogDescription>
                        Fill in the details for the new group event.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-6">
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
                                    <FormLabel>Start Date</FormLabel>
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
                        <FormField
                          control={form.control}
                          name="recurrence.isRecurring"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Recurring Event</FormLabel>
                                <FormDescription>
                                  Is this a repeating event?
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                       {isRecurring && (
                          <Card className="bg-muted/50">
                            <CardContent className="pt-6">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                  control={form.control}
                                  name="recurrence.frequency"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Frequency</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                          <FormControl>
                                              <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                              <SelectItem value="daily">Daily</SelectItem>
                                              <SelectItem value="weekly">Weekly</SelectItem>
                                              <SelectItem value="monthly">Monthly</SelectItem>
                                              <SelectItem value="yearly">Yearly</SelectItem>
                                          </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="recurrence.interval"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Interval</FormLabel>
                                      <FormControl>
                                        <Input type="number" placeholder="1" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="recurrence.endDate"
                                  render={({ field }) => (
                                      <FormItem className="flex flex-col col-span-2">
                                          <FormLabel>End Date (Optional)</FormLabel>
                                          <Popover>
                                              <PopoverTrigger asChild>
                                              <FormControl>
                                                  <Button
                                                  variant={"outline"}
                                                  className={cn(
                                                      "w-full sm:w-[240px] pl-3 text-left font-normal",
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
                                                  captionLayout="dropdown-buttons"
                                                  fromYear={new Date().getFullYear() - 10}
                                                  toYear={new Date().getFullYear()}
                                              />
                                              </PopoverContent>
                                          </Popover>
                                          <FormDescription>If not set, the event will repeat 52 times by default for performance reasons.</FormDescription>
                                          <FormMessage />
                                      </FormItem>
                                  )}
                              />
                              </div>
                            </CardContent>
                          </Card>
                        )}


                         <DialogFooter className="sticky bottom-0 bg-background py-4">
                            <Button type="submit">Save Event</Button>
                        </DialogFooter>
                    </form>
                </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
      </div>
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
           <Card>
             <CardContent className="p-0 sm:p-2">
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

    