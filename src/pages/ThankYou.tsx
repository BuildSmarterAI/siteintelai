import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Calendar, Clock, Phone, ArrowRight, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { ProcessingTimeline } from "@/components/report/ProcessingTimeline";


export default function ThankYou() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId') || searchParams.get('id');
  const [applicationData, setApplicationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [reportError, setReportError] = useState(false);
  const [checking, setChecking] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // Function to check for latest report - redirects even if app is in error state
  const checkForReport = async () => {
    if (!applicationId) return;
    
    setChecking(true);
    logger.debug('ThankYou', 'Checking for report', { applicationId });
    
    try {
      // Check for report directly - don't rely on app status
      const { data: report, error } = await supabase
        .from('reports')
        .select('id, status, feasibility_score')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // If report exists and is completed/partial, redirect immediately
      if (report && (report.status === 'completed' || report.status === 'partial')) {
        logger.debug('ThankYou', 'Report found', { reportId: report.id, status: report.status, score: report.feasibility_score });
        setReportReady(true);
        
        // Clear polling and timeout
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        // Navigate to report
        setRedirecting(true);
        navigate(`/report/${report.id}`);
        return;
      }
      
      // Also check if app hit error but a report still exists (e.g., PDF failed after report created)
      const { data: app } = await supabase
        .from('applications')
        .select('status')
        .eq('id', applicationId)
        .single();
        
      if (app?.status === 'error' && report?.id) {
        logger.debug('ThankYou', 'App errored but report exists, redirecting', { reportId: report.id });
        setReportReady(true);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setRedirecting(true);
        navigate(`/report/${report.id}`);
        return;
      }
      
      // If app is in error state with no report, show error
      if (app?.status === 'error' && !report) {
        logger.debug('ThankYou', 'App errored with no report');
        setReportError(true);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        return;
      }
      
      logger.debug('ThankYou', 'Report not ready yet', report?.status || 'none', 'app:', app?.status);
    } catch (err) {
      logger.error('[ThankYou] Report check failed:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!applicationId) {
      setLoading(false);
      return;
    }

    const fetchApplication = async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .maybeSingle();
      
      if (data && !error) {
        setApplicationData(data);
      }
      setLoading(false);
    };

    fetchApplication();

    // 1. Initial report check
    checkForReport();

    // 2. Setup polling every 10 seconds
    pollIntervalRef.current = setInterval(checkForReport, 10000);

    // 3. Setup 15-minute timeout
    timeoutRef.current = setTimeout(() => {
      logger.error('[ThankYou] Report generation timeout - 15 minutes elapsed');
      setReportError(true);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }, 15 * 60 * 1000);

    // 4. Setup realtime subscription (as backup)
    const applicationsChannel = supabase
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
        }
      )
      .subscribe();

    const reportsChannel = supabase
      .channel('report-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
          filter: `application_id=eq.${applicationId}`
        },
        async (payload) => {
          // Check if report is ready (INSERT or UPDATE to completed/partial)
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const reportData = payload.new as any;
            if (reportData.status === 'completed' || reportData.status === 'partial') {
              setReportReady(true);
              // Immediately redirect to report viewer
              setRedirecting(true);
              navigate(`/report/${reportData.id}`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(applicationsChannel);
      supabase.removeChannel(reportsChannel);
    };
  }, [applicationId]);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('Auth check error:', error);
        setIsAuthenticated(false);
        return;
      }
      
      setIsAuthenticated(!!session?.user);
    } catch (err) {
      logger.error('Failed to check auth:', err);
      setIsAuthenticated(false);
    }
  };

  const handleViewReport = async () => {
    if (!applicationId) return;
    
    setRedirecting(true);
    const { data: report } = await supabase
      .from('reports')
      .select('id')
      .eq('application_id', applicationId)
      .maybeSingle();
    
    if (report) {
      navigate(`/report/${report.id}`);
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

          {/* Report Error Card */}
          {reportError && (
            <Card className="border-2 border-destructive shadow-xl mb-8">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="font-headline text-2xl font-bold text-charcoal mb-4">
                  Report Generation Issue
                </h3>
                <p className="font-body text-charcoal/70 mb-4">
                  We encountered an issue generating your report. Our team has been notified.
                </p>
                <p className="font-body text-sm text-charcoal/60 mb-6">
                  Application ID: {applicationId?.substring(0, 8)}...
                </p>
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={checkForReport} 
                    disabled={checking}
                    className="touch-target"
                  >
                    {checking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Check Again
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = 'mailto:support@buildsmarter.com?subject=Report Generation Issue&body=Application ID: ' + applicationId}
                    className="touch-target"
                  >
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Status Card - Always show if report is ready */}
          {reportReady ? (
            <Card className="border-2 border-primary shadow-xl mb-8">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-headline text-2xl font-bold text-charcoal mb-4">
                  Your Report is Ready!
                </h3>
                <p className="font-body text-charcoal/70 mb-6">
                  {!isAuthenticated 
                    ? "You'll be prompted to sign in or create an account to view your report." 
                    : "Click below to view your comprehensive feasibility report."}
                </p>
                <Button onClick={handleViewReport} size="lg" className="w-full max-w-md" disabled={redirecting}>
                  {redirecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Opening Report...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-5 w-5" />
                      View Your Report Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : !reportError && (
            <Card className="border-2 border-primary shadow-xl mb-8">
              <CardContent className="p-8">
                <h3 className="font-headline text-2xl font-bold text-charcoal mb-6 text-center">
                  Generating Your Report
                </h3>
                
                {/* Enhanced Processing Timeline */}
                <ProcessingTimeline 
                  currentStatus={applicationData?.status || 'queued'} 
                  statusPercent={applicationData?.status_percent || 5}
                />
                
                <div className="mt-6 text-center">
                  <Button 
                    onClick={checkForReport} 
                    variant="outline"
                    disabled={checking}
                    className="touch-target"
                  >
                    {checking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Check Now
                      </>
                    )}
                  </Button>
                </div>
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
                    Your Report Will Be Ready in Seconds
                  </h3>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <p className="font-body text-sm text-charcoal/70 mb-4">
                    Your comprehensive feasibility report is being generated and will appear in your dashboard shortly.
                  </p>
                  {reportReady ? (
                    <Button onClick={handleViewReport} className="w-full" size="lg" disabled={redirecting}>
                      {redirecting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-2 h-5 w-5" />
                          View Report Now
                        </>
                      )}
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