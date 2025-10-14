import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, FileText, Plus, Clock, CheckCircle, Menu, RefreshCw, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/navigation/DashboardSidebar";
import { AuthButton } from "@/components/AuthButton";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { PaymentButton } from "@/components/PaymentButton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useReEnrichApplication } from "@/hooks/useReEnrichApplication";

interface Report {
  id: string;
  created_at: string;
  report_type: string;
  feasibility_score: number | null;
  status: string;
  applications: {
    formatted_address: string;
    property_address: any;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const { isAdmin } = useAdminRole();
  const { reEnrich, loading: reEnrichLoading } = useReEnrichApplication();

  useEffect(() => {
    checkAuth();
    fetchReports();
    
    // Handle payment success/cancel messages
    const payment = searchParams.get('payment');
    const subscription = searchParams.get('subscription');
    
    if (payment === 'success') {
      toast.success('Payment successful! Your report will be generated shortly.');
    } else if (payment === 'canceled') {
      toast.error('Payment was canceled.');
    }
    
    if (subscription === 'success') {
      toast.success('Subscription activated! Welcome to SiteIntel Pro.');
    } else if (subscription === 'canceled') {
      toast.error('Subscription was canceled.');
    }
  }, [searchParams]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    setProfile(profileData);
  };

  const fetchReports = async () => {
    try {
      // Get current session to filter by user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          applications!reports_application_id_fkey (
            formatted_address,
            property_address
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'generating': return 'bg-blue-500';
      case 'failed': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-charcoal/5 to-navy/5">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-charcoal/5 to-navy/5">
        <div className="hidden md:flex">
          <DashboardSidebar />
        </div>
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-charcoal/10 py-4 md:py-6 sticky top-0 z-10">
            <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile Menu */}
                <Sheet>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] p-0">
                    <DashboardSidebar />
                  </SheetContent>
                </Sheet>
                
                <div>
                  <h1 className="font-headline text-lg md:text-2xl font-bold text-charcoal uppercase tracking-wide">
                    Your Projects
                  </h1>
                  <p className="text-xs md:text-sm text-charcoal/60 mt-1">
                    Welcome back, {profile?.full_name || profile?.email}
                  </p>
                </div>
              </div>
              <AuthButton />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 container mx-auto px-4 md:px-6 py-6 md:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-headline font-bold text-charcoal">Reports & Applications</h2>
                    <p className="text-sm text-charcoal/60">Manage your feasibility reports and applications</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <PaymentButton type="report" variant="outline" className="w-full sm:w-auto text-sm">
                      Buy Report ($795)
                    </PaymentButton>
                    <Button 
                      onClick={() => navigate("/application?step=1")} 
                      size="lg"
                      className="bg-navy hover:bg-navy/90 text-white w-full sm:w-auto"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      New Application
                    </Button>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1">
                <SubscriptionStatus />
              </div>
            </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Reports</CardTitle>
                <CardDescription>View and download your feasibility reports</CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No reports yet. Start by submitting an application.</p>
                    <p className="text-sm text-muted-foreground mb-6">Get comprehensive feasibility analysis for your properties</p>
                    <Button onClick={() => navigate("/application?step=1")} size="lg">
                      <Plus className="mr-2 h-5 w-5" />
                      Create Your First Report
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            {report.status === 'completed' ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : report.status === 'generating' ? (
                              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-muted-foreground" />
                            )}
                            <h3 className="font-semibold">
                              {report.applications?.formatted_address || 'Unknown Address'}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground pl-8">
                            {new Date(report.created_at).toLocaleDateString()} • {report.report_type}
                            {report.status === 'generating' && ' • Estimated completion: 30-60 seconds'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          {report.feasibility_score && (
                            <Badge variant="outline" className="text-base px-3 py-1">
                              Score: {report.feasibility_score}
                            </Badge>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                            {isAdmin && report.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const result = await reEnrich(report.id);
                                  if (result.success) {
                                    setTimeout(() => fetchReports(), 3000);
                                  }
                                }}
                                disabled={reEnrichLoading}
                                className="h-8 text-xs"
                              >
                                <RefreshCw className={`h-3 w-3 mr-1 ${reEnrichLoading ? 'animate-spin' : ''}`} />
                                Re-enrich
                              </Button>
                            )}
                          </div>
                          {report.status === 'completed' && (
                            <Button size="sm" onClick={() => navigate(`/report/${report.id}`)}>
                              View Report
                            </Button>
                          )}
                          {report.status === 'failed' && (
                            <div className="flex items-center gap-1 text-xs text-destructive">
                              <AlertCircle className="h-3 w-3" />
                              <span>Failed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Completed Reports</CardTitle>
                <CardDescription>View all your completed feasibility reports</CardDescription>
              </CardHeader>
              <CardContent>
                {reports.filter(r => r.status === 'completed').length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No completed reports yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.filter(r => r.status === 'completed').map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <h3 className="font-semibold">
                              {report.applications?.formatted_address || 'Unknown Address'}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground pl-8">
                            Completed {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          {report.feasibility_score && (
                            <Badge variant="outline" className="text-base px-3 py-1">
                              Score: {report.feasibility_score}
                            </Badge>
                          )}
                          <Button size="sm" onClick={() => navigate(`/report/${report.id}`)}>
                            View Report
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Reports</CardTitle>
                <CardDescription>Reports currently being generated</CardDescription>
              </CardHeader>
              <CardContent>
                {reports.filter(r => r.status !== 'completed').length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No pending reports</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.filter(r => r.status !== 'completed').map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/50">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            <h3 className="font-semibold">
                              {report.applications?.formatted_address || 'Unknown Address'}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground pl-8">
                            Started {new Date(report.created_at).toLocaleDateString()} • Estimated completion: 30-60 seconds
                          </p>
                        </div>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}