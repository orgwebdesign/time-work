"use client";

import { useEffect, useState, useTransition } from "react";
import { getSuggestions } from "@/lib/actions";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Lightbulb, Plus, X } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface TaskSuggestionsProps {
  taskDescription: string;
  onAddSuggestedTask: (text: string) => void;
  onDismiss: () => void;
}

export default function TaskSuggestions({ taskDescription, onAddSuggestedTask, onDismiss }: TaskSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      setLoading(true);
      const result = await getSuggestions(taskDescription);
      setSuggestions(result);
      setLoading(false);
    });
  }, [taskDescription]);

  return (
    <Card className="glass-card animate-in fade-in-50">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-full">
                    <Lightbulb className="text-primary size-5" />
                </div>
                <div>
                    <CardTitle className="text-base">Smart Suggestions</CardTitle>
                    <CardDescription>Based on your new task, you might also want to:</CardDescription>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onDismiss} className="size-7 flex-shrink-0">
                <X className="size-4" />
                <span className="sr-only">Dismiss suggestions</span>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="space-y-2">
                <Skeleton className="h-8 w-3/4 bg-primary/10" />
                <Skeleton className="h-8 w-1/2 bg-primary/10" />
                <Skeleton className="h-8 w-2/3 bg-primary/10" />
            </div>
        ) : (
            <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
                <Button key={index} variant="outline" size="sm" className="bg-background hover:bg-primary/10" onClick={() => onAddSuggestedTask(suggestion)}>
                    <Plus className="mr-2 size-4" />
                    {suggestion}
                </Button>
            ))}
            </div>
        )}
        {(!loading && suggestions.length === 0) && (
            <p className="text-sm text-muted-foreground">No suggestions found right now.</p>
        )}
      </CardContent>
    </Card>
  );
}
