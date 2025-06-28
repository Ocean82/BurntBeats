import { ArrowLeft, ArrowRight, RotateCcw, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBackForwardNavigation } from "@/hooks/useBackForwardNavigation";
import { useNavigationCache } from "@/hooks/useNavigationCache";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavigationControlsProps {
  showDebugInfo?: boolean;
}

export function NavigationControls({ showDebugInfo = false }: NavigationControlsProps) {
  const { canGoBack, canGoForward, goBack, goForward, currentIndex, historyLength } = useBackForwardNavigation();
  const cache = useNavigationCache();

  const handleClearCache = () => {
    cache.clear();
    // Show feedback to user
    const toast = document.createElement('div');
    toast.textContent = 'Navigation cache cleared';
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 2000);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border rounded-lg shadow-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              disabled={!canGoBack}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Go back (Alt + ←)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={goForward}
              disabled={!canGoForward}
              className="flex items-center gap-1"
            >
              Forward
              <ArrowRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Go forward (Alt + →)</p>
          </TooltipContent>
        </Tooltip>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              Clear Cache
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clear navigation cache</p>
          </TooltipContent>
        </Tooltip>

        {showDebugInfo && (
          <>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <History className="h-4 w-4" />
              <Badge variant="secondary" className="text-xs">
                {currentIndex + 1}/{historyLength}
              </Badge>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}