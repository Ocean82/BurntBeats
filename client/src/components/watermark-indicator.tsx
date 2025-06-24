import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WatermarkIndicatorProps {
  hasWatermark: boolean;
  tier?: 'preview' | 'bonus' | 'base' | 'top';
  onUpgrade?: () => void;
  className?: string;
}

export default function WatermarkIndicator({ hasWatermark, tier = 'preview', onUpgrade, className }: WatermarkIndicatorProps) {
  if (!hasWatermark && tier !== 'preview') {
    return (
      <Badge variant="secondary" className={`bg-green-100 text-green-800 border-green-200 ${className}`}>
        <Shield className="w-3 h-3 mr-1" />
        Clean Version
      </Badge>
    );
  }

  const getIndicatorContent = () => {
    switch (tier) {
      case 'bonus':
        return {
          icon: <AlertTriangle className="w-3 h-3 mr-1" />,
          text: 'Demo Version',
          className: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      case 'preview':
        return {
          icon: <AlertTriangle className="w-3 h-3 mr-1" />,
          text: 'Contains Watermark',
          className: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      default:
        return {
          icon: <Crown className="w-3 h-3 mr-1" />,
          text: 'Premium Quality',
          className: 'bg-purple-100 text-purple-800 border-purple-200'
        };
    }
  };

  const indicator = getIndicatorContent();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="secondary" className={indicator.className}>
        {indicator.icon}
        {indicator.text}
      </Badge>
      
      {hasWatermark && onUpgrade && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onUpgrade}
          className="h-6 px-2 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          Remove Watermark
        </Button>
      )}
    </div>
  );
}

export function WatermarkNotice({ onUpgrade }: { onUpgrade?: () => void }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
            Watermark Notice
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            This preview contains a Burnt Beats watermark. Purchase Base or Top tier to get the completely clean version without any overlays.
          </p>
          {onUpgrade && (
            <Button 
              size="sm" 
              onClick={onUpgrade}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              View Purchase Options
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}