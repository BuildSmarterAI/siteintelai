import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Header } from "./components/navigation/Header";
import { Footer } from "./components/navigation/Footer";
import { SkipLinks } from "./components/SkipLinks";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import Index from "./pages/Index";
import Application from "./pages/Application";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
// Report multi-page architecture
import ReportLayout from "./pages/report/ReportLayout";
import PropertyInfoPage from "./pages/report/PropertyInfoPage";
import ScorePage from "./pages/report/ScorePage";
import MapPage from "./pages/report/MapPage";
import ZoningPage from "./pages/report/ZoningPage";
import FloodPage from "./pages/report/FloodPage";
import UtilitiesPage from "./pages/report/UtilitiesPage";
import EnvironmentalPage from "./pages/report/EnvironmentalPage";
import TrafficPage from "./pages/report/TrafficPage";
import MarketPage from "./pages/report/MarketPage";
import CostsPage from "./pages/report/CostsPage";
import Products from "./pages/Products";
import Pricing from "./pages/Pricing";
import Feasibility from "./pages/Feasibility";
import FeasibilityAsAService from "./pages/FeasibilityAsAService";
import InvestorDeck from "./pages/InvestorDeck";
import CostIntelligence from "./pages/CostIntelligence";
import ScheduleIntelligence from "./pages/ScheduleIntelligence";
import AdminGeospatial from "./pages/AdminGeospatial";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Developers from "./pages/industries/Developers";
import Lenders from "./pages/industries/Lenders";
import TexasDevelopers from "./pages/industries/TexasDevelopers";
import SurveyUpload from "./pages/SurveyUpload";
import Demo from "./pages/Demo";
import Blog from "./pages/resources/Blog";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import BetaNDA from "./pages/legal/BetaNDA";
import Analytics from "./pages/Analytics";
import ParcelExplorer from "./pages/ParcelExplorer";
import Beta from "./pages/Beta";
import BetaSignup from "./pages/BetaSignup";
import BetaThankYou from "./pages/BetaThankYou";
import HospitalityIntelligence from "./pages/HospitalityIntelligence";
import UtilitiesDiagnostic from "./pages/UtilitiesDiagnostic";
import PaymentHistory from "./pages/PaymentHistory";
import BrandKit from "./pages/BrandKit";
import ApiDocs from "./pages/ApiDocs";
import SystemHealth from "./pages/admin/SystemHealth";
import DataSources from "./pages/admin/DataSources";
import DataSourceDetail from "./pages/admin/DataSourceDetail";
import DataSourceFormPage from "./pages/admin/DataSourceFormPage";
import DataSourceVersions from "./pages/admin/DataSourceVersions";
import DataSourceErrors from "./pages/admin/DataSourceErrors";
import DocsIndex from "./pages/docs/DocsIndex";
import DslSpecification from "./pages/docs/DslSpecification";
import HoustonWorkflow from "./pages/docs/HoustonWorkflow";
import TexasPipeline from "./pages/docs/TexasPipeline";
import TileArchitecture from "./pages/docs/TileArchitecture";
import CanonicalSchema from "./pages/docs/CanonicalSchema";
import TileManagement from "./pages/admin/TileManagement";
import AdminReports from "./pages/admin/AdminReports";
const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isBetaPage = location.pathname === '/beta' || location.pathname === '/beta-signup' || location.pathname === '/beta-thank-you';
  const isFullscreenPage = location.pathname === '/investor-deck';
  const isDocsPage = location.pathname.startsWith('/docs');
  const isReportPage = location.pathname.startsWith('/report/');

  // Fullscreen pages, docs, and reports render without any layout wrapper
  if (isFullscreenPage || isDocsPage || isReportPage) {
    return <>{children}</>;
  }

  return (
    <>
      <SkipLinks />
      {!isBetaPage && <Header />}
      <KeyboardShortcuts />
      <main id="main-content" className={isBetaPage ? "" : "pt-24"}>
        {children}
      </main>
      {!isBetaPage && <Footer />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SubscriptionProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/application" element={<Application />} />
              <Route path="/thank-you" element={<ThankYou />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/payment-history" element={<PaymentHistory />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/report/:reportId" element={<ReportLayout />}>
                <Route index element={<PropertyInfoPage />} />
                <Route path="score" element={<ScorePage />} />
                <Route path="map" element={<MapPage />} />
                <Route path="zoning" element={<ZoningPage />} />
                <Route path="flood" element={<FloodPage />} />
                <Route path="utilities" element={<UtilitiesPage />} />
                <Route path="environmental" element={<EnvironmentalPage />} />
                <Route path="traffic" element={<TrafficPage />} />
                <Route path="market" element={<MarketPage />} />
                <Route path="costs" element={<CostsPage />} />
              </Route>
              <Route path="/products" element={<Products />} />
              <Route path="/products/feasibility" element={<Feasibility />} />
              <Route path="/products/cost-intelligence" element={<CostIntelligence />} />
              <Route path="/products/schedule-intelligence" element={<ScheduleIntelligence />} />
              <Route path="/feasibility-as-a-service" element={<FeasibilityAsAService />} />
              <Route path="/hospitality-intelligence" element={<HospitalityIntelligence />} />
              <Route path="/survey-upload" element={<SurveyUpload />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/feasibility/:parcelId/hospitality" element={<HospitalityIntelligence />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/industries/developers" element={<Developers />} />
              <Route path="/industries/lenders" element={<Lenders />} />
              <Route path="/industries/texas-developers" element={<TexasDevelopers />} />
              <Route path="/industries/design-build" element={<Developers />} />
              <Route path="/industries/municipalities" element={<Developers />} />
              <Route path="/resources/blog" element={<Blog />} />
              <Route path="/resources/case-studies" element={<Blog />} />
              <Route path="/resources/documentation" element={<Blog />} />
              <Route path="/resources/api" element={<Blog />} />
              <Route path="/legal/privacy" element={<Privacy />} />
              <Route path="/legal/terms" element={<Terms />} />
              <Route path="/legal/beta-nda" element={<BetaNDA />} />
              <Route path="/admin/geospatial" element={<AdminGeospatial />} />
              <Route path="/admin/utilities-diagnostic" element={<UtilitiesDiagnostic />} />
              <Route path="/admin/system-health" element={<SystemHealth />} />
              <Route path="/admin/data-sources" element={<DataSources />} />
              <Route path="/admin/data-sources/new" element={<DataSourceFormPage />} />
              <Route path="/admin/data-sources/:id" element={<DataSourceDetail />} />
              <Route path="/admin/data-sources/:id/edit" element={<DataSourceFormPage />} />
              <Route path="/admin/data-source-versions" element={<DataSourceVersions />} />
              <Route path="/admin/data-source-errors" element={<DataSourceErrors />} />
              <Route path="/admin/tile-management" element={<TileManagement />} />
              <Route path="/admin/tiles" element={<TileManagement />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/parcel-explorer" element={<ParcelExplorer />} />
              <Route path="/beta" element={<Beta />} />
              <Route path="/beta-signup" element={<BetaSignup />} />
              <Route path="/beta-thank-you" element={<BetaThankYou />} />
              <Route path="/investor-deck" element={<InvestorDeck />} />
              <Route path="/brand-kit" element={<BrandKit />} />
              <Route path="/api-docs" element={<ApiDocs />} />
              {/* Documentation Routes */}
              <Route path="/docs" element={<DocsIndex />} />
              <Route path="/docs/dsl-specification" element={<DslSpecification />} />
              <Route path="/docs/houston-workflow" element={<HoustonWorkflow />} />
              <Route path="/docs/texas-pipeline" element={<TexasPipeline />} />
              <Route path="/docs/tile-architecture" element={<TileArchitecture />} />
              <Route path="/docs/canonical-schema" element={<CanonicalSchema />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </SubscriptionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
