
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Shield, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LicenseGeneratorProps {
  songTitle: string;
  userId: string;
  tier: 'base' | 'top';
  userEmail?: string;
  onLicenseGenerated?: (licenseId: string) => void;
}

export default function LicenseGenerator({ 
  songTitle, 
  userId, 
  tier, 
  userEmail,
  onLicenseGenerated 
}: LicenseGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [license, setLicense] = useState<{
    licenseId: string;
    textPath?: string;
    pdfPath?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateLicense = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/license/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songTitle,
          userId,
          tier,
          userEmail,
          format: 'both'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate license');
      }

      const data = await response.json();
      setLicense(data);
      onLicenseGenerated?.(data.licenseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFile = async (filePath: string, filename: string) => {
    try {
      const response = await fetch(`/api/download/${encodeURIComponent(filePath)}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Shield className="w-5 h-5" />
          Commercial License
          <Badge variant="secondary" className={tier === 'top' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
            {tier === 'top' ? 'Premium' : 'Standard'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!license ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Generate a commercial license for "{songTitle}" that grants you full rights to use this track commercially.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">License includes:</h4>
              <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                <li>• Commercial use rights</li>
                <li>• Streaming platform distribution</li>
                <li>• Synchronization rights</li>
                <li>• Modification and remix rights</li>
                {tier === 'top' && <li>• Multitrack stems included</li>}
              </ul>
            </div>

            <Button 
              onClick={generateLicense}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? 'Generating License...' : 'Generate Commercial License'}
              <FileText className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Commercial license generated successfully!
                <br />
                License ID: <code className="font-mono text-xs">{license.licenseId}</code>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {license.textPath && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(license.textPath!, `${songTitle}_license.txt`)}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download TXT
                </Button>
              )}
              
              {license.pdfPath && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(license.pdfPath!, `${songTitle}_license.pdf`)}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Keep these license files safe. You can verify this license at any time using the License ID above.
            </p>
          </div>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
