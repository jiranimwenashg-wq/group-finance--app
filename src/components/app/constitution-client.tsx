"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Bot, Loader2, Send, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryConstitution } from "@/ai/flows/query-constitution";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { placeholderImages } from "@/lib/placeholder-images";

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function ConstitutionClient() {
  const [constitutionText, setConstitutionText] = useState("");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleQuery = async () => {
    if (!constitutionText.trim()) {
      toast({
        variant: "destructive",
        title: "Constitution Missing",
        description: "Please enter your group's constitution first.",
      });
      return;
    }
    if (!query.trim()) return;

    const userMessage: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      const result = await queryConstitution({ constitutionText, query });
      const aiMessage: Message = { role: "ai", content: result.answer };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to query constitution:", error);
      const errorMessage: Message = {
        role: "ai",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not get an answer from the AI assistant.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const userAvatar = placeholderImages.find(p => p.id === 'avatar-1');

  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Group Constitution</CardTitle>
          <CardDescription>
            Paste your group's constitution here. This will be used by the AI
            assistant to answer your questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="[Article 1: Name of the Group]..."
            className="h-96"
            value={constitutionText}
            onChange={(e) => setConstitutionText(e.target.value)}
          />
        </CardContent>
        <CardFooter>
            <Button className="w-full" onClick={() => toast({ title: "Constitution Saved!", description: "The AI assistant will now use this document."})}>Save Constitution</Button>
        </CardFooter>
      </Card>

      <Card className="lg:col-span-2 flex flex-col">
        <CardHeader>
          <CardTitle>Constitution Assistant</CardTitle>
          <CardDescription>
            Ask a question about your constitution in plain English.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-4 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No questions asked yet.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === "user" ? "justify-end" : ""
              }`}
            >
              {message.role === "ai" && (
                <Avatar className="size-8">
                  <AvatarFallback><Bot className="size-5" /></AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-xs rounded-lg p-3 lg:max-w-md ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
               {message.role === "user" && userAvatar && (
                <Avatar className="size-8">
                  <AvatarImage src={userAvatar.imageUrl} alt="User" data-ai-hint={userAvatar.imageHint} />
                  <AvatarFallback><User className="size-5" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
           {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="size-8">
                <AvatarFallback><Bot className="size-5" /></AvatarFallback>
              </Avatar>
              <div className="rounded-lg bg-muted p-3">
                <Loader2 className="size-5 animate-spin" />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-4">
            <div className="relative w-full">
            <Input
                placeholder="e.g., What is the penalty for late contributions?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            />
            <Button
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleQuery}
                disabled={isLoading}
            >
                <Send className="size-4" />
            </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
