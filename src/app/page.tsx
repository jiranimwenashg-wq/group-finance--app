import {
  Activity,
  Bot,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { placeholderImages } from '@/lib/placeholder-images';

const features = [
  {
    icon: <LayoutDashboard className="size-8 text-primary" />,
    title: 'Instant Financial Dashboard',
    description:
      "Get a real-time snapshot of your group's financial health. Track income, monitor expenses, and visualize progress with beautiful charts.",
    image: placeholderImages.find(p => p.id === 'dashboard')!,
  },
  {
    icon: <Bot className="size-8 text-primary" />,
    title: 'AI-Powered Bookkeeping',
    description:
      'Say goodbye to manual data entry. Paste an M-Pesa SMS and our AI instantly parses it into a structured, categorized transaction record.',
    image: placeholderImages.find(p => p.id === 'ai-parser')!,
  },
  {
    icon: <Users className="size-8 text-primary" />,
    title: 'Easy Member Management',
    description:
      'Keep your member list organized and up-to-date. Add new members individually or import your entire list in seconds with our simple CSV tool.',
    image: placeholderImages.find(p => p.id === 'members')!,
  },
  {
    icon: <Wallet className="size-8 text-primary" />,
    title: 'Insurance Premium Tracking',
    description:
      'Create custom policies and tick off payments month by month, ensuring every member is covered and accounted for with our powerful tracking grid.',
    image: placeholderImages.find(p => p.id === 'insurance')!,
  },
  {
    icon: <FileText className="size-8 text-primary" />,
    title: 'AI Constitution Assistant',
    description:
      "Need to check a rule? Ask questions about your group's constitution in plain English and get instant, accurate answers from our AI.",
    image: placeholderImages.find(p => p.id === 'constitution')!,
  },
  {
    icon: <CircleDollarSign className="size-8 text-primary" />,
    title: 'Automated Chama Schedule',
    description:
      'Generate a fair, randomized "merry-go-round" savings schedule with a single click, ensuring transparency and equal opportunity for all members.',
    image: placeholderImages.find(p => p.id === 'schedule')!,
  },
];

export default function LandingPage() {
  const heroImage = placeholderImages.find(p => p.id === 'hero')!;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="size-6 text-primary" />
            <span className="font-bold">FinanceFlow AI</span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">Get Started</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
          <div className="relative grid gap-10 md:grid-cols-2">
            <div className="flex flex-col justify-center gap-4">
               <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                Manage Your Group Finances,{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Effortlessly
                </span>
              </h1>
              <p className="max-w-lg text-lg text-muted-foreground">
                Welcome to FinanceFlow AI, the ultimate tool for community
                groups. Automate bookkeeping, track payments, and gain
                AI-powered insights so you can focus on what truly matters—your
                group's goals.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-72 overflow-hidden rounded-lg border shadow-lg md:h-96">
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
            </div>
          </div>
        </section>

        <section id="features" className="bg-secondary/50 py-16">
          <div className="container">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Powerful Features, Simple Interface
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">
                Everything you need to run your group finances smoothly.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="flex flex-col border-white/20 bg-card/60 backdrop-blur-lg"
                >
                  <CardHeader className="items-center">{feature.icon}</CardHeader>
                  <CardContent className="flex flex-1 flex-col items-center text-center">
                    <h3 className="mb-2 text-xl font-semibold">
                      {feature.title}
                    </h3>
                    <p className="flex-1 text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to Take Control?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-lg text-muted-foreground">
            Join groups who are saving time and making smarter financial
            decisions with FinanceFlow AI.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/dashboard">Start For Free</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/40 bg-secondary/50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.logo className="size-5" />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} FinanceFlow AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
