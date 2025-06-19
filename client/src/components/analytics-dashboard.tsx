import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  TrendingUp, 
  Music, 
  Clock, 
  Users,
  Download,
  Heart,
  Play,
  Calendar
} from "lucide-react";

interface AnalyticsDashboardProps {
  userId: number;
}

export default function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("30d");

  // Mock analytics data - would come from API
  const analytics = {
    totalSongs: 24,
    totalPlays: 1250,
    totalDownloads: 89,
    totalLikes: 156,
    avgSongLength: "3:42",
    genreDistribution: [
      { name: "Pop", value: 35, color: "#8B5CF6" },
      { name: "Rock", value: 25, color: "#EF4444" },
      { name: "Electronic", value: 20, color: "#10B981" },
      { name: "Jazz", value: 12, color: "#F59E0B" },
      { name: "Classical", value: 8, color: "#3B82F6" }
    ],
    weeklyActivity: [
      { day: "Mon", songs: 4, plays: 45 },
      { day: "Tue", songs: 2, plays: 32 },
      { day: "Wed", songs: 6, plays: 78 },
      { day: "Thu", songs: 3, plays: 56 },
      { day: "Fri", songs: 8, plays: 123 },
      { day: "Sat", songs: 5, plays: 89 },
      { day: "Sun", songs: 3, plays: 67 }
    ],
    monthlyGrowth: [
      { month: "Jan", songs: 15, plays: 234 },
      { month: "Feb", songs: 18, plays: 298 },
      { month: "Mar", songs: 22, plays: 445 },
      { month: "Apr", songs: 28, plays: 567 },
      { month: "May", songs: 35, plays: 689 },
      { month: "Jun", songs: 42, plays: 834 }
    ]
  };

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <Card className="bg-dark-card border-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {trend && (
              <p className={`text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'} flex items-center mt-1`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {trend > 0 ? '+' : ''}{trend}% from last month
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-poppins font-bold text-white">Analytics Dashboard</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32 bg-gray-800 border-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 3 months</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Songs"
          value={analytics.totalSongs}
          icon={Music}
          trend={15}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Plays"
          value={analytics.totalPlays.toLocaleString()}
          icon={Play}
          trend={23}
          color="bg-green-500"
        />
        <StatCard
          title="Downloads"
          value={analytics.totalDownloads}
          icon={Download}
          trend={8}
          color="bg-blue-500"
        />
        <StatCard
          title="Likes"
          value={analytics.totalLikes}
          icon={Heart}
          trend={12}
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genre Distribution */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-white">Genre Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.genreDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.genreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#374151', 
                    border: '1px solid #4B5563',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {analytics.genreDistribution.map((genre) => (
                <div key={genre.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: genre.color }}
                  />
                  <span className="text-sm text-gray-300">{genre.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {genre.value}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-white">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#374151', 
                    border: '1px solid #4B5563',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="songs" fill="#8B5CF6" name="Songs Created" />
                <Bar dataKey="plays" fill="#10B981" name="Total Plays" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Growth Trend */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">Growth Trend (6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analytics.monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#374151', 
                  border: '1px solid #4B5563',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="songs" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                name="Songs Created"
              />
              <Line 
                type="monotone" 
                dataKey="plays" 
                stroke="#10B981" 
                strokeWidth={3}
                name="Total Plays"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-green-500/20 p-4 rounded-lg mb-3">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto" />
              </div>
              <h3 className="font-medium text-white mb-1">Top Performing Genre</h3>
              <p className="text-sm text-gray-400">Pop music gets 40% more plays on average</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-500/20 p-4 rounded-lg mb-3">
                <Clock className="w-8 h-8 text-blue-500 mx-auto" />
              </div>
              <h3 className="font-medium text-white mb-1">Optimal Song Length</h3>
              <p className="text-sm text-gray-400">Songs around 3:30 get the most engagement</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500/20 p-4 rounded-lg mb-3">
                <Calendar className="w-8 h-8 text-purple-500 mx-auto" />
              </div>
              <h3 className="font-medium text-white mb-1">Best Upload Time</h3>
              <p className="text-sm text-gray-400">Friday evenings show highest interaction rates</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}