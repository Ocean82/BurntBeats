import { Music, Plus, History, Mic, Download, Crown, Library, BarChart3, GitBranch, Users, BookOpen, TrendingUp, X, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
const burntBeatsLogo = "/burnt-beats-logo.jpeg";

interface SidebarProps {
  onMenuClick?: (menuItem: string) => void;
  activeMenu?: string;
}

export default function Sidebar({ onMenuClick, activeMenu = "New Song" }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const isMobile = useIsMobile();

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(true);
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');

      if (
        isOpen && 
        sidebar && 
        !sidebar.contains(event.target as Node) &&
        toggleButton &&
        !toggleButton.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobile]);

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

  const handleMenuClick = (key: string) => {
    onMenuClick?.(key);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Mobile toggle button
  if (isMobile && !isOpen) {
    return (
      <Button
        id="sidebar-toggle"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 bg-dark-card border border-gray-700 hover:bg-gray-800"
        size="icon"
      >
        <Menu className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        id="sidebar"
        className={`
          ${isMobile ? 'fixed left-0 top-0 h-full z-50' : 'relative'}
          ${isMinimized && !isMobile ? 'w-16' : 'w-64'}
          bg-dark-card border-r border-gray-700 p-6 flex flex-col h-full
          transition-all duration-300 ease-in-out
          ${isMobile && !isOpen ? 'transform -translate-x-full' : 'transform translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <img 
                src={burntBeatsLogo} 
                alt="Burnt Beats Logo" 
                className="w-10 h-10 mr-3 rounded-lg object-cover"
              />
              {(!isMinimized || isMobile) && (
                <h1 className="text-2xl font-poppins font-bold text-spotify-green">
                  Burnt Beats
                </h1>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {!isMobile && (
                <Button
                  onClick={() => setIsMinimized(!isMinimized)}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <Menu className="w-4 h-4" />
                </Button>
              )}

              {isMobile && (
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {(!isMinimized || isMobile) && (
            <p className="text-gray-400 text-sm">AI Music Creation Platform</p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <ul className="space-y-3">
            {menuItems.map((item) => (
              <li key={item.label}>
                <button 
                  onClick={() => handleMenuClick(item.key)}
                  className={`
                    flex items-center px-4 py-3 rounded-lg transition-colors w-full text-left
                    ${activeMenu === item.label 
                      ? 'bg-spotify-green text-white' 
                      : 'text-gray-300 hover:bg-gray-800'
                    }
                    ${isMinimized && !isMobile ? 'justify-center' : ''}
                  `}
                  title={isMinimized && !isMobile ? item.label : undefined}
                >
                  <item.icon className={`w-5 h-5 ${(!isMinimized || isMobile) ? 'mr-3' : ''}`} />
                  {(!isMinimized || isMobile) && (
                    <>
                      {item.label}
                      {item.isPro && (
                        <Crown className="ml-auto w-4 h-4 text-yellow-400" />
                      )}
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer - Upgrade section */}
        {(!isMinimized || isMobile) && (
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
        )}
      </div>
    </>
  );
}