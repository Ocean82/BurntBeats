import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CacheDebugPanel } from "@/components/CacheDebugPanel";
import { useSmartCache, useCachePerformance } from "@/hooks/useSmartCache";
import { useNavigationCache } from "@/hooks/useNavigationCache";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CacheTestPage() {
  const [testData, setTestData] = useState("");
  const [cacheKey, setCacheKey] = useState("test-data");
  const navigationCache = useNavigationCache();
  const { getPerformanceStats, optimizeCache, preloadCriticalData } = useCachePerformance();
  
  const { data: testCacheData, prefetchRelated, warmCache, getCachedData, forceRefresh } = useSmartCache(
    cacheKey,
    { staleTime: 30000 }
  );

  const handleSaveToCache = () => {
    navigationCache.set(cacheKey, testData);
  };

  const handleLoadFromCache = () => {
    const cached = navigationCache.get(cacheKey);
    if (cached) {
      setTestData(cached);
    }
  };

  const handleWarmCache = () => {
    warmCache(['/api/songs', '/api/voice-samples', '/api/auth/user']);
  };

  const handlePreload = () => {
    prefetchRelated(['/api/voice-bank/stats', '/api/pricing/usage']);
  };

  const stats = getPerformanceStats();

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Navigation & Cache Test</h1>
        <p className="text-muted-foreground">
          Test the back/forward navigation and caching systems
        </p>
      </div>

      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="test">Cache Test</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="debug">Debug Panel</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Testing</CardTitle>
              <CardDescription>
                Test the navigation cache by storing and retrieving data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cache-key">Cache Key</Label>
                  <Input
                    id="cache-key"
                    value={cacheKey}
                    onChange={(e) => setCacheKey(e.target.value)}
                    placeholder="Enter cache key"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cache Status</Label>
                  <Badge variant={navigationCache.has(cacheKey) ? "default" : "secondary"}>
                    {navigationCache.has(cacheKey) ? "Cached" : "Not Cached"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-data">Test Data</Label>
                <Textarea
                  id="test-data"
                  value={testData}
                  onChange={(e) => setTestData(e.target.value)}
                  placeholder="Enter test data to cache..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleSaveToCache}>Save to Cache</Button>
                <Button variant="outline" onClick={handleLoadFromCache}>
                  Load from Cache
                </Button>
                <Button variant="outline" onClick={() => setTestData("")}>
                  Clear Input
                </Button>
                <Button variant="destructive" onClick={() => navigationCache.clear()}>
                  Clear All Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="navigation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Navigation Testing</CardTitle>
              <CardDescription>
                Navigate between pages to test back/forward functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/">
                  <Button className="w-full">Home Page</Button>
                </Link>
                <Link href="/purchase-success">
                  <Button variant="outline" className="w-full">Purchase Success</Button>
                </Link>
                <Link href="/cache-test">
                  <Button variant="outline" className="w-full">Cache Test (Current)</Button>
                </Link>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Navigation Tips:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Use Alt + ← to go back</li>
                  <li>• Use Alt + → to go forward</li>
                  <li>• Scroll positions are preserved when navigating</li>
                  <li>• Cache data persists across page changes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance</CardTitle>
              <CardDescription>
                Monitor cache performance and optimization tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalQueries}</div>
                  <div className="text-sm text-muted-foreground">Total Queries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.staleQueries}</div>
                  <div className="text-sm text-muted-foreground">Stale Queries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.fetchingQueries}</div>
                  <div className="text-sm text-muted-foreground">Active Fetches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{Math.round(stats.memoryUsage / 1024)}KB</div>
                  <div className="text-sm text-muted-foreground">Memory Usage</div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleWarmCache}>Warm Cache</Button>
                <Button variant="outline" onClick={handlePreload}>
                  Preload Related
                </Button>
                <Button variant="outline" onClick={optimizeCache}>
                  Optimize Cache
                </Button>
                <Button variant="outline" onClick={preloadCriticalData}>
                  Preload Critical
                </Button>
                <Button variant="outline" onClick={forceRefresh}>
                  Force Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="space-y-4">
          <CacheDebugPanel />
        </TabsContent>
      </Tabs>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">Test Scenario</h3>
        <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
          <li>Enter some test data and save it to cache</li>
          <li>Navigate to another page using the links above</li>
          <li>Use Alt + ← to go back to this page</li>
          <li>Load the cached data to see it persisted</li>
          <li>Check the debug panel to see cache statistics</li>
        </ol>
      </div>
    </div>
  );
}