import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  GitBranch, 
  GitCommit, 
  GitMerge, 
  History, 
  ArrowRight,
  Play,
  Download,
  MessageSquare,
  Clock,
  User,
  Tag,
  Diff,
  RotateCcw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Song } from "@shared/schema";

interface VersionControlProps {
  song: Song;
  userId: number;
}

interface SongVersion {
  id: number;
  versionNumber: string;
  title: string;
  commitMessage: string;
  changes: string[];
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  size: number;
}

interface Branch {
  id: number;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  lastCommit: string;
  isMain: boolean;
}

export default function VersionControl({ song, userId }: VersionControlProps) {
  const [commitMessage, setCommitMessage] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - would come from API
  const versions: SongVersion[] = [
    {
      id: 1,
      versionNumber: "v1.0.0",
      title: song.title,
      commitMessage: "Initial song creation",
      changes: ["Created base lyrics", "Set genre to pop", "Added basic structure"],
      createdBy: "john_doe",
      createdAt: "2025-06-19T10:00:00Z",
      isActive: false,
      size: 3.2
    },
    {
      id: 2,
      versionNumber: "v1.1.0",
      title: song.title,
      commitMessage: "Enhanced chorus melody and added bridge section",
      changes: ["Modified chorus lyrics", "Added bridge section", "Adjusted tempo to 120 BPM"],
      createdBy: "music_lover",
      createdAt: "2025-06-19T14:30:00Z",
      isActive: false,
      size: 3.8
    },
    {
      id: 3,
      versionNumber: "v1.2.0",
      title: song.title,
      commitMessage: "Final polish and vocal adjustments",
      changes: ["Refined vocal style", "Added harmonies", "Final mixing adjustments"],
      createdBy: "producer_sam",
      createdAt: "2025-06-19T18:45:00Z",
      isActive: true,
      size: 4.1
    }
  ];

  const branches: Branch[] = [
    {
      id: 1,
      name: "main",
      description: "Main production branch",
      createdBy: "john_doe",
      createdAt: "2025-06-19T10:00:00Z",
      lastCommit: "v1.2.0 - Final polish and vocal adjustments",
      isMain: true
    },
    {
      id: 2,
      name: "experimental-vocals",
      description: "Testing different vocal styles and effects",
      createdBy: "music_lover",
      createdAt: "2025-06-19T12:00:00Z",
      lastCommit: "v0.3.0 - Added reverb and vocal layers",
      isMain: false
    },
    {
      id: 3,
      name: "remix-version",
      description: "Electronic remix with different arrangement",
      createdBy: "producer_sam",
      createdAt: "2025-06-19T16:00:00Z",
      lastCommit: "v0.2.0 - Electronic beats and synths",
      isMain: false
    }
  ];

  const createVersionMutation = useMutation({
    mutationFn: async (data: { message: string; changes: string[] }) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, version: "v1.3.0" };
    },
    onSuccess: (data) => {
      setCommitMessage("");
      toast({
        title: "Version created",
        description: `Successfully created ${data.version} with your changes.`,
      });
    }
  });

  const createBranchMutation = useMutation({
    mutationFn: async (name: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      setNewBranchName("");
      toast({
        title: "Branch created",
        description: "New branch created successfully for experimentation.",
      });
    }
  });

  const revertToVersionMutation = useMutation({
    mutationFn: async (versionId: number) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Version restored",
        description: "Song has been reverted to the selected version.",
      });
    }
  });

  const handleCreateVersion = () => {
    if (!commitMessage.trim()) return;
    
    const mockChanges = [
      "Updated lyrics in verse 2",
      "Modified chord progression",
      "Adjusted vocal style parameters"
    ];
    
    createVersionMutation.mutate({
      message: commitMessage,
      changes: mockChanges
    });
  };

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    createBranchMutation.mutate(newBranchName);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (sizeInMB: number) => {
    return `${sizeInMB.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-poppins font-bold text-white">Version Control</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-spotify-green/20 text-spotify-green">
            {versions.length} versions
          </Badge>
          <Badge variant="outline">
            <GitBranch className="w-3 h-3 mr-1" />
            main
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Changes & Commit */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-medium text-white">
                <GitCommit className="w-5 h-5 mr-2" />
                Commit Changes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Commit Message
                </label>
                <Textarea
                  placeholder="Describe your changes..."
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="bg-gray-800 border-gray-600 resize-none"
                  rows={3}
                />
              </div>
              
              <div className="bg-gray-800 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2">Pending Changes</h4>
                <div className="space-y-1 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Modified chorus lyrics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Adjusted vocal style</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Updated tempo settings</span>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-spotify-green hover:bg-green-600"
                onClick={handleCreateVersion}
                disabled={createVersionMutation.isPending || !commitMessage.trim()}
              >
                <GitCommit className="w-4 h-4 mr-2" />
                {createVersionMutation.isPending ? "Creating..." : "Commit Version"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-medium text-white">
                <GitBranch className="w-5 h-5 mr-2" />
                Branches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="branch-name"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="bg-gray-800 border-gray-600"
                />
                <Button 
                  size="sm"
                  onClick={handleCreateBranch}
                  disabled={createBranchMutation.isPending || !newBranchName.trim()}
                >
                  <GitBranch className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {branches.map((branch) => (
                  <div key={branch.id} className="bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <GitBranch className="w-3 h-3 text-gray-400" />
                        <span className="font-medium text-white">{branch.name}</span>
                        {branch.isMain && (
                          <Badge variant="outline" className="text-xs">Main</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{branch.description}</p>
                    <div className="text-xs text-gray-500">
                      Last: {branch.lastCommit.split(' - ')[0]}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Version History */}
        <div className="lg:col-span-2">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg font-medium text-white">
                  <History className="w-5 h-5 mr-2" />
                  Version History
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDiff(!showDiff)}
                  >
                    <Diff className="w-4 h-4 mr-1" />
                    {showDiff ? "Hide" : "Show"} Diff
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <div key={version.id} className="relative">
                    {/* Timeline connector */}
                    {index < versions.length - 1 && (
                      <div className="absolute left-4 top-12 w-0.5 h-16 bg-gray-700"></div>
                    )}
                    
                    <div className="flex items-start space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        version.isActive ? 'bg-spotify-green' : 'bg-gray-700'
                      }`}>
                        {version.isActive ? (
                          <Tag className="w-4 h-4 text-white" />
                        ) : (
                          <GitCommit className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-white">{version.versionNumber}</span>
                            {version.isActive && (
                              <Badge className="bg-spotify-green text-white text-xs">Current</Badge>
                            )}
                            <span className="text-sm text-gray-400">by {version.createdBy}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">{formatSize(version.size)}</span>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Play className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Download className="w-3 h-3" />
                              </Button>
                              {!version.isActive && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => revertToVersionMutation.mutate(version.id)}
                                  disabled={revertToVersionMutation.isPending}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-3">{version.commitMessage}</p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDate(version.createdAt)}
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {version.changes.length} changes
                            </div>
                          </div>
                        </div>

                        {showDiff && (
                          <div className="bg-gray-900 p-3 rounded border-l-4 border-spotify-green">
                            <h5 className="text-xs font-medium text-white mb-2">Changes:</h5>
                            <div className="space-y-1">
                              {version.changes.map((change, changeIndex) => (
                                <div key={changeIndex} className="flex items-center space-x-2 text-xs">
                                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                  <span className="text-gray-300">{change}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Merge Requests */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-medium text-white">
            <GitMerge className="w-5 h-5 mr-2" />
            Merge Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <GitMerge className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-white">experimental-vocals → main</span>
                  <Badge variant="outline" className="text-xs">Pending</Badge>
                </div>
                <div className="text-xs text-gray-500">by music_lover</div>
              </div>
              <p className="text-sm text-gray-300 mb-3">
                New vocal arrangements with enhanced harmonies and reverb effects
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>+12 changes</span>
                  <span>-3 deletions</span>
                  <span>2 conflicts</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">Review</Button>
                  <Button size="sm" className="bg-spotify-green hover:bg-green-600">
                    Merge
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}