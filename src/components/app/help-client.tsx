'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Bot, Calendar, FileText, HeartHandshake, Users, Wallet } from 'lucide-react';

const features = [
  {
    title: 'AI-Powered Bookkeeping (M-Pesa)',
    icon: <Wallet className="mr-2 size-5 text-primary" />,
    content:
      "To add a transaction from an M-Pesa SMS, go to the 'Transactions' page and click the 'Parse SMS' button. Paste the full SMS message into the text area and click 'Parse with AI'. The system will automatically extract the amount, date, and sender, and even try to match it to a member in your group.",
  },
  {
    title: 'AI Constitution Assistant',
    icon: <FileText className="mr-2 size-5 text-primary" />,
    content:
      "Navigate to the 'Constitution AI' page. Paste your group's constitution into the text area on the left and save it. Once saved, you can ask questions about your constitution in plain English using the chat interface on the right. The AI will provide answers based on the document you provided.",
  },
  {
    title: 'Automated Chama Schedule',
    icon: <Users className="mr-2 size-5 text-primary" />,
    content:
      "The 'Schedule' page automatically generates a fair, randomized 'merry-go-round' savings schedule based on your list of active members. You can regenerate the schedule at any time, mark payouts as 'Paid', 'Pending', or 'Skipped', and edit or delete entries as needed.",
  },
  {
    title: 'AI-Powered Calendar Events',
    icon: <Bot className="mr-2 size-5 text-primary" />,
    content:
      "On the 'Calendar' page, use the 'Create with AI' card to automatically schedule events. You can type simple prompts like 'Schedule a budget review next Friday' or even create repeating events, such as 'Weekly sync every Friday for 6 weeks'. The AI will parse your request and pre-fill the event creation form for you.",
  },
  {
    title: 'Manual Recurring Events',
    icon: <Calendar className="mr-2 size-5 text-primary" />,
    content:
      "When you click 'Add Event' on the Calendar page, you can create recurring events manually. Check the 'Recurring Event' box to reveal options for frequency (daily, weekly, monthly), interval, and an optional end date. This gives you full control over repeating events.",
  },
  {
    title: 'Member Report Generation',
    icon: <Users className="mr-2 size-5 text-primary" />,
    content:
      "Go to the 'Reports' page to see a list of all active members. Click the 'Generate Report' button on any member's card to get an AI-generated summary of their recent financial activity, including contributions and insurance payment status. Clicking the card will link you to their profile in the Members list.",
  },
  {
    title: 'Insurance Payment Tracking',
    icon: <HeartHandshake className="mr-2 size-5 text-primary" />,
    content:
      "On the 'Insurance' page, you can track premium payments for different policies. Select a policy and a year, and the grid will show the payment status for each member for every month. You can update the status by checking the boxes. The dashboard also provides a summary of collected vs. outstanding premiums for the selected month.",
  },
];

export default function HelpClient() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Help & Feature Guide</h1>
        <p className="text-muted-foreground">
          Find answers and learn how to use the powerful features of FinanceFlow AI.
        </p>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {features.map((feature, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>
              <div className="flex items-center">
                {feature.icon}
                <span className="font-semibold">{feature.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground">
              {feature.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
