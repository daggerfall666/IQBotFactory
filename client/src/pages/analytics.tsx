import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { BarChart3, MessageSquare, Check, Clock } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function Analytics() {
  const { data: chatbots = [] } = useQuery({
    queryKey: ["/api/chatbots"],
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/system/analytics"],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <BarChart3 className="h-16 w-16 animate-bounce text-primary/60 mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Analytics Overview
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Monitor your chatbots performance and usage statistics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Total Chatbots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chatbots.length}</div>
              <p className="text-xs text-muted-foreground">
                Active virtual assistants
              </p>
            </CardContent>
          </Card>

          {/* Add more analytics cards here as needed */}
        </div>

        {/* Add charts and detailed analytics here */}
      </div>
    </Layout>
  );
}
