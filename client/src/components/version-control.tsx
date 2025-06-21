import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  GitBranch, 
  GitCommit, 
  GitMerge, 
  History, 
  Save,
  Crown,
  ArrowRight,
  Calendar,
  User,
  FileText
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import UpgradeModal from "./upgrade-modal";
import type { Song } from "@shared/schema";

interface VersionControlProps {
  song?: Song;
  userPlan: string;
  onUpgrade: () => void;
}

interface Version {
  id: string;
  commitMessage: string;
  timestamp: Date;
  author: string;
  changes: string[];
  branch: string;
}

export default function VersionControl({ song, userPlan, onUpgrade }: VersionControlProps) {
  const [commitMessage, setCommitMessage] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("main");

  // Pricing wall for Pro tier requirement
  if (userPlan === "free" || userPlan === "basic") {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">
            Version Control (Pro Feature)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <GitBranch className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">Git-like Version Control</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
            Track changes, create branches, commit versions, and collaborate with git-like version control for your songs. Available with Pro plan and above.
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

  if (!song) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Select a song to view version history</p>
      </div>
    );
  }

  // Mock version history data
  const versions: Version[] = [
    {
      id: "v1.2.3",
      commitMessage: "Added bridge section and improved chorus melody",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      author: "You",
      changes: ["Added bridge section", "Modified chorus melody", "Updated vocal arrangement"],
      branch: "main"
    },
    {
      id: "v1.2.2",
      commitMessage: "Fixed timing issues in verse 2",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      author: "You",
      changes: ["Fixed verse 2 timing", "Adjusted tempo markers"],
      branch: "main"
    },
    {
      id: "v1.2.1",
      commitMessage: "Experimental rock version",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      author: "You",
      changes: ["Changed genre to rock", "Added guitar arrangements", "Modified vocal style"],
      branch: "rock-version"
    },
    {
      id: "v1.2.0",
      commitMessage: "Initial complete version",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      author: "You",
      changes: ["Created initial song structure", "Added lyrics", "Set basic arrangement"],
      branch: "main"
    }
  ];

  const branches = ["main", "rock-version", "acoustic-mix"];

  const handleCommit = () => {
    if (!commitMessage.trim()) return;
    // In real implementation, this would save the current state as a new version
    console.log("Committing with message:", commitMessage);
    setCommitMessage("");
  };

  const handleRevert = (versionId: string) => {
    console.log("Reverting to version:", versionId);
  };

  const handleCreateBranch = () => {
    const branchName = prompt("Enter new branch name:");
    if (branchName) {
      console.log("Creating branch:", branchName);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Version Control</h2>
          <p className="text-gray-400">Track changes and manage song versions</p>
        </div>
        <Badge className="bg-blue-500/20 text-blue-400">
          <GitBranch className="w-4 h-4 mr-1" />
          Pro Feature
        </Badge>
      </div>

      {/* Current Song Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            {song.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <GitBranch className="w-4 h-4 mr-2 text-blue-400" />
                <span className="text-white">Branch: {selectedBranch}</span>
              </div>
              <div className="flex items-center">
                <History className="w-4 h-4 mr-2 text-green-400" />
                <span className="text-white">Latest: v1.2.3</span>
              </div>
            </div>
            <Button onClick={handleCreateBranch} variant="outline" size="sm">
              <GitBranch className="w-4 h-4 mr-1" />
              New Branch
            </Button>
          </div>

          {/* Commit New Version */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Commit Changes</h4>
            <div className="flex space-x-2">
              <Input
                placeholder="Describe your changes..."
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="bg-gray-800 border-gray-600"
              />
              <Button 
                onClick={handleCommit}
                disabled={!commitMessage.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-1" />
                Commit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branch Selector */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Branches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {branches.map((branch) => (
              <div
                key={branch}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedBranch === branch
                    ? "bg-blue-500/20 border-blue-500"
                    : "bg-gray-900 border-gray-600 hover:border-gray-500"
                }`}
                onClick={() => setSelectedBranch(branch)}
              >
                <div className="flex items-center">
                  <GitBranch className="w-4 h-4 mr-2 text-blue-400" />
                  <span className="text-white font-medium">{branch}</span>
                  {branch === "main" && (
                    <Badge className="ml-2 bg-green-500/20 text-green-400 text-xs">
                      Current
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <History className="w-5 h-5 mr-2" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {versions.map((version, index) => (
              <div key={version.id}>
                <div className="flex items-start justify-between p-4 bg-gray-900 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <GitCommit className="w-4 h-4 text-green-400" />
                      <span className="text-white font-medium">{version.id}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          version.branch === "main" 
                            ? "border-green-500 text-green-400" 
                            : "border-blue-500 text-blue-400"
                        }`}
                      >
                        {version.branch}
                      </Badge>
                    </div>

                    <p className="text-white mb-2">{version.commitMessage}</p>

                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {version.author}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDistanceToNow(version.timestamp, { addSuffix: true })}
                      </div>
                    </div>

                    <div className="space-y-1">
                      {version.changes.map((change, changeIndex) => (
                        <div key={changeIndex} className="flex items-center text-sm text-gray-300">
                          <ArrowRight className="w-3 h-3 mr-2 text-blue-400" />
                          {change}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevert(version.id)}
                    >
                      Revert
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                    >
                      View
                    </Button>
                  </div>
                </div>
                {index < versions.length - 1 && <Separator className="bg-gray-700" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}