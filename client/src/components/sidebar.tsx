import { Music, Plus, History, Mic, Download, Crown, Library, BarChart3, GitBranch, Users, BookOpen, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
const burntBeatsLogo = "/burnt-beats-logo.jpeg";

interface SidebarProps {
  onMenuClick?: (menuItem: string) => void;
  activeMenu?: string;
}

export default function Sidebar({ onMenuClick, activeMenu = "New Song" }: SidebarProps) {
  const menuItems = [
    { icon: Plus, label: "New Song", key: "new-song" },
    { icon: Library, label: "Song Library", key: "library" },
    { icon: History, label: "Recent Creations", key: "recent" },
    { icon: Mic, label: "Voice Samples", key: "voice" },
    { icon: BarChart3, label: "Analytics", key: "analytics", isPro: true },
    { icon: GitBranch, label: "Version Control", key: "version", isPro: true },
    { icon: Users, label: "Collaborative Workspace", key: "collaboration", isPro: true },
    { icon: BookOpen, label: "Music Theory", key: "theory", isPro: true },
    { icon: TrendingUp, label: "Social Hub", key: "social" },
    { icon: Download, label: "Downloads", key: "downloads" },
  ];

  return (
    <div className="w-64 bg-dark-card p-6 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <img 
            src={burntBeatsLogo} 
            alt="Burnt Beats Logo" 
            className="w-10 h-10 mr-3 rounded-lg object-cover"
          />
          <h1 className="text-2xl font-poppins font-bold text-spotify-green">
            Burnt Beats
          </h1>
        </div>
        <p className="text-gray-400 text-sm">AI Music Creation Platform</p>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-3">
          {menuItems.map((item) => (
            <li key={item.label}>
              <button 
                onClick={() => onMenuClick?.(item.key)} 
                className={`flex items-center px-4 py-3 rounded-lg transition-colors w-full text-left ${
                  activeMenu === item.label 
                    ? 'bg-spotify-green text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <item.icon className="mr-3 w-5 h-5" />
                {item.label}
                {item.isPro && (
                  <Crown className="ml-auto w-4 h-4 text-yellow-400" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-auto">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Crown className="text-vibrant-orange mr-2 w-5 h-5" />
            <span className="text-sm font-medium">Free Plan</span>
          </div>
          <div className="space-y-1 mb-3">
            <p className="text-xs text-gray-400">• 2 full songs/month</p>
            <p className="text-xs text-gray-400">• No voice cloning</p>
            <p className="text-xs text-gray-400">• No storage/editing</p>
          </div>
          <Button size="sm" className="w-full bg-gradient-to-r from-vibrant-orange to-orange-600 hover:from-orange-600 hover:to-vibrant-orange text-white font-medium">
            Upgrade to Basic $6.99/mo
          </Button>
        </div>
      </div>
    </div>
  );
}
