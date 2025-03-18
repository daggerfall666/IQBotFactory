import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { 
  BarChart3, 
  MessageSquare, 
  Check, 
  Clock, 
  Zap, 
  Bot,
  Users,
  Activity
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend 
} from "recharts";
import type { Chatbot } from "@shared/schema";

interface SystemAnalytics {
  totalRequests: number;
  errorRate: number;
  averageResponseTime: number;
  activeUsers: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
}

export default function Analytics() {
  const { data: chatbots = [] } = useQuery<Chatbot[]>({
    queryKey: ["/api/chatbots"],
  });

  const { data: systemHealth } = useQuery<SystemAnalytics>({
    queryKey: ["/api/system/health"],
    refetchInterval: 30000,
  });

  // Calculate total interactions across all chatbots
  const totalInteractions = chatbots.reduce((acc, bot) => {
    const interactions = bot.analytics?.totalInteractions || 0;
    return acc + interactions;
  }, 0);

  // Prepare data for the usage chart
  const usageData = chatbots.map(bot => ({
    name: bot.name,
    interactions: bot.analytics?.totalInteractions || 0,
    successRate: bot.analytics?.successRate || 0,
    responseTime: bot.analytics?.averageResponseTime || 0
  }));

  return (
    <Layout>
      <div className="responsive-container py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Analytics Overview
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Monitor your chatbots performance and system health
          </p>
        </div>

        {/* System Health Section */}
        <div className="stats-grid">
          <Card className="adaptive-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                Active Chatbots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chatbots.length}</div>
              <p className="text-xs text-muted-foreground">
                Total deployed assistants
              </p>
            </CardContent>
          </Card>

          <Card className="adaptive-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Total Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInteractions}</div>
              <p className="text-xs text-muted-foreground">
                Messages processed
              </p>
            </CardContent>
          </Card>

          <Card className="adaptive-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemHealth?.errorRate ? (
                  `${(100 - systemHealth.errorRate).toFixed(1)}%`
                ) : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                System reliability
              </p>
            </CardContent>
          </Card>

          <Card className="adaptive-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemHealth?.averageResponseTime
                  ? `${systemHealth.averageResponseTime.toFixed(0)}ms`
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                Average response time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="adaptive-card">
            <CardHeader>
              <CardTitle>Chatbot Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="interactions"
                      name="Interactions"
                      fill="hsl(var(--primary))"
                    />
                    <Bar
                      dataKey="successRate"
                      name="Success Rate (%)"
                      fill="hsl(var(--primary)/0.5)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="adaptive-card">
            <CardHeader>
              <CardTitle>Response Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="responseTime"
                      name="Avg. Response Time (ms)"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Resources */}
        {systemHealth && (
          <Card className="adaptive-card">
            <CardHeader>
              <CardTitle>System Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium">CPU Usage</p>
                  <div className="text-2xl font-bold">
                    {systemHealth.cpuUsage.toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Memory Usage</p>
                  <div className="text-2xl font-bold">
                    {(systemHealth.memoryUsage / 1024 / 1024).toFixed(0)} MB
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uptime</p>
                  <div className="text-2xl font-bold">
                    {Math.floor(systemHealth.uptime / 3600)}h {Math.floor((systemHealth.uptime % 3600) / 60)}m
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}