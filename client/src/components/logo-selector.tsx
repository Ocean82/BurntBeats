import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoOption {
  id: string;
  src: string;
  name: string;
  description?: string;
}

interface LogoSelectorProps {
  selectedLogo: string;
  onLogoChange: (logoSrc: string) => void;
  className?: string;
}

export default function LogoSelector({ selectedLogo, onLogoChange, className }: LogoSelectorProps) {
  const [showSelector, setShowSelector] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  const logoOptions: LogoOption[] = [
    { 
      id: "demon", 
      src: "/logos/demon-logo.jpeg", 
      name: "Demon Fire",
      description: "Dark and powerful"
    },
    { 
      id: "minimal", 
      src: "/logos/minimal-logo.jpeg", 
      name: "Minimal Dark",
      description: "Clean and simple"
    },
    { 
      id: "neon", 
      src: "/logos/neon-wolf.jpeg", 
      name: "Neon Wolf",
      description: "Cyberpunk vibes"
    },
    { 
      id: "musical", 
      src: "/logos/musical-note.jpeg", 
      name: "Musical Note",
      description: "Classic music theme"
    },
    { 
      id: "watermark", 
      src: "/logos/watermark.png", 
      name: "Watermark",
      description: "Subtle branding"
    },
    { 
      id: "headphone", 
      src: "/logos/headphone-character.png", 
      name: "DJ Character",
      description: "Fun and energetic"
    },
    { 
      id: "fire-girl", 
      src: "/logos/fire-girl.jpeg", 
      name: "Fire Girl",
      description: "Fierce and hot"
    },
    { 
      id: "cute-fox-1", 
      src: "/logos/cute-fox-1.jpeg", 
      name: "Cute Fox",
      description: "Friendly and approachable"
    },
    { 
      id: "cute-fox-2", 
      src: "/logos/cute-fox-2.jpeg", 
      name: "Cute Fox Alt",
      description: "Alternative cute option"
    }
  ];

  // Find current logo info
  const currentLogo = logoOptions.find(logo => logo.src === selectedLogo) || logoOptions[0];

  // Close selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setShowSelector(false);
      }
    };

    if (showSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSelector]);

  const handleLogoSelect = (logoSrc: string) => {
    onLogoChange(logoSrc);
    setShowSelector(false);
  };

  return (
    <div className={cn("relative", className)} ref={selectorRef}>
      {/* Current Logo Display */}
      <Button
        variant="ghost"
        onClick={() => setShowSelector(!showSelector)}
        className="flex items-center gap-3 p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
      >
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/50 flex-shrink-0">
          <img
            src={currentLogo.src}
            alt={currentLogo.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              // Fallback to Burnt Beats text if image fails to load
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-white font-bold text-xs">BB</div>';
              }
            }}
          />
        </div>
        <div className="flex-1 text-left">
          <div className="text-white font-medium text-sm">{currentLogo.name}</div>
          <div className="text-gray-400 text-xs">{currentLogo.description}</div>
        </div>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform",
            showSelector && "transform rotate-180"
          )} 
        />
      </Button>

      {/* Logo Options Dropdown */}
      {showSelector && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border-gray-700 shadow-xl z-50 max-h-80 overflow-y-auto">
          <CardContent className="p-2">
            <div className="space-y-1">
              {logoOptions.map((logo) => (
                <div
                  key={logo.id}
                  onClick={() => handleLogoSelect(logo.src)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-700/50",
                    selectedLogo === logo.src && "bg-purple-500/20 border border-purple-500/30"
                  )}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 shadow-lg flex-shrink-0">
                    <img
                      src={logo.src}
                      alt={logo.name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        // Fallback to text if image fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-white font-bold text-xs">BB</div>';
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium text-sm">{logo.name}</div>
                    <div className="text-gray-400 text-xs">{logo.description}</div>
                  </div>
                  {selectedLogo === logo.src && (
                    <Check className="w-4 h-4 text-purple-400" />
                  )}
                </div>
              ))}
            </div>

            {/* Custom Logo Upload Option */}
            <div className="border-t border-gray-600 mt-2 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-700/50">
                <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">+</span>
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">Upload Custom</div>
                  <div className="text-gray-400 text-xs">Add your own logo</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}