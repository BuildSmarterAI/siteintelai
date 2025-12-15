import { useReportContext } from "@/contexts/ReportContext";
import { ExecutiveVerdictBar } from "@/components/report/ExecutiveVerdictBar";
import { KillFactorPanel, KillFactorItem } from "@/components/report/KillFactorPanel";
import { FeasibilityScoreCard } from "@/components/report/FeasibilityScoreCard";
import { RiskDriverList, RiskDriver } from "@/components/report/RiskDriverList";
import { NextActionsBlock, NextAction } from "@/components/report/NextActionsBlock";
import { ExecutiveSummaryCard } from "@/components/report/ExecutiveSummaryCard";

export default function ScorePage() {
  const { 
    report, 
    verdict, 
    confidence, 
    dataFreshness, 
    hasKillFactors,
    summary,
  } = useReportContext();

  if (!report) return null;

  // Build kill factors from data - split into three groups
  const dealKillers: KillFactorItem[] = [];
  const conditionalRisks: KillFactorItem[] = [];
  const advisoryNotes: KillFactorItem[] = [];
  
  if (report.applications?.floodplain_zone?.toLowerCase().includes('floodway')) {
    dealKillers.push({
      id: 'floodway',
      title: 'FEMA Floodway',
      status: 'FAIL',
      impact: 'Property is located in a FEMA-designated floodway. Development is severely restricted.',
      confidence: 95,
      source: 'FEMA NFHL',
    });
  }

  if ((report.applications?.wetlands_area_pct ?? 0) >= 25) {
    conditionalRisks.push({
      id: 'wetlands',
      title: 'Significant Wetlands',
      status: 'WARN',
      impact: `${report.applications?.wetlands_area_pct?.toFixed(1)}% of parcel is wetlands. May require Section 404 permit.`,
      requiredAction: 'Environmental assessment required',
      confidence: 85,
      source: 'USFWS NWI',
    });
  }

  // Build risk drivers - split into positives and penalties
  const positives: RiskDriver[] = [];
  const penalties: RiskDriver[] = [];
  
  if (report.applications?.floodplain_zone === 'X') {
    positives.push({
      id: 'flood-minimal',
      label: 'Minimal Flood Risk',
      delta: 10,
      sectionId: 'flood',
    });
  } else if (report.applications?.floodplain_zone && report.applications.floodplain_zone !== 'X') {
    penalties.push({
      id: 'flood-risk',
      label: `Flood Zone ${report.applications.floodplain_zone}`,
      delta: -15,
      sectionId: 'flood',
    });
  }

  if ((report.applications?.water_lines?.length ?? 0) > 0) {
    positives.push({
      id: 'water-available',
      label: 'Water Infrastructure Available',
      delta: 8,
      sectionId: 'utilities',
    });
  }

  // Build next actions
  const nextActions: NextAction[] = [
    {
      id: 'site-visit',
      label: 'Schedule Site Visit',
      owner: 'developer',
      priority: 1,
    },
    {
      id: 'title-search',
      label: 'Order Title Search',
      owner: 'consultant',
      priority: 2,
    },
  ];

  if (hasKillFactors) {
    nextActions.unshift({
      id: 'environmental',
      label: 'Environmental Assessment Required',
      owner: 'consultant',
      priority: 1,
    });
  }

  // Build justification string
  const getJustification = () => {
    if (hasKillFactors) {
      return "Critical issues identified that may prevent development. Environmental assessment required.";
    }
    const score = report.feasibility_score ?? 0;
    if (score >= 75) {
      return "Strong feasibility indicators across all categories. Proceed with standard due diligence.";
    }
    if (score >= 50) {
      return "Moderate feasibility with some concerns. Additional analysis recommended before proceeding.";
    }
    return "Significant concerns identified. Careful evaluation of risk factors required.";
  };

  return (
    <div className="space-y-6" id="section-score">
      {/* Executive Verdict */}
      <ExecutiveVerdictBar
        verdict={verdict}
        justification={getJustification()}
        confidence={confidence}
        timestamp={report.created_at}
      />

      {/* Kill Factor Panel - only if kill factors exist */}
      {hasKillFactors && (dealKillers.length > 0 || conditionalRisks.length > 0) && (
        <div id="section-kill-factors">
          <KillFactorPanel 
            dealKillers={dealKillers}
            conditionalRisks={conditionalRisks}
            advisoryNotes={advisoryNotes}
          />
        </div>
      )}

      {/* Feasibility Score Card */}
      <FeasibilityScoreCard
        score={report.feasibility_score ?? 0}
        scoreBand={report.score_band}
        address={report.applications?.formatted_address || 'Property'}
      />

      {/* Risk Drivers */}
      {(positives.length > 0 || penalties.length > 0) && (
        <RiskDriverList 
          positives={positives}
          penalties={penalties}
        />
      )}

      {/* Executive Summary */}
      {summary.executive_summary && (
        <ExecutiveSummaryCard
          executiveSummary={summary.executive_summary}
          overallScore={report.feasibility_score ?? 0}
          scoreBand={report.score_band}
          keyOpportunities={summary.key_opportunities}
          keyRisks={summary.key_risks}
          zoningCode={report.applications?.zoning_code}
          floodZone={report.applications?.floodplain_zone}
          acreage={report.applications?.acreage_cad || report.applications?.lot_size_value}
        />
      )}

      {/* Next Actions */}
      <NextActionsBlock 
        actions={nextActions} 
        verdictType={verdict}
      />
    </div>
  );
}
