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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 flex flex-col items-center justify-center p-4">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg mb-6 mt-12">
          Welcome to FinanceFlow AI
        </h1>
        <p className="mb-8 text-xl text-white/80 max-w-2xl">
          Effortlessly manage your community group's finances with AI-powered tools. Get started now.
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/signup">Get Started Free</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-700">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl mt-24">
        {features.map((card, idx) => (
          <div
            key={idx}
            className="group cursor-pointer relative w-full p-8 rounded-2xl bg-card/30 border border-border shadow-2xl backdrop-blur-md
              transition-all duration-500 hover:scale-105 hover:shadow-3xl hover:bg-card/40
              flex flex-col items-center"
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 h-full w-full bg-gradient-to-tr from-primary/20 via-blue-500/20 to-green-300/20 opacity-0 group-hover:opacity-100 rounded-2xl transition duration-700 pointer-events-none" />
            {/* Card Content */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-4">{card.icon}</div>
              <h3 className="text-2xl font-semibold text-white text-center">{card.title}</h3>
              <p className="mt-3 text-white/80 text-center">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
