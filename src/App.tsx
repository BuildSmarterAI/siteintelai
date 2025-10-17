import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import ReportViewer from "./pages/ReportViewer";
import Products from "./pages/Products";
import Feasibility from "./pages/Feasibility";
import CostIntelligence from "./pages/CostIntelligence";
import ScheduleIntelligence from "./pages/ScheduleIntelligence";
import AdminGeospatial from "./pages/AdminGeospatial";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Developers from "./pages/industries/Developers";
import Lenders from "./pages/industries/Lenders";
import Blog from "./pages/resources/Blog";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Analytics from "./pages/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SubscriptionProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SkipLinks />
          <Header />
          <KeyboardShortcuts />
        <main id="main-content" className="pt-24">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/application" element={<Application />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/report/:reportId" element={<ReportViewer />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/feasibility" element={<Feasibility />} />
            <Route path="/products/cost-intelligence" element={<CostIntelligence />} />
            <Route path="/products/schedule-intelligence" element={<ScheduleIntelligence />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/industries/developers" element={<Developers />} />
            <Route path="/industries/lenders" element={<Lenders />} />
            <Route path="/industries/design-build" element={<Developers />} />
            <Route path="/industries/municipalities" element={<Developers />} />
            <Route path="/resources/blog" element={<Blog />} />
            <Route path="/resources/case-studies" element={<Blog />} />
            <Route path="/resources/documentation" element={<Blog />} />
            <Route path="/resources/api" element={<Blog />} />
            <Route path="/legal/privacy" element={<Privacy />} />
            <Route path="/legal/terms" element={<Terms />} />
            <Route path="/admin/geospatial" element={<AdminGeospatial />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
      </SubscriptionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
