import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Crown, Shield, Eye, Trash2, Mail, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Song } from "@shared/schema";

interface TeamManagementProps {
  song: Song;
  currentUser: { id: number; username: string };
}

interface TeamMember {
  id: number;
  userId: number;
  username: string;
  email?: string;
  role: "owner" | "editor" | "viewer";
  joinedAt: string;
  lastActive: string;
  isOnline: boolean;
}

interface InviteLink {
  id: string;
  songId: number;
  role: "editor" | "viewer";
  expiresAt: string;
  usageCount: number;
  maxUses?: number;
  createdBy: number;
}

export default function TeamManagement({ song, currentUser }: TeamManagementProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const { toast } = useToast();

  // Mock data for demonstration
  const teamMembers: TeamMember[] = [
    {
      id: 1,
      userId: currentUser.id,
      username: currentUser.username,
      role: "owner",
      joinedAt: "2025-06-20T08:00:00Z",
      lastActive: "2025-06-20T12:05:00Z",
      isOnline: true
    },
    {
      id: 2,
      userId: 2,
      username: "BeatMaker42",
      email: "beatmaker@example.com",
      role: "editor",
      joinedAt: "2025-06-20T09:30:00Z",
      lastActive: "2025-06-20T11:45:00Z",
      isOnline: true
    },
    {
      id: 3,
      userId: 3,
      username: "LyricGenius",
      email: "lyrics@example.com",
      role: "viewer",
      joinedAt: "2025-06-20T10:15:00Z",
      lastActive: "2025-06-20T10:30:00Z",
      isOnline: false
    }
  ];

  const inviteLinks: InviteLink[] = [
    {
      id: "invite_123",
      songId: song.id,
      role: "editor",
      expiresAt: "2025-06-27T12:00:00Z",
      usageCount: 2,
      maxUses: 10,
      createdBy: currentUser.id
    },
    {
      id: "invite_456",
      songId: song.id,
      role: "viewer",
      expiresAt: "2025-06-22T12:00:00Z",
      usageCount: 0,
      createdBy: currentUser.id
    }
  ];

  const sendInviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      return apiRequest("POST", `/api/collaboration/${song.id}/invite`, {
        email,
        role,
        invitedBy: currentUser.id
      });
    },
    onSuccess: () => {
      setInviteEmail("");
      setIsInviteDialogOpen(false);
      toast({
        title: "Invitation Sent",
        description: "Team member will receive an email invitation",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Send Invitation",
        description: "Could not send team invitation",
        variant: "destructive",
      });
    }
  });

  const createInviteLinkMutation = useMutation({
    mutationFn: async ({ role, maxUses }: { role: string; maxUses?: number }) => {
      return apiRequest("POST", `/api/collaboration/${song.id}/invite-link`, {
        role,
        maxUses,
        createdBy: currentUser.id
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Invite Link Created",
        description: "Share this link with your team members",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Create Link",
        description: "Could not generate invite link",
        variant: "destructive",
      });
    }
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return apiRequest("PATCH", `/api/collaboration/${song.id}/member/${userId}`, {
        role
      });
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "Team member role has been changed",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Update Role",
        description: "Could not change team member role",
        variant: "destructive",
      });
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("DELETE", `/api/collaboration/${song.id}/member/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Member Removed",
        description: "Team member has been removed from the project",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Remove Member",
        description: "Could not remove team member",
        variant: "destructive",
      });
    }
  });

  const handleSendInvite = () => {
    if (inviteEmail.trim()) {
      sendInviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
    }
  };

  const handleCreateInviteLink = (role: "editor" | "viewer") => {
    createInviteLinkMutation.mutate({ role, maxUses: 10 });
  };

  const handleCopyInviteLink = async (linkId: string) => {
    const inviteUrl = `${window.location.origin}/invite/${linkId}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000);
      toast({
        title: "Link Copied",
        description: "Invite link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = (userId: number, newRole: string) => {
    if (userId !== currentUser.id) {
      updateMemberRoleMutation.mutate({ userId, role: newRole });
    }
  };

  const handleRemoveMember = (userId: number) => {
    if (userId !== currentUser.id) {
      removeMemberMutation.mutate(userId);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "editor":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "viewer":
        return <Eye className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "editor":
        return "secondary";
      case "viewer":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Team Members ({teamMembers.length})
            </CardTitle>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-1" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email Address</label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="teammate@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Role</label>
                    <Select value={inviteRole} onValueChange={(value: "editor" | "viewer") => setInviteRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor - Can edit and comment</SelectItem>
                        <SelectItem value="viewer">Viewer - Can view and comment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSendInvite}
                      disabled={!inviteEmail.trim() || sendInviteMutation.isPending}
                      className="flex-1"
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      {sendInviteMutation.isPending ? "Sending..." : "Send Invitation"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsInviteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {member.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {member.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.username}</span>
                        {member.userId === currentUser.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{member.email || "No email"}</span>
                        <span>•</span>
                        <span>Active {formatLastActive(member.lastActive)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center gap-1">
                      {getRoleIcon(member.role)}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                    {member.userId !== currentUser.id && member.role !== "owner" && (
                      <div className="flex gap-1">
                        <Select
                          value={member.role}
                          onValueChange={(role) => handleUpdateRole(member.userId, role)}
                          disabled={updateMemberRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.userId)}
                          disabled={removeMemberMutation.isPending}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Invite Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Invite Links
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCreateInviteLink("editor")}
                disabled={createInviteLinkMutation.isPending}
              >
                Create Editor Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCreateInviteLink("viewer")}
                disabled={createInviteLinkMutation.isPending}
              >
                Create Viewer Link
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {inviteLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No invite links created yet. Create one to share with your team.
              </p>
            ) : (
              inviteLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getRoleBadgeVariant(link.role)}>
                        {link.role.charAt(0).toUpperCase() + link.role.slice(1)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Used {link.usageCount}/{link.maxUses || "∞"} times
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expires: {new Date(link.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyInviteLink(link.id)}
                    className="flex items-center gap-1"
                  >
                    {copiedLinkId === link.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}