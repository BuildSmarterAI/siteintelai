import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, Clock, Phone, ArrowRight, Zap, Database, Users, Loader2 } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UtilityResults } from "@/components/UtilityResults";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ThankYou() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId') || searchParams.get('id');
  const [applicationData, setApplicationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (applicationId) {
      const fetchApplication = async () => {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('id', applicationId)
          .maybeSingle();
        
        if (data && !error) {
          setApplicationData(data);
          // Check if report is ready
          if (data.enrichment_status === 'completed') {
            const { data: report } = await supabase
              .from('reports')
              .select('id')
              .eq('application_id', applicationId)
              .maybeSingle();
            
            if (report) {
              setReportReady(true);
            }
          }
        }
        setLoading(false);
      };

      fetchApplication();

      // Subscribe to real-time updates for this application
      const channel = supabase
        .channel('application-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'applications',
            filter: `id=eq.${applicationId}`
          },
          async (payload) => {
            setApplicationData(payload.new);
            // Check if report became ready
            if (payload.new.enrichment_status === 'completed') {
              const { data: report } = await supabase
                .from('reports')
                .select('id')
                .eq('application_id', applicationId)
                .maybeSingle();
              
              if (report) {
                setReportReady(true);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [applicationId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session?.user);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      toast.success("Account created! Check your email to confirm.");
      setEmail("");
      setPassword("");
      setFullName("");
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Sign up failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="mb-8">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h1 className="font-headline text-3xl md:text-5xl font-black text-charcoal mb-4 uppercase tracking-wide">
                Application Submitted Successfully
              </h1>
              <p className="font-body text-lg md:text-xl text-charcoal/80 max-w-3xl mx-auto leading-relaxed">
                Thank you for your comprehensive application. Our team will review your project details and contact you within 1 business day.
              </p>
            </div>
          </div>

          {/* Conditional Auth Prompt for Non-Authenticated Users */}
          {!isAuthenticated && (
            <Card className="border-2 border-primary shadow-xl mb-8">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Zap className="h-6 w-6 text-primary" />
                  Create a Free Account to View Your Report Instantly
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Access Your Report 24/7</p>
                      <p className="text-xs text-muted-foreground">View and download your feasibility report anytime</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Track Multiple Properties</p>
                      <p className="text-xs text-muted-foreground">Manage all your feasibility reports in one dashboard</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Save Your Progress</p>
                      <p className="text-xs text-muted-foreground">Never lose your work - all data is securely stored</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={authLoading}>
                    {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Free Account & View Report
                  </Button>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  size="lg"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
                  Continue with Google
                </Button>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  Already have an account?{" "}
                  <Link to="/auth" className="text-primary hover:underline font-medium">
                    Sign in here
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Confirmation Details for Authenticated Users */}
          {isAuthenticated && (
            <Card className="border-2 border-green-500/30 shadow-xl mb-8">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <h3 className="font-headline text-2xl font-bold text-charcoal">
                    Your Report Will Be Ready in 10 Minutes
                  </h3>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <p className="font-body text-sm text-charcoal/70 mb-4">
                    Your comprehensive feasibility report is being generated and will appear in your dashboard shortly.
                  </p>
                  {reportReady ? (
                    <Button onClick={() => navigate('/dashboard')} className="w-full" size="lg">
                      <ArrowRight className="mr-2 h-5 w-5" />
                      View Report Now
                    </Button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="font-body text-sm text-charcoal">Processing your report...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirmation Details */}
          <Card className="border-2 border-green-500/30 shadow-xl mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <h3 className="font-headline text-2xl font-bold text-charcoal">
                  Your Application Has Been Processed
                </h3>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h4 className="font-headline text-lg font-bold text-charcoal mb-3">
                  Automatic Integration Complete
                </h4>
                <p className="font-body text-sm text-charcoal/70 mb-4">
                  Your application has been automatically distributed to our systems:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="font-body text-sm text-charcoal">GoHighLevel CRM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-green-600" />
                    <span className="font-body text-sm text-charcoal">Project Database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    <span className="font-body text-sm text-charcoal">Sales Team Alert</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <h4 className="font-headline text-xl font-bold text-charcoal mb-6">
                What Happens Next?
              </h4>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">1</div>
                  <div>
                    <p className="font-body font-semibold text-charcoal text-lg mb-2">Initial Review (Within 24 Hours)</p>
                    <p className="font-body text-charcoal/70">
                      Our feasibility team reviews your application, property details, and project requirements. We'll assess complexity and identify any preliminary concerns.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">2</div>
                  <div>
                    <p className="font-body font-semibold text-charcoal text-lg mb-2">Discovery Call (48-72 Hours)</p>
                    <p className="font-body text-charcoal/70">
                      We'll schedule a 30-minute discovery call to discuss your timeline, budget parameters, and specific requirements. This helps us customize your feasibility package.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">3</div>
                  <div>
                    <p className="font-body font-semibold text-charcoal text-lg mb-2">Proposal & Timeline (3-5 Days)</p>
                    <p className="font-body text-charcoal/70">
                      Receive your customized feasibility proposal with scope, timeline, and investment details. We'll also provide a preliminary project assessment.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-maxx-red rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">4</div>
                  <div>
                    <p className="font-body font-semibold text-charcoal text-lg mb-2">Feasibility Execution (2-4 Weeks)</p>
                    <p className="font-body text-charcoal/70">
                      Upon approval, our team conducts comprehensive feasibility analysis including zoning research, utility verification, and preliminary design concepts.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Call Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="shadow-xl border-2 border-navy/20">
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-navy mx-auto mb-4" />
                <h3 className="font-headline text-xl font-bold text-charcoal mb-4">
                  Schedule Your Discovery Call
                </h3>
                <p className="font-body text-charcoal/70 mb-6">
                  Prefer to schedule your call immediately? Use our calendar to book a convenient time for your discovery session.
                </p>
                <Button className="bg-navy hover:bg-navy/90 text-white w-full">
                  Schedule Call Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-2 border-maxx-red/20">
              <CardContent className="p-8 text-center">
                <Phone className="w-12 h-12 text-maxx-red mx-auto mb-4" />
                <h3 className="font-headline text-xl font-bold text-charcoal mb-4">
                  Urgent Project?
                </h3>
                <p className="font-body text-charcoal/70 mb-6">
                  Need immediate attention for a time-sensitive project? Contact our priority line for expedited review.
                </p>
                <Button variant="outline" className="border-maxx-red text-maxx-red hover:bg-maxx-red hover:text-white w-full">
                  Call Priority Line
                  <Phone className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Utility Results */}
          {applicationData && (
            <div className="mb-8">
              <UtilityResults
                waterLines={applicationData.water_lines}
                sewerLines={applicationData.sewer_lines}
                stormLines={applicationData.storm_lines}
                dataFlags={applicationData.data_flags || []}
              />
            </div>
          )}

          {/* Trust Reminders */}
          <Card className="bg-navy/5 border-2 border-navy/20 mb-8">
            <CardContent className="p-8">
              <h3 className="font-headline text-xl font-bold text-navy mb-6 text-center">
                Your Project Is In Expert Hands
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <p className="font-body font-semibold text-charcoal mb-2">100% Fee Credit</p>
                  <p className="font-body text-sm text-charcoal/70">
                    Every dollar of your feasibility fee is credited toward your project.
                  </p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <p className="font-body font-semibold text-charcoal mb-2">Confidential Process</p>
                  <p className="font-body text-sm text-charcoal/70">
                    All project details remain strictly confidential with NDA protection.
                  </p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <p className="font-body font-semibold text-charcoal mb-2">Proven Results</p>
                  <p className="font-body text-sm text-charcoal/70">
                    Trusted by developers managing $500M+ in Texas commercial projects.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Immediate Attention Box */}
          <Card className="bg-maxx-red/5 border-2 border-maxx-red/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-maxx-red" />
                <h4 className="font-headline text-lg font-bold text-charcoal">
                  Need Immediate Attention?
                </h4>
              </div>
              <p className="font-body text-charcoal/70 mb-4">
                If your project has urgent deadlines or requires immediate feasibility review, our priority team can expedite your application.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="bg-maxx-red hover:bg-maxx-red/90 text-white">
                  Contact Priority Team
                </Button>
                <Button variant="outline" className="border-maxx-red text-maxx-red hover:bg-maxx-red hover:text-white">
                  Email Direct
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Return to Home */}
          <div className="text-center mt-12">
            <Link to="/">
              <Button variant="outline" size="lg" className="border-navy text-navy hover:bg-navy hover:text-white">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}