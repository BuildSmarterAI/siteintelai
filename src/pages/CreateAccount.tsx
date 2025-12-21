import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Mail, Lock, User, AlertCircle } from "lucide-react";
import { Helmet } from "react-helmet";

const CreateAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionData, setSessionData] = useState<{
    customer_email: string;
    payment_status: string;
    application_id: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // User already logged in, try to link and redirect
        await linkApplicationAndRedirect(session.access_token);
      }
    };
    
    if (sessionData) {
      checkAuth();
    }
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
        // Check if user already exists
        if (signUpError.message.includes("already registered")) {
          toast.error("An account with this email already exists. Please sign in.");
          return;
        }
        throw signUpError;
      }

      if (data.session) {
        toast.success("Account created successfully!");
        await linkApplicationAndRedirect(data.session.access_token);
      } else {
        // Email confirmation required
        toast.success("Account created! Please check your email to confirm.");
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

      if (signInError) throw signInError;

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
            Create your account to access your Site Feasibility Intelligence™ report
          </CardDescription>
        </CardHeader>

        <CardContent>
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

            {/* Full Name */}
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

            {/* Confirm Password */}
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
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-sm text-muted-foreground mb-3">
              Already have an account?
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignIn}
              disabled={submitting || !password}
            >
              Sign In Instead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAccount;
