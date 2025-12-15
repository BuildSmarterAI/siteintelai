import { useReportContext } from "@/contexts/ReportContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, Calculator, FileText } from "lucide-react";
import { ValuationCard } from "@/components/report/ValuationCard";
import DOMPurify from 'dompurify';

export default function CostsPage() {
  const { report } = useReportContext();

  if (!report) return null;

  const costsOutput = report.applications?.costs_output;
  const scheduleOutput = report.applications?.schedule_output;

  return (
    <div className="space-y-6" id="section-costs">
      {/* Valuation Card */}
      <ValuationCard
        totApprVal={report.applications?.tot_appr_val}
        totMarketVal={report.applications?.tot_market_val}
        landVal={report.applications?.land_val}
        imprvVal={report.applications?.imprv_val}
        taxableValue={report.applications?.taxable_value}
        bldgSqft={report.applications?.bldg_sqft}
        yearBuilt={report.applications?.year_built}
        effectiveYr={report.applications?.effective_yr}
        numStories={report.applications?.num_stories}
        stateClass={report.applications?.state_class}
        propType={report.applications?.prop_type}
        landUseCode={report.applications?.land_use_code}
      />

      {/* Cost Analysis */}
      {costsOutput && (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-[hsl(var(--data-cyan))]" />
              Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(costsOutput.replace(/\n/g, '<br/>')) 
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Schedule Analysis */}
      {scheduleOutput && (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-[hsl(var(--feasibility-orange))]" />
              Development Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(scheduleOutput.replace(/\n/g, '<br/>')) 
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Permitting Timeline */}
      {report.applications?.average_permit_time_months && (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Permitting Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Average Permit Timeline</p>
                <p className="text-2xl font-bold">
                  {report.applications.average_permit_time_months} months
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {report.applications?.city || report.applications?.county}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholder if no cost data */}
      {!costsOutput && !scheduleOutput && !report.applications?.average_permit_time_months && !report.applications?.tot_market_val && (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="py-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Cost and schedule analysis not available for this report.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact us for a detailed cost estimate.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
