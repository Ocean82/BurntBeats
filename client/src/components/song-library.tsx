import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Music, 
  Search, 
  Play, 
  Pause, 
  Download, 
  Edit,
  Share2,
  Heart,
  Clock,
  Calendar,
  Filter,
  SortAsc
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Song } from "@shared/schema";

interface SongLibraryProps {
  userId: number;
  onEditSong: (song: Song) => void;
}

export default function SongLibrary({ userId, onEditSong }: SongLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [playingSong, setPlayingSong] = useState<number | null>(null);

  const { data: songs = [], isLoading } = useQuery({
    queryKey: [`/api/songs/user/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/songs/user/${userId}`);
      return response.json();
    }
  });

  const filteredSongs = songs
    .filter((song: Song) => {
      const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          song.lyrics.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = genreFilter === "all" || song.genre === genreFilter;
      return matchesSearch && matchesGenre;
    })
    .sort((a: Song, b: Song) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        case "oldest":
          return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const formatDate = (date: string | null) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = (songId: number) => {
    setPlayingSong(playingSong === songId ? null : songId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "generating": return "bg-yellow-500";
      case "failed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spotify-green mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your songs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-poppins font-bold text-white">Your Song Library</h2>
          <Badge variant="secondary" className="bg-spotify-green/20 text-spotify-green">
            {songs.length} songs
          </Badge>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search songs or lyrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600"
            />
          </div>

          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-600">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              <SelectItem value="pop">Pop</SelectItem>
              <SelectItem value="rock">Rock</SelectItem>
              <SelectItem value="jazz">Jazz</SelectItem>
              <SelectItem value="electronic">Electronic</SelectItem>
              <SelectItem value="classical">Classical</SelectItem>
              <SelectItem value="hip-hop">Hip-Hop</SelectItem>
              <SelectItem value="country">Country</SelectItem>
              <SelectItem value="r&b">R&B</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-600">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Songs Grid */}
        {filteredSongs.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              {searchQuery || genreFilter !== "all" ? "No songs found" : "No songs yet"}
            </h3>
            <p className="text-sm text-gray-400">
              {searchQuery || genreFilter !== "all" 
                ? "Try adjusting your search or filters" 
                : "Create your first song to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSongs.map((song: Song) => (
              <Card key={song.id} className="bg-dark-card border-gray-800 hover:border-gray-700 transition-colors group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-medium text-white truncate">
                        {song.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {song.genre}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(song.status)}`} />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePlay(song.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {playingSong === song.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                    {song.lyrics}
                  </p>

                  <div className="flex items-center text-xs text-gray-500 mb-4 space-x-4">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {song.songLength}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(typeof song.createdAt === 'string' ? song.createdAt : song.createdAt?.toISOString() || null)}
                    </div>
                  </div>

                  <Separator className="bg-gray-700 mb-3" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Heart className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Share2 className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex items-center space-x-1">
                      {song.status === "completed" && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => onEditSong(song)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Download className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}