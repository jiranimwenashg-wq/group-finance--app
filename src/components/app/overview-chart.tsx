
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useMemo } from "react";
import { Transaction } from "@/lib/data";

type OverviewChartProps = {
  data: { month: string; income: number; expenses: number }[];
};

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function OverviewChart({ data }: OverviewChartProps) {
  return (
     <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart accessibilityLayer data={data}>
                <CartesianGrid vertical={false} />
                <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                />
                 <YAxis 
                    tickFormatter={(value) => new Intl.NumberFormat('en-US', {
                        notation: 'compact',
                        compactDisplay: 'short'
                    }).format(value as number)}
                 />
                <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
            </BarChart>
            </ChartContainer>
        </CardContent>
    </Card>
  );
}

export function OverviewChartData({ transactions }: { transactions: Transaction[] }) {
  const chartData = useMemo(() => {
    // This is a simplified example. In a real app, you'd aggregate by month.
    const incomeByMonth: Record<string, number> = {};
    const expensesByMonth: Record<string, number> = {};

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const month = date.toLocaleString('default', { month: 'short' });
      if (t.type === 'Income') {
        incomeByMonth[month] = (incomeByMonth[month] || 0) + t.amount;
      } else {
        expensesByMonth[month] = (expensesByMonth[month] || 0) + t.amount;
      }
    });

    const allMonths = [
      ...new Set([
        ...Object.keys(incomeByMonth),
        ...Object.keys(expensesByMonth),
      ]),
    ];

    return allMonths.map((month) => ({
      month,
      income: incomeByMonth[month] || 0,
      expenses: expensesByMonth[month] || 0,
    }));
  }, [transactions]);

  return <OverviewChart data={chartData} />;
}
