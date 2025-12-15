import { useReportContext } from "@/contexts/ReportContext";
import { MarketCard } from "@/components/report/MarketCard";
import { ExtendedDemographicsCard } from "@/components/report/ExtendedDemographicsCard";
import { EmploymentContextCard } from "@/components/report/EmploymentContextCard";
import { TaxJurisdictionCard } from "@/components/report/TaxJurisdictionCard";
import { DemographicsBreakdownCard } from "@/components/report/DemographicsBreakdownCard";
import { IncomeWealthCard } from "@/components/report/IncomeWealthCard";
import { HousingTenureCard } from "@/components/report/HousingTenureCard";
import { WorkforceCommuteCard } from "@/components/report/WorkforceCommuteCard";
import { EducationBreakdownCard } from "@/components/report/EducationBreakdownCard";
import { GrowthProjectionsCard } from "@/components/report/GrowthProjectionsCard";

export default function MarketPage() {
  const { report, marketDemographics, countyComparison } = useReportContext();

  if (!report) return null;

  const app = report.applications;

  return (
    <div className="space-y-6" id="section-market">
      <MarketCard
        score={report.feasibility_score ?? 0}
        population1mi={app?.population_1mi}
        population3mi={app?.population_3mi}
        population5mi={app?.population_5mi}
        households5mi={app?.households_5mi}
        medianIncome={app?.median_income}
        growthRate5yr={app?.growth_rate_5yr}
        driveTime15min={app?.drive_time_15min_population}
        driveTime30min={app?.drive_time_30min_population}
        verdict={marketDemographics?.verdict}
      />

      <ExtendedDemographicsCard
        medianAge={app?.median_age}
        medianHomeValue={app?.median_home_value}
        medianRent={app?.median_rent}
        vacancyRate={app?.vacancy_rate}
        unemploymentRate={app?.unemployment_rate}
        collegeAttainmentPct={app?.college_attainment_pct}
        totalHousingUnits={app?.total_housing_units}
        laborForce={app?.labor_force}
        retailSpendingIndex={app?.retail_spending_index}
        workforceAvailabilityScore={app?.workforce_availability_score}
        growthPotentialIndex={app?.growth_potential_index}
        affluenceConcentration={app?.affluence_concentration}
        laborPoolDepth={app?.labor_pool_depth}
        growthTrajectory={app?.growth_trajectory}
        marketOutlook={app?.market_outlook}
        demographicsSource={app?.demographics_source}
        censusGeoid={app?.census_block_group}
        acsVintage={app?.census_vintage}
        countyComparison={countyComparison}
      />

      <DemographicsBreakdownCard
        under18Pct={app?.under_18_pct}
        workingAgePct={app?.working_age_pct}
        over65Pct={app?.over_65_pct}
        whitePct={app?.white_pct}
        blackPct={app?.black_pct}
        asianPct={app?.asian_pct}
        hispanicPct={app?.hispanic_pct}
      />

      <IncomeWealthCard
        medianIncome={app?.median_income ?? app?.mean_household_income}
        perCapitaIncome={app?.per_capita_income}
        meanHouseholdIncome={app?.mean_household_income}
        povertyRate={app?.poverty_rate}
        giniIndex={app?.gini_index}
      />

      <HousingTenureCard
        ownerOccupiedPct={app?.owner_occupied_pct}
        renterOccupiedPct={app?.renter_occupied_pct}
        totalHousingUnits={app?.total_housing_units}
        populationBlockGroup={app?.population_block_group}
        singleFamilyPct={app?.single_family_pct}
        multiFamilyPct={app?.multi_family_pct}
        medianYearBuilt={app?.median_year_built}
        avgHouseholdSize={app?.avg_household_size}
      />

      <WorkforceCommuteCard
        whiteCollarPct={app?.white_collar_pct}
        blueCollarPct={app?.blue_collar_pct}
        serviceSectorPct={app?.service_sector_pct}
        workFromHomePct={app?.work_from_home_pct}
        meanCommuteTimeMin={app?.mean_commute_time_min}
        driveAlonePct={app?.drive_alone_pct}
        publicTransitPct={app?.public_transit_pct}
        walkBikePct={app?.walk_bike_pct}
      />

      <EducationBreakdownCard
        highSchoolOnlyPct={app?.high_school_only_pct}
        someCollegePct={app?.some_college_pct}
        bachelorsPct={app?.bachelors_pct}
        graduateDegreePct={app?.graduate_degree_pct}
        collegeAttainmentPct={app?.college_attainment_pct}
      />

      <GrowthProjectionsCard
        populationCagr={app?.population_cagr}
        daytimePopulationEstimate={app?.daytime_population_estimate}
        population5yrProjection={app?.population_5yr_projection}
        medianIncome5yrProjection={app?.median_income_5yr_projection}
        medianHomeValue5yrProjection={app?.median_home_value_5yr_projection}
        populationDensitySqmi={app?.population_density_sqmi}
      />

      <EmploymentContextCard
        submarketEnriched={app?.submarket_enriched}
        employmentClusters={app?.employment_clusters}
        nearbyPlaces={app?.nearby_places}
      />

      <TaxJurisdictionCard
        taxRateTotal={app?.tax_rate_total}
        taxingJurisdictions={app?.taxing_jurisdictions}
        opportunityZone={app?.opportunity_zone}
        enterpriseZone={app?.enterprise_zone}
        foreignTradeZone={app?.foreign_trade_zone}
        mudDistrict={app?.mud_district}
      />
    </div>
  );
}
