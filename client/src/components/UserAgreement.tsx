import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Calendar, FileText, Shield, AlertTriangle, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schema for agreement acceptance
const agreementSchema = z.object({
  accepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms to continue",
  }),
});

type AgreementFormData = z.infer<typeof agreementSchema>;

interface UserAgreementProps {
  user: {
    id: string;
    username: string;
    email: string;
  };
  onAccepted: () => void;
}

export default function UserAgreement({ user, onAccepted }: UserAgreementProps) {
  const [currentDate] = useState(() => new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }));
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const { toast } = useToast();

  const form = useForm<AgreementFormData>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
      accepted: false,
    },
  });

  // Agreement acceptance mutation
  const acceptAgreementMutation = useMutation({
    mutationFn: async (data: AgreementFormData) => {
      const agreementData = {
        userId: user.id,
        username: user.username,
        email: user.email,
        accepted: data.accepted,
        acceptedAt: new Date().toISOString(),
        ipAddress: await fetch('/api/auth/get-ip').then(r => r.text()).catch(() => 'unknown'),
        userAgent: navigator.userAgent,
      };

      const response = await apiRequest("POST", "/api/auth/accept-agreement", agreementData);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to record agreement acceptance");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agreement Accepted",
        description: "Thank you for accepting the terms. Welcome to Burnt Beats!",
      });
      onAccepted();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AgreementFormData) => {
    if (!scrolledToBottom) {
      toast({
        title: "Please Read Complete Agreement",
        description: "You must scroll to the bottom and read the entire agreement before accepting.",
        variant: "destructive",
      });
      return;
    }
    acceptAgreementMutation.mutate(data);
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setScrolledToBottom(isNearBottom);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-gray-800/90 backdrop-blur border-gray-700 shadow-2xl">
        <CardHeader className="text-center border-b border-gray-700">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/50">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            User Agreement & Terms
          </CardTitle>
          <div className="flex items-center justify-center gap-2 text-gray-400 mt-2">
            <Calendar className="w-4 h-4" />
            <span>Effective: {currentDate}</span>
          </div>
          <p className="text-gray-300 mt-2">
            Please read and accept the following terms to continue using Burnt Beats
          </p>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Agreement Text */}
            <div className="relative">
              <ScrollArea 
                className="h-96 w-full border border-gray-600 rounded-lg p-4 bg-gray-900/50"
                onScrollCapture={handleScroll}
              >
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-orange-400 mb-4">
                      🔥 Burnt Beats Contributor Acknowledgment & Usage Agreement
                    </h2>
                    <p className="text-sm text-gray-400 mb-6">
                      Effective: {currentDate}
                    </p>
                  </div>

                  <p className="text-gray-300">
                    By accessing or contributing to the Burnt Beats platform, users acknowledge and agree to the following terms. 
                    This agreement is designed to protect both the contributors and the platform while encouraging a fair, respectful, and creative environment.
                  </p>

                  <div className="space-y-4">
                    <section>
                      <h3 className="text-lg font-semibold text-orange-400 mb-2">1. Usage Rights</h3>
                      <p>
                        Burnt Beats and its affiliates retain the irrevocable right to use, modify, distribute, and display any content, 
                        code, assets, vocal samples, or feedback submitted to the platform ("Contributions") for any purpose deemed appropriate, 
                        including commercial use, without additional compensation—unless otherwise agreed in writing.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold text-orange-400 mb-2">2. Ownership & Licensing</h3>
                      <p className="mb-2">
                        Users who purchase a full license to content they create through Burnt Beats (e.g. beats, vocals, lyrics, tracks) 
                        retain 100% ownership of that content. Burnt Beats will not sell, license, or share such content with any third party 
                        or affiliate without explicit written consent from the creator.
                      </p>
                      <p className="mb-2">However, contributors acknowledge and grant Burnt Beats the right to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Feature content in charts, promotional assets, community competitions, and curated playlists (e.g. "Top 10 of the Month", "Featured Remixes").</li>
                        <li>Anonymously store cloned vocal models from users in a shared vocal bank, accessible by others, without revealing the source user's identity.</li>
                        <li>Use short excerpts or visuals in platform demos, onboarding materials, or promotional previews without affecting ownership.</li>
                      </ul>
                      <p className="mt-2">
                        These rights exist solely to support platform functionality, creative discovery, and community building.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold text-orange-400 mb-2">3. Copyright & Compliance</h3>
                      <p>
                        All submitted content must be original or lawfully sourced. Users agree not to submit, upload, or incorporate any 
                        material that violates copyright laws, trademarks, patents, third-party licenses, or any applicable intellectual property regulations.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold text-orange-400 mb-2">4. Indemnification</h3>
                      <p>
                        You agree to indemnify, defend, and hold harmless Burnt Beats, its founders, contributors, and affiliates from and 
                        against any and all claims, damages, liabilities, legal actions, or losses arising from your Contributions, use of 
                        the platform, or violation of this agreement.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold text-orange-400 mb-2">5. Acknowledgment of Terms</h3>
                      <p>
                        By proceeding, you confirm that you've read and understood this agreement in full. Claims of "I didn't know" are 
                        not a valid defense—because, well, we wrote this exact line.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold text-orange-400 mb-2">6. Disclaimers, Liability & Arbitration</h3>
                      
                      <div className="space-y-3 ml-4">
                        <div>
                          <h4 className="font-medium text-gray-200">6.1 No Blame Game</h4>
                          <p>
                            You release Burnt Beats and everyone ever even remotely involved—including the founder, devs, collaborators, 
                            and that one intern who maybe tweaked the color scheme—from any past, present, or future legal claims caused 
                            by your actions, another user's actions, or anything weird the internet might do.
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-200">6.2 You Can't Sue Us</h4>
                          <p>
                            Even if we do something unexpectedly dumb (which we try very hard not to), you agree not to bring legal 
                            action against us—for the next 5,631 years.
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-200">6.3 I Actually Read This</h4>
                          <p>
                            By continuing, you agree that you truly read this agreement. You didn't just skim. You're nodding your head 
                            right now. See? That's binding.
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-200">6.4 In the Unlikely Event of Drama...</h4>
                          <p>
                            Should a legal dispute arise, you agree to resolve it via binding arbitration before pursuing any court action. 
                            Burnt Beats will select the arbitrator. The user shall cover all related fees, including legal representation, 
                            filing fees, vending machine snacks, and the babysitter.
                          </p>
                          <p className="mt-2">
                            You also agree not to sue us for our house. But if you try, we reserve the right to rename it The Burnt Bungalow.
                          </p>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </ScrollArea>

              {!scrolledToBottom && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none flex items-end justify-center pb-2">
                  <span className="text-sm text-orange-400 animate-pulse">
                    ↓ Scroll to read complete agreement ↓
                  </span>
                </div>
              )}
            </div>

            {/* Acceptance Checkbox */}
            <div className="space-y-4">
              {!scrolledToBottom && (
                <Alert className="border-orange-500/50 bg-orange-500/10">
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                  <AlertDescription className="text-orange-200">
                    Please scroll through and read the entire agreement before accepting.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-start space-x-3 p-4 border border-gray-600 rounded-lg bg-gray-900/30">
                <Checkbox
                  id="agreement-accepted"
                  checked={form.watch("accepted")}
                  onCheckedChange={(checked) => form.setValue("accepted", !!checked)}
                  disabled={!scrolledToBottom}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label 
                    htmlFor="agreement-accepted" 
                    className={`text-sm font-medium cursor-pointer ${
                      scrolledToBottom ? "text-gray-200" : "text-gray-500"
                    }`}
                  >
                    I accept and agree to the terms above.
                  </label>
                  <p className="text-xs text-gray-400 mt-1">
                    By checking this box, you confirm that you have read, understood, and agree to be bound by this agreement.
                  </p>
                </div>
              </div>

              {form.formState.errors.accepted && (
                <p className="text-red-400 text-sm">{form.formState.errors.accepted.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                disabled={!form.watch("accepted") || !scrolledToBottom || acceptAgreementMutation.isPending}
                className="w-full max-w-md bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
              >
                {acceptAgreementMutation.isPending ? (
                  "Recording Agreement..."
                ) : (
                  <>
                    Accept Terms & Continue to Burnt Beats
                    <Check className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

            {/* User Info Display */}
            <div className="text-center text-xs text-gray-500 space-y-1">
              <p>Agreement for: {user.username} ({user.email})</p>
              <p>Date: {currentDate}</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}