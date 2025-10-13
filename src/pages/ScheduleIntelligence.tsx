import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, TrendingUp, Users, Package, AlertTriangle, CheckCircle2, Wrench, Building2, Code } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ScheduleIntelligence = () => {
  return (
    <>
      <Helmet>
        <title>Schedule Intelligence | SiteIntel™ Products</title>
        <meta
          name="description"
          content="AI-powered construction schedule intelligence. Predict permit timelines, labor availability, and material lead times before breaking ground."
        />
        <meta property="og:title" content="Schedule Intelligence | SiteIntel™ Products" />
        <link rel="canonical" href="https://siteintel.com/products/schedule-intelligence" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-6 pt-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/products" className="text-white/60 hover:text-white">Products</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white/40" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">Schedule Intelligence</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Hero */}
        <section className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto"
          >
            <div className="inline-block bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 rounded-full px-4 py-2 mb-6">
              <span className="text-[#A78BFA] font-semibold text-sm">Coming Soon</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Schedule Intelligence — <span className="text-[#8B5CF6]">Predict Timelines Before They Slip</span>
            </h1>
            <p className="text-xl text-white/80 mb-12 leading-relaxed">
              AI-powered construction schedule forecasting. Know your permit duration, labor availability, and material lead times before you commit.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] hover:shadow-[0_6px_30px_rgba(139,92,246,0.6)] text-white font-semibold rounded-full px-10 py-6"
              >
                <Link to="/contact">Join Waitlist</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-white/5 hover:bg-white/10 border-white/20 text-white rounded-full px-10 py-6"
              >
                <Link to="/products">Explore All Products</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Challenge Section */}
        <section className="bg-white/5 border-y border-white/10 py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">
                  The Challenge: <span className="text-[#8B5CF6]">Schedules Are Guesswork</span>
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  Traditional construction scheduling relies on outdated assumptions, historical averages, and manual estimates that rarely reflect current market conditions.
                </p>
                <p className="text-white/80 leading-relaxed">
                  Permit delays, labor shortages, and material lead times can derail even the best-laid plans — costing time, money, and stakeholder confidence.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#8B5CF6]/20 to-[#A78BFA]/20 rounded-2xl p-8 border border-[#8B5CF6]/30">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-[#FF7A00] flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold text-white">Permit Delays</div>
                      <div className="text-sm text-white/70">Average 3-6 month variance</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-[#FF7A00] flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold text-white">Labor Volatility</div>
                      <div className="text-sm text-white/70">Unpredictable crew availability</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-[#FF7A00] flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold text-white">Material Lead Times</div>
                      <div className="text-sm text-white/70">Supply chain disruptions</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Pillars */}
        <section className="container mx-auto px-6 py-20">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            How <span className="text-[#8B5CF6]">Schedule Intelligence</span> Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Clock,
                title: "Permit Duration Forecasting",
                description: "Predict permit approval timelines using historical municipal data and current processing volumes.",
              },
              {
                icon: Users,
                title: "Labor Availability Tracking",
                description: "Monitor regional labor market conditions and crew availability in real-time.",
              },
              {
                icon: Package,
                title: "Material Lead Time Intelligence",
                description: "Track supplier lead times and supply chain risk factors across all major materials.",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:scale-105 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-white/5 border-y border-white/10 py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-4xl font-bold text-white text-center mb-16">
                Business <span className="text-[#8B5CF6]">Outcomes</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">Reduce Schedule Uncertainty</h3>
                  <p className="text-white/80 mb-6 leading-relaxed">
                    Enter construction with data-backed timeline expectations, not guesswork.
                  </p>
                  <ul className="space-y-3">
                    {["Eliminate surprise delays", "Validate project timelines", "Improve cash flow planning"].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-white/70">
                        <CheckCircle2 className="w-5 h-5 text-[#8B5CF6] flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">Build Stakeholder Confidence</h3>
                  <p className="text-white/80 mb-6 leading-relaxed">
                    Present transparent, market-informed schedules that lenders and investors trust.
                  </p>
                  <ul className="space-y-3">
                    {["Transparent data sources", "Citation-backed timelines", "Real-time risk alerts"].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-white/70">
                        <CheckCircle2 className="w-5 h-5 text-[#8B5CF6] flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="container mx-auto px-6 py-20">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Who Uses <span className="text-[#8B5CF6]">Schedule Intelligence</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Building2, title: "Developers", benefit: "Plan phases with confidence" },
              { icon: Wrench, title: "GCs & Builders", benefit: "Optimize crew scheduling" },
              { icon: TrendingUp, title: "Investors", benefit: "Validate timeline assumptions" },
              { icon: Code, title: "Project Managers", benefit: "Track risk in real-time" },
            ].map((useCase, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-[#8B5CF6]/40 hover:bg-white/10 transition-all text-center"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center mx-auto mb-4">
                  <useCase.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{useCase.title}</h3>
                <p className="text-sm text-white/70">{useCase.benefit}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Explore Other Products */}
        <section className="container mx-auto px-6 py-20 border-t border-white/10">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Explore Other <span className="text-[#06B6D4]">Intelligence Products</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link
              to="/products/feasibility"
              className="bg-gradient-to-br from-[#06B6D4]/20 to-[#0891B2]/20 backdrop-blur-md border border-[#06B6D4]/30 rounded-2xl p-8 hover:border-[#06B6D4] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#06B6D4] transition-colors">
                    Feasibility Intelligence
                  </h3>
                  <p className="text-white/70">Zoning, flood, utilities & compliance analysis</p>
                </div>
              </div>
            </Link>

            <Link
              to="/products/cost-intelligence"
              className="bg-gradient-to-br from-[#FF7A00]/20 to-[#FF9240]/20 backdrop-blur-md border border-[#FF7A00]/30 rounded-2xl p-8 hover:border-[#FF7A00] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FF9240] flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#FF7A00] transition-colors">
                    Cost Intelligence
                  </h3>
                  <p className="text-white/70">Real-time construction cost tracking & benchmarking</p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-6 py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Be First to Know When We <span className="text-[#8B5CF6]">Launch</span>
            </h2>
            <p className="text-xl text-white/70 mb-10">
              Join the waitlist for Schedule Intelligence and get early access to timeline forecasting tools.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] hover:shadow-[0_8px_40px_rgba(139,92,246,0.6)] text-white font-semibold rounded-full px-12 py-8 text-lg"
            >
              <Link to="/contact">Join Waitlist →</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default ScheduleIntelligence;
