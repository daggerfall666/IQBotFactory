import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Chatbot } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  
  const { data: chatbots, isLoading } = useQuery<Chatbot[]>({
    queryKey: ["/api/chatbots"]
  });

  const createBot = useMutation({
    mutationFn: async () => {
      const defaultBot: Omit<Chatbot, "id"> = {
        name: "New Chatbot",
        description: "",
        settings: {
          initialMessage: "Hello! How can I help you today?",
          temperature: 0.7,
          maxTokens: 1000,
          theme: {
            primaryColor: "#007AFF",
            fontFamily: "Inter",
            borderRadius: 8
          }
        },
        wordpressConfig: {
          position: "bottom-right",
          customCss: ""
        }
      };

      return apiRequest("POST", "/api/chatbots", defaultBot);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots"] });
      toast({
        title: "Success",
        description: "New chatbot created"
      });
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Your Chatbots</h1>
        <Button onClick={() => createBot.mutate()} disabled={createBot.isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Bot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chatbots?.map((bot) => (
          <Card key={bot.id}>
            <CardHeader>
              <CardTitle>{bot.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{bot.description || "No description"}</p>
              <div className="flex gap-2">
                <Link href={`/bot/${bot.id}`}>
                  <Button variant="secondary">Configure</Button>
                </Link>
                <Link href={`/bot/${bot.id}/knowledge`}>
                  <Button variant="outline">Knowledge Base</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
