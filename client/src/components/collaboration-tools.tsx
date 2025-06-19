import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Share2, 
  MessageCircle, 
  Send, 
  UserPlus,
  Eye,
  Edit,
  Clock,
  Music
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Song } from "@shared/schema";

interface CollaborationToolsProps {
  song: Song;
  userId: number;
}

interface Comment {
  id: number;
  userId: number;
  username: string;
  content: string;
  timestamp: number;
  sectionId?: number;
}

interface Collaborator {
  id: number;
  username: string;
  role: "owner" | "editor" | "viewer";
  joinedAt: string;
}

export default function CollaborationTools({ song, userId }: CollaborationToolsProps) {
  const [newComment, setNewComment] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const { toast } = useToast();

  // Mock data - would come from API
  const collaborators: Collaborator[] = [
    { id: 1, username: "john_doe", role: "owner", joinedAt: "2025-06-15" },
    { id: 2, username: "music_lover", role: "editor", joinedAt: "2025-06-18" },
    { id: 3, username: "producer_sam", role: "viewer", joinedAt: "2025-06-19" }
  ];

  const comments: Comment[] = [
    {
      id: 1,
      userId: 2,
      username: "music_lover",
      content: "Love the chorus melody! Could we try a different tempo for the bridge?",
      timestamp: Date.now() - 3600000,
      sectionId: 2
    },
    {
      id: 2,
      userId: 3,
      username: "producer_sam",
      content: "The vocal style works well. Maybe add some reverb in the final mix?",
      timestamp: Date.now() - 1800000
    }
  ];

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your feedback has been shared with collaborators.",
      });
    }
  });

  const inviteCollaboratorMutation = useMutation({
    mutationFn: async (email: string) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      setInviteEmail("");
      toast({
        title: "Invitation sent",
        description: "Collaborator will receive an email invitation.",
      });
    }
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  const handleInviteCollaborator = () => {
    if (!inviteEmail.trim()) return;
    inviteCollaboratorMutation.mutate(inviteEmail);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner": return "bg-yellow-500";
      case "editor": return "bg-green-500";
      case "viewer": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Collaboration Header */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-poppins font-semibold text-white">
            <Users className="w-5 h-5 mr-2" />
            Collaboration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {collaborators.length} collaborators
              </span>
              <div className="flex -space-x-2">
                {collaborators.slice(0, 3).map((collaborator) => (
                  <Avatar key={collaborator.id} className="w-6 h-6 border-2 border-dark-card">
                    <AvatarFallback className="text-xs bg-gray-700">
                      {collaborator.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {collaborators.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-dark-card flex items-center justify-center">
                    <span className="text-xs text-gray-300">+{collaborators.length - 3}</span>
                  </div>
                )}
              </div>
            </div>
            <Button size="sm" className="bg-spotify-green hover:bg-green-600">
              <Share2 className="w-4 h-4 mr-1" />
              Share Song
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collaborators Panel */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-white">Team Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Invite New Collaborator */}
            <div className="flex space-x-2">
              <Input
                placeholder="Enter email to invite..."
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-gray-800 border-gray-600"
              />
              <Button 
                size="sm"
                onClick={handleInviteCollaborator}
                disabled={inviteCollaboratorMutation.isPending}
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>

            {/* Collaborators List */}
            <div className="space-y-3">
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gray-700">
                        {collaborator.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white">{collaborator.username}</p>
                      <p className="text-xs text-gray-400">
                        Joined {new Date(collaborator.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getRoleColor(collaborator.role)} text-white text-xs`}>
                    {collaborator.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comments & Feedback */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-medium text-white">
              <MessageCircle className="w-5 h-5 mr-2" />
              Comments & Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Comment */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add your feedback or suggestions..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="bg-gray-800 border-gray-600 resize-none"
                rows={3}
              />
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-400">
                  {selectedSection && `Commenting on section ${selectedSection}`}
                </div>
                <Button 
                  size="sm"
                  onClick={handleAddComment}
                  disabled={addCommentMutation.isPending || !newComment.trim()}
                >
                  <Send className="w-4 h-4 mr-1" />
                  Send
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-6 h-6 mt-1">
                      <AvatarFallback className="bg-gray-700 text-xs">
                        {comment.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-white">{comment.username}</p>
                        <p className="text-xs text-gray-400">{formatTime(comment.timestamp)}</p>
                        {comment.sectionId && (
                          <Badge variant="outline" className="text-xs">
                            Section {comment.sectionId}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 mt-1">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity Feed */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-400">music_lover edited the chorus section</span>
              <span className="text-xs text-gray-500">2 minutes ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-400">producer_sam left a comment</span>
              <span className="text-xs text-gray-500">30 minutes ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-400">john_doe regenerated the bridge</span>
              <span className="text-xs text-gray-500">1 hour ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}