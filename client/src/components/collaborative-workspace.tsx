import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, MessageSquare, Send, Music, Play, Pause, Save, Share2, Settings, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TeamManagement from "@/components/team-management";
import type { Song } from "@shared/schema";

interface CollaborativeWorkspaceProps {
  song: Song;
  currentUser: { id: number; username: string };
  onSongUpdate: (song: Song) => void;
}

interface Participant {
  userId: number;
  username: string;
}

interface Comment {
  id: number;
  userId: number;
  username: string;
  content: string;
  sectionId?: number;
  timestamp: number;
}

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export default function CollaborativeWorkspace({ 
  song, 
  currentUser, 
  onSongUpdate 
}: CollaborativeWorkspaceProps) {
  const [lyrics, setLyrics] = useState(song.lyrics);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isTeamManagementOpen, setIsTeamManagementOpen] = useState(false);
  const [activeEditors, setActiveEditors] = useState<{ [userId: number]: { cursor: number; selection: { start: number; end: number } } }>({});
  
  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // For Replit, use the current host (which handles port forwarding automatically)
    // Remove any undefined ports and ensure clean URL
    const host = window.location.host.replace(':undefined', '');
    const wsUrl = `${protocol}//${host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to collaboration server');
      
      // Join the song collaboration session
      ws.send(JSON.stringify({
        type: 'join_song',
        songId: song.id,
        userId: currentUser.id,
        username: currentUser.username
      }));
      
      toast({
        title: "Connected",
        description: "Joined collaboration session",
      });
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from collaboration server');
      toast({
        title: "Disconnected",
        description: "Lost connection to collaboration session",
        variant: "destructive",
      });
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to collaboration server",
        variant: "destructive",
      });
    };

    return () => {
      ws.close();
    };
  }, [song.id, currentUser.id, currentUser.username]);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'session_state':
        setLyrics(message.lyrics);
        setParticipants(message.participants);
        break;
        
      case 'user_joined':
        setParticipants(message.participants);
        toast({
          title: "User Joined",
          description: `${message.username} joined the session`,
        });
        break;
        
      case 'user_left':
        setParticipants(message.participants);
        toast({
          title: "User Left",
          description: `${message.username} left the session`,
        });
        break;
        
      case 'lyrics_update':
        if (message.userId !== currentUser.id) {
          setLyrics(message.lyrics);
          toast({
            title: "Lyrics Updated",
            description: `Updated by ${message.username}`,
          });
        }
        break;
        
      case 'new_comment':
        setComments(prev => [...prev, message.comment]);
        if (message.comment.userId !== currentUser.id) {
          toast({
            title: "New Comment",
            description: `${message.comment.username}: ${message.comment.content.substring(0, 50)}...`,
          });
        }
        break;
    }
  }, [currentUser.id, toast]);

  // Handle lyrics changes with debounced saving
  const handleLyricsChange = useCallback((newLyrics: string) => {
    setLyrics(newLyrics);
    
    // Send real-time update via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'lyrics_change',
        songId: song.id,
        lyrics: newLyrics,
        userId: currentUser.id,
        username: currentUser.username
      }));
    }
    
    // Debounced save to database
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveLyrics(newLyrics);
    }, 2000);
  }, [song.id, currentUser.id, currentUser.username]);

  const saveLyricsMutation = useMutation({
    mutationFn: async (lyrics: string) => {
      return apiRequest("POST", `/api/collaboration/${song.id}/update`, {
        lyrics,
        userId: currentUser.id,
        username: currentUser.username
      });
    },
    onSuccess: () => {
      setLastSaved(new Date());
      onSongUpdate({ ...song, lyrics });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: "Failed to save lyrics changes",
        variant: "destructive",
      });
    }
  });

  const saveLyrics = useCallback((lyrics: string) => {
    saveLyricsMutation.mutate(lyrics);
  }, [saveLyricsMutation]);

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/collaboration/${song.id}/comment`, {
        content,
        userId: currentUser.id,
        username: currentUser.username,
        sectionId: null
      });
    },
    onSuccess: () => {
      setNewComment("");
      toast({
        title: "Comment Added",
        description: "Your comment has been posted",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Add Comment",
        description: "Could not post your comment",
        variant: "destructive",
      });
    }
  });

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveLyrics(lyrics);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen max-h-[800px]">
      {/* Main Editing Area */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">"{song.title}"</CardTitle>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-muted-foreground">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleManualSave}
                  disabled={saveLyricsMutation.isPending}
                  size="sm"
                  variant="outline"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {saveLyricsMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Dialog open={isTeamManagementOpen} onOpenChange={setIsTeamManagementOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <UserPlus className="w-4 h-4 mr-1" />
                      Manage Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Team Management - "{song.title}"</DialogTitle>
                    </DialogHeader>
                    <TeamManagement song={song} currentUser={currentUser} />
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="outline">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
            {lastSaved && (
              <p className="text-xs text-muted-foreground">
                Last saved: {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Textarea
              ref={textareaRef}
              value={lyrics}
              onChange={(e) => handleLyricsChange(e.target.value)}
              onSelect={(e) => {
                const target = e.target as HTMLTextAreaElement;
                setCursorPosition(target.selectionStart);
              }}
              placeholder="Start writing your lyrics here..."
              className="min-h-[400px] font-mono text-sm leading-relaxed resize-none"
              style={{ 
                fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Monaco, Consolas, monospace' 
              }}
            />
            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
              <span>Characters: {lyrics.length}</span>
              <span>Lines: {lyrics.split('\n').length}</span>
              <span>Words: {lyrics.trim() ? lyrics.trim().split(/\s+/).length : 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collaboration Sidebar */}
      <div className="space-y-4">
        {/* Active Participants */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Collaborators ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div key={`${participant.userId}_${participant.username}`} className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {participant.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{participant.username}</span>
                    {participant.userId === currentUser.id && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                ))}
                {participants.length === 0 && (
                  <p className="text-sm text-muted-foreground">No active collaborators</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64 px-4">
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-xs">
                          {comment.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{comment.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm bg-muted p-2 rounded">{comment.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet
                  </p>
                )}
              </div>
            </ScrollArea>
            <Separator />
            <div className="p-4 space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="min-h-[60px] resize-none"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || addCommentMutation.isPending}
                size="sm"
                className="w-full"
              >
                <Send className="w-4 h-4 mr-1" />
                {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}