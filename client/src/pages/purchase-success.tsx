import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Download, Home, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PurchaseSuccess() {
  const [location, setLocation] = useLocation();
  const [downloadReady, setDownloadReady] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get URL parameters to extract purchase info
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const tier = urlParams.get('tier') || 'bonus';
    const songTitle = urlParams.get('song_title') || 'Your Song';

    if (sessionId) {
      setPurchaseDetails({
        sessionId,
        tier,
        songTitle,
        timestamp: new Date().toISOString()
      });

      // Simulate download preparation
      setTimeout(() => {
        setDownloadReady(true);
        toast({
          title: "Download Ready!",
          description: "Your high-quality audio file is ready for download.",
        });
      }, 3000);
    }
  }, []);

  const handleDownload = async () => {
    if (!purchaseDetails) return;

    try {
      // Call the download endpoint
      const response = await fetch(`/api/download/${purchaseDetails.sessionId}/${purchaseDetails.tier}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${purchaseDetails.songTitle}_${purchaseDetails.tier}.${purchaseDetails.tier === 'top' ? 'wav' : 'mp3'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Download Started",
          description: "Your file download has begun.",
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      toast({
        title: "Download Error",
        description: "There was an issue with your download. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const getTierDetails = (tier: string) => {
    const details = {
      bonus: { name: 'Bonus', quality: 'MP3 128kbps', color: 'green' },
      base: { name: 'Base', quality: 'MP3 320kbps', color: 'blue' },
      top: { name: 'Top', quality: 'WAV Studio', color: 'purple' }
    };
    return details[tier as keyof typeof details] || details.bonus;
  };

  if (!purchaseDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Purchase Not Found</CardTitle>
            <CardDescription>Unable to locate your purchase details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/')} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tierDetails = getTierDetails(purchaseDetails.tier);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your purchase. Your high-quality download is being prepared.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Purchase Details */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Purchase Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Song:</span>
                <p className="font-medium">{purchaseDetails.songTitle}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Quality:</span>
                <p className="font-medium">{tierDetails.quality}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Tier:</span>
                <p className="font-medium">{tierDetails.name}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Session:</span>
                <p className="font-mono text-xs">{purchaseDetails.sessionId.slice(0, 16)}...</p>
              </div>
            </div>
          </div>

          {/* Download Status */}
          <div className="text-center">
            {!downloadReady ? (
              <div className="space-y-4">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-600 dark:text-gray-400">
                  Preparing your high-quality download...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <p className="text-green-600 font-medium">
                  Your download is ready!
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleDownload}
              disabled={!downloadReady}
              className={`flex-1 ${
                tierDetails.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                tierDetails.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <Download className="mr-2 h-4 w-4" />
              Download {tierDetails.name}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center text-sm text-gray-500">
            <p>Download link expires in 30 days</p>
            <p>Need help? Contact support@burntbeats.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}