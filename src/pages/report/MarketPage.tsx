import { useReportContext } from "@/contexts/ReportContext";
import { MarketCard } from "@/components/report/MarketCard";
import { ExtendedDemographicsCard } from "@/components/report/ExtendedDemographicsCard";
import { EmploymentContextCard } from "@/components/report/EmploymentContextCard";
import { TaxJurisdictionCard } from "@/components/report/TaxJurisdictionCard";

export default function MarketPage() {
  const { report, marketDemographics, countyComparison } = useReportContext();

  if (!report) return null;

  return (
    <div className="space-y-6" id="section-market">
      <MarketCard
        score={report.feasibility_score ?? 0}
        population1mi={report.applications?.population_1mi}
        population3mi={report.applications?.population_3mi}
        population5mi={report.applications?.population_5mi}
        households5mi={report.applications?.households_5mi}
        medianIncome={report.applications?.median_income}
        growthRate5yr={report.applications?.growth_rate_5yr}
        driveTime15min={report.applications?.drive_time_15min_population}
        driveTime30min={report.applications?.drive_time_30min_population}
        verdict={marketDemographics?.verdict}
      />

      <ExtendedDemographicsCard
        medianAge={report.applications?.median_age}
        medianHomeValue={report.applications?.median_home_value}
        medianRent={report.applications?.median_rent}
        vacancyRate={report.applications?.vacancy_rate}
        unemploymentRate={report.applications?.unemployment_rate}
        collegeAttainmentPct={report.applications?.college_attainment_pct}
        totalHousingUnits={report.applications?.total_housing_units}
        laborForce={report.applications?.labor_force}
        retailSpendingIndex={report.applications?.retail_spending_index}
        workforceAvailabilityScore={report.applications?.workforce_availability_score}
        growthPotentialIndex={report.applications?.growth_potential_index}
        affluenceConcentration={report.applications?.affluence_concentration}
        laborPoolDepth={report.applications?.labor_pool_depth}
        growthTrajectory={report.applications?.growth_trajectory}
        marketOutlook={report.applications?.market_outlook}
        demographicsSource={report.applications?.demographics_source}
        censusGeoid={report.applications?.census_block_group}
        acsVintage={report.applications?.census_vintage}
        countyComparison={countyComparison}
      />

      <EmploymentContextCard
        submarketEnriched={report.applications?.submarket_enriched}
        employmentClusters={report.applications?.employment_clusters}
        nearbyPlaces={report.applications?.nearby_places}
      />

      <TaxJurisdictionCard
        taxRateTotal={report.applications?.tax_rate_total}
        taxingJurisdictions={report.applications?.taxing_jurisdictions}
        opportunityZone={report.applications?.opportunity_zone}
        enterpriseZone={report.applications?.enterprise_zone}
        foreignTradeZone={report.applications?.foreign_trade_zone}
        mudDistrict={report.applications?.mud_district}
      />
    </div>
  );
}
