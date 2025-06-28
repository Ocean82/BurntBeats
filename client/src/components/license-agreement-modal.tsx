
import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertDescription } from "./ui/alert";
import { Shield, FileText } from "lucide-react";

interface LicenseAgreementModalProps {
  trackId: string;
  userId: string;
  isOpen: boolean;
  onAgree: () => void;
  onClose: () => void;
}

export function LicenseAgreementModal({ 
  trackId, 
  userId, 
  isOpen, 
  onAgree, 
  onClose 
}: LicenseAgreementModalProps) {
  const [isAgreeing, setIsAgreeing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAgree = async () => {
    setIsAgreeing(true);
    setError(null);

    try {
      const response = await fetch("/api/license-acknowledgment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          trackId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to record license acknowledgment");
      }

      const result = await response.json();
      console.log("License acknowledged:", result);
      
      onAgree();
    } catch (err) {
      console.error("License acknowledgment failed:", err);
      setError("Failed to record license acknowledgment. Please try again.");
    } finally {
      setIsAgreeing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#181818] border-[#ff3c00] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-[#ff3c00]">
            <Shield className="w-6 h-6" />
            🔥 Burnt Beats License Agreement
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <Alert className="bg-[#ff3c00]/10 border-[#ff3c00]/20">
              <FileText className="h-4 w-4" />
              <AlertDescription className="text-[#ffae00]">
                <strong>Important:</strong> Please read this license agreement carefully before proceeding.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <p>
                All tracks created through Burnt Beats are owned exclusively by Burnt Beats and its creators by default.
              </p>
              
              <p>
                Until a license is purchased, users may not use, reproduce, monetize, or distribute any generated material.
              </p>
              
              <p className="font-semibold text-[#ffae00]">
                Once a license is purchased, full exclusive rights to that specific track are transferred to the purchaser.
                Burnt Beats will not use or redistribute it—
                <span className="italic"> except if already in public or promotional use prior to purchase</span>.
              </p>

              <div className="bg-[#0f0f0f] p-4 rounded-lg">
                <h4 className="font-semibold text-[#ff3c00] mb-2">Licensed Rights Include:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Streaming platforms (YouTube, Spotify, Apple Music, TikTok, etc.)</li>
                  <li>• Digital distribution and sale (DistroKid, CD Baby, Bandcamp, etc.)</li>
                  <li>• Commercial projects (podcasts, advertisements, games, film, television, etc.)</li>
                  <li>• Live performances and public exhibitions</li>
                  <li>• Synchronization with visual media</li>
                  <li>• Modification, remixing, and derivative works</li>
                </ul>
              </div>

              <div className="bg-[#0f0f0f] p-4 rounded-lg">
                <h4 className="font-semibold text-[#ff3c00] mb-2">Restrictions:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Cannot republish or redistribute the raw vocal synthesis engine</li>
                  <li>• Cannot share access to Burnt Beats' proprietary AI models or tools</li>
                  <li>• Cannot use in unlawful, defamatory, hateful, or discriminatory content</li>
                  <li>• Cannot claim ownership of the underlying AI technology</li>
                </ul>
              </div>

              <p>
                All licenses are per track and non-transferable. By continuing, you agree to these terms in full.
              </p>
            </div>
          </div>
        </ScrollArea>

        {error && (
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAgree}
            disabled={isAgreeing}
            className="flex-1 bg-[#ff3c00] hover:bg-[#e63600] text-black font-semibold"
          >
            {isAgreeing ? "Recording..." : "I Acknowledge and Agree"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

interface LicenseAgreementModalProps {
  trackId: string;
  userId: string;
  isOpen: boolean;
  onAgree: () => void;
  onClose: () => void;
}

export function LicenseAgreementModal({ 
  trackId, 
  userId, 
  isOpen, 
  onAgree, 
  onClose 
}: LicenseAgreementModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAgree = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/license-acknowledgment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          trackId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log license acknowledgment');
      }

      console.log("License acknowledgment logged successfully");
      onAgree();
    } catch (err) {
      console.error("License acknowledgment failed:", err);
      // Still proceed with onAgree to not block user flow
      onAgree();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-[#181818] border border-[#ff3c00] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#ff3c00] flex items-center gap-2">
            🔥 Burnt Beats License Agreement
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-80 pr-4">
          <div className="space-y-4 text-sm">
            <p>
              All tracks created through Burnt Beats are owned exclusively by Burnt Beats and its creators by default.
            </p>
            <p>
              Until a license is purchased, users may not use, reproduce, monetize, or distribute any generated material.
            </p>
            <p className="font-semibold text-[#ffae00]">
              Once a license is purchased, full exclusive rights to that specific track are transferred to the purchaser.
              Burnt Beats will not use or redistribute it—
              <span className="italic">except if already in public or promotional use prior to purchase</span>.
            </p>
            <p>
              All licenses are per track and non-transferable. By continuing, you agree to these terms in full.
            </p>
          </div>
        </ScrollArea>
        
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-600 hover:bg-gray-800"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAgree}
            disabled={isSubmitting}
            className="flex-1 bg-[#ff3c00] hover:bg-[#e63600] text-black font-semibold"
          >
            {isSubmitting ? "Acknowledging..." : "I Acknowledge and Agree"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
