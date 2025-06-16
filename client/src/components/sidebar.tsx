import { Music, Plus, History, Mic, Download, Crown } from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { icon: Plus, label: "New Song", active: true },
    { icon: History, label: "Recent Creations", active: false },
    { icon: Mic, label: "Voice Samples", active: false },
    { icon: Download, label: "Downloads", active: false },
  ];

  return (
    <div className="w-64 bg-dark-card p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-poppins font-bold text-spotify-green flex items-center">
          <Music className="mr-2" />
          SongCraft AI
        </h1>
        <p className="text-gray-400 text-sm mt-1">Text to Song Generator</p>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-3">
          {menuItems.map((item) => (
            <li key={item.label}>
              <a 
                href="#" 
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  item.active 
                    ? 'bg-spotify-green text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <item.icon className="mr-3 w-5 h-5" />
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-auto">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Crown className="text-vibrant-orange mr-2 w-5 h-5" />
            <span className="text-sm font-medium">Pro Plan</span>
          </div>
          <p className="text-xs text-gray-400">Unlimited generations</p>
        </div>
      </div>
    </div>
  );
}
