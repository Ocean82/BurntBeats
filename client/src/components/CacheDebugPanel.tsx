import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Database, Clock, MapPin, Trash2, RefreshCw } from "lucide-react";
import { globalCache } from "@/hooks/useNavigationCache";
import { globalNavHistory } from "@/hooks/useBackForwardNavigation";

export function CacheDebugPanel() {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  const cacheStats = globalCache.getStats();
  const navigationHistory = globalNavHistory.getFullHistory();
  const currentIndex = globalNavHistory.getCurrentIndex();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`;
    }
    return `${seconds}s ago`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4" key={refreshKey}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Navigation Cache</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Cache Size:</span>
              <Badge variant="secondary">{cacheStats.size}/{cacheStats.maxEntries}</Badge>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Max Age:</span>
              <span>{Math.floor(cacheStats.maxAge / 60000)}m</span>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cached Entries</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  className="h-6 px-2"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
              
              <ScrollArea className="h-24">
                <div className="space-y-1">
                  {cacheStats.entries.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No cached entries</p>
                  ) : (
                    cacheStats.entries.map((key, index) => (
                      <div key={index} className="text-xs font-mono bg-muted p-1 rounded">
                        {key}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                globalCache.clear();
                refreshData();
              }}
              className="w-full mt-2"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Navigation History</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>History Length:</span>
              <Badge variant="secondary">{navigationHistory.length}</Badge>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Current Position:</span>
              <Badge variant="outline">{currentIndex + 1}/{navigationHistory.length}</Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              <span className="text-sm font-medium">Recent Pages</span>
              
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {navigationHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No navigation history</p>
                  ) : (
                    navigationHistory.slice().reverse().map((entry, index) => {
                      const isCurrentPage = navigationHistory.length - 1 - index === currentIndex;
                      return (
                        <div 
                          key={index} 
                          className={`text-xs p-2 rounded border ${
                            isCurrentPage 
                              ? 'bg-primary/10 border-primary' 
                              : 'bg-muted border-border'
                          }`}
                        >
                          <div className="font-mono">{entry.path}</div>
                          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(entry.timestamp)}</span>
                            <span>({formatTimeAgo(entry.timestamp)})</span>
                            {isCurrentPage && (
                              <Badge variant="outline" className="text-xs py-0">
                                Current
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                globalNavHistory.clear();
                refreshData();
              }}
              className="w-full mt-2"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}