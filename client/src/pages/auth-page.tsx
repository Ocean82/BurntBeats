import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Flame, Mail, Lock, User, ArrowRight, Check, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

import { 
  loginSchema, 
  registerSchema, 
  forgotPasswordSchema,
  type LoginRequest,
  type RegisterRequest,
  type ForgotPasswordRequest 
} from "@shared/auth-schemas";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();
  const { login, register, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      // User will be handled by App.tsx routing
      return;
    }
  }, [user]);

  // Login form
  const loginForm = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Forgot password form
  const forgotPasswordForm = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle form submissions
  const handleLogin = async (data: LoginRequest) => {
    try {
      await login(data.email, data.password);
      // Navigation will be handled by App.tsx based on auth state
    } catch (error) {
      // Error handling is done in the auth context
    }
  };

  const handleRegister = async (data: RegisterRequest) => {
    try {
      await register(data.username, data.email, data.password);
      // Navigation will be handled by App.tsx based on auth state
    } catch (error) {
      // Error handling is done in the auth context
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (data: ForgotPasswordRequest) => {
    try {
      // This would typically make an API call to request password reset
      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions",
      });
      setShowForgotPassword(false);
    } catch (error) {
      toast({
        title: "Password reset failed",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 5) strength++;
    
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const typeCount = [hasLetters, hasNumbers, hasSymbols].filter(Boolean).length;
    
    if (typeCount >= 2) strength += 2;
    else if (typeCount === 1) strength += 1;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    return Math.min(strength, 5);
  };

  const passwordStrength = getPasswordStrength(registerForm.watch("password") || "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex">
      {/* Left side - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and header */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/50">
                <Flame className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Burnt Beats
            </h1>
            <p className="text-gray-400 mt-2">AI-Powered Music Creation Platform</p>
          </div>

          {showForgotPassword ? (
            <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Reset Password</CardTitle>
                <CardDescription className="text-gray-400">
                  Enter your email to receive reset instructions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 bg-gray-700 border-gray-600 text-white"
                        {...forgotPasswordForm.register("email")}
                      />
                    </div>
                    {forgotPasswordForm.formState.errors.email && (
                      <p className="text-red-400 text-sm">{forgotPasswordForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      Send Reset Email
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForgotPassword(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border border-gray-700">
                <TabsTrigger value="login" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Welcome Back</CardTitle>
                    <CardDescription className="text-gray-400">
                      Sign in to continue creating amazing music
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-gray-300">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10 bg-gray-700 border-gray-600 text-white"
                            {...loginForm.register("email")}
                          />
                        </div>
                        {loginForm.formState.errors.email && (
                          <p className="text-red-400 text-sm">{loginForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-gray-300">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white"
                            {...loginForm.register("password")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {loginForm.formState.errors.password && (
                          <p className="text-red-400 text-sm">{loginForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-orange-400 hover:text-orange-300"
                        >
                          Forgot password?
                        </button>
                      </div>

                      <Button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all"
                      >
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Create Account</CardTitle>
                    <CardDescription className="text-gray-400">
                      Join Burnt Beats and start creating music with AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-username" className="text-gray-300">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="register-username"
                            type="text"
                            placeholder="Choose a username"
                            className="pl-10 bg-gray-700 border-gray-600 text-white"
                            {...registerForm.register("username")}
                          />
                        </div>
                        {registerForm.formState.errors.username && (
                          <p className="text-red-400 text-sm">{registerForm.formState.errors.username.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-email" className="text-gray-300">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10 bg-gray-700 border-gray-600 text-white"
                            {...registerForm.register("email")}
                          />
                        </div>
                        {registerForm.formState.errors.email && (
                          <p className="text-red-400 text-sm">{registerForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="text-gray-300">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="register-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white"
                            {...registerForm.register("password")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {registerForm.formState.errors.password && (
                          <p className="text-red-400 text-sm">{registerForm.formState.errors.password.message}</p>
                        )}
                        
                        {/* Password strength indicator */}
                        {registerForm.watch("password") && (
                          <div className="space-y-1">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                  key={level}
                                  className={`h-1 flex-1 rounded ${
                                    passwordStrength >= level
                                      ? level <= 2
                                        ? "bg-red-500"
                                        : level <= 3
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                      : "bg-gray-600"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-gray-400">
                              Minimum 5 characters with any 2 of: letters, numbers, or symbols
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-confirm-password" className="text-gray-300">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="register-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white"
                            {...registerForm.register("confirmPassword")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-red-400 text-sm">{registerForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all"
                      >
                        {registerMutation.isPending ? "Creating account..." : "Create Account"}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500/20 via-red-500/20 to-purple-500/20 items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/50">
            <Flame className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-4xl font-bold text-white">
            Create Fire Tracks with AI
          </h2>
          
          <p className="text-gray-300 text-lg">
            Transform your lyrics into professional songs with cutting-edge AI technology. 
            Unlimited creation, pay only to download.
          </p>

          <div className="grid grid-cols-1 gap-4 mt-8">
            <div className="flex items-center gap-3 text-gray-300">
              <Check className="w-5 h-5 text-green-400" />
              <span>Unlimited song creation</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Check className="w-5 h-5 text-green-400" />
              <span>AI voice cloning</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Check className="w-5 h-5 text-green-400" />
              <span>Professional editing tools</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Check className="w-5 h-5 text-green-400" />
              <span>Pay-per-download model</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}