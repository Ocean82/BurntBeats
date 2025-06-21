
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  Music, 
  Play, 
  Calendar,
  Crown,
  ArrowUpRight,
  Users,
  Clock,
  Heart
} from "lucide-react";
import UpgradeModal from "./upgrade-modal";

interface AnalyticsDashboardProps {
  userPlan: string;
  onUpgrade: () => void;
}

export default function AnalyticsDashboard({ userPlan, onUpgrade }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("30d");

  // Pricing wall for Pro tier requirement
  if (userPlan === "free" || userPlan === "basic") {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">
            Analytics Dashboard (Pro Feature)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BarChart className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">Comprehensive Analytics</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
            Get detailed insights into your music performance, play counts, trends, and audience analytics. Available with Pro plan and above.
          </p>
          <UpgradeModal currentPlan={userPlan} onUpgrade={onUpgrade}>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro - $12.99/mo
            </Button>
          </UpgradeModal>
        </CardContent>
      </Card>
    );
  }

  // Mock data for analytics
  const playData = [
    { name: "Week 1", plays: 45 },
    { name: "Week 2", plays: 67 },
    { name: "Week 3", plays: 123 },
    { name: "Week 4", plays: 156 },
  ];

  const genreData = [
    { name: "Pop", value: 35, color: "#8884d8" },
    { name: "Rock", value: 25, color: "#82ca9d" },
    { name: "Electronic", value: 20, color: "#ffc658" },
    { name: "Jazz", value: 20, color: "#ff7300" },
  ];

  const engagementData = [
    { name: "Mon", likes: 12, shares: 8, comments: 5 },
    { name: "Tue", likes: 15, shares: 12, comments: 8 },
    { name: "Wed", likes: 18, shares: 15, comments: 12 },
    { name: "Thu", likes: 22, shares: 18, comments: 15 },
    { name: "Fri", likes: 28, shares: 22, comments: 18 },
    { name: "Sat", likes: 35, shares: 28, comments: 22 },
    { name: "Sun", likes: 32, shares: 25, comments: 20 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h2>
          <p className="text-gray-400">Track your music's performance and audience engagement</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Badge className="bg-blue-500/20 text-blue-400">Pro Analytics</Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Plays</p>
                <p className="text-2xl font-bold text-white">2,847</p>
                <p className="text-sm text-green-400 flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  +23% from last month
                </p>
              </div>
              <Play className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Songs Created</p>
                <p className="text-2xl font-bold text-white">24</p>
                <p className="text-sm text-green-400 flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  +8 this month
                </p>
              </div>
              <Music className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Unique Listeners</p>
                <p className="text-2xl font-bold text-white">1,234</p>
                <p className="text-sm text-green-400 flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  +15% growth
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg. Listen Time</p>
                <p className="text-2xl font-bold text-white">3:24</p>
                <p className="text-sm text-yellow-400 flex items-center mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  +12s from last month
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Play Trends */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Play Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={playData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Line type="monotone" dataKey="plays" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Genre Distribution */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Genre Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genreData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {genreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Weekly Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Bar dataKey="likes" fill="#EC4899" name="Likes" />
              <Bar dataKey="shares" fill="#10B981" name="Shares" />
              <Bar dataKey="comments" fill="#F59E0B" name="Comments" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 font-medium">🚀 Top Performer</p>
            <p className="text-white">Your "Electronic Dreams" track has 40% more plays than average</p>
          </div>
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-300 font-medium">📈 Growing Trend</p>
            <p className="text-white">Jazz genre songs are gaining 25% more engagement this week</p>
          </div>
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-300 font-medium">💡 Recommendation</p>
            <p className="text-white">Consider creating more content on weekends for peak engagement</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
