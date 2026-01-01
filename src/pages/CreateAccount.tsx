import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Mail, Lock, User, AlertCircle } from "lucide-react";
import { Helmet } from "react-helmet";

const CreateAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionData, setSessionData] = useState<{
    customer_email: string;
    payment_status: string;
    application_id: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingUser, setExistingUser] = useState(false);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch session data on mount
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setError("No session ID provided. Please complete payment first.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase.functions.invoke(
          "get-checkout-session",
          { body: { session_id: sessionId } }
        );

        if (fetchError || data?.error) {
          setError(data?.error || "Failed to verify payment session");
          setLoading(false);
          return;
        }

        if (data.payment_status !== "paid") {
          setError("Payment has not been completed. Please try again.");
          setLoading(false);
          return;
        }

        setSessionData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching session:", err);
        setError("Failed to verify payment. Please contact support.");
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  // Check if user is already logged in via AuthContext
  useEffect(() => {
    if (!authLoading && user && session && sessionData) {
      // User already logged in, try to link and redirect
      linkApplicationAndRedirect(session.access_token);
    }
  }, [user, session, authLoading, sessionData]);

  // Listen for OAuth redirect completion
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session && sessionData) {
          await linkApplicationAndRedirect(session.access_token);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [sessionData]);

  const linkApplicationAndRedirect = async (accessToken: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("link-application-to-user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) {
        console.error("Link error:", error);
        toast.error("Failed to link your report. Please contact support.");
        return;
      }

      if (data.linked && data.application_ids?.length > 0) {
        toast.success("Your report is being generated!");
        navigate(`/thank-you?applicationId=${data.application_ids[0]}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Error linking application:", err);
      navigate("/dashboard");
    }
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      // Store session_id in localStorage so we can retrieve it after OAuth redirect
      if (sessionId) {
        localStorage.setItem("pending_session_id", sessionId);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/create-account?session_id=${sessionId}`,
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error("Google sign in error:", err);
      toast.error("Failed to sign in with Google. Please try again.");
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionData?.customer_email) {
      toast.error("Session data not available");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: sessionData.customer_email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        // Check for various "user exists" error patterns
        const errorMsg = signUpError.message.toLowerCase();
        if (
          errorMsg.includes("already registered") ||
          errorMsg.includes("user already registered") ||
          errorMsg.includes("already exists")
        ) {
          setExistingUser(true);
          toast.info("Account already exists. Please enter your password to sign in.", {
            duration: 5000,
          });
          setSubmitting(false);
          return;
        }
        throw signUpError;
      }

      // Handle the "user_repeated_signup" case - user exists but signup returned success
      // This happens when Supabase is configured to not throw on duplicate signups
      if (data.user && !data.session) {
        // Check if user already has an identity (meaning they already exist)
        if (data.user.identities && data.user.identities.length === 0) {
          setExistingUser(true);
          toast.info("Account already exists. Please enter your password to sign in.", {
            duration: 5000,
          });
          setSubmitting(false);
          return;
        }
        // Email confirmation required for new user
        toast.success("Account created! Please check your email to confirm.", {
          duration: 6000,
        });
        setSubmitting(false);
        return;
      }

      if (data.session) {
        toast.success("Account created successfully!");
        await linkApplicationAndRedirect(data.session.access_token);
      }
    } catch (err) {
      console.error("Sign up error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async () => {
    if (!sessionData?.customer_email || !password) {
      toast.error("Please enter your password");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: sessionData.customer_email,
        password,
      });

      if (signInError) {
        // Provide more helpful error messages
        const errorMsg = signInError.message.toLowerCase();
        if (errorMsg.includes("invalid login credentials")) {
          toast.error("Incorrect password. Please try again or use Google sign-in.");
        } else if (errorMsg.includes("email not confirmed")) {
          toast.error("Please confirm your email first, then try again.");
        } else {
          toast.error(signInError.message);
        }
        setSubmitting(false);
        return;
      }

      if (data.session) {
        toast.success("Signed in successfully!");
        await linkApplicationAndRedirect(data.session.access_token);
      }
    } catch (err) {
      console.error("Sign in error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Helmet>
          <title>Create Account | SiteIntel</title>
        </Helmet>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Helmet>
          <title>Payment Error | SiteIntel</title>
        </Helmet>
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/application">Try Again</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/contact">Contact Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Helmet>
        <title>Create Your Account | SiteIntel</title>
        <meta name="description" content="Create your SiteIntel account to access your feasibility report" />
      </Helmet>

      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            {existingUser 
              ? "Sign in to access your Site Feasibility Intelligence™ report"
              : "Create your account to access your Site Feasibility Intelligence™ report"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-medium"
            onClick={handleGoogleSignIn}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={sessionData?.customer_email || ""}
                  readOnly
                  className="pl-10 bg-muted/50"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This is the email used for payment
              </p>
            </div>

            {/* Full Name - only show for new users */}
            {!existingUser && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Confirm Password - only show for new users */}
            {!existingUser && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {existingUser ? (
              <Button 
                type="button" 
                className="w-full" 
                onClick={handleSignIn}
                disabled={submitting || !password}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In & View Report"
                )}
              </Button>
            ) : (
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account & View Report"
                )}
              </Button>
            )}
          </form>

          {/* Toggle between sign up and sign in */}
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setExistingUser(!existingUser)}
            >
              {existingUser 
                ? "Don't have an account? Create one"
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAccount;
