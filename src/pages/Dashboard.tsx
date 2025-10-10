import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, FileText, LogOut, Plus, Clock, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchReports();
  }, []);

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
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          applications!reports_application_id_fkey (
            formatted_address,
            property_address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/src/assets/buildsmarter-logo-new.png" alt="SiteIntel" className="h-12" />
            <div>
              <h1 className="text-2xl font-headline">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name || 'User'}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-headline font-bold">Your Projects</h2>
            <p className="text-muted-foreground">Manage your feasibility reports and applications</p>
          </div>
          <Button onClick={() => navigate("/application?step=1")} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            New Application
          </Button>
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
                            {report.status === 'generating' && ' • Estimated completion: 10 minutes'}
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
                            Started {new Date(report.created_at).toLocaleDateString()} • Estimated completion: 10 minutes
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
  );
}