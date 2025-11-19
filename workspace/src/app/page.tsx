import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Banknote, Bot, FileText, HeartHandshake, Users, Wallet } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: <Wallet className="size-12 text-primary" />,
      title: "AI Bookkeeping",
      description: "Paste an M-Pesa SMS and let our AI instantly parse it into a categorized transaction.",
    },
    {
      icon: <Users className="size-12 text-primary" />,
      title: "Member Management",
      description: "Easily organize your member list, add new members, and import or export data via CSV.",
    },
    {
      icon: <HeartHandshake className="size-12 text-primary" />,
      title: "Insurance Tracking",
      description: "Manage insurance policies and track monthly premium payments for every member.",
    },
    {
      icon: <FileText className="size-12 text-primary" />,
      title: "Constitution AI",
      description: "Upload your group's constitution and get instant answers to your questions in plain English.",
    },
     {
      icon: <Banknote className="size-12 text-primary" />,
      title: "Automated Schedules",
      description: "Generate a fair, randomized 'merry-go-round' savings schedule with a single click.",
    },
    {
      icon: <Bot className="size-12 text-primary" />,
      title: "AI Reports",
      description: "Create AI-generated financial report cards for each member summarizing their activity.",
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/30 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-primary/30 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-300/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center p-8 md:p-12 mt-16 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg mb-6">
            Welcome to FinanceFlow AI
          </h1>
          <p className="mb-8 text-xl text-white/80 max-w-2xl">
            Effortlessly manage your community group's finances with AI-powered tools. Get started now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg">
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-white border-white/50 bg-white/10 hover:bg-white/20 hover:text-white">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl mt-24">
          {features.map((card, idx) => (
            <div
              key={idx}
              className="group cursor-pointer w-full p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg
                transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-white/30
                flex flex-col items-center text-center"
            >
              <div className="mb-4 transform transition-transform duration-300 group-hover:scale-110">{card.icon}</div>
              <h3 className="text-2xl font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-white/80">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
