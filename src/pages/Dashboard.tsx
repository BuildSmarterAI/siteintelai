import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, FileText, Plus, Clock, CheckCircle, Menu, RefreshCw, AlertCircle, Building2, DollarSign, TrendingUp, GripVertical, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/navigation/DashboardSidebar";
import { AuthButton } from "@/components/AuthButton";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { PaymentButton } from "@/components/PaymentButton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useReEnrichApplication } from "@/hooks/useReEnrichApplication";
import { useBulkReEnrich } from "@/hooks/useBulkReEnrich";
import { IntentBadge } from "@/components/IntentBadge";
import { ReportCardSkeleton, StatsCardSkeleton } from "@/components/ui/report-skeleton";
import { OnboardingTour } from "@/components/OnboardingTour";
import { triggerDataPulse } from "@/lib/data-pulse-effect";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Report {
  id: string;
  created_at: string;
  report_type: string;
  feasibility_score: number | null;
  status: string;
  applications: {
    formatted_address: string;
    property_address: any;
    intent_type: 'build' | 'buy' | null;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [sortedReports, setSortedReports] = useState<Report[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const { isAdmin } = useAdminRole();
  const { reEnrich, loading: reEnrichLoading } = useReEnrichApplication();
  const { bulkReEnrich, loading: bulkReEnrichLoading } = useBulkReEnrich();
  const [showTour, setShowTour] = useState(false);
  const [reportStatuses, setReportStatuses] = useState<Record<string, string>>({});

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

  // Poll for generating reports every 3 seconds
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    const generatingReports = reports.filter(r => r.status === 'generating');
    
    if (generatingReports.length > 0) {
      pollInterval = setInterval(() => {
        console.log('🔄 Polling for report updates...');
        fetchReports();
      }, 3000);
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [reports]);

  // Status change detection with toast notifications
  useEffect(() => {
    reports.forEach(report => {
      const prevStatus = reportStatuses[report.id];
      
      if (prevStatus === 'generating' && report.status === 'completed') {
        // Report just completed - Corporate toast with icon
        toast.success(
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Report Complete</p>
              <p className="text-xs text-muted-foreground">{report.applications.formatted_address}</p>
            </div>
          </div>,
          {
            action: {
              label: 'View Report',
              onClick: () => navigate(`/report/${report.id}`)
            },
            duration: 8000,
          }
        );
        
        // Data pulse instead of confetti
        triggerDataPulse();
      } else if (prevStatus === 'generating' && report.status === 'failed') {
        toast.error(
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Generation Failed</p>
              <p className="text-xs text-muted-foreground">{report.applications.formatted_address}</p>
            </div>
          </div>,
          { duration: 10000 }
        );
      }
    });
    
    // Update status map
    const newStatuses = reports.reduce((acc, r) => ({
      ...acc,
      [r.id]: r.status
    }), {});
    setReportStatuses(newStatuses);
  }, [reports, navigate]);

  // Show tour for new users
  useEffect(() => {
    const tourCompleted = localStorage.getItem('tour_completed_dashboard');
    if (!tourCompleted && reports.length === 0) {
      setTimeout(() => setShowTour(true), 1500);
    }
  }, [reports]);

  // Load saved order and apply it
  useEffect(() => {
    if (reports.length === 0) return;
    
    const savedOrder = localStorage.getItem(`siteintel_report_order_${profile?.id}`);
    if (savedOrder) {
      try {
        const orderMap: Record<string, number> = JSON.parse(savedOrder);
        const sorted = [...reports].sort((a, b) => {
          const aIndex = orderMap[a.id] ?? 999;
          const bIndex = orderMap[b.id] ?? 999;
          return aIndex - bIndex;
        });
        setSortedReports(sorted);
      } catch {
        setSortedReports(reports);
      }
    } else {
      setSortedReports(reports);
    }
  }, [reports, profile]);

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    setSortedReports((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      const newOrder = arrayMove(items, oldIndex, newIndex);
      
      // Save to localStorage
      const orderMap = newOrder.reduce((acc, report, idx) => {
        acc[report.id] = idx;
        return acc;
      }, {} as Record<string, number>);
      
      localStorage.setItem(`siteintel_report_order_${profile?.id}`, JSON.stringify(orderMap));
      
      return newOrder;
    });
  };

  const SortableReportCard = ({ report }: { report: Report }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: report.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent/50 transition"
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-move text-charcoal/40 hover:text-charcoal transition"
          title="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex-1 flex items-center justify-between">
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
              {report.applications?.intent_type && (
                <IntentBadge intentType={report.applications.intent_type} size="sm" />
              )}
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
      </div>
    );
  };

  // Show onboarding tour for new users
  useEffect(() => {
    const tourCompleted = localStorage.getItem('tour_completed_dashboard');
    if (!tourCompleted && reports.length === 0) {
      setTimeout(() => setShowTour(true), 1500);
    }
  }, [reports]);

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
            property_address,
            intent_type
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data || []) as Report[]);
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
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-charcoal/5 to-navy/5">
          <div className="hidden md:flex">
            <DashboardSidebar />
          </div>
          
          <div className="flex-1 flex flex-col">
            <header className="bg-white border-b border-charcoal/10 py-4 md:py-6">
              <div className="container mx-auto px-4 md:px-6">
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
              </div>
            </header>
            
            <main className="flex-1 container mx-auto px-4 md:px-6 py-6 md:py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[...Array(3)].map((_, i) => (
                  <StatsCardSkeleton key={i} />
                ))}
              </div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <ReportCardSkeleton key={i} />
                ))}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <OnboardingTour 
        tourName="dashboard" 
        run={showTour} 
        onComplete={() => setShowTour(false)} 
      />
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
            {/* Intent-Based Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Build Projects</p>
                      <p className="text-2xl font-bold">
                        {reports.filter(r => r.applications?.intent_type === 'build').length}
                      </p>
                    </div>
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Investment Deals</p>
                      <p className="text-2xl font-bold">
                        {reports.filter(r => r.applications?.intent_type === 'buy').length}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-accent" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Score</p>
                      <p className="text-2xl font-bold">
                        {reports.length > 0 
                          ? Math.round(reports.reduce((acc, r) => acc + (r.feasibility_score || 0), 0) / reports.length)
                          : 0}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Admin Bulk Re-enrich Control */}
            {isAdmin && (
              <Card className="mb-6 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-orange-600" />
                    Admin: Bulk Re-enrichment
                  </CardTitle>
                  <CardDescription>
                    Re-process all failed applications with E003 errors that have geocode + parcel data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={async () => {
                      const result = await bulkReEnrich();
                      if (result.success) {
                        setTimeout(() => fetchReports(), 5000);
                      }
                    }}
                    disabled={bulkReEnrichLoading}
                    variant="default"
                    className="w-full sm:w-auto"
                  >
                    {bulkReEnrichLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Re-enrich All E003 Failed Apps
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
            
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
                      data-tour="new-application"
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
            <TabsTrigger value="build" className="text-primary">
              <Building2 className="mr-2 h-4 w-4" />
              Build Projects
            </TabsTrigger>
            <TabsTrigger value="buy" className="text-accent">
              <DollarSign className="mr-2 h-4 w-4" />
              Investment Deals
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value="all" data-tour="reports-list" className="space-y-4">
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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={sortedReports.map(r => r.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {sortedReports.map((report) => (
                          <SortableReportCard key={report.id} report={report} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Build Projects Tab */}
          <TabsContent value="build" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Build / Development Projects
                </CardTitle>
                <CardDescription>Properties focused on new construction and ground-up development</CardDescription>
              </CardHeader>
              <CardContent>
                {reports.filter(r => r.applications?.intent_type === 'build').length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No build projects yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Start a new development feasibility analysis</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.filter(r => r.applications?.intent_type === 'build').map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-primary/5 transition border-primary/20">
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
                            <IntentBadge intentType="build" size="sm" />
                          </div>
                          <p className="text-sm text-muted-foreground pl-8">
                            {new Date(report.created_at).toLocaleDateString()} • Development Feasibility
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          {report.feasibility_score && (
                            <Badge variant="outline" className="text-base px-3 py-1">
                              Score: {report.feasibility_score}
                            </Badge>
                          )}
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          {report.status === 'completed' && (
                            <Button size="sm" onClick={() => navigate(`/report/${report.id}`)}>
                              View Report
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Buy / Investment Deals Tab */}
          <TabsContent value="buy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-accent" />
                  Buy / Investment Deals
                </CardTitle>
                <CardDescription>Properties being evaluated for acquisition and investment</CardDescription>
              </CardHeader>
              <CardContent>
                {reports.filter(r => r.applications?.intent_type === 'buy').length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No investment deals yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Start a new investment analysis</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.filter(r => r.applications?.intent_type === 'buy').map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition border-accent/20">
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
                            <IntentBadge intentType="buy" size="sm" />
                          </div>
                          <p className="text-sm text-muted-foreground pl-8">
                            {new Date(report.created_at).toLocaleDateString()} • Investment Analysis
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          {report.feasibility_score && (
                            <Badge variant="outline" className="text-base px-3 py-1">
                              Score: {report.feasibility_score}
                            </Badge>
                          )}
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          {report.status === 'completed' && (
                            <Button size="sm" onClick={() => navigate(`/report/${report.id}`)}>
                              View Report
                            </Button>
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
                            {report.applications?.intent_type && (
                              <IntentBadge intentType={report.applications.intent_type} size="sm" />
                            )}
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