import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Calendar, ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";

const Products = () => {
  const products = [
    {
      icon: MapPin,
      title: "Feasibility Intelligence",
      subtitle: "Zoning, flood, utilities & compliance",
      description: "Verify site feasibility in minutes with AI-powered zoning, floodplain, utilities, and environmental constraint analysis.",
      href: "/products/feasibility",
      color: "from-[#06B6D4] to-[#0891B2]",
      features: ["Zoning verification", "FEMA flood data", "Utilities mapping", "Environmental constraints"],
    },
    {
      icon: DollarSign,
      title: "Cost Intelligence",
      subtitle: "Real-time construction costs",
      description: "Track material and labor costs in real-time with market-aligned design and construction cost visibility.",
      href: "/products/cost-intelligence",
      color: "from-[#FF7A00] to-[#FF9240]",
      features: ["Real-time market data", "Design cost clarity", "Construction benchmarking", "Budget validation"],
    },
    {
      icon: Calendar,
      title: "Schedule Intelligence",
      subtitle: "Timeline risk & permits",
      description: "Predict project timelines with AI-powered permit duration forecasting and construction scheduling intelligence.",
      href: "/products/schedule-intelligence",
      color: "from-[#8B5CF6] to-[#A78BFA]",
      features: ["Permit timeline prediction", "Labor availability", "Material lead times", "Risk assessment"],
      comingSoon: true,
    },
  ];

  const comparisonFeatures = [
    { name: "AI-Powered Analysis", feasibility: true, cost: true, schedule: true },
    { name: "Real-Time Data Updates", feasibility: true, cost: true, schedule: true },
    { name: "Lender-Ready Reports", feasibility: true, cost: true, schedule: true },
    { name: "Citation & Transparency", feasibility: true, cost: true, schedule: true },
    { name: "Zoning & Flood Analysis", feasibility: true, cost: false, schedule: false },
    { name: "Construction Cost Tracking", feasibility: false, cost: true, schedule: false },
    { name: "Permit Duration Forecasting", feasibility: false, cost: false, schedule: true },
    { name: "Market Benchmarking", feasibility: false, cost: true, schedule: true },
  ];

  return (
    <>
      <Helmet>
        <title>Products | SiteIntel™ Intelligence Platform</title>
        <meta
          name="description"
          content="SiteIntel™ Intelligence Platform: Feasibility, Cost, and Schedule intelligence for commercial real estate. AI-powered insights from concept to construction."
        />
        <meta property="og:title" content="Products | SiteIntel™ Intelligence Platform" />
        <meta property="og:description" content="Three intelligence engines for smarter commercial real estate decisions." />
        <link rel="canonical" href="https://siteintel.com/products" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              One Platform. Three <span className="text-[#06B6D4]">Intelligence Engines</span>.
            </h1>
            <p className="text-xl text-white/80 mb-12 leading-relaxed max-w-3xl mx-auto">
              From feasibility to cost to schedule — SiteIntel™ delivers AI-powered intelligence across every phase of commercial real estate development.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#FF7A00] to-[#FF9240] hover:shadow-[0_6px_30px_rgba(255,122,0,0.6)] text-white font-semibold rounded-full px-12 py-6 text-lg"
            >
              <Link to="/application?step=2">Start Free QuickCheck →</Link>
            </Button>
          </motion.div>
        </section>

        {/* Product Cards Grid */}
        <section className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {products.map((product, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all relative group"
              >
                {product.comingSoon && (
                  <div className="absolute top-4 right-4 bg-[#8B5CF6] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Coming Soon
                  </div>
                )}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${product.color} flex items-center justify-center mb-6`}>
                  <product.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{product.title}</h3>
                <p className="text-sm text-white/60 mb-4">{product.subtitle}</p>
                <p className="text-white/80 mb-6 leading-relaxed">{product.description}</p>
                
                <ul className="space-y-3 mb-8">
                  {product.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2 text-white/70 text-sm">
                      <Check className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant="outline"
                  className="w-full bg-white/5 hover:bg-white/10 border-white/20 text-white group-hover:border-white/40"
                  disabled={product.comingSoon}
                >
                  <Link to={product.href}>
                    Learn More <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Comparison Table */}
        <section className="container mx-auto px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-white text-center mb-12">
              Compare <span className="text-[#FF7A00]">Intelligence Engines</span>
            </h2>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-6 text-white/80 font-semibold">Feature</th>
                    <th className="text-center p-6 text-white/80 font-semibold">Feasibility</th>
                    <th className="text-center p-6 text-white/80 font-semibold">Cost</th>
                    <th className="text-center p-6 text-white/80 font-semibold">Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, idx) => (
                    <tr key={idx} className="border-t border-white/10">
                      <td className="p-6 text-white/90">{feature.name}</td>
                      <td className="text-center p-6">
                        {feature.feasibility ? (
                          <Check className="w-5 h-5 text-[#06B6D4] mx-auto" />
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                      <td className="text-center p-6">
                        {feature.cost ? (
                          <Check className="w-5 h-5 text-[#FF7A00] mx-auto" />
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                      <td className="text-center p-6">
                        {feature.schedule ? (
                          <Check className="w-5 h-5 text-[#8B5CF6] mx-auto" />
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Unified Pricing */}
        <section className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Flexible <span className="text-[#06B6D4]">Pricing Options</span>
            </h2>
            <p className="text-white/70 mb-12">Choose individual reports or unlock unlimited intelligence with a Pro subscription.</p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-left">
                <h3 className="text-2xl font-bold text-white mb-2">Pay-Per-Use</h3>
                <div className="text-4xl font-bold text-[#FF7A00] mb-6">$795<span className="text-lg text-white/60">/report</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2 text-white/80">
                    <Check className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                    <span>Single feasibility or cost report</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/80">
                    <Check className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                    <span>Full data citations</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/80">
                    <Check className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                    <span>PDF export & 72-hour access</span>
                  </li>
                </ul>
                <Button asChild className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF9240] hover:shadow-[0_6px_30px_rgba(255,122,0,0.4)]">
                  <Link to="/application?step=2">Get Started</Link>
                </Button>
              </div>

              <div className="bg-gradient-to-br from-[#06B6D4]/20 to-[#0891B2]/20 backdrop-blur-md border-2 border-[#06B6D4] rounded-2xl p-8 text-left relative">
                <div className="absolute top-4 right-4 bg-[#06B6D4] text-[#0A0F2C] text-xs font-semibold px-3 py-1 rounded-full">
                  Best Value
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Pro Subscription</h3>
                <div className="text-4xl font-bold text-[#06B6D4] mb-6">$1,950<span className="text-lg text-white/60">/month</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2 text-white/80">
                    <Check className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                    <span>Unlimited reports (all products)</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/80">
                    <Check className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                    <span>Portfolio analytics dashboard</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/80">
                    <Check className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                    <span>API access & integrations</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/80">
                    <Check className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button asChild className="w-full bg-[#06B6D4] hover:bg-[#0891B2] text-[#0A0F2C] font-semibold">
                  <Link to="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-6 py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Build with <span className="text-[#FF7A00]">Intelligence</span>?
            </h2>
            <p className="text-xl text-white/70 mb-10">
              Start with a free QuickCheck and experience the power of AI-driven feasibility analysis.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#FF7A00] to-[#FF9240] hover:shadow-[0_8px_40px_rgba(255,122,0,0.6)] text-white font-semibold rounded-full px-12 py-8 text-lg"
            >
              <Link to="/application?step=2">Run Free QuickCheck →</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default Products;
