import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Music, Sparkles, Crown, User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// Removed insertUserSchema as we're using Replit Auth
import { z } from "zod";
const burntBeatsLogo = "/burnt-beats-logo.jpeg";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Using Replit Auth - no signup schema needed
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});

interface AuthFormProps {
  onAuthSuccess: (user: any) => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [activeTab, setActiveTab] = useState("login");
  const { toast } = useToast();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return await response.json();
    },
    onSuccess: (user) => {
      const sassyWelcomes = [
        "Well, well, well... look who's back!",
        "Welcome back! Ready to make some bangers?",
        "You're back! Let's cook up some musical magic.",
        "This is the way. Welcome back to BangerGPT!",
        "I don't feel like it right now... just kidding, welcome back!"
      ];
      const randomWelcome = sassyWelcomes[Math.floor(Math.random() * sassyWelcomes.length)];

      toast({
        title: randomWelcome,
        description: "Time to create some fire tracks!",
      });
      onAuthSuccess({ ...user, plan: "free", songsThisMonth: 0 });
    },
    onError: () => {
      const sassyErrors = [
        "Nope, that's not it chief",
        "Wrong credentials, try again genius",
        "These aren't the droids you're looking for",
        "I find your lack of correct password disturbing",
        "Sir, this is a music app, not a guessing game"
      ];
      const randomError = sassyErrors[Math.floor(Math.random() * sassyErrors.length)];

      toast({
        title: randomError,
        description: "Check your username and password and try again.",
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof signupSchema>) => {
      const { confirmPassword, ...signupData } = data;
      const response = await apiRequest("POST", "/api/auth/signup", signupData);
      return await response.json();
    },
    onSuccess: (user) => {
      const sassyWelcomes = [
        "Welcome to the club! Time to make some bangers!",
        "Fresh meat! Let's see what you can create.",
        "A new challenger appears! Ready to cook up some hits?",
        "Welcome aboard! Your musical journey starts now.",
        "Finally, someone with taste joins Burnt Beats!"
      ];
      const randomWelcome = sassyWelcomes[Math.floor(Math.random() * sassyWelcomes.length)];

      toast({
        title: randomWelcome,
        description: "You get 3 free songs to start. Make them count!",
      });
      onAuthSuccess({ ...user, plan: "free", songsThisMonth: 0 });
    },
    onError: () => {
      const sassyErrors = [
        "Hold up, something's not right",
        "Username already taken, be more creative",
        "Nope, try a different username",
        "That username is already someone else's vibe"
      ];
      const randomError = sassyErrors[Math.floor(Math.random() * sassyErrors.length)];

      toast({
        title: randomError,
        description: "Try a different username or check your details.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const handleSignup = (data: z.infer<typeof signupSchema>) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src={burntBeatsLogo} 
              alt="Burnt Beats Logo" 
              className="w-12 h-12 mr-3 rounded-lg object-cover"
            />
            <h1 className="text-3xl font-bold text-white">Burnt Beats</h1>
          </div>
          <p className="text-gray-400">
            Transform text into fire tracks with AI that's got attitude
          </p>
        </div>

        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-center text-white">
              <Sparkles className="w-5 h-5 inline mr-2" />
              Get Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                placeholder="Enter your username"
                                className="bg-gray-800 border-gray-600 pl-10"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="Enter your password"
                                className="bg-gray-800 border-gray-600 pl-10"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full bg-gradient-to-r from-spotify-green to-green-600 hover:from-green-600 hover:to-spotify-green"
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="signup">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                placeholder="Choose a username"
                                className="bg-gray-800 border-gray-600 pl-10"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="Create a password"
                                className="bg-gray-800 border-gray-600 pl-10"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="Confirm your password"
                                className="bg-gray-800 border-gray-600 pl-10"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={signupMutation.isPending}
                      className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    >
                      {signupMutation.isPending ? "Creating account..." : "Sign Up"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <h4 className="text-white font-medium mb-2">What you get for free:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• 3 songs per month</li>
                <li>• 30-second tracks only</li>
                <li>• Basic genres (Pop, Rock, Electronic)</li>
                <li>• MP3 128kbps quality</li>
              </ul>
              {/* Quick Plan Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <h3 className="font-semibold text-white mb-2">Free</h3>
            <p className="text-2xl font-bold text-white mb-2">$0</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>3 songs/month</li>
              <li>30-second tracks</li>
              <li>Basic quality</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-vibrant-orange/20 to-orange-600/20 border border-vibrant-orange rounded-lg p-4 text-center">
            <h3 className="font-semibold text-white mb-2">Basic</h3>
            <p className="text-2xl font-bold text-white mb-2">$6.99</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>3 full songs/month</li>
              <li>Voice cloning</li>
              <li>Premium quality</li>
            </ul>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <h3 className="font-semibold text-white mb-2">Pro</h3>
            <p className="text-2xl font-bold text-white mb-2">$12.99</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>50 songs/month</li>
              <li>Advanced tools</li>
              <li>Collaboration</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-400 rounded-lg p-4 text-center">
            <h3 className="font-semibold text-white mb-2">Enterprise</h3>
            <p className="text-2xl font-bold text-white mb-2">$39.99</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>Unlimited songs</li>
              <li>Commercial license</li>
              <li>Priority support</li>
            </ul>
          </div>
        </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}