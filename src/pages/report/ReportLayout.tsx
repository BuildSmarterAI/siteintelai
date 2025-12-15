import { useParams, Outlet, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useReportData } from "@/hooks/useReportData";
import { ReportContextProvider } from "@/contexts/ReportContext";
import { ReportSidebar } from "@/components/report/ReportSidebar";
import { ReportHeader } from "@/components/report/ReportHeader";
import { ReportPreviewGate } from "@/components/ReportPreviewGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreCircle } from "@/components/ScoreCircle";
import { Lock } from "lucide-react";
import siteintelLogo from "@/assets/siteintel-ai-logo-main.png";

export default function ReportLayout() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const reportData = useReportData(reportId);

  const {
    report,
    loading,
    showPreview,
    showGate,
    setShowGate,
    hasKillFactors,
    pdfGenerating,
    pdfError,
    handleAuthSuccess,
  } = reportData;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Report not found</p>
      </div>
    );
  }

  // Preview mode for non-authenticated users
  if (showPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50">
        {showGate && reportId && (
          <ReportPreviewGate reportId={reportId} onAuthSuccess={handleAuthSuccess} />
        )}
        
        <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 md:px-6 py-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <img 
                  src={siteintelLogo} 
                  alt="SiteIntel AI" 
                  className="h-8 md:h-10 drop-shadow-[0_0_8px_rgba(255,122,0,0.5)]" 
                />
                <div>
                  <h1 className="text-lg md:text-2xl font-headline">Feasibility Report</h1>
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                    {report.applications?.formatted_address || 'Property Report'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="space-y-8">
            <div className="text-center">
              <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20">
                🔓 Quick Preview - Sign in for full access
              </Badge>
              
              <ScoreCircle score={report.feasibility_score ?? 0} size="lg" showLabel={true} />
              
              <p className="text-sm text-muted-foreground mt-4">
                {report.applications?.formatted_address}
              </p>
            </div>

            <div className="relative mt-6 p-6 border rounded-lg">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10 rounded-lg flex items-center justify-center">
                <Button size="lg" onClick={() => setShowGate(true)} className="shadow-xl">
                  <Lock className="mr-2 h-5 w-5" />
                  Sign In to Unlock Full Report
                </Button>
              </div>
              
              <div className="blur-md select-none pointer-events-none h-64" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Full report layout with sidebar and nested routes
  return (
    <ReportContextProvider value={reportData}>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/50">
          <ReportSidebar hasKillFactors={hasKillFactors} />

          <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 md:px-6 pt-6">
              <ReportHeader
                address={report.applications?.formatted_address || 'Property Report'}
                parcelId={report.applications?.parcel_id}
                jurisdiction={report.applications?.city || report.applications?.county}
                zoningCode={report.applications?.zoning_code || undefined}
                acreage={report.applications?.acreage_cad || report.applications?.lot_size_value}
                createdAt={report.created_at}
                pdfUrl={report.pdf_url}
                onDownloadPdf={() => window.open(report.pdf_url!, '_blank')}
                pdfGenerating={pdfGenerating}
                pdfError={pdfError}
              />
            </div>

            <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ReportContextProvider>
  );
}
