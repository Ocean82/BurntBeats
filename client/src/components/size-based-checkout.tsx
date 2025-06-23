import { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, HardDrive, CreditCard, FileAudio, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SongDownload {
  id: string;
  title: string;
  estimatedSize: number; // in MB
  format: 'MP3' | 'WAV' | 'FLAC';
  quality: string;
}

interface SizeBasedCheckoutProps {
  song: any;
  onCancel: () => void;
  onSuccess: (downloadUrl: string) => void;
}

const PRICE_PER_MB = 0.05; // $0.05 per MB
const MIN_CHARGE = 0.99; // Minimum $0.99 charge

const downloadOptions: SongDownload[] = [
  {
    id: 'mp3_standard',
    title: 'MP3 Standard',
    estimatedSize: 3.5,
    format: 'MP3',
    quality: '128kbps'
  },
  {
    id: 'mp3_hq',
    title: 'MP3 High Quality',
    estimatedSize: 8.2,
    format: 'MP3',
    quality: '320kbps'
  },
  {
    id: 'wav_cd',
    title: 'WAV CD Quality',
    estimatedSize: 42.5,
    format: 'WAV',
    quality: '44.1kHz/16-bit'
  },
  {
    id: 'wav_studio',
    title: 'WAV Studio Quality',
    estimatedSize: 85.0,
    format: 'WAV',
    quality: '96kHz/24-bit'
  }
];

const CheckoutForm = ({ selectedDownload, onCancel, onSuccess }: { 
  selectedDownload: SongDownload; 
  onCancel: () => void; 
  onSuccess: (url: string) => void; 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const price = Math.max(selectedDownload.estimatedSize * PRICE_PER_MB, MIN_CHARGE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}?download=${selectedDownload.id}`,
        },
      });

      if (error) {
        toast({
          title: "Payment declined faster than your demo tape",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Generate download URL after successful payment
        const downloadUrl = `/api/download/${selectedDownload.id}`;
        onSuccess(downloadUrl);
        
        toast({
          title: "Payment successful!",
          description: "Your download is ready. Hope it's worth what you paid!",
        });
      }
    } catch (error) {
      toast({
        title: "Payment failed",
        description: "Even our payment processor has better timing than most users",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="flex space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          {isProcessing ? (
            <div className="flex items-center">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Processing...
            </div>
          ) : (
            <div className="flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Pay ${price.toFixed(2)}
            </div>
          )}
        </Button>
      </div>
    </form>
  );
};

export default function SizeBasedCheckout({ song, onCancel, onSuccess }: SizeBasedCheckoutProps) {
  const [selectedDownload, setSelectedDownload] = useState<SongDownload | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createPaymentIntent = async (download: SongDownload) => {
    setIsLoading(true);
    try {
      const price = Math.max(download.estimatedSize * PRICE_PER_MB, MIN_CHARGE);
      const response = await apiRequest("POST", "/api/create-payment-intent", { 
        amount: price,
        downloadType: download.id,
        songId: song.id
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Failed to create payment intent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSelect = (download: SongDownload) => {
    setSelectedDownload(download);
    createPaymentIntent(download);
  };

  if (selectedDownload && clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              💳 Download Checkout
            </h1>
            <p className="text-gray-300">
              Pay by file size - simple and transparent
            </p>
          </div>

          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Download Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Song</span>
                  <span className="text-white font-medium">{song.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Format</span>
                  <Badge variant="secondary">{selectedDownload.format}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Quality</span>
                  <span className="text-white">{selectedDownload.quality}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">File Size</span>
                  <span className="text-white">{selectedDownload.estimatedSize} MB</span>
                </div>
                <Separator className="bg-gray-600" />
                <div className="flex items-center justify-between font-bold text-lg">
                  <span className="text-white">Total</span>
                  <span className="text-green-400">
                    ${Math.max(selectedDownload.estimatedSize * PRICE_PER_MB, MIN_CHARGE).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm 
                  selectedDownload={selectedDownload}
                  onCancel={() => setSelectedDownload(null)}
                  onSuccess={onSuccess}
                />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            💾 Choose Your Download
          </h1>
          <p className="text-gray-300 text-lg">
            Pay ${PRICE_PER_MB.toFixed(2)} per MB - Fair and simple pricing
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Minimum charge: ${MIN_CHARGE} | Higher quality = bigger file = higher price
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {downloadOptions.map(download => {
            const price = Math.max(download.estimatedSize * PRICE_PER_MB, MIN_CHARGE);
            return (
              <Card key={download.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer">
                <CardContent className="p-6" onClick={() => handleDownloadSelect(download)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <FileAudio className="w-8 h-8 text-purple-400" />
                      <div>
                        <h3 className="text-xl font-bold text-white">{download.title}</h3>
                        <p className="text-gray-400">{download.quality}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-900 text-green-400 text-lg px-3 py-1">
                      ${price.toFixed(2)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center">
                        <HardDrive className="w-4 h-4 mr-1" />
                        File Size
                      </span>
                      <span className="text-white">{download.estimatedSize} MB</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Format</span>
                      <span className="text-white">{download.format}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Setting up...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        Buy & Download
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={onCancel} className="border-gray-600 text-gray-300 hover:bg-gray-700">
            Back to Song
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
          <p className="text-sm text-blue-300 text-center">
            💡 <strong>Pricing is transparent:</strong> You pay exactly ${PRICE_PER_MB.toFixed(2)} per MB of file size. 
            No hidden fees, no subscriptions, just pay for what you download.
          </p>
        </div>
      </div>
    </div>
  );
}