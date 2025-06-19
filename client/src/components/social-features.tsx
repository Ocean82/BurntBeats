import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  Share2, 
  MessageCircle, 
  Users, 
  Trophy,
  Star,
  Send,
  ThumbsUp,
  Music,
  Play,
  TrendingUp,
  Crown,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Song } from "@shared/schema";

interface SocialFeaturesProps {
  userId: number;
  currentSong?: Song;
}

interface SocialPost {
  id: number;
  userId: number;
  username: string;
  avatar?: string;
  content: string;
  songId?: number;
  songTitle?: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  isLiked: boolean;
}

interface UserProfile {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  followers: number;
  following: number;
  totalSongs: number;
  totalLikes: number;
  badges: string[];
  joinedAt: string;
}

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  avatar?: string;
  metric: number;
  badge?: string;
}

export default function SocialFeatures({ userId, currentSong }: SocialFeaturesProps) {
  const [newPost, setNewPost] = useState("");
  const [selectedTab, setSelectedTab] = useState("feed");
  const { toast } = useToast();

  // Mock social data
  const socialPosts: SocialPost[] = [
    {
      id: 1,
      userId: 2,
      username: "music_lover",
      content: "Just dropped my latest track! 🎵 Experimenting with some jazz-fusion elements. What do you think?",
      songId: 123,
      songTitle: "Midnight Jazz",
      likes: 45,
      comments: 12,
      shares: 8,
      timestamp: "2025-06-19T10:30:00Z",
      isLiked: false
    },
    {
      id: 2,
      userId: 3,
      username: "producer_sam",
      content: "Collaborated with @music_lover on an amazing remix! The vocal layering came out perfect.",
      likes: 67,
      comments: 23,
      shares: 15,
      timestamp: "2025-06-19T08:15:00Z",
      isLiked: true
    },
    {
      id: 3,
      userId: 4,
      username: "indie_artist",
      content: "Hit 1000 plays on my latest song! Thanks everyone for the support 🙏",
      songId: 124,
      songTitle: "Electric Dreams",
      likes: 89,
      comments: 34,
      shares: 22,
      timestamp: "2025-06-18T20:45:00Z",
      isLiked: false
    }
  ];

  const userProfile: UserProfile = {
    id: userId,
    username: "john_doe",
    displayName: "John Doe",
    followers: 234,
    following: 189,
    totalSongs: 24,
    totalLikes: 567,
    badges: ["Early Adopter", "Collaboration King", "Hit Maker"],
    joinedAt: "2025-05-15T00:00:00Z"
  };

  const weeklyLeaderboard: LeaderboardEntry[] = [
    { rank: 1, userId: 5, username: "chart_topper", metric: 2340, badge: "👑" },
    { rank: 2, userId: 3, username: "producer_sam", metric: 1876, badge: "🔥" },
    { rank: 3, userId: 2, username: "music_lover", metric: 1654, badge: "⭐" },
    { rank: 4, userId: userId, username: "john_doe", metric: 1432 },
    { rank: 5, userId: 6, username: "beat_master", metric: 1289 }
  ];

  const trendingSongs = [
    { id: 1, title: "Neon Nights", artist: "chart_topper", plays: 12500, trend: "+45%" },
    { id: 2, title: "Ocean Waves", artist: "indie_artist", plays: 8900, trend: "+32%" },
    { id: 3, title: "City Lights", artist: "producer_sam", plays: 7600, trend: "+28%" }
  ];

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      setNewPost("");
      toast({
        title: "Post shared",
        description: "Your post has been shared with the community.",
      });
    }
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    }
  });

  const followUserMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "User followed",
        description: "You're now following this artist.",
      });
    }
  });

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleCreatePost = () => {
    if (!newPost.trim()) return;
    createPostMutation.mutate(newPost);
  };

  const handleLikePost = (postId: number) => {
    likePostMutation.mutate(postId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-poppins font-bold text-white">Music Community</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-spotify-green/20 text-spotify-green">
            {userProfile.followers} followers
          </Badge>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="feed">Community Feed</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-6">
          {/* Create Post */}
          <Card className="bg-dark-card border-gray-800">
            <CardContent className="p-4">
              <div className="flex space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-spotify-green text-white">
                    {userProfile.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="Share your music journey..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="bg-gray-800 border-gray-600 resize-none"
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {currentSong && (
                        <Button variant="outline" size="sm">
                          <Music className="w-4 h-4 mr-1" />
                          Attach "{currentSong.title}"
                        </Button>
                      )}
                    </div>
                    <Button 
                      onClick={handleCreatePost}
                      disabled={createPostMutation.isPending || !newPost.trim()}
                      className="bg-spotify-green hover:bg-green-600"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      {createPostMutation.isPending ? "Posting..." : "Share"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Feed */}
          <div className="space-y-4">
            {socialPosts.map((post) => (
              <Card key={post.id} className="bg-dark-card border-gray-800">
                <CardContent className="p-4">
                  <div className="flex space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gray-700">
                        {post.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-white">{post.username}</span>
                        <span className="text-xs text-gray-500">{formatTime(post.timestamp)}</span>
                      </div>
                      
                      <p className="text-gray-300 mb-3">{post.content}</p>
                      
                      {post.songId && (
                        <div className="bg-gray-800 p-3 rounded-lg mb-3 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-spotify-green/20 rounded flex items-center justify-center">
                              <Music className="w-5 h-5 text-spotify-green" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{post.songTitle}</p>
                              <p className="text-xs text-gray-400">by {post.username}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleLikePost(post.id)}
                            className={`${post.isLiked ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}
                          >
                            <Heart className={`w-4 h-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                            {post.likes}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {post.comments}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <Share2 className="w-4 h-4 mr-1" />
                            {post.shares}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-dark-card border-gray-800">
              <CardContent className="p-6 text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarFallback className="bg-spotify-green text-white text-2xl">
                    {userProfile.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold text-white mb-1">{userProfile.displayName}</h3>
                <p className="text-gray-400 mb-4">@{userProfile.username}</p>
                
                <div className="grid grid-cols-2 gap-4 text-center mb-4">
                  <div>
                    <p className="text-2xl font-bold text-white">{userProfile.followers}</p>
                    <p className="text-xs text-gray-400">Followers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{userProfile.following}</p>
                    <p className="text-xs text-gray-400">Following</p>
                  </div>
                </div>
                
                <Button className="w-full bg-spotify-green hover:bg-green-600">
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-white">Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{userProfile.totalSongs}</p>
                      <p className="text-sm text-gray-400">Songs Created</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{userProfile.totalLikes}</p>
                      <p className="text-sm text-gray-400">Total Likes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">12.5K</p>
                      <p className="text-sm text-gray-400">Total Plays</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">89</p>
                      <p className="text-sm text-gray-400">Collaborations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-white">Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {userProfile.badges.map((badge, index) => (
                      <div key={index} className="bg-gray-800 p-3 rounded-lg text-center">
                        <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-white">{badge}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-medium text-white">
                <Trophy className="w-5 h-5 mr-2" />
                Weekly Leaderboard - Most Plays
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weeklyLeaderboard.map((entry) => (
                  <div key={entry.rank} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        entry.rank === 1 ? 'bg-yellow-500 text-black' :
                        entry.rank === 2 ? 'bg-gray-400 text-black' :
                        entry.rank === 3 ? 'bg-orange-500 text-black' :
                        'bg-gray-700 text-white'
                      }`}>
                        {entry.badge || entry.rank}
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gray-700">
                          {entry.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{entry.username}</p>
                        {entry.userId === userId && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{entry.metric.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">plays</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-medium text-white">
                <TrendingUp className="w-5 h-5 mr-2" />
                Trending Songs This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendingSongs.map((song, index) => (
                  <div key={song.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-spotify-green/20 rounded flex items-center justify-center">
                        <Zap className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{song.title}</p>
                        <p className="text-sm text-gray-400">by {song.artist}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{song.plays.toLocaleString()}</p>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-500/20 text-green-400 text-xs">
                          {song.trend}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}