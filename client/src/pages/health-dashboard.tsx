import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Activity, Server, Clock, AlertTriangle, CheckCircle, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemHealth {
  system: {
    cpuUsage: number;
    totalMemory: number;
    freeMemory: number;
    uptime: number;
    platform: string;
  };
  process: {
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    uptime: number;
  };
  api: {
    totalRequests: number;
    errorCount: number;
    averageResponseTime: number;
    errorRate: number;
  };
  database: {
    status: 'connected' | 'error';
    healthy: boolean;
    error?: string;
  };
}

const StatusIndicator = ({ status, text }: { status: boolean; text: string }) => {
  return (
    <div className={cn(
      "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2",
      status ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
    )}>
      {status ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {text}
    </div>
  );
};

export default function HealthDashboard() {
  const { data: health, isLoading, error } = useQuery<SystemHealth>({
    queryKey: ["/api/system/health"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Activity className="h-16 w-16 animate-bounce text-primary/60" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[60vh] text-destructive">
            <AlertTriangle className="h-8 w-8 mr-2" />
            Error loading system health data
          </div>
        </div>
      </Layout>
    );
  }

  if (!health) return null;

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            System Health
          </h1>
          <p className="text-muted-foreground text-lg">
            Monitor system performance and health metrics in real-time
          </p>
        </div>

        {/* Status Overview */}
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                System Status
              </CardTitle>
              <StatusIndicator 
                status={health.database.healthy} 
                text={health.database.status === 'connected' ? 'Healthy' : 'Error'} 
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Uptime */}
              <Card className="border-none shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Uptime
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatUptime(health.system.uptime)}</div>
                  <p className="text-sm text-muted-foreground">
                    Platform: {health.system.platform}
                  </p>
                </CardContent>
              </Card>

              {/* Memory Usage */}
              <Card className="border-none shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary" />
                    Memory Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((1 - health.system.freeMemory / health.system.totalMemory) * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(health.system.totalMemory - health.system.freeMemory)} / {formatBytes(health.system.totalMemory)}
                  </p>
                </CardContent>
              </Card>

              {/* CPU Usage */}
              <Card className="border-none shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    CPU Load
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{health.system.cpuUsage.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">
                    1 minute load average
                  </p>
                </CardContent>
              </Card>

              {/* Process Memory */}
              <Card className="border-none shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Heap Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatBytes(health.process.memoryUsage.heapUsed)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    of {formatBytes(health.process.memoryUsage.heapTotal)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* API Metrics */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Server className="h-6 w-6 text-primary" />
              API Performance
            </CardTitle>
            <CardDescription>
              Real-time API metrics and response times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {health.api.averageResponseTime.toFixed(2)}ms
                  </div>
                  <p className="text-sm text-muted-foreground">Average</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{health.api.totalRequests}</div>
                  <p className="text-sm text-muted-foreground">Last Hour</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{health.api.errorRate.toFixed(2)}%</div>
                  <p className="text-sm text-muted-foreground">
                    {health.api.errorCount} errors in the last hour
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}