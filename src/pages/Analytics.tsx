import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, FileText, Target, Calendar, ArrowLeft } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/navigation/DashboardSidebar';
import { AuthButton } from '@/components/AuthButton';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Report {
  id: string;
  created_at: string;
  feasibility_score: number;
  score_band: string;
  applications: {
    formatted_address: string;
    intent_type: string | null;
  };
}

const SCORE_BAND_COLORS = {
  A: '#10B981',
  B: '#3B82F6',
  C: '#F59E0B',
  D: '#EF4444',
};

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          created_at,
          feasibility_score,
          score_band,
          applications!reports_application_id_fkey (
            formatted_address,
            intent_type
          )
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics data
  const totalReports = reports.length;
  const avgScore = totalReports > 0
    ? Math.round(reports.reduce((acc, r) => acc + (r.feasibility_score || 0), 0) / totalReports)
    : 0;
  const bestScore = totalReports > 0
    ? Math.max(...reports.map(r => r.feasibility_score || 0))
    : 0;
  const worstScore = totalReports > 0
    ? Math.min(...reports.map(r => r.feasibility_score || 0))
    : 0;

  // Score distribution data
  const scoreDistribution = Object.entries(
    reports.reduce((acc, r) => {
      const band = r.score_band || 'D';
      acc[band] = (acc[band] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([band, count]) => ({
    name: `Grade ${band}`,
    value: count,
    color: SCORE_BAND_COLORS[band as keyof typeof SCORE_BAND_COLORS] || '#9CA3AF',
  }));

  // Intent breakdown data
  const intentBreakdown = Object.entries(
    reports.reduce((acc, r) => {
      const intent = (r.applications?.intent_type as string) || 'unknown';
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([intent, count]) => ({
    name: intent === 'build' ? 'Build Projects' : intent === 'buy' ? 'Investment Deals' : 'Other',
    count,
    color: intent === 'build' ? '#FF7A00' : '#06B6D4',
  }));

  // Score timeline data
  const scoreTimeline = reports.map(r => ({
    date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: r.feasibility_score || 0,
    address: r.applications.formatted_address,
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-headline font-bold text-charcoal">Portfolio Analytics</h1>
              <p className="text-sm text-charcoal/60">Comprehensive insights across all your reports</p>
            </div>
          </div>
          <AuthButton />
        </div>

        {totalReports === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No completed reports yet.</p>
              <Button onClick={() => navigate('/application?step=1')}>
                Create Your First Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-charcoal/60 mb-1">Total Reports</p>
                      <p className="text-3xl font-bold text-charcoal">{totalReports}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-charcoal/60 mb-1">Average Score</p>
                      <p className="text-3xl font-bold text-charcoal">{avgScore}</p>
                    </div>
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-charcoal/60 mb-1">Best Score</p>
                      <p className="text-3xl font-bold text-green-600">{bestScore}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-charcoal/60 mb-1">Lowest Score</p>
                      <p className="text-3xl font-bold text-orange-600">{worstScore}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                  <CardDescription>Breakdown by grade band</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={scoreDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Intent Breakdown Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Intent</CardTitle>
                  <CardDescription>Build vs Buy breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={intentBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fill: '#0A0F2C', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#0A0F2C', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px',
                        }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {intentBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Score Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Score Timeline</CardTitle>
                <CardDescription>Feasibility scores over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={scoreTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#0A0F2C', fontSize: 12 }}
                      angle={-15}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      tick={{ fill: '#0A0F2C', fontSize: 12 }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px',
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        `Score: ${value}`,
                        props.payload.address,
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#FF7A00"
                      strokeWidth={3}
                      dot={{ r: 6, fill: '#FF7A00' }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
