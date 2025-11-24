import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Cloud, Globe } from "lucide-react";

interface BackendStats {
  name: string;
  enabled: boolean;
  activeScans: number;
  concurrent: number;
  available: boolean;
  dailyScans?: number;  // Optional - may not be returned for security
  dailyLimit?: number;  // Optional - may not be returned for security
}

export default function BackendStatus() {
  const { data: backends = [], isLoading } = useQuery<BackendStats[]>({
    queryKey: ["/api/backends/stats"],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const enabledCount = backends.filter(b => b.enabled).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Browser Backends</h1>
        <p className="text-muted-foreground mt-2">
          Multi-provider browser automation status
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Backend Overview</CardTitle>
          <CardDescription>
            {enabledCount} of {backends.length} browser backends available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-md">
              <div className="text-2xl font-bold text-primary" data-testid="text-total-backends">{backends.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Backends</div>
            </div>
            <div className="text-center p-4 border rounded-md">
              <div className="text-2xl font-bold text-green-600" data-testid="text-enabled-backends">{enabledCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Enabled</div>
            </div>
            <div className="text-center p-4 border rounded-md">
              <div className="text-2xl font-bold text-blue-600" data-testid="text-active-scans-total">
                {backends.reduce((sum, b) => sum + b.activeScans, 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Active Scans</div>
            </div>
            <div className="text-center p-4 border rounded-md">
              <div className="text-2xl font-bold text-purple-600" data-testid="text-daily-scans-total">
                {backends.reduce((sum, b) => sum + (b.dailyScans || 0), 0) || "N/A"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Scans Today</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Backends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {backends.map((backend, index) => {
          const getIcon = () => {
            if (backend.name.includes("Puppeteer")) return Activity;
            if (backend.name.includes("Neon")) return Globe;
            return Cloud;
          };

          const Icon = getIcon();
          const usagePercent = backend.dailyLimit
            ? (backend.dailyScans / backend.dailyLimit) * 100
            : 0;

          return (
            <Card key={index} data-testid={`card-backend-${backend.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <span data-testid={`text-backend-name-${index}`}>{backend.name}</span>
                  </CardTitle>
                  <Badge variant={backend.enabled ? "default" : "secondary"} data-testid={`badge-status-${index}`}>
                    {backend.enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Active Scans */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Active Scans</span>
                    <span className="font-medium">
                      {backend.activeScans} / {backend.concurrent}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${(backend.activeScans / backend.concurrent) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Daily Usage - only show if data available */}
                {backend.dailyLimit && backend.dailyScans !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Daily Usage</span>
                      <span className="font-medium">
                        {backend.dailyScans} / {backend.dailyLimit}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          usagePercent >= 90
                            ? "bg-destructive"
                            : usagePercent >= 70
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {backend.enabled && backend.dailyScans === undefined && (
                  <div className="text-sm text-muted-foreground">
                    Quota tracking available after first scan
                  </div>
                )}

                {!backend.enabled && (
                  <div className="text-sm text-muted-foreground">
                    Configure API credentials to enable
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Help */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Opera Neon</h4>
            <code className="text-sm bg-muted p-2 rounded block">
              export NEON_WS_URL="wss://neon.opera.com/browser"<br />
              export NEON_API_TOKEN="your-token"<br />
              export NEON_PAID="true" # For unlimited scans
            </code>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Comet</h4>
            <code className="text-sm bg-muted p-2 rounded block">
              export COMET_API_URL="https://api.comet.com"<br />
              export COMET_API_KEY="your-api-key"<br />
              export COMET_PAID="true" # For unlimited scans
            </code>
          </div>

          <div>
            <h4 className="font-semibold mb-2">BrowserOS</h4>
            <code className="text-sm bg-muted p-2 rounded block">
              export BROWSEROS_API_URL="https://api.browseros.com"<br />
              export BROWSEROS_API_KEY="your-api-key"<br />
              export BROWSEROS_PAID="true" # For unlimited scans
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
