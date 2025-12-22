import { useEffect } from 'react';
import { logger } from "@/lib/logger";
import { Helmet } from 'react-helmet';
import { useHiiStore } from '@/features/hospitality-hii';
import { Building2, TrendingUp } from 'lucide-react';

const HospitalityIntelligence = () => {
  const { city, hiiScore } = useHiiStore();

  useEffect(() => {
    // Initialize module (future: check feature flag)
    logger.debug('HII', 'Module initialized for:', city);
  }, [city]);

  return (
    <>
      <Helmet>
        <title>Hospitality Intelligence - SiteIntel™</title>
        <meta name="description" content="Real-time hospitality activity analysis powered by Texas Mixed Beverage data" />
      </Helmet>

      <main className="h-screen grid lg:grid-cols-[380px_1fr] overflow-hidden bg-background">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex flex-col border-r bg-card overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Hospitality Intelligence
                </h1>
                <p className="text-sm text-muted-foreground">
                  Texas Activity Index
                </p>
              </div>
            </div>
          </div>

          {/* Placeholder for future components */}
          <div className="flex-1 p-6 space-y-6">
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-muted-foreground">HII Score</h2>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">
                {hiiScore ?? '--'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {city} · Last 12 months
              </p>
            </div>

            <div className="rounded-xl border bg-muted/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Filter Panel · Trend Chart · Alerts
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Components coming in Phase 3
              </p>
            </div>
          </div>
        </aside>

        {/* Right Map Section */}
        <section className="relative flex items-center justify-center bg-muted">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Interactive Map Loading...
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Map integration with HII heatmap and venue markers coming in Phase 4
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default HospitalityIntelligence;
